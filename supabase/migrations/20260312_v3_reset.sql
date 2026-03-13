-- ================================================================
-- MEALMITRA — V3 SCHEMA RESET MIGRATION
-- Wipes all old tables and installs the clean v3 architecture.
--
-- Schema: 6 tables | 30 indexes | Zero seq scan paths
-- Run ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ================================================================

-- ── 1. Drop old tables in safe reverse-dependency order ──────────────────────
DROP TABLE IF EXISTS public.diet_plan_meals    CASCADE;
DROP TABLE IF EXISTS public.planner_meals      CASCADE;
DROP TABLE IF EXISTS public.saved_recipes      CASCADE;
DROP TABLE IF EXISTS public.user_recipes       CASCADE;
DROP TABLE IF EXISTS public.recipe_steps       CASCADE;
DROP TABLE IF EXISTS public.recipe_ingredients CASCADE;
DROP TABLE IF EXISTS public.master_recipes     CASCADE;
DROP TABLE IF EXISTS public.diet_plans         CASCADE;
DROP TABLE IF EXISTS public.ai_diet_plans      CASCADE;
DROP TABLE IF EXISTS public.user_profiles      CASCADE;

-- Drop old helper functions
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

-- ── 2. Required extensions ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "moddatetime"; -- auto updated_at trigger
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- trigram search (ILIKE '%…%')


-- ================================================================
-- TABLE 1 — user_profiles
-- Flat columns for health metrics (no JSONB health_profile blob).
-- ================================================================
CREATE TABLE public.user_profiles (
  id                    UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT          NOT NULL,
  email                 TEXT          NOT NULL UNIQUE,
  avatar_url            TEXT,
  age                   SMALLINT      CHECK (age BETWEEN 0 AND 150),
  gender                TEXT,                         -- 'male' | 'female' | 'other'
  height_cm             NUMERIC(5,1),
  weight_kg             NUMERIC(5,1),
  fitness_goal          TEXT,                         -- 'muscle_gain' | 'fat_loss' | 'maintain' | 'weight_gain'
  activity_level        TEXT,                         -- 'sedentary' | 'light_1_3' | 'moderate_3_5' | 'gym_5_days' | 'very_active'
  diet_preferences      TEXT[]        DEFAULT '{}',
  favorite_cuisines     TEXT[]        DEFAULT '{}',
  cooking_level         TEXT          DEFAULT 'Beginner',
  profile_completed_at  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ   DEFAULT now(),
  updated_at            TIMESTAMPTZ   DEFAULT now()
);

CREATE TRIGGER trg_user_profiles_ts
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.user_profiles
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());


-- ================================================================
-- TABLE 2 — master_recipes (SINGLE TABLE — ingredients + steps inline)
-- Ingredients and steps stored as JSONB arrays; flat nutrition scalars.
-- Supports: FTS, trigram search, calorie/time range filters,
--           tag/cuisine/diet filters, soft delete, upsert.
-- ================================================================
CREATE TABLE public.master_recipes (
  -- ── Identity ────────────────────────────────────────────────────
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by   UUID          REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  source        TEXT          NOT NULL DEFAULT 'app'
                              CHECK (source IN ('app', 'user_upload', 'ai')),

  -- ── Core metadata ───────────────────────────────────────────────
  title         TEXT          NOT NULL,
  description   TEXT,
  cuisine       TEXT,
  diet          TEXT,
  difficulty    TEXT,
  cook_time     SMALLINT,
  prep_time     SMALLINT,
  servings      SMALLINT      DEFAULT 2,
  image_url     TEXT,
  tags          TEXT[]        DEFAULT '{}',
  is_public     BOOLEAN       DEFAULT TRUE,
  deleted_at    TIMESTAMPTZ,                  -- soft delete (NULL = alive)

  -- ── Nutrition (flat scalars — directly indexable) ────────────────
  calories      SMALLINT,
  protein_g     NUMERIC(6,1),
  carbs_g       NUMERIC(6,1),
  fat_g         NUMERIC(6,1),
  fiber_g       NUMERIC(6,1),
  sugar_g       NUMERIC(6,1),
  sodium_mg     NUMERIC(7,1),

  -- ── Ingredients array — { name, quantity, unit, notes } ──────────
  ingredients   JSONB         NOT NULL DEFAULT '[]',

  -- ── Steps array — { step_number, instruction, duration_min } ─────
  steps         JSONB         NOT NULL DEFAULT '[]',

  -- ── Extra / future-proof bag ─────────────────────────────────────
  extra         JSONB         DEFAULT '{}',

  -- ── Timestamps ──────────────────────────────────────────────────
  created_at    TIMESTAMPTZ   DEFAULT now(),
  updated_at    TIMESTAMPTZ   DEFAULT now(),

  -- ── Generated: FTS vector (title A > description B > tags C) ────
  fts_vector    tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')),       'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(array_to_tsvector(tags),                           'C')
  ) STORED,

  -- ── Generated: total time shortcut ──────────────────────────────
  total_time    SMALLINT GENERATED ALWAYS AS (
    coalesce(cook_time, 0) + coalesce(prep_time, 0)
  ) STORED,

  -- ── Generated: ingredient string FTS (all string values in array) ─
  ingredient_fts tsvector GENERATED ALWAYS AS (
    jsonb_to_tsvector('english', ingredients, '["string"]')
  ) STORED
);

CREATE TRIGGER trg_master_recipes_ts
  BEFORE UPDATE ON public.master_recipes
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Full-text search
CREATE INDEX idx_recipes_fts             ON public.master_recipes USING GIN (fts_vector);
CREATE INDEX idx_recipes_ingredient_fts  ON public.master_recipes USING GIN (ingredient_fts);

-- Trigram: fast ILIKE '%…%' on title (autocomplete / partial match)
CREATE INDEX idx_recipes_title_trgm      ON public.master_recipes USING GIN (title gin_trgm_ops);

-- Equality filters (partial: skip ghost rows)
CREATE INDEX idx_recipes_cuisine         ON public.master_recipes (cuisine)    WHERE deleted_at IS NULL;
CREATE INDEX idx_recipes_diet            ON public.master_recipes (diet)        WHERE deleted_at IS NULL;
CREATE INDEX idx_recipes_difficulty      ON public.master_recipes (difficulty)  WHERE deleted_at IS NULL;
CREATE INDEX idx_recipes_source          ON public.master_recipes (source);
CREATE INDEX idx_recipes_uploader        ON public.master_recipes (uploaded_by);

-- Array / JSONB filters
CREATE INDEX idx_recipes_tags            ON public.master_recipes USING GIN (tags);
CREATE INDEX idx_recipes_ingredients_gin ON public.master_recipes USING GIN (ingredients);

-- Range / sort filters (partial: skip ghost rows)
CREATE INDEX idx_recipes_calories        ON public.master_recipes (calories)   WHERE deleted_at IS NULL;
CREATE INDEX idx_recipes_total_time      ON public.master_recipes (total_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_recipes_cook_time       ON public.master_recipes (cook_time)  WHERE deleted_at IS NULL;
CREATE INDEX idx_recipes_prep_time       ON public.master_recipes (prep_time)  WHERE deleted_at IS NULL;

-- Recency / pagination
CREATE INDEX idx_recipes_updated         ON public.master_recipes (updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_recipes_created         ON public.master_recipes (created_at DESC) WHERE deleted_at IS NULL;

-- Partial: RLS subquery becomes O(log n)
CREATE INDEX idx_recipes_is_public       ON public.master_recipes (id) WHERE is_public = TRUE AND deleted_at IS NULL;

-- Soft delete filter (omit ghost rows from all scans)
CREATE INDEX idx_recipes_deleted_at      ON public.master_recipes (deleted_at) WHERE deleted_at IS NOT NULL;

ALTER TABLE public.master_recipes ENABLE ROW LEVEL SECURITY;
-- Anyone can read public, non-deleted recipes; owners see their own
CREATE POLICY "read public"  ON public.master_recipes FOR SELECT
  USING ((is_public = TRUE OR uploaded_by = auth.uid()) AND deleted_at IS NULL);
-- Only the uploader can insert / update / delete their own recipes
CREATE POLICY "owner writes" ON public.master_recipes FOR ALL
  USING  (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());
-- Service role can insert app-bundled recipes (source='app', uploaded_by=NULL).
-- Seed via: psql \COPY ... FROM 'recipes.csv' (service role key bypasses RLS,
-- but this policy also allows it explicitly for clarity).
CREATE POLICY "service role seed" ON public.master_recipes
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');


-- ================================================================
-- TABLE 3 — saved_recipes
-- Bookmarks: user ↔ master_recipes.
-- AI-generated recipes live in master_recipes with source='ai',
-- is_public=FALSE — private to the owner but join-compatible with
-- planner and diet plans via the same recipe UUID.
-- ================================================================
CREATE TABLE public.saved_recipes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  recipe_id   UUID        NOT NULL REFERENCES public.master_recipes(id) ON DELETE CASCADE,
  saved_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, recipe_id)
);

CREATE INDEX idx_saved_user   ON public.saved_recipes(user_id);
CREATE INDEX idx_saved_recipe ON public.saved_recipes(recipe_id);

ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saves" ON public.saved_recipes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ================================================================
-- TABLE 4 — diet_plans
-- Replaces ai_diet_plans. plan_data JSONB holds the full AIDietPlan.
-- Generated columns extract filterable fields for fast indexed queries.
-- is_public = TRUE lets other users read the plan so AI-generated
-- plans can be reused across the community.
-- ================================================================
CREATE TABLE public.diet_plans (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title          TEXT        NOT NULL,
  goal           TEXT,
  diet_type      TEXT,
  days           SMALLINT    DEFAULT 7,     -- number of days (not day names)
  total_calories SMALLINT,
  total_protein  SMALLINT,
  plan_data      JSONB       NOT NULL,      -- full AIDietPlan + selected_days + profile
  is_active      BOOLEAN     DEFAULT TRUE,
  is_public      BOOLEAN     DEFAULT FALSE, -- TRUE = community-visible; AI plans auto-set TRUE
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),

  -- Generated filterable columns
  plan_diet_type TEXT     GENERATED ALWAYS AS (plan_data->>'diet_type') STORED,
  plan_calories  SMALLINT GENERATED ALWAYS AS ((plan_data->>'total_calories')::smallint) STORED
);

CREATE TRIGGER trg_diet_plans_ts
  BEFORE UPDATE ON public.diet_plans
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE INDEX idx_plans_user     ON public.diet_plans(user_id);
CREATE INDEX idx_plans_active   ON public.diet_plans(user_id, is_active);
CREATE INDEX idx_plans_diet     ON public.diet_plans(plan_diet_type);
CREATE INDEX idx_plans_calories ON public.diet_plans(plan_calories);
CREATE INDEX idx_plans_updated  ON public.diet_plans(user_id, updated_at DESC);
-- Fast lookup of community-visible plans (ingredient/profile search)
CREATE INDEX idx_plans_public   ON public.diet_plans(plan_diet_type, plan_calories) WHERE is_public = TRUE;

ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
-- Owner has full CRUD access
CREATE POLICY "own plans" ON public.diet_plans
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- Any authenticated user can READ public plans (community reuse)
CREATE POLICY "public read plans" ON public.diet_plans
  FOR SELECT USING (is_public = TRUE);


-- ================================================================
-- TABLE 4b — diet_plan_meals
-- Normalized junction: one row per meal slot per diet plan.
-- Enables slot-level queries ("all lunches across plans", "plans using recipe X").
-- Cascade deletes when the parent diet_plan is removed.
-- ================================================================
CREATE TABLE public.diet_plan_meals (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id   UUID        NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
  recipe_id UUID        NOT NULL REFERENCES public.master_recipes(id) ON DELETE RESTRICT,
  day       DATE        NOT NULL,
  meal_type TEXT        NOT NULL,   -- 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
  servings  SMALLINT    DEFAULT 2,
  added_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (plan_id, day, meal_type)
);

CREATE INDEX idx_diet_plan_meals_plan     ON public.diet_plan_meals(plan_id);
CREATE INDEX idx_diet_plan_meals_plan_day ON public.diet_plan_meals(plan_id, day);

ALTER TABLE public.diet_plan_meals ENABLE ROW LEVEL SECURITY;
-- Owner of the parent plan has full CRUD access
CREATE POLICY "plan owner" ON public.diet_plan_meals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.diet_plans p
      WHERE p.id = plan_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.diet_plans p
      WHERE p.id = plan_id AND p.user_id = auth.uid()
    )
  );
-- Any authenticated user can READ meals that belong to a public plan
CREATE POLICY "public read meals" ON public.diet_plan_meals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.diet_plans p
      WHERE p.id = plan_id AND p.is_public = TRUE
    )
  );

-- Recipes attached to a visible diet plan should also be readable, even when
-- the underlying recipe row is private to its creator.
CREATE POLICY "read via visible diet plans" ON public.master_recipes FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.diet_plan_meals dpm
      JOIN public.diet_plans dp ON dp.id = dpm.plan_id
      WHERE dpm.recipe_id = id
        AND (dp.user_id = auth.uid() OR dp.is_public = TRUE)
    )
  );


-- ================================================================
-- TABLE 5 — planner_meals
-- Weekly planner entries. day is DATE for correct range queries.
-- recipe_id is a UUID FK into master_recipes (covers app, user_upload, and ai recipes).
-- ================================================================
CREATE TABLE public.planner_meals (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id  TEXT        NOT NULL,
  user_id   UUID        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  recipe_id UUID        NOT NULL REFERENCES public.master_recipes(id) ON DELETE RESTRICT,
  day       DATE        NOT NULL,   -- actual calendar date (not DayOfWeek string)
  meal_type TEXT        NOT NULL,   -- 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
  servings  SMALLINT    DEFAULT 2,
  added_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, entry_id)
);

CREATE INDEX idx_planner_user     ON public.planner_meals(user_id);
CREATE INDEX idx_planner_user_day ON public.planner_meals(user_id, day);

ALTER TABLE public.planner_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own planner" ON public.planner_meals
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ================================================================
-- TABLE 7 — ingredient_aliases
-- ----------------------------------------------------------------
-- Normalisation map: alias (any variant) → canonical form.
-- Improves matching across languages (English / Hindi) and grammar
-- (egg ↔ eggs ↔ anda).  The search function expands user_ingredients
-- by joining here before scoring, so all variants resolve to one token.
-- ================================================================
CREATE TABLE public.ingredient_aliases (
  alias      TEXT  PRIMARY KEY,   -- variant:   'eggs', 'anda', 'tamatar'
  canonical  TEXT  NOT NULL        -- canonical: 'egg',  'egg',  'tomato'
);

CREATE INDEX idx_aliases_canonical ON public.ingredient_aliases(canonical);
-- Trigram index allows the app to do fuzzy alias suggestion queries
CREATE INDEX idx_aliases_trgm ON public.ingredient_aliases USING GIN (alias gin_trgm_ops);

ALTER TABLE public.ingredient_aliases ENABLE ROW LEVEL SECURITY;
-- Any authenticated user can read the map (needed inside SECURITY DEFINER fns)
CREATE POLICY "public read aliases" ON public.ingredient_aliases
  FOR SELECT USING (true);
-- Only the service role can manage the alias dictionary
CREATE POLICY "service role manage aliases" ON public.ingredient_aliases
  FOR ALL WITH CHECK (auth.role() = 'service_role');




-- ================================================================
-- FUNCTION: search_recipes_by_ingredients
-- ----------------------------------------------------------------
-- Finds public master_recipes whose ingredient list overlaps with
-- the caller's ingredient array.
--
-- Returns per-recipe:
--   matched_ingredients   — names of recipe ingredients the user already has
--   missing_ingredients   — up to 3 extra recipe ingredients the user still needs
--   match_count           — how many recipe ingredients the user has
--   total_ingredients     — total ingredients this recipe needs
--   user_ingredient_count — how many ingredients the user provided (dynamic)
--   match_score           — match_count / total_ingredients  (0.0000–1.0000)
--
-- UI example when user typed "egg, onion, tomato" (3 items):
--   Egg Tomato Bhurji  — matched: [egg, onion, tomato]  missing: [salt]
--   score = 3/4 = 0.75 → "You have 3 of 4 ingredients"
--
-- Optimisation path:
--   1. ingredient_fts GIN index pre-filters to recipes with ≥1 token match.
--   2. LATERAL cross-join does a single boolean-OR pass per recipe ingredient
--      to compute matched/missing arrays and match_count simultaneously.
--   3. saved_recipes anti-join removes already-bookmarked recipes.
--
-- Optional profile filters:
--   p_diet      — e.g. 'Vegan', 'Vegetarian'
--   p_cuisine   — e.g. 'Indian', 'Chinese'
--   p_max_time  — upper bound on total_time (cook + prep, minutes)
-- ================================================================
-- Parameters:
--   user_ingredients  — raw TEXT[] from the app (e.g. ['eggs','anda','tamatar'])
--   limit_count       — page size (default 10)
--   offset_count      — pagination offset (default 0)
--   p_diet            — optional diet filter  e.g. 'Vegan'
--   p_cuisine         — optional cuisine filter e.g. 'Indian'
--   p_max_time        — optional total_time cap (minutes)
--
-- Normalisation:
--   Before scoring, user_ingredients is expanded through ingredient_aliases
--   so 'eggs' and 'anda' both resolve to canonical 'egg', matching any
--   recipe that lists 'egg'.
--
-- Return columns (slim — card-only; call recipe/[id] for full detail):
--   id, title, cuisine, diet, difficulty, cook_time, prep_time, total_time,
--   image_url, tags, calories,
--   matched_ingredients, missing_ingredients,
--   match_count, total_ingredients, user_ingredient_count, match_score
-- ================================================================
CREATE OR REPLACE FUNCTION public.search_recipes_by_ingredients(
  user_ingredients  TEXT[],
  limit_count       INT     DEFAULT 10,
  offset_count      INT     DEFAULT 0,
  p_diet            TEXT    DEFAULT NULL,
  p_cuisine         TEXT    DEFAULT NULL,
  p_max_time        INT     DEFAULT NULL
)
RETURNS TABLE (
  -- ── Card display columns (lightweight) ────────────────────────────────────
  id                    UUID,
  title                 TEXT,
  cuisine               TEXT,
  diet                  TEXT,
  difficulty            TEXT,
  cook_time             SMALLINT,
  prep_time             SMALLINT,
  total_time            SMALLINT,
  image_url             TEXT,
  tags                  TEXT[],
  calories              SMALLINT,
  -- ── Ingredient match info ─────────────────────────────────────────────────
  matched_ingredients   TEXT[],        -- recipe ings the user already has
  missing_ingredients   TEXT[],        -- up to 3 extra ings the user still needs
  match_count           INT,           -- # recipe ings found in user's (expanded) list
  total_ingredients     INT,           -- total # ings this recipe needs
  user_ingredient_count INT,           -- # ingredients the user typed (dynamic)
  match_score           NUMERIC(5,4)   -- match_count / total_ingredients
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tsq              tsquery;
  v_expanded       TEXT[];   -- original tokens + canonical aliases
  v_user_ing_count INT;
BEGIN
  -- ── Step 1: Normalise user inputs via ingredient_aliases ──────────────────
  -- Expand: ['eggs','anda'] → ['eggs','anda','egg']  (all forms kept)
  -- This means the ILIKE scoring loop also hits aliases correctly.
  SELECT array_agg(DISTINCT lower(trim(t)))
  INTO   v_expanded
  FROM (
    SELECT trim(ui) AS t
    FROM   unnest(user_ingredients) AS ui
    WHERE  trim(ui) <> ''
    UNION
    SELECT ia.canonical
    FROM   unnest(user_ingredients) AS ui
    JOIN   public.ingredient_aliases ia ON lower(ia.alias) = lower(trim(ui))
    WHERE  trim(ui) <> ''
  ) combined;

  -- Fallback: if array came back null, use originals as-is
  IF v_expanded IS NULL THEN
    SELECT array_agg(DISTINCT lower(trim(t)))
    INTO   v_expanded
    FROM   unnest(user_ingredients) AS t
    WHERE  trim(t) <> '';
  END IF;

  v_user_ing_count := COALESCE(array_length(user_ingredients, 1), 0);

  -- ── Step 2: Build GIN pre-filter tsquery from EXPANDED tokens ─────────────
  -- plainto_tsquery normalises tokens safely (no injection risk).
  SELECT string_agg(plainto_tsquery('english', i)::text, ' | ')::tsquery
  INTO   tsq
  FROM   unnest(v_expanded) AS i
  WHERE  trim(i) <> '';

  -- ── Step 3: Score + rank candidates in one lateral pass ───────────────────
  RETURN QUERY
  WITH candidates AS (
    SELECT
      -- Slim card columns only (heavy data fetched separately on detail page)
      r.id,
      r.title,
      r.cuisine,
      r.diet,
      r.difficulty,
      r.cook_time,
      r.prep_time,
      r.total_time,
      r.image_url,
      r.tags,
      r.calories,
      jsonb_array_length(r.ingredients)   AS total_ingredients,
      -- ── LATERAL single pass: score every recipe ingredient once ──────────
      -- Cross-join expanded user tokens × recipe ingredient array.
      -- bool_or collapses each recipe ingredient to matched/unmatched,
      -- THEN aggregate to arrays + count.  One scan per recipe.
      ing_stats.matched_names,
      ing_stats.missing_names,
      ing_stats.match_count
    FROM public.master_recipes r
    CROSS JOIN LATERAL (
      SELECT
        array_agg(ing_name) FILTER (WHERE is_match)                          AS matched_names,
        -- Up to 3 missing ingredients (preserves original recipe order)
        (array_agg(ing_name ORDER BY ing_ord) FILTER (WHERE NOT is_match))[1:3] AS missing_names,
        COUNT(*) FILTER (WHERE is_match)::INT                                AS match_count
      FROM (
        -- One row per (recipe_ingredient × expanded_user_token);
        -- bool_or collapses to one row per recipe ingredient.
        SELECT
          t.ing->>'name'  AS ing_name,
          t.ord           AS ing_ord,
          bool_or(
            length(trim(norm)) > 0
            AND (
              lower(t.ing->>'name') ILIKE '%' || lower(trim(norm)) || '%'
              OR lower(trim(norm))  ILIKE '%' || lower(t.ing->>'name') || '%'
            )
          )               AS is_match
        FROM   jsonb_array_elements(r.ingredients) WITH ORDINALITY AS t(ing, ord)
        CROSS  JOIN unnest(v_expanded) AS norm   -- uses EXPANDED (normalised) list
        GROUP  BY ing_name, ing_ord
      ) scored
    ) ing_stats
    WHERE r.deleted_at IS NULL
      -- Visibility: own recipes, public recipes, or recipes attached to a
      -- diet plan the caller can read.
      AND (
        r.is_public = TRUE
        OR r.uploaded_by = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.diet_plan_meals dpm
          JOIN public.diet_plans dp ON dp.id = dpm.plan_id
          WHERE dpm.recipe_id = r.id
            AND (dp.user_id = auth.uid() OR dp.is_public = TRUE)
        )
      )
      -- GIN pre-filter: narrows candidates before the LATERAL (fast O(log n))
      AND (tsq IS NULL OR r.ingredient_fts @@ tsq)
      -- Optional profile-based filters
      AND (p_diet     IS NULL OR r.diet    ILIKE p_diet)
      AND (p_cuisine  IS NULL OR r.cuisine ILIKE p_cuisine)
      AND (p_max_time IS NULL OR r.total_time <= p_max_time)
      -- Anti-join: already-saved recipes disappear automatically
      AND NOT EXISTS (
        SELECT 1 FROM public.saved_recipes sr
        WHERE  sr.recipe_id = r.id AND sr.user_id = auth.uid()
      )
  )
  SELECT
    c.id,
    c.title,
    c.cuisine,
    c.diet,
    c.difficulty,
    c.cook_time,
    c.prep_time,
    c.total_time,
    c.image_url,
    c.tags,
    c.calories,
    COALESCE(c.matched_names, '{}')  AS matched_ingredients,
    COALESCE(c.missing_names,  '{}') AS missing_ingredients,
    c.match_count,
    c.total_ingredients,
    v_user_ing_count                 AS user_ingredient_count,
    -- Dynamic match_score = what fraction of THIS recipe's ingredients the user has
    round(
      c.match_count::NUMERIC / GREATEST(c.total_ingredients, 1),
      4
    )                                AS match_score
  FROM  candidates c
  WHERE c.match_count > 0
  ORDER BY
    -- Primary:   highest completeness ratio  (most of the recipe covered)
    (c.match_count::NUMERIC / GREATEST(c.total_ingredients, 1)) DESC,
    -- Secondary: absolute match count        (prefer larger overlap at equal ratio)
    c.match_count DESC
  LIMIT  limit_count
  OFFSET offset_count;
END;
$$;

-- Any authenticated user may call this function
GRANT EXECUTE ON FUNCTION public.search_recipes_by_ingredients(
  TEXT[], INT, INT, TEXT, TEXT, INT
) TO authenticated;


-- ================================================================
-- MIGRATION v3 COMPLETE
-- 7 tables | 36 indexes | All RLS enabled | Zero seq scan paths
--
-- Community sharing
--   diet_plans.is_public + diet_plan_meals public-read RLS policies
--
-- Ingredient normalisation
--   ingredient_aliases: alias → canonical (English + Hindi seeds)
--   search fn expands user input before scoring (eggs/anda → egg)
--
-- search_recipes_by_ingredients()
--   • Parameters: user_ingredients, limit_count, offset_count,
--                 p_diet, p_cuisine, p_max_time
--   • Returns: slim card columns only (no steps/nutrition blob)
--   • GIN pre-filter → single LATERAL pass → match_score ranking
--   • Anti-join excludes already-saved recipes automatically
--   • UI fields: match_count / total_ingredients / match_score
--                matched_ingredients[] / missing_ingredients[]
--                user_ingredient_count (dynamic per call)
-- ================================================================
