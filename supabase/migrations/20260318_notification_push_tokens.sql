BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL,
  device_id text,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name text,
  app_version text,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT user_push_tokens_unique UNIQUE (user_id, expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_active
ON public.user_push_tokens(user_id, is_active, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_last_seen
ON public.user_push_tokens(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_active_push_tokens
ON public.user_push_tokens(user_id, updated_at DESC)
WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_push_tokens_active_device
ON public.user_push_tokens(user_id, device_id)
WHERE is_active = true AND device_id IS NOT NULL;

ALTER TABLE public.user_push_tokens
ADD COLUMN IF NOT EXISTS device_id text,
ADD COLUMN IF NOT EXISTS device_name text,
ADD COLUMN IF NOT EXISTS app_version text;

UPDATE public.user_push_tokens
SET platform = 'web'
WHERE platform IS NULL OR platform NOT IN ('ios', 'android', 'web');

ALTER TABLE public.user_push_tokens
ALTER COLUMN platform SET NOT NULL,
ALTER COLUMN platform DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_push_tokens_platform_check'
      AND conrelid = 'public.user_push_tokens'::regclass
  ) THEN
    ALTER TABLE public.user_push_tokens
    ADD CONSTRAINT user_push_tokens_platform_check
    CHECK (platform IN ('ios', 'android', 'web'));
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.touch_user_push_tokens_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_stale_user_push_tokens(p_stale_after_days integer DEFAULT 60)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count integer := 0;
BEGIN
  UPDATE public.user_push_tokens
  SET is_active = false,
      updated_at = timezone('utc', now())
  WHERE is_active = true
    AND last_seen_at < timezone('utc', now()) - make_interval(days => p_stale_after_days);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_user_push_token(
  p_user_id uuid,
  p_expo_push_token text,
  p_platform text,
  p_device_id text DEFAULT NULL,
  p_device_name text DEFAULT NULL,
  p_app_version text DEFAULT NULL
)
RETURNS public.user_push_tokens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.user_push_tokens;
BEGIN
  IF p_platform NOT IN ('ios', 'android', 'web') THEN
    RAISE EXCEPTION 'Invalid platform: %', p_platform;
  END IF;

  IF p_device_id IS NOT NULL THEN
    UPDATE public.user_push_tokens
    SET is_active = false,
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id
      AND device_id = p_device_id
      AND expo_push_token <> p_expo_push_token
      AND is_active = true;
  END IF;

  INSERT INTO public.user_push_tokens (
    user_id,
    expo_push_token,
    platform,
    device_id,
    device_name,
    app_version,
    is_active,
    last_seen_at
  )
  VALUES (
    p_user_id,
    p_expo_push_token,
    p_platform,
    p_device_id,
    p_device_name,
    p_app_version,
    true,
    timezone('utc', now())
  )
  ON CONFLICT (user_id, expo_push_token)
  DO UPDATE SET
    platform = EXCLUDED.platform,
    device_id = COALESCE(EXCLUDED.device_id, public.user_push_tokens.device_id),
    device_name = COALESCE(EXCLUDED.device_name, public.user_push_tokens.device_name),
    app_version = COALESCE(EXCLUDED.app_version, public.user_push_tokens.app_version),
    is_active = true,
    last_seen_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_user_push_token_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_active_count integer;
BEGIN
  IF NEW.is_active THEN
    SELECT COUNT(*)
    INTO v_active_count
    FROM public.user_push_tokens
    WHERE user_id = NEW.user_id
      AND is_active = true
      AND (TG_OP = 'INSERT' OR id <> NEW.id);

    IF v_active_count >= 20 THEN
      RAISE EXCEPTION 'Active push token limit exceeded for user %', NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_user_push_tokens_updated_at ON public.user_push_tokens;
CREATE TRIGGER trg_touch_user_push_tokens_updated_at
BEFORE UPDATE ON public.user_push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.touch_user_push_tokens_updated_at();

DROP TRIGGER IF EXISTS trg_enforce_user_push_token_limit ON public.user_push_tokens;
CREATE TRIGGER trg_enforce_user_push_token_limit
BEFORE INSERT OR UPDATE OF is_active, user_id
ON public.user_push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.enforce_user_push_token_limit();

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own push tokens" ON public.user_push_tokens;
CREATE POLICY "read own push tokens"
ON public.user_push_tokens
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert own push tokens" ON public.user_push_tokens;
CREATE POLICY "insert own push tokens"
ON public.user_push_tokens
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update own push tokens" ON public.user_push_tokens;
CREATE POLICY "update own push tokens"
ON public.user_push_tokens
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "service role manages push tokens" ON public.user_push_tokens;
CREATE POLICY "service role manages push tokens"
ON public.user_push_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;
