# AI Planner Deep Dive

This document covers the AI diet plan lifecycle from generation to storage, public sharing, and planner insertion.

## Scope

Covers:
- Plan persistence in `diet_plans`
- Plan meal rows in `diet_plan_meals`
- Public plan browsing/detail hydration
- Adding public plans to weekly planner with nutrition checks

## Core Service

Main service file:
- `src/services/aiPlanSupabaseService.ts`

Key exports:
- `saveAiDietPlan(...)`
- `getUserAiDietPlans(...)`
- `getUploadedUserAiDietPlansPage(...)`
- `getPublicAiDietPlansPage(...)`
- `getPublicAiDietPlanById(...)`
- `savePublicAiDietPlan(...)`

## Data Design

### `diet_plans`

Stores plan metadata and serialized plan payload:
- `goal`, `diet_type`, `days`
- `total_calories`, `total_protein`
- `plan_data` (JSON payload, includes selected days and plan origin)
- `is_public` for discoverability

### `diet_plan_meals`

Normalized per-slot mapping:
- `plan_id`
- `recipe_id`
- `recipe_source` (`master` or `ai`)
- `day` (date)
- `meal_type` (Breakfast/Lunch/Dinner/Snack)
- `servings`

The combination supports polymorphic recipe references and source-aware planner hydration.

## Save Flow

When `saveAiDietPlan` runs:

1. Resolve authenticated user id.
2. Ensure `user_profiles` row exists (upsert safeguard).
3. Insert plan row in `diet_plans`.
4. Insert unique slot rows into `diet_plan_meals`.
5. On meal insert failure, rollback by deleting created plan row.
6. Invalidate public and uploaded plan caches.

## Public Plan Consumption

Public plan detail route:
- `app/public-ai-plan/[id].tsx`

Behavior:
- Loads public plan by id with embedded meal rows.
- Normalizes meals to weekly planner slots (`Sun..Sat`, meal types).
- Prevents exact duplicate insertion when slot/source/id already match.

## Nutrition Guardrails

Public plan insertion performs daily target checks before writing planner rows:
- Computes target values from profile (`getDailyNutritionTargets`).
- Merges existing day meals (excluding replaced slots) and incoming plan slots.
- Fetches recipes by source (`master`/`ai`) and sums nutrition.
- Uses `getExceededTargetKeys(...)` to block insertion when day totals exceed target.

Utility file:
- `src/utils/plannerNutrition.ts`

## Planner Integration

Planner store write operation:
- `addMeal(day, mealType, recipeId, servings, recipeSource)`

Source-aware references are preserved end-to-end from plan to planner.

## Public Plan Browse and Reuse

Public plan pages use service methods that support:
- server query + client ranking
- pagination limits
- title and diet filters
- exact-match reuse flow before plan generation

This reduces repeated model calls and improves consistency for common goal/diet/calorie/day combinations.

## Related Routes and UI

- `app/ai-plans.tsx`
- `app/ai-generated-plan-history.tsx`
- `app/ai-generated-plan-history/[id].tsx`
- `app/public-ai-plan/[id].tsx`
- `src/components/AiDietPlannerModal.tsx`

## Common Failure Modes

- Missing profile row can block FK insert into `diet_plans`.
  - Mitigated by upsert safeguard in `saveAiDietPlan`.
- Missing recipe references during hydration can break nutrition calculations.
  - Mitigated by source-aware fetch fallback in detail route.
- Planner over-target insertions.
  - Guarded by pre-insert nutrition checks.
