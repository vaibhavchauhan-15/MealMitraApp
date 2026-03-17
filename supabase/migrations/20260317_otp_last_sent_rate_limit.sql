-- Add rate-limit metadata for OTP sends to avoid duplicate sends.
ALTER TABLE public.account_action_otps
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.password_reset_otps
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now();
