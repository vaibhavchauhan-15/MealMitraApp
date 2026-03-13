-- Ensure nutrition fields never default to NULL in master_recipes.
-- This keeps API payloads stable for UI nutrition rendering.

ALTER TABLE public.master_recipes
  ALTER COLUMN carbs_g SET DEFAULT 0,
  ALTER COLUMN fat_g SET DEFAULT 0,
  ALTER COLUMN fiber_g SET DEFAULT 0,
  ALTER COLUMN sugar_g SET DEFAULT 0;

-- Backfill existing rows so legacy NULL values do not leak into clients.
UPDATE public.master_recipes
SET
  carbs_g = COALESCE(carbs_g, 0),
  fat_g = COALESCE(fat_g, 0),
  fiber_g = COALESCE(fiber_g, 0),
  sugar_g = COALESCE(sugar_g, 0)
WHERE carbs_g IS NULL
   OR fat_g IS NULL
   OR fiber_g IS NULL
   OR sugar_g IS NULL;
