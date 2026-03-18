import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InteractionNotification {
  id: string;
  user_id: string;
  actor_id: string | null;
  actor_name: string | null;
  type: 'recipe_liked' | 'recipe_disliked' | 'recipe_commented' | 'comment_replied' | 'comment_liked';
  recipe_id: string | null;
  recipe_source: 'master' | 'ai' | null;
  comment_id: string | null;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationCursor {
  createdAt: string;
  id: string;
}

const MAX_NOTIFICATION_ITEMS = 120;

interface InteractionNotificationState {
  items: InteractionNotification[];
  unreadCount: number;
  hasHydrated: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  nextCursor: NotificationCursor | null;
  incomingSequence: number;
  latestIncoming: InteractionNotification | null;
  setItems: (items: InteractionNotification[]) => void;
  prependItem: (item: InteractionNotification) => void;
  prependItemsBatch: (items: InteractionNotification[]) => void;
  appendPage: (items: InteractionNotification[], nextCursor: NotificationCursor | null, hasMore: boolean) => void;
  resetForFreshFetch: () => void;
  setHydrated: (value: boolean) => void;
  setLoadingMore: (value: boolean) => void;
  updateItems: (items: InteractionNotification[]) => void;
  applyUpdatesBatch: (items: InteractionNotification[]) => void;
  markRead: (id: string) => void;
  markManyRead: (ids: string[]) => void;
  markAllRead: () => void;
  clearLatestIncoming: () => void;
  clear: () => void;
}

function getUnreadCount(items: InteractionNotification[]): number {
  return items.reduce((acc, item) => acc + (item.is_read ? 0 : 1), 0);
}

function dedupeById(items: InteractionNotification[]): InteractionNotification[] {
  const seen = new Set<string>();
  const output: InteractionNotification[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    output.push(item);
  }
  return output;
}

function sortDesc(items: InteractionNotification[]): InteractionNotification[] {
  return [...items].sort((a, b) => {
    const tsDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (tsDiff !== 0) return tsDiff;
    return b.id.localeCompare(a.id);
  });
}

function normalizeItems(items: InteractionNotification[]): InteractionNotification[] {
  return sortDesc(dedupeById(items)).slice(0, MAX_NOTIFICATION_ITEMS);
}

export const useInteractionNotificationStore = create<InteractionNotificationState>()(
  persist(
    (set, get) => ({
      items: [],
      unreadCount: 0,
      hasHydrated: false,
      hasMore: true,
      loadingMore: false,
      nextCursor: null,
      incomingSequence: 0,
      latestIncoming: null,

      setItems: (items) =>
        set(() => {
          const normalized = normalizeItems(items);
          return {
            items: normalized,
            unreadCount: getUnreadCount(normalized),
          };
        }),

      prependItem: (item) => {
        get().prependItemsBatch([item]);
      },

      prependItemsBatch: (items) =>
        set((state) => {
          if (!items.length) return state;
          const normalized = normalizeItems([...items, ...state.items]);
          const latestIncoming = items[0] ?? null;
          return {
            items: normalized,
            unreadCount: getUnreadCount(normalized),
            latestIncoming,
            incomingSequence: state.incomingSequence + 1,
          };
        }),

      appendPage: (items, nextCursor, hasMore) =>
        set((state) => {
          const normalized = normalizeItems([...state.items, ...items]);
          return {
            items: normalized,
            unreadCount: getUnreadCount(normalized),
            nextCursor,
            hasMore,
          };
        }),

      resetForFreshFetch: () =>
        set({
          items: [],
          unreadCount: 0,
          hasMore: true,
          nextCursor: null,
          loadingMore: false,
        }),

      setHydrated: (value) => set({ hasHydrated: value }),
      setLoadingMore: (value) => set({ loadingMore: value }),

      updateItems: (items) => {
        const normalized = normalizeItems(items);
        set({
          items: normalized,
          unreadCount: getUnreadCount(normalized),
        });
      },

      applyUpdatesBatch: (updates) =>
        set((state) => {
          if (!updates.length) return state;
          const byId = new Map(state.items.map((item) => [item.id, item]));
          for (const item of updates) {
            if (!byId.has(item.id)) continue;
            byId.set(item.id, item);
          }
          const normalized = normalizeItems(Array.from(byId.values()));
          return {
            items: normalized,
            unreadCount: getUnreadCount(normalized),
          };
        }),

      markRead: (id) =>
        set((state) => {
          const next = state.items.map((item) => (item.id === id ? { ...item, is_read: true } : item));
          return {
            items: next,
            unreadCount: getUnreadCount(next),
          };
        }),

      markManyRead: (ids) =>
        set((state) => {
          if (!ids.length) return state;
          const idSet = new Set(ids);
          const next = state.items.map((item) => (idSet.has(item.id) ? { ...item, is_read: true } : item));
          return {
            items: next,
            unreadCount: getUnreadCount(next),
          };
        }),

      markAllRead: () =>
        set((state) => {
          const next = state.items.map((item) => ({ ...item, is_read: true }));
          return {
            items: next,
            unreadCount: 0,
          };
        }),

      clearLatestIncoming: () => set({ latestIncoming: null }),

      clear: () =>
        set({
          items: [],
          unreadCount: 0,
          hasMore: true,
          loadingMore: false,
          nextCursor: null,
          latestIncoming: null,
        }),
    }),
    {
      name: 'interaction-notification-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        unreadCount: state.unreadCount,
        hasMore: state.hasMore,
        nextCursor: state.nextCursor,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
