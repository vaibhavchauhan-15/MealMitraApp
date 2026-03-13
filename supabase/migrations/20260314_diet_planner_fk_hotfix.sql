-- ================================================================
-- MEALMITRA — Diet Planner FK + Trigger Hotfix
-- Purpose:
--   - Ensure AI recipe IDs can be referenced from planner_meals/diet_plan_meals
--   - Remove legacy master-only recipe FKs
--   - Ensure validate_recipe_reference() exists and triggers are attached
-- Safe to run multiple times.
-- ================================================================

BEGIN;

ALTER TABLE public.diet_plan_meals
  ADD COLUMN IF NOT EXISTS recipe_source text NOT NULL DEFAULT 'master';

ALTER TABLE public.planner_meals
  ADD COLUMN IF NOT EXISTS recipe_source text NOT NULL DEFAULT 'master';

ALTER TABLE public.diet_plan_meals
  DROP CONSTRAINT IF EXISTS diet_plan_meals_recipe_id_fkey;

ALTER TABLE public.planner_meals
  DROP CONSTRAINT IF EXISTS planner_meals_recipe_id_fkey;

ALTER TABLE public.diet_plan_meals
  DROP CONSTRAINT IF EXISTS diet_plan_meals_recipe_source_check;

ALTER TABLE public.planner_meals
  DROP CONSTRAINT IF EXISTS planner_meals_recipe_source_check;

ALTER TABLE public.diet_plan_meals
  ADD CONSTRAINT diet_plan_meals_recipe_source_check
  CHECK (recipe_source IN ('master', 'ai'));

ALTER TABLE public.planner_meals
  ADD CONSTRAINT planner_meals_recipe_source_check
  CHECK (recipe_source IN ('master', 'ai'));

CREATE INDEX IF NOT EXISTS idx_diet_plan_meals_recipe_source_id
  ON public.diet_plan_meals(recipe_source, recipe_id);

CREATE INDEX IF NOT EXISTS idx_planner_recipe_source_id
  ON public.planner_meals(recipe_source, recipe_id);

CREATE INDEX IF NOT EXISTS idx_planner_user_day_source
  ON public.planner_meals(user_id, day, recipe_source);

CREATE OR REPLACE FUNCTION public.validate_recipe_reference()
RETURNS TRIGGER AS $$
DECLARE
  exists_row BOOLEAN;
BEGIN
  IF NEW.recipe_source = 'ai' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.user_ai_generated_recipes r
      WHERE r.id = NEW.recipe_id
        AND (
          auth.role() = 'service_role'
          OR r.is_public = TRUE
          OR r.user_id = auth.uid()
        )
    ) INTO exists_row;
  ELSE
    SELECT EXISTS (
      SELECT 1
      FROM public.master_recipes r
      WHERE r.id = NEW.recipe_id
        AND r.deleted_at IS NULL
    ) INTO exists_row;
  END IF;

  IF NOT exists_row THEN
    RAISE EXCEPTION 'Invalid recipe reference: % (%)', NEW.recipe_id, NEW.recipe_source
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_planner_meals_validate_recipe_ref ON public.planner_meals;
CREATE TRIGGER trg_planner_meals_validate_recipe_ref
BEFORE INSERT OR UPDATE OF recipe_id, recipe_source ON public.planner_meals
FOR EACH ROW
EXECUTE FUNCTION public.validate_recipe_reference();

DROP TRIGGER IF EXISTS trg_diet_plan_meals_validate_recipe_ref ON public.diet_plan_meals;
CREATE TRIGGER trg_diet_plan_meals_validate_recipe_ref
BEFORE INSERT OR UPDATE OF recipe_id, recipe_source ON public.diet_plan_meals
FOR EACH ROW
EXECUTE FUNCTION public.validate_recipe_reference();

COMMIT;
