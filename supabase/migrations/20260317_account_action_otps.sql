-- Secure OTP challenges for sensitive account actions.
CREATE TABLE IF NOT EXISTS public.account_action_otps (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('change_email', 'change_username', 'change_password')),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, action)
);

ALTER TABLE public.account_action_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS account_action_otps_no_direct_read ON public.account_action_otps;
CREATE POLICY account_action_otps_no_direct_read
ON public.account_action_otps
FOR SELECT
TO authenticated
USING (false);

DROP POLICY IF EXISTS account_action_otps_no_direct_write ON public.account_action_otps;
CREATE POLICY account_action_otps_no_direct_write
ON public.account_action_otps
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_account_action_otps_expires_at
ON public.account_action_otps (expires_at);

CREATE OR REPLACE FUNCTION public.cleanup_expired_account_action_otps()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.account_action_otps
  WHERE expires_at < now() - interval '1 day';
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_account_action_otps() TO authenticated;
