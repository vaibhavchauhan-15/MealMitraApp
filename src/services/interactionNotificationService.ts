import { AppState, AppStateStatus, Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import {
  InteractionNotification,
  NotificationCursor,
  useInteractionNotificationStore,
} from '../store/interactionNotificationStore';

type Unsubscribe = () => void;

const isExpoGo = Constants.appOwnership === 'expo';
const DEFAULT_PAGE_SIZE = 20;

let realtimeUnsub: Unsubscribe | null = null;
let appStateSub: { remove: () => void } | null = null;
let notifResponseSub: { remove: () => void } | null = null;
let currentAppState: AppStateStatus = AppState.currentState;
let insertQueue: any[] = [];
let updateQueue: any[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

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

function withIdSortDesc(items: InteractionNotification[]): InteractionNotification[] {
  return [...items].sort((a, b) => {
    const tsDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (tsDiff !== 0) return tsDiff;
    return b.id.localeCompare(a.id);
  });
}

async function enrichNotifications(items: InteractionNotification[]): Promise<InteractionNotification[]> {
  if (!items.length) return items;

  const actorIds = Array.from(
    new Set(
      items
        .map((item) => item.actor_id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    )
  );

  const masterRecipeIds = Array.from(
    new Set(
      items
        .filter((item) => item.recipe_source !== 'ai' && !!item.recipe_id)
        .map((item) => item.recipe_id as string)
    )
  );

  const aiRecipeIds = Array.from(
    new Set(
      items
        .filter((item) => item.recipe_source === 'ai' && !!item.recipe_id)
        .map((item) => item.recipe_id as string)
    )
  );

  const [actorsRes, masterRecipesRes, aiRecipesRes] = await Promise.all([
    actorIds.length
      ? supabase.from('user_profiles').select('id,avatar_url').in('id', actorIds)
      : Promise.resolve({ data: [], error: null }),
    masterRecipeIds.length
      ? supabase.from('master_recipes').select('id,image_url').in('id', masterRecipeIds)
      : Promise.resolve({ data: [], error: null }),
    aiRecipeIds.length
      ? supabase.from('user_ai_generated_recipes').select('id,image_url').in('id', aiRecipeIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const actorAvatarById = new Map<string, string>();
  if (!actorsRes.error) {
    for (const row of actorsRes.data ?? []) {
      const id = String((row as any).id ?? '');
      const avatar = String((row as any).avatar_url ?? '');
      if (id && avatar) actorAvatarById.set(id, avatar);
    }
  }

  const recipeThumbById = new Map<string, string>();
  if (!masterRecipesRes.error) {
    for (const row of masterRecipesRes.data ?? []) {
      const id = String((row as any).id ?? '');
      const image = String((row as any).image_url ?? '');
      if (id && image) recipeThumbById.set(id, image);
    }
  }
  if (!aiRecipesRes.error) {
    for (const row of aiRecipesRes.data ?? []) {
      const id = String((row as any).id ?? '');
      const image = String((row as any).image_url ?? '');
      if (id && image) recipeThumbById.set(id, image);
    }
  }

  return items.map((item) => {
    const metadata = { ...(item.metadata ?? {}) };
    const actorAvatar = item.actor_id ? actorAvatarById.get(item.actor_id) : undefined;
    if (actorAvatar && !metadata.actor_avatar_url) {
      metadata.actor_avatar_url = actorAvatar;
    }

    const recipeThumb = item.recipe_id ? recipeThumbById.get(item.recipe_id) : undefined;
    if (recipeThumb && !metadata.recipe_thumbnail) {
      metadata.recipe_thumbnail = recipeThumb;
    }

    return {
      ...item,
      metadata,
    };
  });
}

async function registerPushTokenForCurrentUser(uid: string): Promise<void> {
  if (isExpoGo) return;

  try {
    const Notifs = require('expo-notifications') as typeof import('expo-notifications');
    const { status } = await Notifs.getPermissionsAsync();
    const granted = status === 'granted' ? status : (await Notifs.requestPermissionsAsync()).status;
    if (granted !== 'granted') return;

    const projectId =
      (Constants as any)?.easConfig?.projectId ??
      (Constants as any)?.expoConfig?.extra?.eas?.projectId;

    const tokenResult = projectId
      ? await Notifs.getExpoPushTokenAsync({ projectId })
      : await Notifs.getExpoPushTokenAsync();

    const expoPushToken = String(tokenResult?.data ?? '');
    if (!expoPushToken) return;

    await supabase
      .from('user_push_tokens')
      .upsert(
        {
          user_id: uid,
          expo_push_token: expoPushToken,
          platform: Platform.OS,
          is_active: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,expo_push_token' }
      );
  } catch {
    // Token registration should never block app start.
  }
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

export interface NotificationPageResult {
  items: InteractionNotification[];
  nextCursor: NotificationCursor | null;
  hasMore: boolean;
}

export async function fetchInteractionNotificationsPage(params?: {
  limit?: number;
  cursor?: NotificationCursor | null;
}): Promise<NotificationPageResult> {
  const limit = Math.max(1, Math.min(params?.limit ?? DEFAULT_PAGE_SIZE, 40));
  const cursor = params?.cursor ?? null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return { items: [], nextCursor: null, hasMore: false };

  let query = supabase
    .from('user_notifications')
    .select('id,user_id,actor_id,actor_name,type,recipe_id,recipe_source,comment_id,message,metadata,is_read,created_at')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const mapped = await enrichNotifications((data ?? []).map(toNotification));
  const last = mapped[mapped.length - 1];

  return {
    items: mapped,
    nextCursor: last ? { createdAt: last.created_at, id: last.id } : null,
    hasMore: mapped.length === limit,
  };
}

export async function fetchInteractionNotifications(limit = 60): Promise<InteractionNotification[]> {
  const page = await fetchInteractionNotificationsPage({ limit });
  return page.items;
}

export async function markInteractionNotificationRead(id: string): Promise<void> {
  await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .eq('id', id);

  useInteractionNotificationStore.getState().markRead(id);
}

export async function markInteractionNotificationsRead(ids: string[]): Promise<void> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (!uniqueIds.length) return;

  await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .in('id', uniqueIds);

  useInteractionNotificationStore.getState().markManyRead(uniqueIds);
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
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  insertQueue = [];
  updateQueue = [];
}

async function flushRealtimeQueues() {
  flushTimer = null;

  const insertRows = insertQueue;
  const updateRows = updateQueue;
  insertQueue = [];
  updateQueue = [];

  if (!insertRows.length && !updateRows.length) return;

  const uniqueInsertRows = Array.from(new Map(insertRows.map((row) => [String(row.id), row])).values());
  const uniqueUpdateRows = Array.from(new Map(updateRows.map((row) => [String(row.id), row])).values());

  if (uniqueInsertRows.length) {
    const inserts = await enrichNotifications(withIdSortDesc(uniqueInsertRows.map(toNotification)));
    useInteractionNotificationStore.getState().prependItemsBatch(inserts);

    if (currentAppState !== 'active') {
      for (const item of inserts.slice(0, 3)) {
        await scheduleLocalInteractionNotification(item);
      }
    }
  }

  if (uniqueUpdateRows.length) {
    const updates = await enrichNotifications(uniqueUpdateRows.map(toNotification));
    useInteractionNotificationStore.getState().applyUpdatesBatch(updates);
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    void flushRealtimeQueues();
  }, 200);
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

  void registerPushTokenForCurrentUser(uid);

  try {
    if (useInteractionNotificationStore.getState().items.length === 0) {
      const seeded = await fetchInteractionNotifications(40);
      useInteractionNotificationStore.getState().setItems(seeded);
    }
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
      const notificationId = response.notification.request.content.data?.notificationId;
      if (typeof notificationId === 'string' && notificationId.length > 0) {
        useInteractionNotificationStore.getState().markRead(notificationId);
        void markInteractionNotificationRead(notificationId);
      }
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
      (payload) => {
        insertQueue.push(payload.new);
        scheduleFlush();
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
        updateQueue.push(payload.new);
        scheduleFlush();
      }
    )
    .subscribe();

  realtimeUnsub = () => {
    void supabase.removeChannel(channel);
  };
}
