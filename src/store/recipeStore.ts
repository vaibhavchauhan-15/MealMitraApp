import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, RecipeFilters } from '../types';
import recipes from '../data/recipes';

interface RecipeState {
  recipes: Recipe[];
  recentlyViewed: string[]; // recipe IDs
  searchQuery: string;
  filters: RecipeFilters;
  setSearchQuery: (q: string) => void;
  setFilters: (f: RecipeFilters) => void;
  clearFilters: () => void;
  addRecentlyViewed: (id: string) => void;
  getRecipeById: (id: string) => Recipe | undefined;
  getFilteredRecipes: () => Recipe[];
  getSimilarRecipes: (id: string) => Recipe[];
}

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes,
      recentlyViewed: [],
      searchQuery: '',
      filters: {},

      setSearchQuery: (q) => set({ searchQuery: q }),

      setFilters: (f) => set({ filters: f }),

      clearFilters: () => set({ filters: {}, searchQuery: '' }),

      addRecentlyViewed: (id) => {
        const current = get().recentlyViewed.filter((r) => r !== id);
        set({ recentlyViewed: [id, ...current].slice(0, 20) });
      },

      getRecipeById: (id) => get().recipes.find((r) => r.id === id),

      getFilteredRecipes: () => {
        const { recipes: allRecipes, filters } = get();
        return allRecipes.filter((r) => {
          if (filters.diet && r.diet !== filters.diet) return false;
          if (filters.cuisine && r.cuisine !== filters.cuisine) return false;
          if (filters.difficulty && r.difficulty !== filters.difficulty) return false;
          if (filters.maxCookTime && r.cook_time > filters.maxCookTime) return false;
          if (filters.maxCalories && r.calories > filters.maxCalories) return false;
          return true;
        });
      },

      getSimilarRecipes: (id) => {
        const recipe = get().getRecipeById(id);
        if (!recipe) return [];
        return get()
          .recipes.filter(
            (r) => r.id !== id && (r.cuisine === recipe.cuisine || r.diet === recipe.diet)
          )
          .slice(0, 6);
      },
    }),
    {
      name: 'recipe-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ recentlyViewed: state.recentlyViewed }),
    }
  )
);
