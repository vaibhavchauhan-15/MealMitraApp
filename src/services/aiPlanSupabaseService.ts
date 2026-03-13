// ─── AI Diet Plan Supabase Service ───────────────────────────────────────────
// CRUD operations for persisting AI-generated diet plans in the v3 diet_plans table.
// All operations are scoped to the authenticated user via RLS.

import { supabase } from './supabase';
import { AIDietPlan, UserFitnessProfile } from './aiDietService';
import { DayOfWeek, MealType, RecipeSource } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SavedAiDietPlan {
  id: string;
  user_id: string;
  title: string;
  goal: string;
  diet_type: string;
  days: number;          // count of selected days
  total_calories: number;
  total_protein: number;
  plan_data: AIDietPlan & {
    diet_type: string;
    selected_days: DayOfWeek[];
    plan_origin?: 'ai' | 'public';
  };
  is_active: boolean;
  is_public?: boolean;
  created_at: string;
  diet_plan_meals?: SavedAiDietPlanMeal[];
}

export interface SavedAiDietPlanMeal {
  id: string;
  plan_id: string;
  recipe_id: string;
  recipe_source: RecipeSource;
  day: string;
  meal_type: MealType;
  servings: number;
  added_at: string;
}

export interface PublicAiDietPlanCard {
  id: string;
  user_id: string;
  title: string;
  goal: string | null;
  diet_type: string | null;
  days: number | null;
  total_calories: number | null;
  total_protein: number | null;
  plan_diet_type: string | null;
  plan_calories: number | null;
  created_at: string;
  plan_data?: Record<string, unknown> | null;
  created_by_name: string;
  source_label: string;
  created_by_ai: boolean;
  diet_plan_meals?: SavedAiDietPlanMeal[];
}

export interface PublicPlanQueryOptions {
  offset?: number;
  limit?: number;
  titleQuery?: string;
  dietType?: string;
  maxCalories?: number;
}

export interface ExactPublicPlanQueryInput {
  goal: string;
  dietType: string;
  calories: number;
  days: number;
  limit?: number;
}

export interface PublicPlanPage {
  items: PublicAiDietPlanCard[];
  hasMore: boolean;
}

export interface AiDietPlanMealSelection {
  day: DayOfWeek;
  mealType: MealType;
  recipeId: string;
  recipeSource?: RecipeSource;
  servings?: number;
}

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function mapPublicPlanRow(row: any): PublicAiDietPlanCard {
  const profileRel = row?.user_profiles;
  const createdByName = Array.isArray(profileRel)
    ? profileRel[0]?.name ?? 'MealMitra User'
    : profileRel?.name ?? 'MealMitra User';
  const planOrigin = String(row?.plan_data?.plan_origin ?? 'ai').toLowerCase();

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    goal: row.goal,
    diet_type: row.diet_type,
    days: row.days,
    total_calories: row.total_calories,
    total_protein: row.total_protein,
    plan_diet_type: row.plan_diet_type,
    plan_calories: row.plan_calories,
    created_at: row.created_at,
    plan_data: row.plan_data ?? null,
    created_by_name: createdByName,
    source_label: createdByName,
    created_by_ai: planOrigin !== 'public',
    diet_plan_meals: (row.diet_plan_meals ?? []) as SavedAiDietPlanMeal[],
  };
}

function dayToDate(day: DayOfWeek): string {
  const today = new Date();
  const jsDay = today.getDay();
  const daysFromMonday = jsDay === 0 ? 6 : jsDay - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  const offset = DAYS.indexOf(day);
  const target = new Date(monday);
  target.setDate(monday.getDate() + offset);
  return target.toISOString().split('T')[0];
}

// ─── Save a new AI diet plan ──────────────────────────────────────────────────

export async function saveAiDietPlan(
  userId: string | null | undefined,
  plan: AIDietPlan,
  selectedDays: DayOfWeek[],
  profile: UserFitnessProfile,
  meals: AiDietPlanMealSelection[] = []
): Promise<SavedAiDietPlan> {
  // Ensure user_profiles row exists before inserting into diet_plans.
  // diet_plans.user_id → user_profiles(id) FK will fail if the row isn't there yet.
  // syncProfileToSupabase in userStore is fire-and-forget, so it may not have
  // committed before we reach here (especially on first plan creation).
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const resolvedUserId = userId ?? authUser?.id ?? null;
  if (!resolvedUserId) {
    throw new Error('You must be logged in to save diet plans.');
  }

  if (authUser) {
    await supabase.from('user_profiles').upsert(
      {
        id: authUser.id,
        name: (authUser.user_metadata?.name as string | undefined)
          ?? authUser.email?.split('@')[0]
          ?? 'User',
        email: authUser.email ?? '',
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  }

  const goalLabel = profile.goal.replace(/_/g, ' ');
  const { data, error } = await supabase
    .from('diet_plans')
    .insert({
      user_id: resolvedUserId,
      title: `${goalLabel.charAt(0).toUpperCase() + goalLabel.slice(1)} Plan — ${selectedDays.join(', ')}`,
      goal: profile.goal,
      diet_type: profile.diet_type,
      days: selectedDays.length,
      total_calories: plan.total_calories,
      total_protein: plan.protein_g,
      // Embed diet_type + selected_days in JSONB so generated columns can extract them
      plan_data: {
        ...plan,
        diet_type: profile.diet_type,
        selected_days: selectedDays,
        plan_origin: 'ai',
      },
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;

  if (meals.length > 0) {
    const uniqueMeals = Array.from(
      new Map(
        meals.map((meal) => [
          `${meal.day}-${meal.mealType}`,
          {
            plan_id: data.id,
            recipe_id: meal.recipeId,
            recipe_source: meal.recipeSource ?? 'master',
            day: dayToDate(meal.day),
            meal_type: meal.mealType,
            servings: meal.servings ?? 1,
          },
        ])
      ).values()
    );

    const { error: mealsError } = await supabase
      .from('diet_plan_meals')
      .insert(uniqueMeals);

    if (mealsError) {
      await supabase.from('diet_plans').delete().eq('id', data.id);
      throw mealsError;
    }
  }

  return data as SavedAiDietPlan;
}

// ─── Fetch all plans for a user ───────────────────────────────────────────────

export async function getUserAiDietPlans(userId: string): Promise<SavedAiDietPlan[]> {
  const { data, error } = await supabase
    .from('diet_plans')
    .select('*, diet_plan_meals(id, plan_id, recipe_id, recipe_source, day, meal_type, servings, added_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as SavedAiDietPlan[];
}

export async function getPublicAiDietPlansPage(
  options: PublicPlanQueryOptions = {}
): Promise<PublicPlanPage> {
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 20;
  const upper = offset + limit;

  let query = supabase
    .from('diet_plans')
    .select('id,user_id,title,goal,diet_type,days,total_calories,total_protein,plan_diet_type,plan_calories,created_at,plan_data,user_profiles(name)')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (options.titleQuery && options.titleQuery.trim().length > 0) {
    query = query.ilike('title', `%${options.titleQuery.trim()}%`);
  }
  if (options.dietType) {
    query = query.eq('plan_diet_type', options.dietType);
  }
  if (typeof options.maxCalories === 'number') {
    query = query.lte('plan_calories', options.maxCalories);
  }

  const { data, error } = await query.range(offset, upper);
  if (error) throw error;

  const rows = (data ?? []).map(mapPublicPlanRow);
  return {
    items: rows.slice(0, limit),
    hasMore: rows.length > limit,
  };
}

export async function findExactPublicDietPlans(
  input: ExactPublicPlanQueryInput
): Promise<PublicAiDietPlanCard[]> {
  const exactCalories = Math.round(input.calories);
  const exactMatchOr = [
    `and(plan_diet_type.eq.${input.dietType},plan_calories.eq.${exactCalories})`,
    `and(plan_diet_type.eq.${input.dietType},total_calories.eq.${exactCalories})`,
    `and(diet_type.eq.${input.dietType},plan_calories.eq.${exactCalories})`,
    `and(diet_type.eq.${input.dietType},total_calories.eq.${exactCalories})`,
  ].join(',');

  const { data, error } = await supabase
    .from('diet_plans')
    .select('id,user_id,title,goal,diet_type,days,total_calories,total_protein,plan_diet_type,plan_calories,created_at,plan_data,user_profiles(name),diet_plan_meals(id,plan_id,recipe_id,recipe_source,day,meal_type,servings,added_at)')
    .eq('is_public', true)
    .eq('is_active', true)
    // Backward-compatible exact matching: generated columns for new rows,
    // fallback scalar columns for older rows.
    .or(exactMatchOr)
    .eq('days', input.days)
    .eq('goal', input.goal)
    .order('created_at', { ascending: false })
    .limit(input.limit ?? 10);

  if (error) throw error;
  return (data ?? []).map(mapPublicPlanRow);
}

export async function uploadAiDietPlan(planId: string): Promise<void> {
  const { error } = await supabase
    .from('diet_plans')
    .update({ is_public: true })
    .eq('id', planId);

  if (error) throw error;
}

export async function upsertAiDietPlanMeals(
  planId: string,
  meals: AiDietPlanMealSelection[]
): Promise<void> {
  if (meals.length === 0) return;

  const uniqueMeals = Array.from(
    new Map(
      meals.map((meal) => [
        `${meal.day}-${meal.mealType}`,
        {
          plan_id: planId,
          recipe_id: meal.recipeId,
          recipe_source: meal.recipeSource ?? 'master',
          day: dayToDate(meal.day),
          meal_type: meal.mealType,
          servings: meal.servings ?? 1,
        },
      ])
    ).values()
  );

  const { error } = await supabase
    .from('diet_plan_meals')
    .upsert(uniqueMeals, { onConflict: 'plan_id,day,meal_type' });

  if (error) throw error;
}

// ─── Delete a plan ────────────────────────────────────────────────────────────

export async function deleteAiDietPlan(planId: string): Promise<void> {
  const { error } = await supabase
    .from('diet_plans')
    .delete()
    .eq('id', planId);

  if (error) throw error;
}
