-- Track resend attempt windows for OTP flows (max 5 requests per hour).
ALTER TABLE public.signup_otps
ADD COLUMN IF NOT EXISTS resend_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS resend_window_started_at TIMESTAMPTZ;

ALTER TABLE public.password_reset_otps
ADD COLUMN IF NOT EXISTS resend_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS resend_window_started_at TIMESTAMPTZ;

ALTER TABLE public.account_action_otps
ADD COLUMN IF NOT EXISTS resend_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS resend_window_started_at TIMESTAMPTZ;

UPDATE public.signup_otps
SET
  resend_count = CASE WHEN resend_count = 0 THEN 1 ELSE resend_count END,
  resend_window_started_at = COALESCE(resend_window_started_at, last_sent_at, now());

UPDATE public.password_reset_otps
SET
  resend_count = CASE WHEN resend_count = 0 THEN 1 ELSE resend_count END,
  resend_window_started_at = COALESCE(resend_window_started_at, last_sent_at, now());

UPDATE public.account_action_otps
SET
  resend_count = CASE WHEN resend_count = 0 THEN 1 ELSE resend_count END,
  resend_window_started_at = COALESCE(resend_window_started_at, last_sent_at, now());
