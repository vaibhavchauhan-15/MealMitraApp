import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, DbRecipeRow, mapDbToRecipe } from '../types';
import { supabase } from '../services/supabase';
import {
  getFeaturedRecipes,
  getTrendingRecipes,
  getQuickRecipes,
  getRecipeCount,
  getRecipeByIdFromSource,
  getSimilarRecipesFromDb,
  invalidateRecipeQueryCaches,
} from '../services/searchService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUid(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

function needsRecipeHydration(recipe: Recipe): boolean {
  // List endpoints intentionally omit heavy JSON fields.
  // If these are missing, force a full row fetch for detail/cooking views.
  return recipe.ingredients.length === 0 || recipe.steps.length === 0;
}

function recipeToAiDbRow(recipe: Recipe, uid: string) {
  return {
    id: recipe.id,
    user_id: uid,
    title: recipe.name,
    description: recipe.description,
    cuisine: recipe.cuisine,
    diet: recipe.diet,
    difficulty: recipe.difficulty.toLowerCase(),
    cook_time: recipe.cook_time,
    prep_time: recipe.prep_time,
    servings: recipe.servings,
    calories: recipe.calories,
    protein_g: recipe.nutrition.protein,
    carbs_g: recipe.nutrition.carbs,
    fat_g: recipe.nutrition.fat,
    fiber_g: recipe.nutrition.fiber,
    sugar_g: recipe.nutrition.sugar,
    image_url: recipe.image || null,
    tags: recipe.tags,
    source_ingredients: recipe.ingredients.map((i) => i.name.toLowerCase()),
    ingredients: recipe.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
    })),
    steps: recipe.steps.map((s) => ({
      step_number: s.step,
      instruction: s.instruction,
      duration_min: s.time,
    })),
    is_public: false,
  };
}

function withCurrentUserAuthor(recipe: Recipe, uid: string): Recipe {
  if (recipe.uploadedBy) return recipe;
  return {
    ...recipe,
    uploadedBy: uid,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecipeState {
  /** In-memory cache for instant lookups — keyed by UUID */
  cache: Record<string, Recipe>;

  /** Home-screen curated sections */
  featured: Recipe[];
  trending: Recipe[];
  quick: Recipe[];
  totalCount: number;
  initialLoaded: boolean;

  /** Supabase-backed: recently viewed recipe IDs (UUIDs) */
  recentlyViewed: string[];

  /** Supabase-backed: recently searched titles (latest first). */
  recentSearches: string[];

  /** Persisted: AI-generated recipes stored in user_ai_generated_recipes. */
  aiRecipes: Recipe[];

  // ── Data loading ────────────────────────────────────────────────────────────
  /** Load featured / trending / quick + total count. Call once on app start. */
  loadInitialData: () => Promise<void>;
  /** Cache-first fetch by ID. Falls back to Supabase. */
  fetchById: (id: string, source?: 'master' | 'ai') => Promise<Recipe | null>;
  /** Similar recipes via Supabase (cuisine OR diet match). */
  fetchSimilar: (recipe: Recipe) => Promise<Recipe[]>;
  /** Add one or many recipes to the in-memory cache. */
  addToCache: (recipes: Recipe | Recipe[]) => void;

  // ── Recently viewed ─────────────────────────────────────────────────────────
  addRecentlyViewed: (id: string) => void;
  syncRecentlyViewedFromSupabase: () => Promise<void>;

  // ── Search history ──────────────────────────────────────────────────────────
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  syncRecentSearchesFromSupabase: () => Promise<void>;

  // ── Sync shims (synchronous, cache-only) ───────────────────────────────────
  getRecipeById: (id: string) => Recipe | undefined;
  getSimilarRecipes: (id: string) => Recipe[];

  // ── AI recipes ──────────────────────────────────────────────────────────────
  /** Insert a single AI recipe into user_ai_generated_recipes and local state. */
  addAiRecipe: (recipe: Recipe) => Promise<void>;
  /** Batch-insert AI recipes into user_ai_generated_recipes then local state. */
  addAiRecipes: (recipes: Recipe[]) => Promise<void>;
  removeAiRecipe: (id: string) => void;
  /** Pull AI recipes from Supabase into local state and cache. */
  syncAiRecipesFromSupabase: () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      cache: {},
      featured: [],
      trending: [],
      quick: [],
      totalCount: 0,
      initialLoaded: false,
      recentlyViewed: [],
      recentSearches: [],
      aiRecipes: [],

      loadInitialData: async () => {
        if (get().initialLoaded) return;
        const [featured, trending, quick, totalCount] = await Promise.all([
          getFeaturedRecipes(8),
          getTrendingRecipes(8),
          getQuickRecipes(8),
          getRecipeCount(),
        ]);
        const newCache: Record<string, Recipe> = { ...get().cache };
        [...featured, ...trending, ...quick].forEach((r) => { newCache[r.id] = r; });
        set({ featured, trending, quick, totalCount, initialLoaded: true, cache: newCache });
      },

      fetchById: async (id, source = 'master') => {
        const hit = get().cache[id] ?? get().aiRecipes.find((r) => r.id === id);
        if (hit && (source === 'ai' || !needsRecipeHydration(hit))) return hit;

        let recipe = await getRecipeByIdFromSource(id, source);
        // Route params often only include `id`; if source was unknown and master
        // lookup misses, try AI table before concluding "not found".
        if (!recipe && source === 'master') {
          recipe = await getRecipeByIdFromSource(id, 'ai');
        }
        if (recipe) {
          set((s) => ({
            cache: { ...s.cache, [id]: recipe, [recipe.id]: recipe },
            aiRecipes: source === 'ai'
              ? [...s.aiRecipes.filter((r) => r.id !== recipe.id), recipe]
              : s.aiRecipes,
          }));
        }
        return recipe;
      },

      fetchSimilar: async (recipe) => getSimilarRecipesFromDb(recipe, 6),

      addToCache: (recipes) => {
        const arr = Array.isArray(recipes) ? recipes : [recipes];
        set((s) => {
          const c = { ...s.cache };
          arr.forEach((r) => { c[r.id] = r; });
          return { cache: c };
        });
      },

      addRecentlyViewed: (id) => {
        const current = get().recentlyViewed.filter((r) => r !== id);
        const next = [id, ...current].slice(0, 20);
        set({ recentlyViewed: next });
        getUid().then((uid) => {
          if (!uid) return;
          supabase
            .from('user_profiles')
            .update({ recent_viewed_recipe_ids: next })
            .eq('id', uid)
            .then(({ error }) => {
              if (error) console.warn('[RecipeStore] addRecentlyViewed:', error.message);
            });
        });
      },

      syncRecentlyViewedFromSupabase: async () => {
        const uid = await getUid();
        if (!uid) {
          set({ recentlyViewed: [] });
          return;
        }
        const { data, error } = await supabase
          .from('user_profiles')
          .select('recent_viewed_recipe_ids')
          .eq('id', uid)
          .single();
        if (error) { console.warn('[RecipeStore] syncRecentlyViewed:', error.message); return; }

        const incoming = Array.isArray(data?.recent_viewed_recipe_ids)
          ? data.recent_viewed_recipe_ids
              .filter((item: unknown): item is string => typeof item === 'string')
              .slice(0, 20)
          : [];

        set({ recentlyViewed: incoming });
      },

      addRecentSearch: (query) => {
        const normalized = query.trim();
        if (!normalized) return;
        const current = get().recentSearches.filter(
          (item) => item.toLowerCase() !== normalized.toLowerCase()
        );
        const next = [normalized, ...current].slice(0, 12);
        set({ recentSearches: next });
        getUid().then((uid) => {
          if (!uid) return;
          supabase
            .from('user_profiles')
            .update({ recent_searches: next })
            .eq('id', uid)
            .then(({ error }) => {
              if (error) console.warn('[RecipeStore] addRecentSearch:', error.message);
            });
        });
      },

      clearRecentSearches: () => {
        set({ recentSearches: [] });
        getUid().then((uid) => {
          if (!uid) return;
          supabase
            .from('user_profiles')
            .update({ recent_searches: [] })
            .eq('id', uid)
            .then(({ error }) => {
              if (error) console.warn('[RecipeStore] clearRecentSearches:', error.message);
            });
        });
      },

      syncRecentSearchesFromSupabase: async () => {
        const uid = await getUid();
        if (!uid) {
          set({ recentSearches: [] });
          return;
        }
        const { data, error } = await supabase
          .from('user_profiles')
          .select('recent_searches')
          .eq('id', uid)
          .single();
        if (error) { console.warn('[RecipeStore] syncRecentSearches:', error.message); return; }

        const incoming = Array.isArray(data?.recent_searches)
          ? data.recent_searches.filter((item: unknown): item is string => typeof item === 'string').slice(0, 12)
          : [];

        set({ recentSearches: incoming });
      },

      getRecipeById: (id) =>
        get().cache[id] ?? get().aiRecipes.find((r) => r.id === id),

      getSimilarRecipes: (id) => {
        const recipe = get().getRecipeById(id);
        if (!recipe) return [];
        return Object.values(get().cache)
          .filter((r) => r.id !== id && (r.cuisine === recipe.cuisine || r.diet === recipe.diet))
          .slice(0, 6);
      },

      addAiRecipe: async (recipe) => {
        const uid = await getUid();
        const normalized = uid ? withCurrentUserAuthor(recipe, uid) : recipe;
        // Optimistic local update first
        set((s) => ({
          aiRecipes: [...s.aiRecipes.filter((r) => r.id !== normalized.id), normalized],
          cache: { ...s.cache, [normalized.id]: normalized },
        }));
        if (!uid) return;
        const { error } = await supabase
          .from('user_ai_generated_recipes')
          .upsert(recipeToAiDbRow(normalized, uid), { onConflict: 'id' });
        if (error) console.warn('[RecipeStore] addAiRecipe:', error.message);
        else void invalidateRecipeQueryCaches();
      },

      addAiRecipes: async (recipes) => {
        if (recipes.length === 0) return;
        const uid = await getUid();
        const normalizedRecipes = uid
          ? recipes.map((recipe) => withCurrentUserAuthor(recipe, uid))
          : recipes;
        // Update local state synchronously so planner can reference the IDs immediately
        set((s) => {
          const newAi = [...s.aiRecipes];
          const newCache = { ...s.cache };
          normalizedRecipes.forEach((r) => {
            if (!newAi.find((x) => x.id === r.id)) newAi.push(r);
            newCache[r.id] = r;
          });
          return { aiRecipes: newAi, cache: newCache };
        });
        if (!uid) return;
        const rows = normalizedRecipes.map((r) => recipeToAiDbRow(r, uid));
        const { error } = await supabase
          .from('user_ai_generated_recipes')
          .upsert(rows, { onConflict: 'id' });
        if (error) console.warn('[RecipeStore] addAiRecipes:', error.message);
        else void invalidateRecipeQueryCaches();
      },

      removeAiRecipe: (id) => {
        set((s) => {
          const c = { ...s.cache };
          delete c[id];
          return { aiRecipes: s.aiRecipes.filter((r) => r.id !== id), cache: c };
        });
        getUid().then((uid) => {
          if (!uid) return;
          supabase.from('user_ai_generated_recipes')
            .delete()
            .eq('id', id)
            .eq('user_id', uid)
            .then(({ error }) => {
              if (error) console.warn('[RecipeStore] removeAiRecipe:', error.message);
              else void invalidateRecipeQueryCaches();
            });
        });
      },

      syncAiRecipesFromSupabase: async () => {
        const uid = await getUid();
        if (!uid) return;
        const { data, error } = await supabase
          .from('user_ai_generated_recipes')
          .select(
            'id,title,description,cuisine,diet,difficulty,cook_time,prep_time,servings,calories,' +
            'protein_g,carbs_g,fat_g,fiber_g,sugar_g,image_url,tags,ingredients,steps,created_at,user_id,user_profiles!user_ai_generated_recipes_user_id_fkey(name,username)'
          )
          .eq('user_id', uid)
          .order('created_at', { ascending: false });
        if (error) { console.warn('[RecipeStore] syncAi:', error.message); return; }
        const aiRecipes = (data ?? []).map((r) => mapDbToRecipe({
          ...(r as unknown as DbRecipeRow),
          source: 'ai',
        }));
        set((s) => {
          const newCache = { ...s.cache };
          aiRecipes.forEach((r) => { newCache[r.id] = r; });
          return { aiRecipes, cache: newCache };
        });
      },
    }),
    {
      name: 'recipe-store-v4',
      storage: createJSONStorage(() => AsyncStorage),
      version: 5,
      migrate: (persistedState: unknown, version) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState;
        const stateObj = persistedState as Record<string, unknown>;
        if (version >= 5) return stateObj;
        const { recentlyViewed, recentSearches, ...rest } = stateObj;
        return rest;
      },
      partialize: (state) => ({
        aiRecipes: state.aiRecipes,
        // Persist curated sections for instant display on next launch
        featured: state.featured,
        trending: state.trending,
        quick: state.quick,
        totalCount: state.totalCount,
      }),
    }
  )
);
