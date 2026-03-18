import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  PanResponder,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/theme/useTheme';
import { BorderRadius, Shadow, Spacing, Typography } from '../src/theme';
import {
  fetchInteractionNotificationsPage,
  markAllInteractionNotificationsRead,
  markInteractionNotificationRead,
  markInteractionNotificationsRead,
} from '../src/services/interactionNotificationService';
import {
  InteractionNotification,
  useInteractionNotificationStore,
} from '../src/store/interactionNotificationStore';
import { FallbackImage } from '../src/components/FallbackImage';
import { NotificationSkeletonList } from '../src/components/notifications/NotificationSkeletonList';

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const PRIORITY_BY_TYPE: Record<InteractionNotification['type'], number> = {
  comment_replied: 5,
  recipe_commented: 4,
  comment_liked: 3,
  recipe_liked: 2,
  recipe_disliked: 1,
};

type GroupedNotification = {
  id: string;
  type: InteractionNotification['type'];
  createdAt: string;
  priority: number;
  message: string;
  actorAvatarUrl: string | null;
  recipeThumbUrl: string | null;
  recipeId: string | null;
  recipeSource: 'master' | 'ai' | null;
  isRead: boolean;
  notificationIds: string[];
};

function iconForType(type: InteractionNotification['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'recipe_liked':
      return 'heart-outline';
    case 'recipe_disliked':
      return 'thumbs-down-outline';
    case 'recipe_commented':
      return 'chatbubble-outline';
    case 'comment_replied':
      return 'return-up-forward-outline';
    case 'comment_liked':
      return 'heart-circle-outline';
    default:
      return 'notifications-outline';
  }
}

function relativeTime(value: string): string {
  const now = Date.now();
  const ts = new Date(value).getTime();
  const diffSec = Math.max(1, Math.floor((now - ts) / 1000));

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function getMetadataString(item: InteractionNotification, key: string): string | null {
  const value = item.metadata?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function formatGroupedMessage(type: InteractionNotification['type'], actorNames: string[], totalActors: number): string {
  const [first = 'Someone', second] = actorNames;
  const others = Math.max(0, totalActors - (second ? 2 : 1));

  const lead = second ? `${first}, ${second}` : first;
  const actorLabel = others > 0 ? `${lead} and ${others} others` : lead;

  switch (type) {
    case 'recipe_liked':
      return `${actorLabel} liked your recipe.`;
    case 'recipe_disliked':
      return `${actorLabel} disliked your recipe.`;
    case 'recipe_commented':
      return `${actorLabel} commented on your recipe.`;
    case 'comment_replied':
      return `${actorLabel} replied to your comment.`;
    case 'comment_liked':
      return `${actorLabel} liked your comment.`;
    default:
      return `${actorLabel} sent you an update.`;
  }
}

function groupNotifications(items: InteractionNotification[]): GroupedNotification[] {
  const grouped = new Map<string, InteractionNotification[]>();

  for (const item of items) {
    const bucket = Math.floor(new Date(item.created_at).getTime() / GROUP_WINDOW_MS);
    const key = `${item.type}:${item.recipe_id ?? 'none'}:${bucket}`;
    const list = grouped.get(key);
    if (list) {
      list.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  const output: GroupedNotification[] = [];

  for (const [key, list] of grouped.entries()) {
    const sorted = [...list].sort((a, b) => {
      const tsDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (tsDiff !== 0) return tsDiff;
      return b.id.localeCompare(a.id);
    });
    const newest = sorted[0];
    const actorNames = Array.from(
      new Set(
        sorted
          .map((n) => (n.actor_name?.trim().length ? n.actor_name.trim() : 'Someone'))
          .filter(Boolean)
      )
    );

    output.push({
      id: key,
      type: newest.type,
      createdAt: newest.created_at,
      priority: PRIORITY_BY_TYPE[newest.type],
      message:
        sorted.length > 1
          ? formatGroupedMessage(newest.type, actorNames, actorNames.length)
          : newest.message,
      actorAvatarUrl: getMetadataString(newest, 'actor_avatar_url'),
      recipeThumbUrl: getMetadataString(newest, 'recipe_thumbnail'),
      recipeId: newest.recipe_id,
      recipeSource: newest.recipe_source,
      isRead: sorted.every((n) => n.is_read),
      notificationIds: sorted.map((n) => n.id),
    });
  }

  return output.sort((a, b) => {
    const tsDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (tsDiff !== 0) return tsDiff;
    return b.priority - a.priority;
  });
}

type FeedRowProps = {
  item: GroupedNotification;
  onOpen: (value: GroupedNotification) => void;
  onSwipeRead: (value: GroupedNotification) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  shouldAnimateIn: boolean;
};

const FeedRow = memo(function FeedRow({
  item,
  onOpen,
  onSwipeRead,
  colors,
  shouldAnimateIn,
}: FeedRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const entryOpacity = useRef(new Animated.Value(shouldAnimateIn ? 0 : 1)).current;
  const entryTranslateY = useRef(new Animated.Value(shouldAnimateIn ? 14 : 0)).current;

  useEffect(() => {
    if (!shouldAnimateIn) return;
    Animated.parallel([
      Animated.timing(entryOpacity, {
        toValue: 1,
        duration: 230,
        useNativeDriver: true,
      }),
      Animated.spring(entryTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entryOpacity, entryTranslateY, shouldAnimateIn]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8 && Math.abs(gesture.dy) < 14,
        onPanResponderMove: (_, gesture) => {
          const next = Math.min(0, gesture.dx);
          translateX.setValue(next);
        },
        onPanResponderRelease: async (_, gesture) => {
          if (!item.isRead && gesture.dx < -72) {
            await Haptics.selectionAsync();
            Animated.timing(translateX, {
              toValue: -96,
              duration: 120,
              useNativeDriver: true,
            }).start(() => {
              onSwipeRead(item);
              Animated.spring(translateX, {
                toValue: 0,
                friction: 7,
                tension: 95,
                useNativeDriver: true,
              }).start();
            });
            return;
          }

          Animated.spring(translateX, {
            toValue: 0,
            friction: 8,
            tension: 115,
            useNativeDriver: true,
          }).start();
        },
      }),
    [item, onSwipeRead, translateX]
  );

  return (
    <View style={styles.rowShell}>
      <View style={[styles.swipeHint, { backgroundColor: colors.accentLight, borderColor: colors.border }]}> 
        <Ionicons name="checkmark-done-outline" size={14} color={colors.accent} />
        <Text style={[styles.swipeHintText, { color: colors.accent }]}>Read</Text>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX }, { scale: pressScale }, { translateY: entryTranslateY }],
          opacity: entryOpacity,
        }}
      >
        <Pressable
          style={[
            styles.row,
            {
              backgroundColor: colors.surface,
              borderColor: item.isRead ? colors.border : `${colors.accent}66`,
            },
            Shadow.sm,
          ]}
          onPressIn={() => {
            Animated.spring(pressScale, {
              toValue: 0.96,
              friction: 7,
              tension: 150,
              useNativeDriver: true,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(pressScale, {
              toValue: 1,
              friction: 7,
              tension: 120,
              useNativeDriver: true,
            }).start();
          }}
          onPress={() => onOpen(item)}
        >
          <View style={[styles.avatarWrap, { backgroundColor: colors.accentLight }]}> 
            {item.actorAvatarUrl ? (
              <FallbackImage uri={item.actorAvatarUrl} style={styles.avatarImage} />
            ) : (
              <Ionicons name={iconForType(item.type)} size={17} color={colors.accent} />
            )}
          </View>

          <View style={styles.mainContent}>
            <Text style={[styles.message, { color: colors.text }]}>{item.message}</Text>
            <Text style={[styles.time, { color: colors.textSecondary }]}>{relativeTime(item.createdAt)}</Text>
          </View>

          {item.recipeThumbUrl ? (
            <FallbackImage uri={item.recipeThumbUrl} style={[styles.thumb, { borderColor: colors.border }]} />
          ) : null}

          {!item.isRead ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}
        </Pressable>
      </Animated.View>
    </View>
  );
});

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const items = useInteractionNotificationStore((s) => s.items);
  const unreadCount = useInteractionNotificationStore((s) => s.unreadCount);
  const hasMore = useInteractionNotificationStore((s) => s.hasMore);
  const nextCursor = useInteractionNotificationStore((s) => s.nextCursor);
  const loadingMore = useInteractionNotificationStore((s) => s.loadingMore);
  const updateItems = useInteractionNotificationStore((s) => s.updateItems);
  const appendPage = useInteractionNotificationStore((s) => s.appendPage);
  const markReadLocal = useInteractionNotificationStore((s) => s.markRead);
  const markManyReadLocal = useInteractionNotificationStore((s) => s.markManyRead);
  const setLoadingMore = useInteractionNotificationStore((s) => s.setLoadingMore);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const animatedIds = useRef(new Set<string>());

  const grouped = useMemo(() => groupNotifications(items), [items]);

  const loadFirstPage = useCallback(async () => {
    const page = await fetchInteractionNotificationsPage({ limit: 20, cursor: null });
    updateItems(page.items);
    useInteractionNotificationStore.setState({ nextCursor: page.nextCursor, hasMore: page.hasMore });
  }, [updateItems]);

  useEffect(() => {
    const hadCachedItems = items.length > 0;
    setLoading(!hadCachedItems);
    loadFirstPage().finally(() => setLoading(false));
  }, [loadFirstPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFirstPage();
    } finally {
      setRefreshing(false);
    }
  }, [loadFirstPage]);

  const onEndReached = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await fetchInteractionNotificationsPage({ limit: 20, cursor: nextCursor });
      appendPage(page.items, page.nextCursor, page.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, nextCursor, setLoadingMore, appendPage]);

  const openNotification = useCallback(async (item: GroupedNotification) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!item.isRead) {
      if (item.notificationIds.length > 1) {
        markManyReadLocal(item.notificationIds);
        await markInteractionNotificationsRead(item.notificationIds);
      } else {
        const id = item.notificationIds[0];
        markReadLocal(id);
        await markInteractionNotificationRead(id);
      }
    }

    if (item.recipeId) {
      router.push({
        pathname: '/recipe/[id]',
        params: {
          id: item.recipeId,
          source: item.recipeSource === 'ai' ? 'ai' : 'master',
        },
      } as any);
    }
  }, [markManyReadLocal, markReadLocal, router]);

  const markRowReadFromSwipe = useCallback(async (item: GroupedNotification) => {
    if (item.isRead) return;

    if (item.notificationIds.length > 1) {
      markManyReadLocal(item.notificationIds);
      await markInteractionNotificationsRead(item.notificationIds);
      return;
    }

    const id = item.notificationIds[0];
    markReadLocal(id);
    await markInteractionNotificationRead(id);
  }, [markManyReadLocal, markReadLocal]);

  const markAll = useCallback(async () => {
    if (unreadCount === 0) return;
    await Haptics.selectionAsync();
    await markAllInteractionNotificationsRead();
  }, [unreadCount]);

  const renderRow = useCallback(
    ({ item }: { item: GroupedNotification }) => {
      const shouldAnimateIn = !animatedIds.current.has(item.id);
      if (shouldAnimateIn) {
        animatedIds.current.add(item.id);
      }

      return (
        <FeedRow
          item={item}
          onOpen={openNotification}
          onSwipeRead={markRowReadFromSwipe}
          colors={colors}
          shouldAnimateIn={shouldAnimateIn}
        />
      );
    },
    [openNotification, markRowReadFromSwipe, colors]
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{unreadCount} unread</Text>
        </View>
        <TouchableOpacity
          style={[styles.markAllBtn, { backgroundColor: colors.surface, opacity: unreadCount ? 1 : 0.5 }]}
          onPress={markAll}
          disabled={unreadCount === 0}
        >
          <Text style={[styles.markAllText, { color: colors.accent }]}>Mark all</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={[styles.listContent, { paddingBottom: insets.bottom + Spacing['2xl'] }]}>
          <NotificationSkeletonList />
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          renderItem={renderRow}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          removeClippedSubviews
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          initialNumToRender={8}
          windowSize={9}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.55}
          ListFooterComponent={
            loadingMore ? <Text style={[styles.footerText, { color: colors.textSecondary }]}>Loading more...</Text> : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-off-outline" size={42} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Likes, comments and replies will appear here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  subtitle: { fontSize: Typography.fontSize.xs, marginTop: 2 },
  markAllBtn: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markAllText: { fontSize: Typography.fontSize.xs, fontWeight: '700' },
  listContent: { padding: Spacing.base },
  rowShell: {
    overflow: 'hidden',
    borderRadius: BorderRadius.lg,
  },
  swipeHint: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 90,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  swipeHintText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  row: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  mainContent: { flex: 1, gap: 4 },
  message: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  time: { fontSize: Typography.fontSize.xs },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['3xl'],
    gap: 6,
  },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: '800' },
  emptySub: { fontSize: Typography.fontSize.base },
  footerText: {
    textAlign: 'center',
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.sm,
  },
});
