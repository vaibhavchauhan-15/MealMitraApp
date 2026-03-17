BEGIN;

CREATE OR REPLACE FUNCTION public.get_user_ai_diet_plan_meals_page(
  p_user_id uuid,
  p_plan_id uuid,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 24
)
RETURNS TABLE(
  id uuid,
  plan_id uuid,
  recipe_id uuid,
  recipe_source text,
  day date,
  meal_type text,
  servings smallint,
  added_at timestamp with time zone
)
LANGUAGE sql
STABLE
AS $$
  WITH authorized_plan AS (
    SELECT p.id
    FROM public.diet_plans p
    WHERE p.id = p_plan_id
      AND p.user_id = p_user_id
      AND (auth.uid() = p_user_id OR auth.role() = 'service_role')
  )
  SELECT
    dpm.id,
    dpm.plan_id,
    dpm.recipe_id,
    dpm.recipe_source,
    dpm.day,
    dpm.meal_type,
    dpm.servings,
    dpm.added_at
  FROM public.diet_plan_meals dpm
  JOIN authorized_plan ap ON ap.id = dpm.plan_id
  ORDER BY
    dpm.day ASC,
    CASE dpm.meal_type
      WHEN 'Breakfast' THEN 1
      WHEN 'Lunch' THEN 2
      WHEN 'Snack' THEN 3
      WHEN 'Dinner' THEN 4
      ELSE 99
    END ASC,
    dpm.added_at ASC,
    dpm.id ASC
  OFFSET GREATEST(coalesce(p_offset, 0), 0)
  LIMIT (GREATEST(coalesce(p_limit, 24), 1) + 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_user_ai_diet_plan_meals_page(uuid, uuid, integer, integer)
TO authenticated, service_role;

COMMIT;
