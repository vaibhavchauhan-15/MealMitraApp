-- Persist recently viewed recipe IDs for cross-device/reinstall sync.
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS recent_viewed_recipe_ids UUID[] DEFAULT '{}';
