-- OTP challenges for email verification before signup completion.
CREATE TABLE IF NOT EXISTS public.signup_otps (
  email TEXT PRIMARY KEY,
  otp_hash TEXT NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS signup_otps_no_direct_read ON public.signup_otps;
CREATE POLICY signup_otps_no_direct_read
ON public.signup_otps
FOR SELECT
TO authenticated
USING (false);

DROP POLICY IF EXISTS signup_otps_no_direct_write ON public.signup_otps;
CREATE POLICY signup_otps_no_direct_write
ON public.signup_otps
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_signup_otps_expires_at
ON public.signup_otps (expires_at);

CREATE OR REPLACE FUNCTION public.cleanup_expired_signup_otps()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.signup_otps
  WHERE expires_at < now() - interval '1 day';
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_signup_otps() TO authenticated;
