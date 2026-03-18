BEGIN;

-- =====================================================
-- EXTENSION
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- TABLE: user_notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NULL,
  type text NOT NULL CHECK (
    type IN (
      'recipe_liked',
      'recipe_disliked',
      'recipe_commented',
      'comment_replied',
      'comment_liked'
    )
  ),
  recipe_id uuid NULL,
  recipe_source text NULL DEFAULT 'master' CHECK (recipe_source IN ('master','ai')),
  comment_id uuid NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON public.user_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON public.user_notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_feed
ON public.user_notifications(user_id, created_at DESC, id);

-- prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_notification_dedupe'
  ) THEN
    ALTER TABLE public.user_notifications
    ADD CONSTRAINT unique_notification_dedupe
    UNIQUE (user_id, actor_id, type, recipe_id, comment_id);
  END IF;
END $$;

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own notifications" ON public.user_notifications;
CREATE POLICY "read own notifications"
ON public.user_notifications
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "update own notifications" ON public.user_notifications;
CREATE POLICY "update own notifications"
ON public.user_notifications
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete own notifications" ON public.user_notifications;
CREATE POLICY "delete own notifications"
ON public.user_notifications
FOR DELETE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "service role writes notifications" ON public.user_notifications;
CREATE POLICY "service role writes notifications"
ON public.user_notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- =====================================================
-- HELPER: GET RECIPE OWNER
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_recipe_owner_id(
  p_recipe_id uuid,
  p_recipe_source text
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_owner uuid;
BEGIN
  IF p_recipe_source = 'ai' THEN
    SELECT user_id INTO v_owner
    FROM public.user_ai_generated_recipes
    WHERE id = p_recipe_id LIMIT 1;
    RETURN v_owner;
  END IF;

  SELECT uploaded_by INTO v_owner
  FROM public.master_recipes
  WHERE id = p_recipe_id
    AND deleted_at IS NULL
    AND source = 'user_upload'
  LIMIT 1;

  RETURN v_owner;
END;
$$;

-- =====================================================
-- HELPER: ACTOR NAME
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_actor_display_name(p_actor_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(username,''), NULLIF(name,''), 'Someone')
  FROM public.user_profiles
  WHERE id = p_actor_id
  LIMIT 1;
$$;

-- =====================================================
-- CORE: ENQUEUE NOTIFICATION (SAFE)
-- =====================================================
CREATE OR REPLACE FUNCTION public.enqueue_social_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_recipe_id uuid,
  p_recipe_source text,
  p_comment_id uuid,
  p_message text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_actor_name text;
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  IF p_actor_id IS NOT NULL AND p_user_id = p_actor_id THEN RETURN; END IF;

  IF p_type NOT IN (
    'recipe_liked','recipe_disliked','recipe_commented',
    'comment_replied','comment_liked'
  ) THEN
    RAISE EXCEPTION 'Invalid notification type';
  END IF;

  -- anti-spam (10 sec)
  IF EXISTS (
    SELECT 1 FROM public.user_notifications
    WHERE user_id = p_user_id
      AND actor_id = p_actor_id
      AND type = p_type
      AND created_at > now() - interval '10 seconds'
  ) THEN
    RETURN;
  END IF;

  v_actor_name := public.get_actor_display_name(p_actor_id);

  INSERT INTO public.user_notifications (
    user_id, actor_id, actor_name, type,
    recipe_id, recipe_source, comment_id,
    message, metadata
  )
  VALUES (
    p_user_id, p_actor_id, v_actor_name, p_type,
    p_recipe_id, p_recipe_source, p_comment_id,
    p_message, COALESCE(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT ON CONSTRAINT unique_notification_dedupe DO NOTHING;
END;
$$;

-- =====================================================
-- TRIGGER: REACTION (INSERT + UPDATE)
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_on_recipe_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_owner uuid;
DECLARE v_actor text;
BEGIN
  v_owner := public.get_recipe_owner_id(NEW.recipe_id, NEW.recipe_source);
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;

  v_actor := public.get_actor_display_name(NEW.user_id);

  PERFORM public.enqueue_social_notification(
    v_owner,
    NEW.user_id,
    CASE WHEN NEW.reaction_type='dislike' THEN 'recipe_disliked' ELSE 'recipe_liked' END,
    NEW.recipe_id,
    NEW.recipe_source,
    NULL,
    CASE WHEN NEW.reaction_type='dislike'
      THEN format('%s disliked your recipe.', v_actor)
      ELSE format('%s liked your recipe.', v_actor)
    END,
    jsonb_build_object('reaction_type', NEW.reaction_type)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_recipe_reaction ON public.recipe_reactions;
CREATE TRIGGER trg_notify_on_recipe_reaction
AFTER INSERT OR UPDATE OF reaction_type
ON public.recipe_reactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_recipe_reaction();

-- =====================================================
-- TRIGGER: COMMENT
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_on_recipe_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_owner uuid;
DECLARE v_parent uuid;
DECLARE v_actor text;
BEGIN
  v_actor := public.get_actor_display_name(NEW.user_id);

  v_owner := public.get_recipe_owner_id(NEW.recipe_id, NEW.recipe_source);

  IF NEW.parent_id IS NULL THEN
    IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
      PERFORM public.enqueue_social_notification(
        v_owner,
        NEW.user_id,
        'recipe_commented',
        NEW.recipe_id,
        NEW.recipe_source,
        NEW.id,
        format('%s commented on your recipe.', v_actor),
        '{}'::jsonb
      );
    END IF;
  ELSE
    SELECT user_id INTO v_parent
    FROM public.recipe_comments
    WHERE id = NEW.parent_id
      AND deleted_at IS NULL;

    IF v_parent IS NOT NULL AND v_parent <> NEW.user_id THEN
      PERFORM public.enqueue_social_notification(
        v_parent,
        NEW.user_id,
        'comment_replied',
        NEW.recipe_id,
        NEW.recipe_source,
        NEW.id,
        format('%s replied to your comment.', v_actor),
        jsonb_build_object('parent_id', NEW.parent_id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_recipe_comment ON public.recipe_comments;
CREATE TRIGGER trg_notify_on_recipe_comment
AFTER INSERT ON public.recipe_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_recipe_comment();

-- =====================================================
-- TRIGGER: COMMENT LIKE
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_on_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_owner uuid;
DECLARE v_recipe_id uuid;
DECLARE v_recipe_source text;
DECLARE v_actor text;
BEGIN
  SELECT user_id, recipe_id, recipe_source
  INTO v_owner, v_recipe_id, v_recipe_source
  FROM public.recipe_comments
  WHERE id = NEW.comment_id
    AND deleted_at IS NULL;

  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;

  v_actor := public.get_actor_display_name(NEW.user_id);

  PERFORM public.enqueue_social_notification(
    v_owner,
    NEW.user_id,
    'comment_liked',
    v_recipe_id,
    v_recipe_source,
    NEW.comment_id,
    format('%s liked your comment.', v_actor),
    '{}'::jsonb
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_comment_like ON public.comment_likes;
CREATE TRIGGER trg_notify_on_comment_like
AFTER INSERT ON public.comment_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_comment_like();

COMMIT;