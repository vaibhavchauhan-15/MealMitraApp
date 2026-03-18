import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../src/theme';
import {
  fetchInteractionNotifications,
  markAllInteractionNotificationsRead,
  markInteractionNotificationRead,
} from '../src/services/interactionNotificationService';
import {
  InteractionNotification,
  useInteractionNotificationStore,
} from '../src/store/interactionNotificationStore';

function iconForType(type: InteractionNotification['type']) {
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

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const items = useInteractionNotificationStore((s) => s.items);
  const unreadCount = useInteractionNotificationStore((s) => s.unreadCount);
  const setItems = useInteractionNotificationStore((s) => s.setItems);
  const markReadLocal = useInteractionNotificationStore((s) => s.markRead);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchInteractionNotifications(80);
    setItems(data);
  }, [setItems]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const openNotification = async (item: InteractionNotification) => {
    if (!item.is_read) {
      markReadLocal(item.id);
      await markInteractionNotificationRead(item.id);
    }

    if (item.recipe_id) {
      router.push({
        pathname: '/recipe/[id]',
        params: {
          id: item.recipe_id,
          source: item.recipe_source === 'ai' ? 'ai' : 'master',
        },
      } as any);
    }
  };

  const markAll = async () => {
    if (unreadCount === 0) return;
    await markAllInteractionNotificationsRead();
  };

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
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.84}
              style={[
                styles.row,
                {
                  backgroundColor: colors.surface,
                  borderColor: item.is_read ? colors.border : colors.accent + '66',
                },
              ]}
              onPress={() => openNotification(item)}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.accentLight }]}> 
                <Ionicons name={iconForType(item.type)} size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.message, { color: colors.text }]}>{item.message}</Text>
                <Text style={[styles.time, { color: colors.textSecondary }]}>{relativeTime(item.created_at)}</Text>
              </View>
              {!item.is_read && <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
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
  row: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  time: { fontSize: Typography.fontSize.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['3xl'],
    gap: 6,
  },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: '800' },
  emptySub: { fontSize: Typography.fontSize.base },
});
