BEGIN;

CREATE OR REPLACE FUNCTION public.match_master_recipes_for_meals_batch(
  p_meal_names text[],
  p_diet_type text,
  p_exclude_recipe_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS TABLE(
  meal_name text,
  matched_title text,
  recipe_id uuid,
  recipe_source text
)
LANGUAGE sql
STABLE
AS $$
  WITH requested AS (
    SELECT DISTINCT lower(regexp_replace(trim(name), '\\s+', ' ', 'g')) AS meal_name
    FROM unnest(coalesce(p_meal_names, ARRAY[]::text[])) AS name
    WHERE coalesce(trim(name), '') <> ''
  ),
  allowed_diets AS (
    SELECT unnest(
      CASE lower(coalesce(p_diet_type, 'vegetarian'))
        WHEN 'vegan' THEN ARRAY['Vegan']::text[]
        WHEN 'eggetarian' THEN ARRAY['Eggetarian', 'Vegetarian', 'Vegan']::text[]
        WHEN 'non_veg' THEN ARRAY['Non-Vegetarian', 'Eggetarian', 'Vegetarian', 'Vegan']::text[]
        ELSE ARRAY['Vegetarian', 'Vegan']::text[]
      END
    ) AS diet
  ),
  ranked AS (
    SELECT
      r.meal_name,
      m.title AS matched_title,
      m.id AS recipe_id,
      row_number() OVER (
        PARTITION BY r.meal_name
        ORDER BY m.updated_at DESC NULLS LAST, m.created_at DESC NULLS LAST, m.id
      ) AS row_rank
    FROM requested r
    JOIN public.master_recipes m
      ON lower(regexp_replace(trim(m.title), '\\s+', ' ', 'g')) = r.meal_name
    WHERE m.is_public = true
      AND m.deleted_at IS NULL
      AND m.source <> 'ai'
      AND m.diet IN (SELECT diet FROM allowed_diets)
      AND NOT (m.id = ANY(coalesce(p_exclude_recipe_ids, '{}'::uuid[])))
  )
  SELECT
    meal_name,
    matched_title,
    recipe_id,
    'master'::text AS recipe_source
  FROM ranked
  WHERE row_rank <= 5
  ORDER BY meal_name, row_rank;
$$;

GRANT EXECUTE ON FUNCTION public.match_master_recipes_for_meals_batch(text[], text, uuid[]) TO anon, authenticated, service_role;

COMMIT;
