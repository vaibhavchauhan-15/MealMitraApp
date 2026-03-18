import { AppState, AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import {
  InteractionNotification,
  useInteractionNotificationStore,
} from '../store/interactionNotificationStore';

type Unsubscribe = () => void;

const isExpoGo = Constants.appOwnership === 'expo';

let realtimeUnsub: Unsubscribe | null = null;
let appStateSub: { remove: () => void } | null = null;
let notifResponseSub: { remove: () => void } | null = null;
let currentAppState: AppStateStatus = AppState.currentState;

function toNotification(row: any): InteractionNotification {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    actor_id: row.actor_id ? String(row.actor_id) : null,
    actor_name: row.actor_name ? String(row.actor_name) : null,
    type: row.type,
    recipe_id: row.recipe_id ? String(row.recipe_id) : null,
    recipe_source: row.recipe_source ? (String(row.recipe_source) as 'master' | 'ai') : null,
    comment_id: row.comment_id ? String(row.comment_id) : null,
    message: String(row.message ?? ''),
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    is_read: Boolean(row.is_read),
    created_at: String(row.created_at),
  };
}

function getDeepLinkForNotification(item: InteractionNotification): string | null {
  if (item.recipe_id) {
    const source = item.recipe_source === 'ai' ? 'ai' : 'master';
    return `mealmitra://recipe/${item.recipe_id}?source=${source}`;
  }
  return null;
}

async function scheduleLocalInteractionNotification(item: InteractionNotification): Promise<void> {
  if (isExpoGo) return;

  const Notifs = require('expo-notifications') as typeof import('expo-notifications');
  const deepLink = getDeepLinkForNotification(item);

  await Notifs.scheduleNotificationAsync({
    content: {
      title: 'MealMitra',
      body: item.message,
      data: {
        deepLink,
        notificationId: item.id,
      },
      sound: 'default',
    },
    trigger: null,
  });
}

export async function fetchInteractionNotifications(limit = 60): Promise<InteractionNotification[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return [];

  const { data, error } = await supabase
    .from('user_notifications')
    .select('id,user_id,actor_id,actor_name,type,recipe_id,recipe_source,comment_id,message,metadata,is_read,created_at')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map(toNotification);
}

export async function markInteractionNotificationRead(id: string): Promise<void> {
  await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .eq('id', id);

  useInteractionNotificationStore.getState().markRead(id);
}

export async function markAllInteractionNotificationsRead(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return;

  await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .eq('user_id', uid)
    .eq('is_read', false);

  useInteractionNotificationStore.getState().markAllRead();
}

export function stopInteractionNotificationBridge() {
  if (realtimeUnsub) {
    realtimeUnsub();
    realtimeUnsub = null;
  }
  if (appStateSub) {
    appStateSub.remove();
    appStateSub = null;
  }
  if (notifResponseSub) {
    notifResponseSub.remove();
    notifResponseSub = null;
  }
}

export async function startInteractionNotificationBridge(onNavigateDeepLink: (url: string) => void) {
  stopInteractionNotificationBridge();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user?.id;

  if (!uid) {
    useInteractionNotificationStore.getState().clear();
    return;
  }

  try {
    const seeded = await fetchInteractionNotifications(60);
    useInteractionNotificationStore.getState().setItems(seeded);
  } catch {
    // Keep UI functional even if initial hydrate fails.
  }

  appStateSub = AppState.addEventListener('change', (nextState) => {
    currentAppState = nextState;
  });

  if (!isExpoGo) {
    const Notifs = require('expo-notifications') as typeof import('expo-notifications');
    notifResponseSub = Notifs.addNotificationResponseReceivedListener((response) => {
      const deepLink = response.notification.request.content.data?.deepLink;
      if (typeof deepLink === 'string' && deepLink.length > 0) {
        onNavigateDeepLink(deepLink);
      }
    });
  }

  const channel = supabase
    .channel(`user-notifications-${uid}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${uid}`,
      },
      async (payload) => {
        const item = toNotification(payload.new);
        useInteractionNotificationStore.getState().prependItem(item);

        if (currentAppState !== 'active') {
          await scheduleLocalInteractionNotification(item);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${uid}`,
      },
      (payload) => {
        const updated = toNotification(payload.new);
        const state = useInteractionNotificationStore.getState();
        const next = state.items.map((item) => (item.id === updated.id ? updated : item));
        state.setItems(next);
      }
    )
    .subscribe();

  realtimeUnsub = () => {
    void supabase.removeChannel(channel);
  };
}
