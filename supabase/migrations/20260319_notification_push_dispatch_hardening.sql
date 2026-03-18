    CREATE INDEX IF NOT EXISTS idx_push_dispatch_ready
    ON public.push_dispatch_queue(next_attempt_at, created_at)
    WHERE status IN ('pending', 'failed');

    CREATE INDEX IF NOT EXISTS idx_push_dispatch_cleanup
    ON public.push_dispatch_queue(created_at)
    WHERE status IN ('sent', 'dead');

    ALTER TABLE public.push_dispatch_queue
    ADD COLUMN IF NOT EXISTS response_status integer,
    ADD COLUMN IF NOT EXISTS provider text,
    ADD COLUMN IF NOT EXISTS response jsonb;

    DO $$
    BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'push_dispatch_queue_payload_object_check'
        AND conrelid = 'public.push_dispatch_queue'::regclass
    ) THEN
        ALTER TABLE public.push_dispatch_queue
        ADD CONSTRAINT push_dispatch_queue_payload_object_check
        CHECK (jsonb_typeof(payload) = 'object') NOT VALID;
    END IF;
    END
    $$;

    CREATE OR REPLACE FUNCTION public.claim_push_dispatch_jobs(
    p_limit integer DEFAULT 50,
    p_worker_id text DEFAULT gen_random_uuid()::text
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
    v_worker_id := COALESCE(NULLIF(p_worker_id, ''), gen_random_uuid()::text);

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

    CREATE OR REPLACE FUNCTION public.requeue_stuck_push_jobs(
    p_stuck_after interval DEFAULT interval '5 minutes'
    )
    RETURNS integer
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
    v_updated_count integer := 0;
    BEGIN
    UPDATE public.push_dispatch_queue
    SET status = 'failed',
        locked_at = NULL,
        locked_by = NULL,
        updated_at = timezone('utc', now())
    WHERE status = 'processing'
        AND locked_at IS NOT NULL
        AND locked_at < timezone('utc', now()) - p_stuck_after;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
    END;
    $$;

    CREATE OR REPLACE FUNCTION public.cleanup_old_push_jobs(
    p_retention interval DEFAULT interval '7 days'
    )
    RETURNS integer
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
    v_deleted_count integer := 0;
    BEGIN
    DELETE FROM public.push_dispatch_queue
    WHERE status IN ('sent', 'dead')
        AND created_at < timezone('utc', now()) - p_retention;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
    END;
    $$;

    CREATE OR REPLACE FUNCTION public.cleanup_push_dispatch_queue()
    RETURNS void
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DELETE FROM public.push_dispatch_queue
    WHERE status IN ('sent', 'dead')
        AND created_at < timezone('utc', now()) - interval '7 days';
    $$;

    CREATE OR REPLACE FUNCTION public.finalize_push_dispatch_job(
    p_job_id uuid,
    p_sent boolean,
    p_error text DEFAULT NULL,
    p_retry_delay_seconds integer DEFAULT NULL,
    p_response_status integer DEFAULT NULL,
    p_provider text DEFAULT NULL,
    p_response jsonb DEFAULT NULL
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
            response_status = COALESCE(p_response_status, q.response_status),
            provider = COALESCE(p_provider, q.provider),
            response = COALESCE(p_response, q.response),
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
        response_status = COALESCE(p_response_status, q.response_status),
        provider = COALESCE(p_provider, q.provider),
        response = COALESCE(p_response, q.response),
        locked_at = NULL,
        locked_by = NULL,
        updated_at = timezone('utc', now())
    WHERE q.id = p_job_id
    RETURNING q.* INTO v_row;

    RETURN v_row;
    END;
    $$;

    ALTER FUNCTION public.claim_push_dispatch_jobs(integer, text) OWNER TO postgres;
    ALTER FUNCTION public.requeue_stuck_push_jobs(interval) OWNER TO postgres;
    ALTER FUNCTION public.cleanup_old_push_jobs(interval) OWNER TO postgres;
    ALTER FUNCTION public.cleanup_push_dispatch_queue() OWNER TO postgres;
    ALTER FUNCTION public.finalize_push_dispatch_job(uuid, boolean, text, integer, integer, text, jsonb) OWNER TO postgres;

    REVOKE ALL ON FUNCTION public.claim_push_dispatch_jobs(integer, text) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.requeue_stuck_push_jobs(interval) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.cleanup_old_push_jobs(interval) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.cleanup_push_dispatch_queue() FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.finalize_push_dispatch_job(uuid, boolean, text, integer, integer, text, jsonb) FROM PUBLIC;

    GRANT EXECUTE ON FUNCTION public.claim_push_dispatch_jobs(integer, text) TO service_role;
    GRANT EXECUTE ON FUNCTION public.requeue_stuck_push_jobs(interval) TO service_role;
    GRANT EXECUTE ON FUNCTION public.cleanup_old_push_jobs(interval) TO service_role;
    GRANT EXECUTE ON FUNCTION public.cleanup_push_dispatch_queue() TO service_role;
    GRANT EXECUTE ON FUNCTION public.finalize_push_dispatch_job(uuid, boolean, text, integer, integer, text, jsonb) TO service_role;
