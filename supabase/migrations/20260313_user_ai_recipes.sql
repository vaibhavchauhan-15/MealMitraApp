-- ================================================================
-- MEALMITRA — AI RECIPE SYSTEM
-- Production Migration Script
-- Target: Supabase (PostgreSQL 15)
-- Run in: Supabase SQL Editor (single execution)
-- ================================================================

-- ================================================================
-- EXTENSIONS
-- ================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS moddatetime;   -- built-in Supabase ext

-- ================================================================
-- UTILITY: updated_at auto-trigger
-- Uses the moddatetime extension function directly.
-- ================================================================

-- ================================================================
-- TABLE: user_ai_generated_recipes
-- ================================================================

CREATE TABLE IF NOT EXISTS public.user_ai_generated_recipes (

  -- ── Identity ────────────────────────────────────────────────
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES public.user_profiles(id)
                          ON DELETE SET NULL,

  -- ── Metadata ─────────────────────────────────────────────────
  title       TEXT        NOT NULL,
  description TEXT,
  image_url   TEXT,                        -- nullable; AI recipes may lack image

  cuisine     TEXT,
  diet        TEXT,
  difficulty  TEXT        CHECK (difficulty IN ('easy','medium','hard')),

  prep_time   SMALLINT    CHECK (prep_time  >= 0),
  cook_time   SMALLINT    CHECK (cook_time  >= 0),
  servings    SMALLINT    DEFAULT 2 CHECK (servings > 0),

  tags        TEXT[]      DEFAULT '{}',

  -- ── Nutrition (all nullable — AI may not always return these) ─
  calories    SMALLINT    CHECK (calories   >= 0),
  protein_g   NUMERIC(6,1) CHECK (protein_g >= 0),
  carbs_g     NUMERIC(6,1) CHECK (carbs_g   >= 0),
  fat_g       NUMERIC(6,1) CHECK (fat_g     >= 0),
  fiber_g     NUMERIC(6,1) CHECK (fiber_g   >= 0),
  sugar_g     NUMERIC(6,1) CHECK (sugar_g   >= 0),

  -- ── Core Data ─────────────────────────────────────────────────
  -- ingredients: array of objects, e.g.
  --   [{"name":"egg","qty":2,"unit":"whole"},...]
  ingredients JSONB       NOT NULL DEFAULT '[]',

  -- steps: array of objects, e.g.
  --   [{"step":1,"text":"Boil water..."},...]
  steps       JSONB       NOT NULL DEFAULT '[]',

  -- ── Ingredient names used during AI generation ────────────────
  -- Stored as lowercase canonical text[] for fast GIN array ops.
  -- These are the ingredients the user typed to trigger generation.
  source_ingredients TEXT[] DEFAULT '{}',

  -- ── Visibility ────────────────────────────────────────────────
  -- false = private (only owner can see)
  -- true  = public  (community feed; all authenticated users can see)
  is_public   BOOLEAN     NOT NULL DEFAULT false,

  -- ── Timestamps ────────────────────────────────────────────────
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ── Computed: total_time ──────────────────────────────────────
  total_time  SMALLINT    GENERATED ALWAYS AS (
    prep_time + cook_time
  ) STORED,

  -- ── Full-Text Search: title + description + tags ──────────────
  -- Weighted: title=A, description=B, tags=C  
  -- Using simple columns; will be updated via trigger
  fts_vector  TSVECTOR,

  -- ── Full-Text Search: ingredient names only ───────────────────
  -- Using simple column; will be updated via trigger
  ingredient_fts TSVECTOR

);

-- ================================================================
-- TRIGGER FUNCTIONS: FTS vector updates
-- ================================================================

CREATE OR REPLACE FUNCTION public.trg_ai_recipe_update_fts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update title + description + tags FTS vector
  NEW.fts_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(
      array_to_string(NEW.tags, ' '), ''
    )), 'C');

  -- Update ingredient names FTS vector
  NEW.ingredient_fts := 
    jsonb_to_tsvector('english', NEW.ingredients, '["string"]'::jsonb);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TRIGGER: auto-update FTS vectors
-- ================================================================

DROP TRIGGER IF EXISTS trg_ai_recipe_update_fts
  ON public.user_ai_generated_recipes;

CREATE TRIGGER trg_ai_recipe_update_fts
  BEFORE INSERT OR UPDATE ON public.user_ai_generated_recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_ai_recipe_update_fts();

-- ================================================================
-- TRIGGER: auto-update updated_at via moddatetime extension
-- ================================================================

DROP TRIGGER IF EXISTS trg_ai_recipe_moddatetime
  ON public.user_ai_generated_recipes;

CREATE TRIGGER trg_ai_recipe_moddatetime
  BEFORE UPDATE ON public.user_ai_generated_recipes
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime('updated_at');

-- ================================================================
-- INDEXES
-- ================================================================

-- FTS: title + description + tags
CREATE INDEX IF NOT EXISTS idx_ai_recipe_fts
  ON public.user_ai_generated_recipes
  USING GIN (fts_vector);

-- FTS: ingredient names
CREATE INDEX IF NOT EXISTS idx_ai_recipe_ingredient_fts
  ON public.user_ai_generated_recipes
  USING GIN (ingredient_fts);

-- JSONB: raw ingredient object search (for @> containment queries)
CREATE INDEX IF NOT EXISTS idx_ai_recipe_ingredients_jsonb
  ON public.user_ai_generated_recipes
  USING GIN (ingredients jsonb_path_ops);

-- Array: source ingredients used during generation
CREATE INDEX IF NOT EXISTS idx_ai_recipe_source_ingredients
  ON public.user_ai_generated_recipes
  USING GIN (source_ingredients);

-- Array: tags
CREATE INDEX IF NOT EXISTS idx_ai_recipe_tags
  ON public.user_ai_generated_recipes
  USING GIN (tags);

-- Trigram: title autocomplete / fuzzy search
CREATE INDEX IF NOT EXISTS idx_ai_recipe_title_trgm
  ON public.user_ai_generated_recipes
  USING GIN (title gin_trgm_ops);

-- B-tree: user lookup
CREATE INDEX IF NOT EXISTS idx_ai_recipe_user_id
  ON public.user_ai_generated_recipes (user_id);

-- B-tree: filter by cuisine, diet
CREATE INDEX IF NOT EXISTS idx_ai_recipe_cuisine
  ON public.user_ai_generated_recipes (cuisine);

CREATE INDEX IF NOT EXISTS idx_ai_recipe_diet
  ON public.user_ai_generated_recipes (diet);

-- B-tree: filter by calories, total_time
CREATE INDEX IF NOT EXISTS idx_ai_recipe_calories
  ON public.user_ai_generated_recipes (calories);

CREATE INDEX IF NOT EXISTS idx_ai_recipe_total_time
  ON public.user_ai_generated_recipes (total_time);

-- Composite: diet + calories (most common filter combo)
CREATE INDEX IF NOT EXISTS idx_ai_recipe_diet_calories
  ON public.user_ai_generated_recipes (diet, calories);

-- Composite: cuisine + diet
CREATE INDEX IF NOT EXISTS idx_ai_recipe_cuisine_diet
  ON public.user_ai_generated_recipes (cuisine, diet);

-- Partial: public recipes only — used for community feed queries
CREATE INDEX IF NOT EXISTS idx_ai_recipe_public
  ON public.user_ai_generated_recipes (created_at DESC)
  WHERE is_public = true;

-- Partial: user's own recipes — used for "my recipes" queries
CREATE INDEX IF NOT EXISTS idx_ai_recipe_user_created
  ON public.user_ai_generated_recipes (user_id, created_at DESC);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.user_ai_generated_recipes
  ENABLE ROW LEVEL SECURITY;

-- SELECT: owner sees all their own; others see only public recipes
CREATE POLICY "ai_recipe_select"
  ON public.user_ai_generated_recipes
  FOR SELECT
  USING (
    auth.uid() = user_id          -- owner sees their own (public or private)
    OR is_public = true           -- everyone sees public recipes
  );

-- INSERT: authenticated users insert their own recipes only
CREATE POLICY "ai_recipe_insert"
  ON public.user_ai_generated_recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: owner only
CREATE POLICY "ai_recipe_update"
  ON public.user_ai_generated_recipes
  FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: owner only
CREATE POLICY "ai_recipe_delete"
  ON public.user_ai_generated_recipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- INGREDIENT_ALIASES: ensure index exists
-- (Table must already exist from a prior migration)
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_ingredient_alias_lookup
  ON public.ingredient_aliases (lower(trim(alias)));

CREATE INDEX IF NOT EXISTS idx_ingredient_canonical_lookup
  ON public.ingredient_aliases (lower(trim(canonical)));

-- ================================================================
-- RPC: search_all_recipes_by_ingredients
--
-- Purpose:
--   Given a list of user-supplied ingredient strings (English or Hindi),
--   expand them via ingredient_aliases to canonical form, then search
--   both master_recipes and user_ai_generated_recipes using FTS.
--
-- Returns unified result set, sorted by match relevance then total_time.
--
-- Parameters:
--   user_ingredients  TEXT[]   — raw ingredient names from user input
--   min_match_pct     INT      — 0–100, used by caller to decide Flow 1 vs 2
--   limit_count       INT      — pagination page size
--   offset_count      INT      — pagination offset
--
-- Security: SECURITY DEFINER so it can read both tables regardless of
--   calling user's RLS. search_path locked to public to prevent hijack.
-- ================================================================

CREATE OR REPLACE FUNCTION public.search_all_recipes_by_ingredients(
  user_ingredients  TEXT[],
  limit_count       INT  DEFAULT 20,
  offset_count      INT  DEFAULT 0,
  p_diet            TEXT DEFAULT NULL,
  p_cuisine         TEXT DEFAULT NULL,
  p_max_time        INT  DEFAULT NULL
)
RETURNS TABLE (
  id                    UUID,
  title                 TEXT,
  description           TEXT,
  image_url             TEXT,
  cuisine               TEXT,
  diet                  TEXT,
  difficulty            TEXT,
  prep_time             SMALLINT,
  cook_time             SMALLINT,
  total_time            SMALLINT,
  servings              SMALLINT,
  tags                  TEXT[],
  calories              SMALLINT,
  matched_ingredients   TEXT[],
  missing_ingredients   TEXT[],
  match_count           INT,
  total_ingredients     INT,
  user_ingredient_count INT,
  match_score           NUMERIC(5,4),
  source                TEXT,
  generated_by_name     TEXT,
  fts_rank              REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized        TEXT[];
  tsq               TSQUERY;
  term_parts        TEXT[];
  t                 TEXT;
  v_user_ing_count  INT;
BEGIN

  -- Step 1: Normalize input to lowercase + canonical aliases.
  SELECT array_agg(DISTINCT lower(trim(x)))
  INTO   normalized
  FROM (
    SELECT lower(trim(unnest(user_ingredients))) AS x
    UNION
    SELECT lower(trim(canonical))
    FROM   public.ingredient_aliases
    WHERE  lower(trim(alias)) = ANY(
             SELECT lower(trim(i)) FROM unnest(user_ingredients) i
           )
  ) s
  WHERE x IS NOT NULL AND x <> '';

  v_user_ing_count := COALESCE(array_length(user_ingredients, 1), 0);

  IF normalized IS NULL OR array_length(normalized, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Step 2: Build an OR tsquery from normalized ingredients.
  SELECT array_agg('(' || plainto_tsquery('english', t)::TEXT || ')')
  INTO   term_parts
  FROM   unnest(normalized) AS t
  WHERE  plainto_tsquery('english', t)::TEXT <> '';

  IF term_parts IS NULL OR array_length(term_parts, 1) = 0 THEN
    RETURN;
  END IF;

  tsq := array_to_string(term_parts, ' | ')::TSQUERY;

  -- Step 3: Pull candidates from both recipe tables, then score ingredient overlap.
  RETURN QUERY
  WITH unified AS (
    (
      SELECT
        r.id,
        r.title,
        r.description,
        r.image_url,
        r.cuisine,
        r.diet,
        r.difficulty,
        r.prep_time,
        r.cook_time,
        r.total_time,
        r.servings,
        r.tags,
        r.calories,
        r.ingredients,
        'master'::TEXT                    AS source,
        NULL::TEXT                        AS generated_by_name,
        ts_rank_cd(r.ingredient_fts, tsq) AS fts_rank
      FROM public.master_recipes r
      WHERE r.deleted_at IS NULL
        AND r.ingredient_fts @@ tsq
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
        AND (p_diet     IS NULL OR r.diet    ILIKE p_diet)
        AND (p_cuisine  IS NULL OR r.cuisine ILIKE p_cuisine)
        AND (p_max_time IS NULL OR r.total_time <= p_max_time)
        AND NOT EXISTS (
          SELECT 1
          FROM public.saved_recipes sr
          WHERE sr.recipe_id = r.id
            AND sr.user_id = auth.uid()
        )
    )

    UNION ALL

    (
      SELECT
        r.id,
        r.title,
        r.description,
        r.image_url,
        r.cuisine,
        r.diet,
        r.difficulty,
        r.prep_time,
        r.cook_time,
        r.total_time,
        r.servings,
        r.tags,
        r.calories,
        r.ingredients,
        'ai'::TEXT                        AS source,
        u.name                            AS generated_by_name,
        ts_rank_cd(r.ingredient_fts, tsq) AS fts_rank
      FROM public.user_ai_generated_recipes r
      LEFT JOIN public.user_profiles u ON u.id = r.user_id
      WHERE r.ingredient_fts @@ tsq
        AND (r.is_public = TRUE OR r.user_id = auth.uid())
        AND (p_diet     IS NULL OR r.diet    ILIKE p_diet)
        AND (p_cuisine  IS NULL OR r.cuisine ILIKE p_cuisine)
        AND (p_max_time IS NULL OR r.total_time <= p_max_time)
    )
  ),
  scored AS (
    SELECT
      u.id,
      u.title,
      u.description,
      u.image_url,
      u.cuisine,
      u.diet,
      u.difficulty,
      u.prep_time,
      u.cook_time,
      u.total_time,
      u.servings,
      u.tags,
      u.calories,
      COALESCE(ing_stats.matched_names, '{}'::TEXT[]) AS matched_ingredients,
      COALESCE(ing_stats.missing_names, '{}'::TEXT[]) AS missing_ingredients,
      COALESCE(ing_stats.match_count, 0)              AS match_count,
      jsonb_array_length(u.ingredients)::INT          AS total_ingredients,
      u.source,
      u.generated_by_name,
      u.fts_rank
    FROM unified u
    CROSS JOIN LATERAL (
      SELECT
        array_agg(ing_name) FILTER (WHERE is_match) AS matched_names,
        (array_agg(ing_name ORDER BY ing_ord) FILTER (WHERE NOT is_match))[1:3] AS missing_names,
        COUNT(*) FILTER (WHERE is_match)::INT AS match_count
      FROM (
        SELECT
          elem->>'name' AS ing_name,
          ord::INT      AS ing_ord,
          bool_or(
            length(trim(norm)) > 0
            AND (
              lower(elem->>'name') ILIKE '%' || lower(trim(norm)) || '%'
              OR lower(trim(norm)) ILIKE '%' || lower(elem->>'name') || '%'
            )
          ) AS is_match
        FROM jsonb_array_elements(u.ingredients) WITH ORDINALITY AS e(elem, ord)
        CROSS JOIN unnest(normalized) AS norm
        GROUP BY elem->>'name', ord
      ) scored_ing
    ) ing_stats
  )
  SELECT
    s.id,
    s.title,
    s.description,
    s.image_url,
    s.cuisine,
    s.diet,
    s.difficulty,
    s.prep_time,
    s.cook_time,
    s.total_time,
    s.servings,
    s.tags,
    s.calories,
    s.matched_ingredients,
    s.missing_ingredients,
    s.match_count,
    s.total_ingredients,
    v_user_ing_count AS user_ingredient_count,
    ROUND(
      s.match_count::NUMERIC / GREATEST(s.total_ingredients, 1),
      4
    )::NUMERIC(5,4) AS match_score,
    s.source,
    s.generated_by_name,
    s.fts_rank
  FROM scored s
  WHERE s.match_count > 0
  ORDER BY
    ROUND(s.match_count::NUMERIC / GREATEST(s.total_ingredients, 1), 4) DESC,
    s.match_count DESC,
    s.fts_rank DESC,
    s.total_time ASC NULLS LAST
  LIMIT  limit_count
  OFFSET offset_count;

END;
$$;

GRANT EXECUTE
  ON FUNCTION public.search_all_recipes_by_ingredients(TEXT[], INT, INT, TEXT, TEXT, INT)
  TO authenticated;

-- ================================================================
-- RPC: save_ai_generated_recipe
--
-- Purpose:
--   Called by the AI assistant backend after generating a recipe.
--   Inserts into user_ai_generated_recipes and returns the new row id.
--
-- All ingredient names in source_ingredients are lowercased on insert
-- for consistent GIN array matching.
-- ================================================================

CREATE OR REPLACE FUNCTION public.save_ai_generated_recipe(
  p_user_id           UUID,
  p_title             TEXT,
  p_description       TEXT       DEFAULT NULL,
  p_image_url         TEXT       DEFAULT NULL,
  p_cuisine           TEXT       DEFAULT NULL,
  p_diet              TEXT       DEFAULT NULL,
  p_difficulty        TEXT       DEFAULT 'medium',
  p_prep_time         SMALLINT   DEFAULT NULL,
  p_cook_time         SMALLINT   DEFAULT NULL,
  p_servings          SMALLINT   DEFAULT 2,
  p_tags              TEXT[]     DEFAULT '{}',
  p_calories          SMALLINT   DEFAULT NULL,
  p_protein_g         NUMERIC    DEFAULT NULL,
  p_carbs_g           NUMERIC    DEFAULT NULL,
  p_fat_g             NUMERIC    DEFAULT NULL,
  p_fiber_g           NUMERIC    DEFAULT NULL,
  p_sugar_g           NUMERIC    DEFAULT NULL,
  p_ingredients       JSONB      DEFAULT '[]',
  p_steps             JSONB      DEFAULT '[]',
  p_source_ingredients TEXT[]    DEFAULT '{}',
  p_is_public         BOOLEAN    DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'p_user_id must match auth.uid()'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.user_ai_generated_recipes (
    user_id, title, description, image_url,
    cuisine, diet, difficulty,
    prep_time, cook_time, servings,
    tags, calories,
    protein_g, carbs_g, fat_g, fiber_g, sugar_g,
    ingredients, steps,
    source_ingredients, is_public
  )
  VALUES (
    p_user_id,
    p_title,
    p_description,
    p_image_url,
    p_cuisine,
    p_diet,
    p_difficulty,
    p_prep_time,
    p_cook_time,
    p_servings,
    p_tags,
    p_calories,
    p_protein_g, p_carbs_g, p_fat_g, p_fiber_g, p_sugar_g,
    p_ingredients,
    p_steps,
    -- normalise source ingredients to lowercase for consistent GIN matching
    ARRAY(
      SELECT lower(trim(i))
      FROM   unnest(p_source_ingredients) i
      WHERE  trim(i) <> ''
    ),
    p_is_public
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE
  ON FUNCTION public.save_ai_generated_recipe(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
    SMALLINT, SMALLINT, SMALLINT,
    TEXT[], SMALLINT,
    NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC,
    JSONB, JSONB, TEXT[], BOOLEAN
  )
  TO authenticated;

-- ================================================================
-- RPC: get_recipe_match_percentage
--
-- Purpose:
--   Given a recipe id + source ('master'|'ai') and a list of user
--   ingredients, return what percentage of the recipe's ingredients
--   are covered by the user's pantry.
--   Used to decide Flow 1 (match >= 80%) vs Flow 2 (generate new).
--
-- Returns: NUMERIC 0–100
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_recipe_match_percentage(
  p_recipe_id         UUID,
  p_source            TEXT,      -- 'master' or 'ai'
  p_user_ingredients  TEXT[]
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipe_ingredients  JSONB;
  total_count         INT;
  matched_count       INT;
  normalized_pantry   TEXT[];
BEGIN

  -- Normalize user pantry to canonical form
  SELECT array_agg(DISTINCT lower(trim(x)))
  INTO   normalized_pantry
  FROM (
    SELECT lower(trim(unnest(p_user_ingredients))) AS x
    UNION
    SELECT lower(trim(canonical))
    FROM   public.ingredient_aliases
    WHERE  lower(trim(alias)) = ANY(
             SELECT lower(trim(i)) FROM unnest(p_user_ingredients) i
           )
  ) s
  WHERE x IS NOT NULL AND x <> '';

  -- Fetch ingredients JSONB from correct table
  IF p_source = 'master' THEN
    SELECT ingredients INTO recipe_ingredients
    FROM   public.master_recipes
    WHERE  id = p_recipe_id;
  ELSE
    SELECT ingredients INTO recipe_ingredients
    FROM   public.user_ai_generated_recipes
    WHERE  id = p_recipe_id
      AND  (is_public = true OR user_id = auth.uid());
  END IF;

  IF recipe_ingredients IS NULL THEN
    RETURN 0;
  END IF;

  -- Count total ingredients in recipe
  SELECT jsonb_array_length(recipe_ingredients) INTO total_count;

  IF total_count = 0 THEN
    RETURN 100;
  END IF;

  -- Count how many recipe ingredient names appear in user's pantry
  -- Assumes JSONB structure: [{"name": "egg", ...}, ...]
  SELECT COUNT(*)
  INTO   matched_count
  FROM   jsonb_array_elements(recipe_ingredients) AS elem
  WHERE  lower(trim(elem->>'name')) = ANY(normalized_pantry);

  RETURN ROUND((matched_count::NUMERIC / total_count) * 100, 1);
END;
$$;

GRANT EXECUTE
  ON FUNCTION public.get_recipe_match_percentage(UUID, TEXT, TEXT[])
  TO authenticated;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
-- Tables  : user_ai_generated_recipes
-- Triggers: trg_ai_recipe_moddatetime
-- Indexes : 15 (GIN FTS, GIN JSONB, GIN array, trigram, B-tree,
--           composite, partial)
-- RLS     : 4 policies (select/insert/update/delete)
-- RPCs    : search_all_recipes_by_ingredients
--           save_ai_generated_recipe
--           get_recipe_match_percentage
-- ================================================================