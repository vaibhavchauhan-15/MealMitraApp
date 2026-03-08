import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SavedState {
  savedIds: string[];
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      toggleSaved: (id) => {
        const current = get().savedIds;
        if (current.includes(id)) {
          set({ savedIds: current.filter((r) => r !== id) });
        } else {
          set({ savedIds: [id, ...current] });
        }
      },
      isSaved: (id) => get().savedIds.includes(id),
    }),
    {
      name: 'saved-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
