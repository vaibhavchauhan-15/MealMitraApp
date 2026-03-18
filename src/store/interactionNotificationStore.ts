import { create } from 'zustand';

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

interface InteractionNotificationState {
  items: InteractionNotification[];
  unreadCount: number;
  setItems: (items: InteractionNotification[]) => void;
  prependItem: (item: InteractionNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

function getUnreadCount(items: InteractionNotification[]): number {
  return items.reduce((acc, item) => acc + (item.is_read ? 0 : 1), 0);
}

export const useInteractionNotificationStore = create<InteractionNotificationState>((set) => ({
  items: [],
  unreadCount: 0,

  setItems: (items) =>
    set({
      items,
      unreadCount: getUnreadCount(items),
    }),

  prependItem: (item) =>
    set((state) => {
      const deduped = [item, ...state.items.filter((existing) => existing.id !== item.id)].slice(0, 120);
      return {
        items: deduped,
        unreadCount: getUnreadCount(deduped),
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

  markAllRead: () =>
    set((state) => {
      const next = state.items.map((item) => ({ ...item, is_read: true }));
      return {
        items: next,
        unreadCount: 0,
      };
    }),

  clear: () => set({ items: [], unreadCount: 0 }),
}));
