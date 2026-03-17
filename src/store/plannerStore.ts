import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealEntry, DayOfWeek, MealType, RecipeSource } from '../types';
import { supabase } from '../services/supabase';

const PLANNER_SYNC_TTL_MS = 1000 * 45;

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

async function upsertPlannerMealRemote(payload: {
  user_id: string;
  entry_id: string;
  day: string;
  meal_type: MealType;
  recipe_id: string;
  recipe_source: RecipeSource;
  servings: number;
}): Promise<boolean> {
  const first = await supabase
    .from('planner_meals')
    .upsert(payload, { onConflict: 'user_id,entry_id' });

  if (!first.error) return true;

  // One lightweight retry helps on flaky mobile networks.
  await new Promise((resolve) => setTimeout(resolve, 700));
  const second = await supabase
    .from('planner_meals')
    .upsert(payload, { onConflict: 'user_id,entry_id' });

  if (second.error) {
    console.warn('[PlannerStore] addMeal:', second.error.message);
    return false;
  }

  return true;
}

async function deletePlannerMealRemote(uid: string, entryId: string): Promise<boolean> {
  const first = await supabase
    .from('planner_meals')
    .delete()
    .eq('user_id', uid)
    .eq('entry_id', entryId);

  if (!first.error) return true;

  await new Promise((resolve) => setTimeout(resolve, 700));
  const second = await supabase
    .from('planner_meals')
    .delete()
    .eq('user_id', uid)
    .eq('entry_id', entryId);

  if (second.error) {
    console.warn('[PlannerStore] removeMeal:', second.error.message);
    return false;
  }

  return true;
}

async function clearPlannerMealsRemote(uid: string): Promise<boolean> {
  const first = await supabase
    .from('planner_meals')
    .delete()
    .eq('user_id', uid);

  if (!first.error) return true;

  await new Promise((resolve) => setTimeout(resolve, 700));
  const second = await supabase
    .from('planner_meals')
    .delete()
    .eq('user_id', uid);

  if (second.error) {
    console.warn('[PlannerStore] clearWeek:', second.error.message);
    return false;
  }

  return true;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlannerState {
  meals: MealEntry[];
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: number | null;
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
  syncFromSupabase: (options?: { force?: boolean }) => Promise<void>;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      meals: [],
      syncStatus: 'idle',
      lastSyncedAt: null,

      addMeal: (day, mealType, recipeId, servings = 2, recipeSource = 'master') => {
        const entryId = `${day}-${mealType}`;
        const newEntry: MealEntry = { id: entryId, day, mealType, recipeId, recipeSource, servings };
        // Keep one recipe per day+meal slot for a cleaner planner UI.
        set((s) => ({
          meals: [
            ...s.meals.filter((m) => !(m.day === day && m.mealType === mealType)),
            newEntry,
          ],
        }));

        // Background Supabase sync — day is stored as actual DATE (v3 schema)
        getUid().then((uid) => {
          if (!uid) return;
          set({ syncStatus: 'syncing' });
          upsertPlannerMealRemote({
              user_id: uid,
              entry_id: entryId,
              day: dayToDate(day),   // DayOfWeek → YYYY-MM-DD
              meal_type: mealType,
              recipe_id: recipeId,
              recipe_source: recipeSource,
              servings,
          }).then((ok) => {
            set({ syncStatus: ok ? 'synced' : 'error', lastSyncedAt: ok ? Date.now() : get().lastSyncedAt });
          });
        });
      },

      removeMeal: (id) => {
        set((s) => ({ meals: s.meals.filter((m) => m.id !== id) }));
        getUid().then((uid) => {
          if (!uid) return;
          set({ syncStatus: 'syncing' });
          deletePlannerMealRemote(uid, id).then((ok) => {
            set({ syncStatus: ok ? 'synced' : 'error', lastSyncedAt: ok ? Date.now() : get().lastSyncedAt });
          });
        });
      },

      getMealsForDay: (day) => get().meals.filter((m) => m.day === day),

      clearWeek: () => {
        set({ meals: [] });
        getUid().then((uid) => {
          if (!uid) return;
          set({ syncStatus: 'syncing' });
          clearPlannerMealsRemote(uid).then((ok) => {
            set({ syncStatus: ok ? 'synced' : 'error', lastSyncedAt: ok ? Date.now() : get().lastSyncedAt });
          });
        });
      },

      getAllRecipeIds: () => [...new Set(get().meals.map((m) => m.recipeId))],

      syncFromSupabase: async (options) => {
        const force = options?.force ?? false;
        const last = get().lastSyncedAt;
        if (!force && last && Date.now() - last < PLANNER_SYNC_TTL_MS) {
          return;
        }

        set({ syncStatus: 'syncing' });
        const uid = await getUid();
        if (!uid) {
          set({ syncStatus: 'idle' });
          return;
        }
        // Only fetch meals for the current ISO week to avoid merging stale weeks
        const weekStart = dayToDate('Mon');
        const weekEnd   = dayToDate('Sun');
        const { data, error } = await supabase
          .from('planner_meals')
          .select('entry_id, day, meal_type, recipe_id, recipe_source, servings')
          .eq('user_id', uid)
          .gte('day', weekStart)
          .lte('day', weekEnd);
        if (error) {
          console.warn('[PlannerStore] sync:', error.message);
          set({ syncStatus: 'error' });
          return;
        }
        const meals: MealEntry[] = (data ?? []).map((row: any) => ({
          id: row.entry_id,
          day: dateToDay(row.day),          // DATE → DayOfWeek
          mealType: row.meal_type as MealType,
          recipeId: row.recipe_id,
          recipeSource: (row.recipe_source as RecipeSource | null) ?? 'master',
          servings: row.servings,
        }));

        // Normalize legacy duplicates: keep only one meal per day+meal slot.
        const bySlot = new Map<string, MealEntry>();
        meals.forEach((meal) => {
          bySlot.set(`${meal.day}-${meal.mealType}`, meal);
        });
        set({ meals: Array.from(bySlot.values()), syncStatus: 'synced', lastSyncedAt: Date.now() });
      },
    }),
    {
      name: 'planner-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
