import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { RecipeSource } from '../types';

async function getUid(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

interface SavedState {
  savedIds: string[];
  savedBySource: Record<string, RecipeSource>;
  toggleSaved: (id: string, source?: RecipeSource) => void;
  isSaved: (id: string, source?: RecipeSource) => boolean;
  getSavedSource: (id: string) => RecipeSource | undefined;
  /** Pull saved recipe IDs from Supabase and replace local state. */
  syncFromSupabase: () => Promise<void>;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      savedBySource: {},

      toggleSaved: (id, source = 'master') => {
        const current = get().savedIds;
        const currentSource = get().savedBySource[id];
        const nowSaved = !(current.includes(id) && currentSource === source);

        if (nowSaved) {
          set((state) => ({
            savedIds: state.savedIds.includes(id) ? state.savedIds : [id, ...state.savedIds],
            savedBySource: { ...state.savedBySource, [id]: source },
          }));
        } else {
          set((state) => {
            const nextMap = { ...state.savedBySource };
            delete nextMap[id];
            return {
              savedIds: state.savedIds.filter((r) => r !== id),
              savedBySource: nextMap,
            };
          });
        }

        // Sync to Supabase saved_recipes (polymorphic by recipe_source)
        getUid().then((uid) => {
          if (!uid) return;
          if (nowSaved) {
            supabase.from('saved_recipes')
              .upsert(
                { user_id: uid, recipe_id: id, recipe_source: source },
                { onConflict: 'user_id,recipe_source,recipe_id' }
              )
              .then(({ error }) => {
                if (error) console.warn('[SavedStore] insert:', error.message);
              });
          } else {
            supabase.from('saved_recipes')
              .delete()
              .eq('user_id', uid)
              .eq('recipe_id', id)
              .eq('recipe_source', source)
              .then(({ error }) => {
                if (error) console.warn('[SavedStore] delete:', error.message);
              });
          }
        });
      },

      isSaved: (id, source) => {
        if (!source) return get().savedIds.includes(id);
        return get().savedIds.includes(id) && get().savedBySource[id] === source;
      },

      getSavedSource: (id) => get().savedBySource[id],

      syncFromSupabase: async () => {
        const uid = await getUid();
        if (!uid) return;
        const { data, error } = await supabase
          .from('saved_recipes')
          .select('recipe_id, recipe_source')
          .eq('user_id', uid)
          .order('saved_at', { ascending: false });
        if (error) { console.warn('[SavedStore] sync:', error.message); return; }
        const dbRows = (data ?? [])
          .map((row: any) => ({
            id: row.recipe_id as string,
            source: (row.recipe_source as RecipeSource | null) ?? 'master',
          }))
          .filter((row) => Boolean(row.id));
        const dbIds = dbRows.map((row) => row.id);
        const savedBySource: Record<string, RecipeSource> = {};
        dbRows.forEach((row) => {
          savedBySource[row.id] = row.source;
        });
        set({ savedIds: dbIds, savedBySource });
      },
    }),
    {
      name: 'saved-store-v4',     // bumped to clear old schema data from AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
