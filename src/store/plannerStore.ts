import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealEntry, DayOfWeek, MealType } from '../types';

interface PlannerState {
  meals: MealEntry[];
  addMeal: (day: DayOfWeek, mealType: MealType, recipeId: string, servings?: number) => void;
  removeMeal: (id: string) => void;
  getMealsForDay: (day: DayOfWeek) => MealEntry[];
  clearWeek: () => void;
  getAllRecipeIds: () => string[];
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      meals: [],

      addMeal: (day, mealType, recipeId, servings = 2) => {
        const newEntry: MealEntry = {
          id: `${day}-${mealType}-${recipeId}-${Date.now()}`,
          day,
          mealType,
          recipeId,
          servings,
        };
        set((s) => ({ meals: [...s.meals, newEntry] }));
      },

      removeMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),

      getMealsForDay: (day) => get().meals.filter((m) => m.day === day),

      clearWeek: () => set({ meals: [] }),

      getAllRecipeIds: () => [...new Set(get().meals.map((m) => m.recipeId))],
    }),
    {
      name: 'planner-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
