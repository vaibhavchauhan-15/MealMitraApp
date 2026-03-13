import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealEntry, DayOfWeek, MealType, RecipeSource } from '../types';
import { supabase } from '../services/supabase';

// ─── Date helpers (DayOfWeek ↔ DATE) ─────────────────────────────────────────

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Map a DayOfWeek label ('Mon'…'Sun') to the actual ISO calendar date
 * for the current ISO week (Monday-anchored). Returns 'YYYY-MM-DD'.
 */
function dayToDate(day: DayOfWeek): string {
  const today = new Date();
  const jsDay = today.getDay(); // 0=Sun … 6=Sat
  const daysFromMonday = jsDay === 0 ? 6 : jsDay - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  const offset = DAYS.indexOf(day);
  const target = new Date(monday);
  target.setDate(monday.getDate() + offset);
  return target.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Map a DATE string ('YYYY-MM-DD') back to a DayOfWeek label.
 * Uses noon UTC to avoid DST edge-cases.
 */
function dateToDay(dateStr: string): DayOfWeek {
  const labels: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(dateStr + 'T12:00:00Z');
  return labels[d.getUTCDay()];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUid(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlannerState {
  meals: MealEntry[];
  addMeal: (
    day: DayOfWeek,
    mealType: MealType,
    recipeId: string,
    servings?: number,
    recipeSource?: RecipeSource,
  ) => void;
  removeMeal: (id: string) => void;
  getMealsForDay: (day: DayOfWeek) => MealEntry[];
  clearWeek: () => void;
  getAllRecipeIds: () => string[];
  /** Call once on app start (after auth) to pull server state into local store. */
  syncFromSupabase: () => Promise<void>;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      meals: [],

      addMeal: (day, mealType, recipeId, servings = 2, recipeSource = 'master') => {
        const entryId = `${day}-${mealType}-${recipeId}-${Date.now()}`;
        const newEntry: MealEntry = { id: entryId, day, mealType, recipeId, recipeSource, servings };
        // Optimistic local update
        set((s) => ({ meals: [...s.meals, newEntry] }));
        // Background Supabase sync — day is stored as actual DATE (v3 schema)
        getUid().then((uid) => {
          if (!uid) return;
          supabase.from('planner_meals').upsert(
            {
              user_id: uid,
              entry_id: entryId,
              day: dayToDate(day),   // DayOfWeek → YYYY-MM-DD
              meal_type: mealType,
              recipe_id: recipeId,
              recipe_source: recipeSource,
              servings,
            },
            { onConflict: 'user_id,entry_id' }
          ).then(({ error }) => {
            if (error) console.warn('[PlannerStore] addMeal:', error.message);
          });
        });
      },

      removeMeal: (id) => {
        set((s) => ({ meals: s.meals.filter((m) => m.id !== id) }));
        getUid().then((uid) => {
          if (!uid) return;
          supabase.from('planner_meals')
            .delete()
            .eq('user_id', uid)
            .eq('entry_id', id)
            .then(({ error }) => {
              if (error) console.warn('[PlannerStore] removeMeal:', error.message);
            });
        });
      },

      getMealsForDay: (day) => get().meals.filter((m) => m.day === day),

      clearWeek: () => {
        set({ meals: [] });
        getUid().then((uid) => {
          if (!uid) return;
          supabase.from('planner_meals')
            .delete()
            .eq('user_id', uid)
            .then(({ error }) => {
              if (error) console.warn('[PlannerStore] clearWeek:', error.message);
            });
        });
      },

      getAllRecipeIds: () => [...new Set(get().meals.map((m) => m.recipeId))],

      syncFromSupabase: async () => {
        const uid = await getUid();
        if (!uid) return;
        // Only fetch meals for the current ISO week to avoid merging stale weeks
        const weekStart = dayToDate('Mon');
        const weekEnd   = dayToDate('Sun');
        const { data, error } = await supabase
          .from('planner_meals')
          .select('entry_id, day, meal_type, recipe_id, recipe_source, servings')
          .eq('user_id', uid)
          .gte('day', weekStart)
          .lte('day', weekEnd);
        if (error) { console.warn('[PlannerStore] sync:', error.message); return; }
        const meals: MealEntry[] = (data ?? []).map((row: any) => ({
          id: row.entry_id,
          day: dateToDay(row.day),          // DATE → DayOfWeek
          mealType: row.meal_type as MealType,
          recipeId: row.recipe_id,
          recipeSource: (row.recipe_source as RecipeSource | null) ?? 'master',
          servings: row.servings,
        }));
        set({ meals });
      },
    }),
    {
      name: 'planner-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
