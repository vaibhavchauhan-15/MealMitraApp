-- OTP challenges for unauthenticated password recovery.
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS password_reset_otps_no_direct_read ON public.password_reset_otps;
CREATE POLICY password_reset_otps_no_direct_read
ON public.password_reset_otps
FOR SELECT
TO authenticated
USING (false);

DROP POLICY IF EXISTS password_reset_otps_no_direct_write ON public.password_reset_otps;
CREATE POLICY password_reset_otps_no_direct_write
ON public.password_reset_otps
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at
ON public.password_reset_otps (expires_at);

CREATE OR REPLACE FUNCTION public.cleanup_expired_password_reset_otps()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.password_reset_otps
  WHERE expires_at < now() - interval '1 day';
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_password_reset_otps() TO authenticated;
