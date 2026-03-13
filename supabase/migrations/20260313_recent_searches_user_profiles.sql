-- Persist user search history in profile for cross-device/reinstall sync.
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS recent_searches TEXT[] DEFAULT '{}';
