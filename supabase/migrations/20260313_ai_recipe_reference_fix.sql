-- ================================================================
-- MEALMITRA — AI Recipe Storage + Reference Fix
-- Goal:
--   1) Keep AI-generated recipes in user_ai_generated_recipes only
--   2) Let saved/planner/diet-plan rows reference master + ai recipes
--   3) Keep ingredient search fast and compatible with app RPC callers
-- ================================================================

BEGIN;

-- ------------------------------------------------
-- saved_recipes: add source and remove hard FK to master_recipes
-- ------------------------------------------------
ALTER TABLE public.saved_recipes
  ADD COLUMN IF NOT EXISTS recipe_source TEXT;

UPDATE public.saved_recipes
SET recipe_source = 'master'
WHERE recipe_source IS NULL;

ALTER TABLE public.saved_recipes
  ALTER COLUMN recipe_source SET DEFAULT 'master',
  ALTER COLUMN recipe_source SET NOT NULL;

ALTER TABLE public.saved_recipes
  DROP CONSTRAINT IF EXISTS saved_recipes_recipe_id_fkey;

ALTER TABLE public.saved_recipes
  DROP CONSTRAINT IF EXISTS saved_recipes_user_id_recipe_id_key;

ALTER TABLE public.saved_recipes
  ADD CONSTRAINT saved_recipes_recipe_source_check
  CHECK (recipe_source IN ('master', 'ai'));

ALTER TABLE public.saved_recipes
  ADD CONSTRAINT saved_recipes_user_recipe_unique
  UNIQUE (user_id, recipe_source, recipe_id);

CREATE INDEX IF NOT EXISTS idx_saved_user_source_recipe
  ON public.saved_recipes(user_id, recipe_source, recipe_id);

CREATE INDEX IF NOT EXISTS idx_saved_recipe_source_id
  ON public.saved_recipes(recipe_source, recipe_id);

-- ------------------------------------------------
-- planner_meals: add source and remove hard FK to master_recipes
-- ------------------------------------------------
ALTER TABLE public.planner_meals
  ADD COLUMN IF NOT EXISTS recipe_source TEXT;

UPDATE public.planner_meals
SET recipe_source = 'master'
WHERE recipe_source IS NULL;

ALTER TABLE public.planner_meals
  ALTER COLUMN recipe_source SET DEFAULT 'master',
  ALTER COLUMN recipe_source SET NOT NULL;

ALTER TABLE public.planner_meals
  DROP CONSTRAINT IF EXISTS planner_meals_recipe_id_fkey;

ALTER TABLE public.planner_meals
  ADD CONSTRAINT planner_meals_recipe_source_check
  CHECK (recipe_source IN ('master', 'ai'));

CREATE INDEX IF NOT EXISTS idx_planner_user_day_source
  ON public.planner_meals(user_id, day, recipe_source);

CREATE INDEX IF NOT EXISTS idx_planner_recipe_source_id
  ON public.planner_meals(recipe_source, recipe_id);

-- ------------------------------------------------
-- diet_plan_meals: add source and remove hard FK to master_recipes
-- ------------------------------------------------
ALTER TABLE public.diet_plan_meals
  ADD COLUMN IF NOT EXISTS recipe_source TEXT;

UPDATE public.diet_plan_meals
SET recipe_source = 'master'
WHERE recipe_source IS NULL;

ALTER TABLE public.diet_plan_meals
  ALTER COLUMN recipe_source SET DEFAULT 'master',
  ALTER COLUMN recipe_source SET NOT NULL;

ALTER TABLE public.diet_plan_meals
  DROP CONSTRAINT IF EXISTS diet_plan_meals_recipe_id_fkey;

ALTER TABLE public.diet_plan_meals
  ADD CONSTRAINT diet_plan_meals_recipe_source_check
  CHECK (recipe_source IN ('master', 'ai'));

CREATE INDEX IF NOT EXISTS idx_diet_plan_meals_recipe_source_id
  ON public.diet_plan_meals(recipe_source, recipe_id);

-- ------------------------------------------------
-- Shared trigger for polymorphic recipe references
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

DROP TRIGGER IF EXISTS trg_saved_recipes_validate_recipe_ref ON public.saved_recipes;
CREATE TRIGGER trg_saved_recipes_validate_recipe_ref
  BEFORE INSERT OR UPDATE OF recipe_id, recipe_source
  ON public.saved_recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_recipe_reference();

DROP TRIGGER IF EXISTS trg_planner_meals_validate_recipe_ref ON public.planner_meals;
CREATE TRIGGER trg_planner_meals_validate_recipe_ref
  BEFORE INSERT OR UPDATE OF recipe_id, recipe_source
  ON public.planner_meals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_recipe_reference();

DROP TRIGGER IF EXISTS trg_diet_plan_meals_validate_recipe_ref ON public.diet_plan_meals;
CREATE TRIGGER trg_diet_plan_meals_validate_recipe_ref
  BEFORE INSERT OR UPDATE OF recipe_id, recipe_source
  ON public.diet_plan_meals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_recipe_reference();

-- ------------------------------------------------
-- Recreate ingredient search RPC with source-aware saved filter
-- and correct user profile name projection.
-- ------------------------------------------------
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
  v_user_ing_count  INT;
BEGIN
  SELECT array_agg(DISTINCT lower(trim(x)))
  INTO normalized
  FROM (
    SELECT lower(trim(unnest(user_ingredients))) AS x
    UNION
    SELECT lower(trim(a.canonical))
    FROM public.ingredient_aliases a
    JOIN unnest(user_ingredients) raw(i)
      ON lower(trim(a.alias)) = lower(trim(raw.i))
  ) s
  WHERE x IS NOT NULL AND x <> '';

  v_user_ing_count := COALESCE(array_length(user_ingredients, 1), 0);

  IF normalized IS NULL OR array_length(normalized, 1) IS NULL THEN
    RETURN;
  END IF;

  SELECT array_agg('(' || plainto_tsquery('english', t)::TEXT || ')')
  INTO term_parts
  FROM unnest(normalized) AS t
  WHERE plainto_tsquery('english', t)::TEXT <> '';

  IF term_parts IS NULL OR array_length(term_parts, 1) = 0 THEN
    RETURN;
  END IF;

  tsq := array_to_string(term_parts, ' | ')::TSQUERY;

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
              AND dpm.recipe_source = 'master'
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
            AND sr.recipe_source = 'master'
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
        COALESCE(u.name, 'MealMitra User') AS generated_by_name,
        ts_rank_cd(r.ingredient_fts, tsq) AS fts_rank
      FROM public.user_ai_generated_recipes r
      LEFT JOIN public.user_profiles u ON u.id = r.user_id
      WHERE r.ingredient_fts @@ tsq
        AND (r.is_public = TRUE OR r.user_id = auth.uid())
        AND (p_diet     IS NULL OR r.diet    ILIKE p_diet)
        AND (p_cuisine  IS NULL OR r.cuisine ILIKE p_cuisine)
        AND (p_max_time IS NULL OR r.total_time <= p_max_time)
        AND NOT EXISTS (
          SELECT 1
          FROM public.saved_recipes sr
          WHERE sr.recipe_id = r.id
            AND sr.recipe_source = 'ai'
            AND sr.user_id = auth.uid()
        )
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
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE
  ON FUNCTION public.search_all_recipes_by_ingredients(TEXT[], INT, INT, TEXT, TEXT, INT)
  TO authenticated;

-- ------------------------------------------------
-- Harden save RPC: normalize difficulty + source ingredient casing
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_ai_generated_recipe(
  p_user_id            UUID,
  p_title              TEXT,
  p_description        TEXT       DEFAULT NULL,
  p_image_url          TEXT       DEFAULT NULL,
  p_cuisine            TEXT       DEFAULT NULL,
  p_diet               TEXT       DEFAULT NULL,
  p_difficulty         TEXT       DEFAULT 'medium',
  p_prep_time          SMALLINT   DEFAULT NULL,
  p_cook_time          SMALLINT   DEFAULT NULL,
  p_servings           SMALLINT   DEFAULT 2,
  p_tags               TEXT[]     DEFAULT '{}',
  p_calories           SMALLINT   DEFAULT NULL,
  p_protein_g          NUMERIC    DEFAULT NULL,
  p_carbs_g            NUMERIC    DEFAULT NULL,
  p_fat_g              NUMERIC    DEFAULT NULL,
  p_fiber_g            NUMERIC    DEFAULT NULL,
  p_sugar_g            NUMERIC    DEFAULT NULL,
  p_ingredients        JSONB      DEFAULT '[]',
  p_steps              JSONB      DEFAULT '[]',
  p_source_ingredients TEXT[]     DEFAULT '{}',
  p_is_public          BOOLEAN    DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
  v_diff TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'p_user_id must match auth.uid()'
      USING ERRCODE = '42501';
  END IF;

  v_diff := lower(trim(COALESCE(p_difficulty, 'medium')));
  IF v_diff NOT IN ('easy', 'medium', 'hard') THEN
    v_diff := 'medium';
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
    v_diff,
    p_prep_time,
    p_cook_time,
    p_servings,
    p_tags,
    p_calories,
    p_protein_g, p_carbs_g, p_fat_g, p_fiber_g, p_sugar_g,
    p_ingredients,
    p_steps,
    ARRAY(
      SELECT DISTINCT lower(trim(i))
      FROM unnest(p_source_ingredients) i
      WHERE trim(i) <> ''
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

COMMIT;
