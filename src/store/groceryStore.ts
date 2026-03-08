import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GroceryItem } from '../types';

interface GroceryState {
  items: GroceryItem[];
  addItems: (newItems: Omit<GroceryItem, 'id' | 'checked'>[]) => void;
  toggleItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearChecked: () => void;
  clearAll: () => void;
  addCustomItem: (name: string, quantity?: number, unit?: string) => void;
}

export const useGroceryStore = create<GroceryState>()(
  persist(
    (set, get) => ({
      items: [],

      addItems: (newItems) => {
        const existing = get().items;
        const merged = [...existing];
        newItems.forEach((item) => {
          const existingIdx = merged.findIndex(
            (e) => e.name.toLowerCase() === item.name.toLowerCase() && e.unit === item.unit
          );
          if (existingIdx >= 0) {
            merged[existingIdx] = {
              ...merged[existingIdx],
              quantity: merged[existingIdx].quantity + item.quantity,
            };
          } else {
            merged.push({
              ...item,
              id: `${item.name}-${Date.now()}-${Math.random()}`,
              checked: false,
            });
          }
        });
        set({ items: merged });
      },

      toggleItem: (id) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
        })),

      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      clearChecked: () => set((s) => ({ items: s.items.filter((i) => !i.checked) })),

      clearAll: () => set({ items: [] }),

      addCustomItem: (name, quantity = 1, unit = 'pcs') => {
        const newItem: GroceryItem = {
          id: `custom-${Date.now()}`,
          name,
          quantity,
          unit,
          checked: false,
        };
        set((s) => ({ items: [...s.items, newItem] }));
      },
    }),
    {
      name: 'grocery-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
