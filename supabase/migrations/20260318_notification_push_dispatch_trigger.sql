BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.push_dispatch_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.user_notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'failed', 'sent', 'dead')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts >= 1),
  next_attempt_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT push_dispatch_queue_notification_unique UNIQUE (notification_id)
);

CREATE INDEX IF NOT EXISTS idx_push_dispatch_queue_status_next_attempt
ON public.push_dispatch_queue(status, next_attempt_at, created_at);

CREATE INDEX IF NOT EXISTS idx_push_dispatch_queue_user_created
ON public.push_dispatch_queue(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_push_dispatch_queue_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_push_dispatch_queue_updated_at ON public.push_dispatch_queue;
CREATE TRIGGER trg_touch_push_dispatch_queue_updated_at
BEFORE UPDATE ON public.push_dispatch_queue
FOR EACH ROW
EXECUTE FUNCTION public.touch_push_dispatch_queue_updated_at();

CREATE OR REPLACE FUNCTION public.dispatch_push_on_notification_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'userId', NEW.user_id,
    'title', 'MealMitra',
    'body', COALESCE(NEW.message, ''),
    'notificationId', NEW.id,
    'deepLink',
      CASE
        WHEN NEW.recipe_id IS NOT NULL
          THEN format('mealmitra://recipe/%s?source=%s', NEW.recipe_id, COALESCE(NEW.recipe_source, 'master'))
        ELSE NULL
      END
  );

  BEGIN
    INSERT INTO public.push_dispatch_queue (
      notification_id,
      user_id,
      payload,
      status,
      attempts,
      max_attempts,
      next_attempt_at
    )
    VALUES (
      NEW.id,
      NEW.user_id,
      payload,
      'pending',
      0,
      5,
      timezone('utc', now())
    )
    ON CONFLICT (notification_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Never block notification inserts if enqueue fails.
    RAISE LOG 'Push enqueue failed for notification %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_push_dispatch_jobs(
  p_limit integer DEFAULT 50,
  p_worker_id text DEFAULT NULL
)
RETURNS SETOF public.push_dispatch_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_worker_id text;
BEGIN
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
  v_worker_id := COALESCE(NULLIF(p_worker_id, ''), 'worker');

  RETURN QUERY
  WITH picked AS (
    SELECT q.id
    FROM public.push_dispatch_queue q
    WHERE q.status IN ('pending', 'failed')
      AND q.next_attempt_at <= timezone('utc', now())
      AND q.attempts < q.max_attempts
    ORDER BY q.next_attempt_at ASC, q.created_at ASC
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.push_dispatch_queue q
  SET status = 'processing',
      attempts = q.attempts + 1,
      locked_at = timezone('utc', now()),
      locked_by = v_worker_id,
      updated_at = timezone('utc', now())
  FROM picked
  WHERE q.id = picked.id
  RETURNING q.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_push_dispatch_job(
  p_job_id uuid,
  p_sent boolean,
  p_error text DEFAULT NULL,
  p_retry_delay_seconds integer DEFAULT NULL
)
RETURNS public.push_dispatch_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.push_dispatch_queue;
  v_retry_seconds integer;
BEGIN
  IF p_sent THEN
    UPDATE public.push_dispatch_queue q
    SET status = 'sent',
        sent_at = timezone('utc', now()),
        last_error = NULL,
        locked_at = NULL,
        locked_by = NULL,
        updated_at = timezone('utc', now())
    WHERE q.id = p_job_id
    RETURNING q.* INTO v_row;

    RETURN v_row;
  END IF;

  SELECT LEAST(3600, 15 * (2 ^ LEAST(attempts, 7)))
  INTO v_retry_seconds
  FROM public.push_dispatch_queue
  WHERE id = p_job_id;

  v_retry_seconds := GREATEST(COALESCE(p_retry_delay_seconds, v_retry_seconds, 15), 1);

  UPDATE public.push_dispatch_queue q
  SET status = CASE
        WHEN q.attempts >= q.max_attempts THEN 'dead'
        ELSE 'failed'
      END,
      next_attempt_at = CASE
        WHEN q.attempts >= q.max_attempts THEN q.next_attempt_at
        ELSE timezone('utc', now()) + make_interval(secs => v_retry_seconds)
      END,
      last_error = LEFT(COALESCE(p_error, 'dispatch failed'), 1000),
      locked_at = NULL,
      locked_by = NULL,
      updated_at = timezone('utc', now())
  WHERE q.id = p_job_id
  RETURNING q.* INTO v_row;

  RETURN v_row;
END;
$$;

ALTER FUNCTION public.dispatch_push_on_notification_insert() OWNER TO postgres;
ALTER FUNCTION public.claim_push_dispatch_jobs(integer, text) OWNER TO postgres;
ALTER FUNCTION public.finalize_push_dispatch_job(uuid, boolean, text, integer) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.dispatch_push_on_notification_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_push_dispatch_jobs(integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_push_dispatch_job(uuid, boolean, text, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_push_dispatch_jobs(integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_push_dispatch_job(uuid, boolean, text, integer) TO service_role;

ALTER TABLE public.push_dispatch_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role manages push dispatch queue" ON public.push_dispatch_queue;
CREATE POLICY "service role manages push dispatch queue"
ON public.push_dispatch_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_dispatch_push_on_notification_insert ON public.user_notifications;
CREATE TRIGGER trg_dispatch_push_on_notification_insert
AFTER INSERT ON public.user_notifications
FOR EACH ROW
EXECUTE FUNCTION public.dispatch_push_on_notification_insert();

COMMIT;
