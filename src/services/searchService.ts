// ─── Supabase-powered search service ─────────────────────────────────────────
// All functions are async and query the master_recipes table directly.
// Replaces the old Fuse.js + local-file approach.

import { supabase } from './supabase';
import { Recipe, DbRecipeRow, RecipeFilters, UserProfile, mapDbToRecipe, RecipeSource } from '../types';
import { getCachedOrFetch, invalidateCache } from '../utils/queryCache';

const CACHE_TTL = {
  count: 1000 * 60 * 10,
  homeSection: 1000 * 60 * 15,
  personalized: 1000 * 60 * 8,
  recipeDetail: 1000 * 60 * 20,
};

function normalizeIngredientToken(value: string): string {
  return value.trim().toLowerCase();
}

function toDbRecipeRow(row: unknown): DbRecipeRow {
  return row as DbRecipeRow;
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

/**
 * Maps user-entered ingredients to canonical names using ingredient_aliases.
 * Falls back to normalized input when aliases are missing or query fails.
 */
export async function canonicalizeIngredients(ingredients: string[]): Promise<string[]> {
  const normalized = Array.from(
    new Set(ingredients.map(normalizeIngredientToken).filter(Boolean))
  );

  if (normalized.length === 0) return [];

  const { data, error } = await supabase
    .from('ingredient_aliases')
    .select('alias, canonical')
    .in('alias', normalized);

  if (error) {
    console.warn('[searchService] canonicalizeIngredients:', error.message);
    return normalized;
  }

  const aliasMap = new Map<string, string>();
  (data ?? []).forEach((row: any) => {
    const alias = normalizeIngredientToken(row.alias ?? '');
    const canonical = normalizeIngredientToken(row.canonical ?? '');
    if (alias && canonical) aliasMap.set(alias, canonical);
  });

  return normalized.map((item) => aliasMap.get(item) ?? item);
}

// ─── Column selects ───────────────────────────────────────────────────────────

/** Lightweight columns for list/card views (no heavy JSONB blobs) */
export const LIST_COLS =
  'id,recipe_slug,title,description,cuisine,diet,difficulty,cook_time,prep_time,servings,calories,' +
  'protein_g,carbs_g,fat_g,fiber_g,sugar_g,image_url,tags,source';

/** Full columns for detail / cooking screens */
export const FULL_COLS =
  'id,recipe_slug,title,description,cuisine,diet,difficulty,cook_time,prep_time,servings,calories,' +
  'protein_g,carbs_g,fat_g,fiber_g,sugar_g,image_url,tags,ingredients,steps,ingredient_fts,fts_vector,source,uploaded_by';

// ─── Base query helper ────────────────────────────────────────────────────────

function base(cols = LIST_COLS) {
  return supabase
    .from('master_recipes')
    .select(cols)
    .is('deleted_at', null)
    .eq('is_public', true);
}

// ─── Count ────────────────────────────────────────────────────────────────────

// Module-level cache: fetched once per app session, never re-fetched.
let _cachedCount: number | null = null;
let _countPromise: Promise<number> | null = null;

/** Returns the total number of public, non-deleted recipes. Result is cached
 *  for the lifetime of the app session so Supabase is queried at most once. */
export async function getTotalRecipeCount(): Promise<number> {
  if (_cachedCount !== null) return _cachedCount;

  // Deduplicate concurrent callers: share one in-flight request
  if (!_countPromise) {
    _countPromise = getCachedOrFetch('search:total-recipe-count', CACHE_TTL.count, async () => {
      const { count, error } = await supabase
        .from('master_recipes')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('is_public', true);
      if (error) { console.warn('[searchService] getTotalRecipeCount:', error.message); return 1000; }
      return count ?? 1000;
    }).then((value) => {
      _countPromise = null;
      _cachedCount = value;
      return value;
    }) as Promise<number>;
  }

  return _countPromise ?? Promise.resolve(1000);
}

/** Clears all recipe/search query caches so post-mutation reads are fresh. */
export async function invalidateRecipeQueryCaches(): Promise<void> {
  _cachedCount = null;
  _countPromise = null;
  await invalidateCache('search:');
}

// ─── Search ───────────────────────────────────────────────────────────────────

/** Full-text + filter search. Uses trigram index for partial title match. */
export async function searchRecipes(
  query: string,
  filters?: RecipeFilters,
  limit = 1000,
): Promise<Recipe[]> {
  let q = base();

  if (query && query.trim().length > 0) {
    // idx_recipes_title_trgm handles partial ILIKE efficiently
    q = q.ilike('title', `%${query.trim()}%`);
  }

  if (filters) {
    if (filters.diet)        q = q.eq('diet', filters.diet);
    if (filters.cuisine)     q = q.eq('cuisine', filters.cuisine);
    if (filters.difficulty)  q = q.eq('difficulty', filters.difficulty);
    if (filters.maxCookTime) q = q.lte('cook_time', filters.maxCookTime);
    if (filters.maxCalories) q = q.lte('calories', filters.maxCalories);
  }

  const { data, error } = await q
    .limit(limit)
    .order('updated_at', { ascending: false });

  if (error) { console.warn('[searchService] searchRecipes:', error.message); return []; }
  return (data ?? []).map((r) => mapDbToRecipe(toDbRecipeRow(r)));
}

// ─── Curated sections ─────────────────────────────────────────────────────────

/** Featured recipes – recency-first list, with rating tie-breaker when available. */
export async function getFeaturedRecipes(limit = 8): Promise<Recipe[]> {
  return getCachedOrFetch(`search:featured:${limit}`, CACHE_TTL.homeSection, async () => {
    const { data, error } = await base()
      .limit(Math.max(limit * 4, 40))
      .order('updated_at', { ascending: false });
    if (error) { console.warn('[searchService] getFeaturedRecipes:', error.message); return []; }
    return (data ?? [])
      .map((r) => mapDbToRecipe(toDbRecipeRow(r)))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  });
}

/** Trending recipes – recency-first list, with review-count tie-breaker when available. */
export async function getTrendingRecipes(limit = 8): Promise<Recipe[]> {
  return getCachedOrFetch(`search:trending:${limit}`, CACHE_TTL.homeSection, async () => {
    const { data, error } = await base()
      .limit(Math.max(limit * 4, 40))
      .order('updated_at', { ascending: false });
    if (error) { console.warn('[searchService] getTrendingRecipes:', error.message); return []; }
    return (data ?? [])
      .map((r) => mapDbToRecipe(toDbRecipeRow(r)))
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, limit);
  });
}

/** Quick recipes – cook_time ≤ 20 min. Uses idx_recipes_cook_time. */
export async function getQuickRecipes(limit = 8): Promise<Recipe[]> {
  return getCachedOrFetch(`search:quick:${limit}`, CACHE_TTL.homeSection, async () => {
    const { data, error } = await base()
      .lte('cook_time', 20)
      .limit(limit)
      .order('cook_time', { ascending: true });
    if (error) { console.warn('[searchService] getQuickRecipes:', error.message); return []; }
    return (data ?? []).map((r) => mapDbToRecipe(toDbRecipeRow(r)));
  });
}

/** Low-calorie recipes. Uses idx_recipes_calories partial index. */
export async function getLowCalorieRecipes(maxCal = 300, limit = 8): Promise<Recipe[]> {
  return getCachedOrFetch(`search:low-cal:${maxCal}:${limit}`, CACHE_TTL.homeSection, async () => {
    const { data, error } = await base()
      .lte('calories', maxCal)
      .limit(limit)
      .order('calories', { ascending: true });
    if (error) { console.warn('[searchService] getLowCalorieRecipes:', error.message); return []; }
    return (data ?? []).map((r) => mapDbToRecipe(toDbRecipeRow(r)));
  });
}

/** High-protein recipes. Uses idx_recipes_calories partial index. */
export async function getHighProteinRecipes(minProtein = 20, limit = 8): Promise<Recipe[]> {
  return getCachedOrFetch(`search:high-protein:${minProtein}:${limit}`, CACHE_TTL.homeSection, async () => {
    const { data, error } = await base()
      .gte('protein_g', minProtein)
      .limit(limit)
      .order('protein_g', { ascending: false });
    if (error) { console.warn('[searchService] getHighProteinRecipes:', error.message); return []; }
    return (data ?? []).map((r) => mapDbToRecipe(toDbRecipeRow(r)));
  });
}

/** Recipes by cuisine. Uses idx_recipes_cuisine partial index. */
export async function getRecipesByCuisine(cuisine: string, limit = 50): Promise<Recipe[]> {
  const { data, error } = await base()
    .eq('cuisine', cuisine)
    .limit(limit)
    .order('updated_at', { ascending: false });
  if (error) { console.warn('[searchService] getRecipesByCuisine:', error.message); return []; }
  return (data ?? []).map((r) => mapDbToRecipe(toDbRecipeRow(r)));
}

/** Total count of public non-deleted recipes. */
export async function getRecipeCount(): Promise<number> {
  return getTotalRecipeCount();
}

/** Fetch a single recipe by UUID with full columns. */
export async function getRecipeByIdFromDb(id: string): Promise<Recipe | null> {
  const key = `search:recipe:master:${id.trim()}`;
  return getCachedOrFetch(key, CACHE_TTL.recipeDetail, async () => {
  const ref = id.trim();

  if (isUuidLike(ref)) {
    const byId = await supabase
      .from('master_recipes')
      .select(FULL_COLS)
      .eq('id', ref)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (!byId.error && byId.data) return mapDbToRecipe(toDbRecipeRow(byId.data));
  }

  const bySlug = await supabase
    .from('master_recipes')
    .select(FULL_COLS)
    .eq('recipe_slug', ref)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (bySlug.error || !bySlug.data) return null;
  return mapDbToRecipe(toDbRecipeRow(bySlug.data));
  });
}

export async function getAIRecipeByIdFromDb(id: string): Promise<Recipe | null> {
  return getCachedOrFetch(`search:recipe:ai:${id}`, CACHE_TTL.recipeDetail, async () => {
    const { data, error } = await supabase
      .from('user_ai_generated_recipes')
      .select(
        'id,title,description,cuisine,diet,difficulty,cook_time,prep_time,servings,calories,' +
        'protein_g,carbs_g,fat_g,fiber_g,sugar_g,image_url,tags,ingredients,steps'
      )
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return mapDbToRecipe({
      ...toDbRecipeRow(data),
      source: 'ai',
    });
  });
}

export async function getRecipeByIdFromSource(id: string, source: RecipeSource): Promise<Recipe | null> {
  return source === 'ai' ? getAIRecipeByIdFromDb(id) : getRecipeByIdFromDb(id);
}

/** Similar recipes — shares cuisine OR diet, excludes self. */
export async function getSimilarRecipesFromDb(recipe: Recipe, limit = 6): Promise<Recipe[]> {
  const [byCuisine, byDiet] = await Promise.all([
    base().select(LIST_COLS).eq('cuisine', recipe.cuisine).neq('id', recipe.id).limit(limit),
    base().select(LIST_COLS).eq('diet', recipe.diet).neq('id', recipe.id).limit(limit),
  ]);
  const seen = new Set<string>();
  const out: Recipe[] = [];
  [...(byCuisine.data ?? []), ...(byDiet.data ?? [])].forEach((r: any) => {
    if (!seen.has(r.id)) { seen.add(r.id); out.push(mapDbToRecipe(toDbRecipeRow(r))); }
  });
  return out.slice(0, limit);
}

// ─── Diet preference → Recipe.diet mapping ───────────────────────────────────

const DIET_PREF_MAP: Record<string, Recipe['diet'][]> = {
  Vegetarian:       ['Vegetarian'],
  Vegan:            ['Vegan'],
  'Non-Vegetarian': ['Non-Vegetarian', 'Vegetarian', 'Vegan', 'Eggetarian'],
  Eggetarian:       ['Eggetarian', 'Vegetarian', 'Vegan'],
  Jain:             ['Vegetarian', 'Vegan'],
};

/** Personalized recommendations based on user profile. */
export async function getPersonalizedRecipes(
  profile: UserProfile | null,
  limit = 12,
): Promise<Recipe[]> {
  if (!profile) return getFeaturedRecipes(limit);

  const cacheKey = [
    'search:personalized',
    profile.id,
    profile.healthProfile?.fitnessGoal ?? 'none',
    profile.cookingLevel,
    [...(profile.dietPreferences ?? [])].sort().join('|'),
    [...(profile.favoriteCuisines ?? [])].sort().join('|'),
    limit,
  ].join(':');

  return getCachedOrFetch(cacheKey, CACHE_TTL.personalized, async () => {

  let q = base().limit(limit * 3);

  // Hard-filter by diet preferences
  const prefs = profile.dietPreferences ?? [];
  if (prefs.length > 0) {
    const allowedSet = new Set<string>();
    prefs.forEach((p) => DIET_PREF_MAP[p]?.forEach((d) => allowedSet.add(d)));
    const allowed = [...allowedSet];
    if (allowed.length > 0) q = q.in('diet', allowed);
  }

  // Order by goal-relevant column
  const goal = profile.healthProfile?.fitnessGoal;
  if (goal === 'fat_loss') {
    q = q.order('calories', { ascending: true });
  } else if (goal === 'muscle_gain') {
    q = q.order('protein_g', { ascending: false });
  }

  const { data, error } = await q;
  if (error) { console.warn('[searchService] getPersonalizedRecipes:', error.message); return []; }

  let recipes = (data ?? []).map((r) => mapDbToRecipe(toDbRecipeRow(r)));

  // Boost favourite cuisines to front
  if (profile.favoriteCuisines.length > 0) {
    const pref  = recipes.filter((r) => profile.favoriteCuisines.includes(r.cuisine));
    const other = recipes.filter((r) => !profile.favoriteCuisines.includes(r.cuisine));
    recipes = [...pref, ...other];
  }

  // Beginners: easy recipes first
  if (profile.cookingLevel === 'Beginner') {
    const easy = recipes.filter((r) => r.difficulty === 'Easy');
    const rest  = recipes.filter((r) => r.difficulty !== 'Easy');
    recipes = [...easy, ...rest];
  }

  return recipes.slice(0, limit);
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const CUISINE_LIST = [
  'Punjabi', 'Bengali', 'Bihari', 'Gujarati', 'Kashmiri',
  'Himachali', 'Haryanvi', 'Indo-Chinese', 'Indo-Italian',
  'Rajasthani', 'Maharashtrian', 'South Indian', 'North Indian',
  'Street Food', 'Desserts',
];

export const DIET_FILTERS = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Eggetarian'];

export const DIFFICULTY_FILTERS = ['Easy', 'Medium', 'Hard'];

// ─── Ingredient-based search ─────────────────────────────────────────────────

export interface IngredientMatchResult {
  recipe: Recipe;
  matched_ingredients: string[];
  missing_ingredients: string[];
  match_count: number;
  total_ingredients: number;
  match_score: number;
  /** 'master' = curated/user-upload recipe; 'ai' = AI-generated recipe */
  source?: 'master' | 'ai';
  /** Display name of the user who generated this recipe (AI recipes only) */
  generated_by_name?: string | null;
}

function normalizeIngredientName(value: string): string {
  return value.trim().toLowerCase();
}

function extractIngredientNames(ingredients: unknown): string[] {
  const rawList = Array.isArray(ingredients)
    ? ingredients
    : typeof ingredients === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(ingredients);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

  return rawList
    .map((item) => {
      if (typeof item === 'string') return normalizeIngredientName(item);
      const row = (item ?? {}) as Record<string, unknown>;
      return normalizeIngredientName(String(row.name ?? row.ingredient ?? row.item ?? ''));
    })
    .filter(Boolean);
}

export async function searchRecipesByIngredients(
  ingredients: string[],
  options?: { diet?: string; cuisine?: string; maxTime?: number; limit?: number },
): Promise<IngredientMatchResult[]> {
  const canonicalIngredients = Array.from(
    new Set((await canonicalizeIngredients(ingredients)).map(normalizeIngredientToken).filter(Boolean))
  );
  if (canonicalIngredients.length === 0) return [];

  const cacheKey = [
    'search:ingredients',
    canonicalIngredients.sort().join('|'),
    options?.diet ?? '',
    options?.cuisine ?? '',
    typeof options?.maxTime === 'number' ? options.maxTime : '',
    typeof options?.limit === 'number' ? options.limit : '',
  ].join(':');

  return getCachedOrFetch(cacheKey, 1000 * 60 * 6, async () => {

  let masterQuery = supabase
    .from('master_recipes')
    .select(
      'id,source,title,description,cuisine,diet,difficulty,cook_time,prep_time,servings,calories,' +
      'protein_g,carbs_g,fat_g,fiber_g,sugar_g,image_url,tags,ingredients,created_at'
    )
    .is('deleted_at', null)
    .eq('is_public', true);

  let aiQuery = supabase
    .from('user_ai_generated_recipes')
    .select(
      'id,title,description,cuisine,diet,difficulty,cook_time,prep_time,servings,calories,' +
      'protein_g,carbs_g,fat_g,fiber_g,sugar_g,image_url,tags,ingredients,created_at,' +
      'user_profiles:user_id(name)'
    )
    .eq('is_public', true);

  if (options?.diet) {
    masterQuery = masterQuery.eq('diet', options.diet);
    aiQuery = aiQuery.eq('diet', options.diet);
  }
  if (options?.cuisine) {
    masterQuery = masterQuery.eq('cuisine', options.cuisine);
    aiQuery = aiQuery.eq('cuisine', options.cuisine);
  }
  if (typeof options?.maxTime === 'number') {
    masterQuery = masterQuery.lte('cook_time', options.maxTime);
    aiQuery = aiQuery.lte('cook_time', options.maxTime);
  }

  const [masterResp, aiResp] = await Promise.all([
    masterQuery.order('created_at', { ascending: false }).limit(200),
    aiQuery.order('created_at', { ascending: false }).limit(200),
  ]);

  if (masterResp.error || aiResp.error) {
    console.warn(
      '[searchService] searchRecipesByIngredients:',
      masterResp.error?.message ?? aiResp.error?.message,
    );
    return [];
  }

  const out: IngredientMatchResult[] = [];

  ((masterResp.data as any[]) ?? []).forEach((row) => {
    const ingredientSet = new Set(extractIngredientNames(row.ingredients));
    const matched = canonicalIngredients.filter((ing) => ingredientSet.has(ing));
    const isExact = matched.length === canonicalIngredients.length;
    if (!isExact) return;

    out.push({
      recipe: mapDbToRecipe({
        id: row.id,
        source: row.source ?? 'app',
        title: row.title,
        description: row.description,
        cuisine: row.cuisine,
        diet: row.diet,
        difficulty: row.difficulty,
        cook_time: row.cook_time,
        prep_time: row.prep_time,
        servings: row.servings,
        calories: row.calories,
        protein_g: row.protein_g,
        carbs_g: row.carbs_g,
        fat_g: row.fat_g,
        fiber_g: row.fiber_g,
        sugar_g: row.sugar_g,
        image_url: row.image_url,
        tags: row.tags,
        ingredients: row.ingredients,
      } as DbRecipeRow),
      matched_ingredients: matched,
      missing_ingredients: [],
      match_count: matched.length,
      total_ingredients: ingredientSet.size,
      match_score: 1,
      source: 'master',
      generated_by_name: null,
    });
  });

  ((aiResp.data as any[]) ?? []).forEach((row) => {
    const ingredientSet = new Set(extractIngredientNames(row.ingredients));
    const matched = canonicalIngredients.filter((ing) => ingredientSet.has(ing));
    const isExact = matched.length === canonicalIngredients.length;
    if (!isExact) return;

    const profile = row.user_profiles as { name?: string } | { name?: string }[] | null;
    const generatedByName = Array.isArray(profile)
      ? (profile[0]?.name ?? null)
      : (profile?.name ?? null);

    out.push({
      recipe: mapDbToRecipe({
        id: row.id,
        source: 'ai',
        title: row.title,
        description: row.description,
        cuisine: row.cuisine,
        diet: row.diet,
        difficulty: row.difficulty,
        cook_time: row.cook_time,
        prep_time: row.prep_time,
        servings: row.servings,
        calories: row.calories,
        protein_g: row.protein_g,
        carbs_g: row.carbs_g,
        fat_g: row.fat_g,
        fiber_g: row.fiber_g,
        sugar_g: row.sugar_g,
        image_url: row.image_url,
        tags: row.tags,
        ingredients: row.ingredients,
      } as DbRecipeRow),
      matched_ingredients: matched,
      missing_ingredients: [],
      match_count: matched.length,
      total_ingredients: ingredientSet.size,
      match_score: 1,
      source: 'ai',
      generated_by_name: generatedByName,
    });
  });

  out.sort((a, b) => {
    const aTime = (a.recipe.prep_time ?? 0) + (a.recipe.cook_time ?? 0);
    const bTime = (b.recipe.prep_time ?? 0) + (b.recipe.cook_time ?? 0);
    if (aTime !== bTime) return aTime - bTime;
    return (a.recipe.calories ?? 0) - (b.recipe.calories ?? 0);
  });

  return out.slice(0, options?.limit ?? 20);
  });
}
