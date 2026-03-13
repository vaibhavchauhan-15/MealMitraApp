-- ================================================================
-- MEALMITRA — DIET PLANNER SYSTEM (public-plan-first flow support)
-- Adds/ensures:
--   - diet_plans
--   - diet_plan_meals
--   - planner_meals
--   - indexes for exact-match and feed queries
--   - recipe reference validation triggers
-- ================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ------------------------------------------------
-- diet_plans
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diet_plans (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  goal text null,
  diet_type text null,
  days smallint null default 7,
  total_calories smallint null,
  total_protein smallint null,
  plan_data jsonb not null,
  is_active boolean null default true,
  is_public boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  plan_diet_type text generated always as ((plan_data ->> 'diet_type'::text)) stored,
  plan_calories smallint generated always as (
    case
      when coalesce(plan_data ->> 'total_calories'::text, '') ~ '^[0-9]+$'
        then least((plan_data ->> 'total_calories'::text)::numeric, 32767)::smallint
      else null::smallint
    end
  ) stored,
  constraint diet_plans_pkey primary key (id),
  constraint diet_plans_user_id_fkey foreign key (user_id) references user_profiles (id) on delete cascade
) tablespace pg_default;

CREATE INDEX IF NOT EXISTS idx_plans_user ON public.diet_plans USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_plans_active ON public.diet_plans USING btree (user_id, is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_plans_diet ON public.diet_plans USING btree (plan_diet_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_plans_calories ON public.diet_plans USING btree (plan_calories) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_plans_updated ON public.diet_plans USING btree (user_id, updated_at desc) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_plans_public ON public.diet_plans USING btree (plan_diet_type, plan_calories) TABLESPACE pg_default WHERE (is_public = true);
CREATE INDEX IF NOT EXISTS idx_plans_public_match ON public.diet_plans USING btree (plan_diet_type, days, goal, plan_calories) TABLESPACE pg_default WHERE (is_public = true);
CREATE INDEX IF NOT EXISTS idx_plans_public_feed ON public.diet_plans USING btree (plan_diet_type, plan_calories) TABLESPACE pg_default WHERE (is_public = true and is_active = true);

DROP TRIGGER IF EXISTS trg_diet_plans_ts ON public.diet_plans;
CREATE TRIGGER trg_diet_plans_ts
BEFORE UPDATE ON public.diet_plans
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');

-- ------------------------------------------------
-- diet_plan_meals
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diet_plan_meals (
  id uuid not null default gen_random_uuid(),
  plan_id uuid not null,
  recipe_id uuid not null,
  day date not null,
  meal_type text not null,
  servings smallint null default 2,
  added_at timestamp with time zone null default now(),
  recipe_source text not null default 'master'::text,
  constraint diet_plan_meals_pkey primary key (id),
  constraint diet_plan_meals_plan_id_day_meal_type_key unique (plan_id, day, meal_type),
  constraint diet_plan_meals_plan_id_fkey foreign key (plan_id) references diet_plans (id) on delete cascade,
  constraint diet_plan_meals_recipe_source_check check ((recipe_source = any (array['master'::text, 'ai'::text])))
) tablespace pg_default;

-- Backward-compatible for deployments where table existed before recipe_source was introduced.
ALTER TABLE public.diet_plan_meals
  ADD COLUMN IF NOT EXISTS recipe_source text not null default 'master'::text;

CREATE INDEX IF NOT EXISTS idx_diet_plan_meals_plan ON public.diet_plan_meals USING btree (plan_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_diet_plan_meals_plan_day ON public.diet_plan_meals USING btree (plan_id, day) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_plan_meals_plan_day_type ON public.diet_plan_meals USING btree (plan_id, day, meal_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_diet_plan_meals_recipe_source_id ON public.diet_plan_meals USING btree (recipe_source, recipe_id) TABLESPACE pg_default;

-- Remove legacy hard FK (master_recipes-only) so polymorphic source validation can work.
ALTER TABLE public.diet_plan_meals
  DROP CONSTRAINT IF EXISTS diet_plan_meals_recipe_id_fkey;

-- ------------------------------------------------
-- planner_meals
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planner_meals (
  id uuid not null default gen_random_uuid(),
  entry_id text not null,
  user_id uuid not null,
  recipe_id uuid not null,
  day date not null,
  meal_type text not null,
  servings smallint null default 2,
  added_at timestamp with time zone null default now(),
  recipe_source text not null default 'master'::text,
  constraint planner_meals_pkey primary key (id),
  constraint planner_meals_user_id_entry_id_key unique (user_id, entry_id),
  constraint planner_meals_user_id_fkey foreign key (user_id) references user_profiles (id) on delete cascade,
  constraint planner_meals_recipe_source_check check ((recipe_source = any (array['master'::text, 'ai'::text])))
) tablespace pg_default;

-- Backward-compatible for deployments where table existed before recipe_source was introduced.
ALTER TABLE public.planner_meals
  ADD COLUMN IF NOT EXISTS recipe_source text not null default 'master'::text;

CREATE INDEX IF NOT EXISTS idx_planner_user ON public.planner_meals USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_planner_user_day ON public.planner_meals USING btree (user_id, day) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_planner_user_day_source ON public.planner_meals USING btree (user_id, day, recipe_source) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_planner_recipe_source_id ON public.planner_meals USING btree (recipe_source, recipe_id) TABLESPACE pg_default;

-- Remove legacy hard FK (master_recipes-only) so polymorphic source validation can work.
ALTER TABLE public.planner_meals
  DROP CONSTRAINT IF EXISTS planner_meals_recipe_id_fkey;

-- ------------------------------------------------
-- Recipe reference validation triggers
-- Requires validate_recipe_reference() from prior migration.
-- ------------------------------------------------
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

DROP TRIGGER IF EXISTS trg_diet_plan_meals_validate_recipe_ref ON public.diet_plan_meals;
CREATE TRIGGER trg_diet_plan_meals_validate_recipe_ref
BEFORE INSERT OR UPDATE OF recipe_id, recipe_source ON public.diet_plan_meals
FOR EACH ROW
EXECUTE FUNCTION validate_recipe_reference();

DROP TRIGGER IF EXISTS trg_planner_meals_validate_recipe_ref ON public.planner_meals;
CREATE TRIGGER trg_planner_meals_validate_recipe_ref
BEFORE INSERT OR UPDATE OF recipe_id, recipe_source ON public.planner_meals
FOR EACH ROW
EXECUTE FUNCTION validate_recipe_reference();

COMMIT;
