// ─── AI Diet Plan Supabase Service ───────────────────────────────────────────
// CRUD operations for persisting AI-generated diet plans in the v3 diet_plans table.
// All operations are scoped to the authenticated user via RLS.

import { supabase } from './supabase';
import { AIDietPlan, UserFitnessProfile } from './aiDietService';
import { DayOfWeek, MealType, RecipeSource } from '../types';
import { getCachedOrFetch, invalidateCache } from '../utils/queryCache';

const PLAN_CACHE_TTL_MS = 1000 * 60 * 5;

function publicPlansKey(options: PublicPlanQueryOptions): string {
  return [
    'plans:public',
    options.offset ?? 0,
    options.limit ?? 20,
    options.maxResults ?? 30,
    options.sortBy ?? 'trending',
    options.titleQuery?.trim().toLowerCase() ?? '',
    options.dietType ?? '',
    typeof options.maxCalories === 'number' ? options.maxCalories : '',
    options.excludeUserId ?? '',
  ].join(':');
}

function uploadedPlansKey(userId: string, options: UserPlanQueryOptions): string {
  return [
    'plans:uploaded',
    userId,
    options.offset ?? 0,
    options.limit ?? 16,
  ].join(':');
}

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
  maxResults?: number;
  sortBy?: 'trending' | 'recently_active';
  excludeUserId?: string;
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

export interface UserPlanPage {
  items: SavedAiDietPlan[];
  hasMore: boolean;
}

export interface UserPlanQueryOptions {
  offset?: number;
  limit?: number;
}

export interface AiDietPlanMealSelection {
  day: DayOfWeek;
  mealType: MealType;
  recipeId: string;
  recipeSource?: RecipeSource;
  servings?: number;
}

export interface MasterRecipeMatchInput {
  mealNames: string[];
  dietType: UserFitnessProfile['diet_type'];
  excludeRecipeIds?: string[];
}

export interface MasterRecipeBatchMatchRow {
  meal_name: string;
  matched_title: string;
  recipe_id: string;
  recipe_source: 'master';
}

const DIET_ALLOWED: Record<UserFitnessProfile['diet_type'], string[]> = {
  vegetarian: ['Vegetarian', 'Vegan'],
  vegan: ['Vegan'],
  eggetarian: ['Eggetarian', 'Vegetarian', 'Vegan'],
  non_veg: ['Non-Vegetarian', 'Eggetarian', 'Vegetarian', 'Vegan'],
};

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
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

  await Promise.all([
    invalidateCache(`plans:uploaded:${resolvedUserId}:`),
    invalidateCache('plans:public:'),
  ]);

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

export async function getUploadedUserAiDietPlans(userId: string): Promise<SavedAiDietPlan[]> {
  const page = await getUploadedUserAiDietPlansPage(userId, { offset: 0, limit: 100 });
  return page.items;
}

export async function getUploadedUserAiDietPlansPage(
  userId: string,
  options: UserPlanQueryOptions = {}
): Promise<UserPlanPage> {
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 16;
  return getCachedOrFetch(uploadedPlansKey(userId, options), PLAN_CACHE_TTL_MS, async () => {
    const upper = offset + limit;

    const { data, error } = await supabase
      .from('diet_plans')
      .select('*, diet_plan_meals(id, plan_id, recipe_id, recipe_source, day, meal_type, servings, added_at)')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, upper);

    if (error) throw error;

    const rows = (data ?? []) as SavedAiDietPlan[];
    return {
      items: rows.slice(0, limit),
      hasMore: rows.length > limit,
    };
  });
}

export async function getUserAiDietPlanById(
  userId: string,
  planId: string
): Promise<SavedAiDietPlan | null> {
  const { data, error } = await supabase
    .from('diet_plans')
    .select('*, diet_plan_meals(id, plan_id, recipe_id, recipe_source, day, meal_type, servings, added_at)')
    .eq('id', planId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as SavedAiDietPlan | null;
}

export async function getUserAiDietPlanMealsPage(
  userId: string,
  planId: string,
  options: UserPlanQueryOptions = {}
): Promise<{ items: SavedAiDietPlanMeal[]; hasMore: boolean }> {
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 24;
  const { data, error } = await supabase.rpc('get_user_ai_diet_plan_meals_page', {
    p_user_id: userId,
    p_plan_id: planId,
    p_offset: offset,
    p_limit: limit,
  });

  if (error) throw error;

  const rows = (data ?? []) as SavedAiDietPlanMeal[];
  return {
    items: rows.slice(0, limit),
    hasMore: rows.length > limit,
  };
}

export async function findMasterRecipeMatchesForMealsBatch(
  input: MasterRecipeMatchInput
): Promise<Map<string, Array<{ recipeId: string; recipeSource: 'master' }>>> {
  const normalizedNames = Array.from(
    new Set(input.mealNames.map((name) => normalizeTitle(name)).filter(Boolean))
  );
  const out = new Map<string, Array<{ recipeId: string; recipeSource: 'master' }>>();

  if (normalizedNames.length === 0) return out;

  const { data, error } = await supabase.rpc('match_master_recipes_for_meals_batch', {
    p_meal_names: normalizedNames,
    p_diet_type: input.dietType,
    p_exclude_recipe_ids: input.excludeRecipeIds ?? [],
  });

  if (error) throw error;

  ((data ?? []) as MasterRecipeBatchMatchRow[]).forEach((row) => {
    const key = normalizeTitle(row.meal_name);
    if (!out.has(key)) out.set(key, []);
    out.get(key)!.push({
      recipeId: String(row.recipe_id),
      recipeSource: 'master',
    });
  });

  return out;
}

export async function findMasterRecipeMatchForMeal(
  input: MasterRecipeMatchInput
): Promise<{ recipeId: string; recipeSource: 'master' } | null> {
  const normalizedNames = Array.from(
    new Set(input.mealNames.map((name) => normalizeTitle(name)).filter(Boolean))
  );

  if (normalizedNames.length === 0) return null;

  const allowedDiets = DIET_ALLOWED[input.dietType] ?? DIET_ALLOWED.vegetarian;
  const excluded = new Set(input.excludeRecipeIds ?? []);

  for (const candidateName of normalizedNames) {
    const { data, error } = await supabase
      .from('master_recipes')
      .select('id,title')
      .eq('is_public', true)
      .is('deleted_at', null)
      .in('diet', allowedDiets)
      .neq('source', 'ai')
      // Case-insensitive exact match (without wildcards) = strict 100% title match.
      .ilike('title', candidateName)
      .limit(10);

    if (error) {
      throw error;
    }

    const exact = (data ?? []).find((row: any) => {
      const title = normalizeTitle(String(row?.title ?? ''));
      return title === candidateName && !excluded.has(String(row?.id ?? ''));
    });

    if (exact?.id) {
      return {
        recipeId: String(exact.id),
        recipeSource: 'master',
      };
    }
  }

  return null;
}

export async function getPublicAiDietPlansPage(
  options: PublicPlanQueryOptions = {}
): Promise<PublicPlanPage> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const excludeUserId = options.excludeUserId ?? authUser?.id;

  return getCachedOrFetch(publicPlansKey({ ...options, excludeUserId }), PLAN_CACHE_TTL_MS, async () => {
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 20;
    const maxResults = Math.max(1, Math.min(options.maxResults ?? 30, 30));
    const sortBy = options.sortBy ?? 'trending';

    if (offset >= maxResults) {
      return {
        items: [],
        hasMore: false,
      };
    }

    let query = supabase
      .from('diet_plans')
      .select('id,user_id,title,goal,diet_type,days,total_calories,total_protein,plan_diet_type,plan_calories,created_at,plan_data,user_profiles(name)')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId);
    }

    if (options.titleQuery && options.titleQuery.trim().length > 0) {
      query = query.ilike('title', `%${options.titleQuery.trim()}%`);
    }
    if (options.dietType) {
      query = query.eq('plan_diet_type', options.dietType);
    }
    if (typeof options.maxCalories === 'number') {
      query = query.lte('plan_calories', options.maxCalories);
    }

    const fetchPoolSize = Math.max(maxResults, offset + limit + 1);
    const { data, error } = await query.limit(fetchPoolSize);
    if (error) throw error;

    const rows = (data ?? []).map(mapPublicPlanRow);
    const titleQuery = options.titleQuery?.trim().toLowerCase() ?? '';

    const sorted = [...rows].sort((a, b) => {
      if (sortBy === 'recently_active') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aMatch = titleQuery
        ? (aTitle === titleQuery ? 4 : 0) + (aTitle.startsWith(titleQuery) ? 3 : 0) + (aTitle.includes(titleQuery) ? 2 : 0)
        : 0;
      const bMatch = titleQuery
        ? (bTitle === titleQuery ? 4 : 0) + (bTitle.startsWith(titleQuery) ? 3 : 0) + (bTitle.includes(titleQuery) ? 2 : 0)
        : 0;

      if (aMatch !== bMatch) return bMatch - aMatch;
      const aKcal = a.plan_calories ?? a.total_calories ?? 0;
      const bKcal = b.plan_calories ?? b.total_calories ?? 0;
      if (aKcal !== bKcal) return bKcal - aKcal;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const capped = sorted.slice(0, maxResults);
    return {
      items: capped.slice(offset, offset + limit),
      hasMore: offset + limit < capped.length,
    };
  });
}

export async function findExactPublicDietPlans(
  input: ExactPublicPlanQueryInput
): Promise<PublicAiDietPlanCard[]> {
  const { data: { user: authUser } } = await supabase.auth.getUser();

  const exactCalories = Math.round(input.calories);
  const exactMatchOr = [
    `and(plan_diet_type.eq.${input.dietType},plan_calories.eq.${exactCalories})`,
    `and(plan_diet_type.eq.${input.dietType},total_calories.eq.${exactCalories})`,
    `and(diet_type.eq.${input.dietType},plan_calories.eq.${exactCalories})`,
    `and(diet_type.eq.${input.dietType},total_calories.eq.${exactCalories})`,
  ].join(',');

  let query = supabase
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

  if (authUser?.id) {
    query = query.neq('user_id', authUser.id);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map(mapPublicPlanRow);
}

export async function getPublicAiDietPlanById(planId: string): Promise<PublicAiDietPlanCard | null> {
  const { data, error } = await supabase
    .from('diet_plans')
    .select('id,user_id,title,goal,diet_type,days,total_calories,total_protein,plan_diet_type,plan_calories,created_at,plan_data,user_profiles(name),diet_plan_meals(id,plan_id,recipe_id,recipe_source,day,meal_type,servings,added_at)')
    .eq('id', planId)
    .eq('is_public', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapPublicPlanRow(data);
}

export async function uploadAiDietPlan(planId: string): Promise<void> {
  const { error } = await supabase
    .from('diet_plans')
    .update({ is_public: true })
    .eq('id', planId);

  if (error) throw error;
  await invalidateCache('plans:public:');
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
  await invalidateCache('plans:uploaded:');
}

// ─── Delete a plan ────────────────────────────────────────────────────────────

export async function deleteAiDietPlan(planId: string): Promise<void> {
  const { error } = await supabase
    .from('diet_plans')
    .delete()
    .eq('id', planId);

  if (error) throw error;
  await Promise.all([
    invalidateCache('plans:uploaded:'),
    invalidateCache('plans:public:'),
  ]);
}
