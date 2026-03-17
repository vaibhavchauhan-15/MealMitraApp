import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { BorderRadius, Shadow, Spacing, Typography, Motion } from '../src/theme';
import { useUserStore } from '../src/store/userStore';
import { getUploadedUserAiDietPlansPage, SavedAiDietPlan } from '../src/services/aiPlanSupabaseService';

const PAGE_SIZE = 14;

function StaggeredEntry({
  delay,
  triggerKey,
  children,
}: {
  delay: number;
  triggerKey: string;
  children: React.ReactNode;
}) {
  const entry = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    entry.setValue(0);
    Animated.timing(entry, {
      toValue: 1,
      duration: Motion.STAGGER_DURATION_MS,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, triggerKey, entry]);

  return (
    <Animated.View
      style={{
        opacity: entry,
        transform: [
          {
            translateY: entry.interpolate({
              inputRange: [0, 1],
              outputRange: [Motion.STAGGER_TRANSLATE_Y, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function HistoryCard({
  item,
  colors,
  compact,
  onPress,
}: {
  item: SavedAiDietPlan;
  colors: any;
  compact: boolean;
  onPress: () => void;
}) {
  const totalSlots = item.diet_plan_meals?.length ?? 0;
  const totalDays = item.days ?? 0;
  const mealCounts = {
    Breakfast: item.diet_plan_meals?.filter((m) => m.meal_type === 'Breakfast').length ?? 0,
    Lunch: item.diet_plan_meals?.filter((m) => m.meal_type === 'Lunch').length ?? 0,
    Snack: item.diet_plan_meals?.filter((m) => m.meal_type === 'Snack').length ?? 0,
    Dinner: item.diet_plan_meals?.filter((m) => m.meal_type === 'Dinner').length ?? 0,
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: colors.surface, borderColor: colors.border },
        Shadow.sm,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.cardRight}> 
          <View style={[styles.publicBadge, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.publicBadgeText, { color: colors.accent }]}>Uploaded</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </View>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
        <Text style={[styles.metaText, compact && styles.metaTextCompact, { color: colors.textSecondary }]}>{formatDate(item.created_at)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="nutrition-outline" size={13} color={colors.textTertiary} />
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          {item.diet_type || item.plan_data?.diet_type || 'mixed'}
        </Text>
        <Text style={[styles.metaDot, { color: colors.textTertiary }]}>·</Text>
        <Text style={[styles.metaText, compact && styles.metaTextCompact, { color: colors.textSecondary }]}>{totalDays} days</Text>
      </View>

      <View style={[styles.statsRow, compact && styles.statsRowCompact]}>
        <View style={[styles.statPill, { backgroundColor: colors.background }]}> 
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Calories</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{item.total_calories} kcal</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: colors.background }]}> 
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Protein</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{item.total_protein} g</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: colors.background }]}> 
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Slots</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalSlots}</Text>
        </View>
      </View>

      <View style={[styles.slotBreakdown, { borderTopColor: colors.border }]}> 
        <Text style={[styles.slotBreakdownTitle, { color: colors.textTertiary }]}>Meal slots</Text>
        <View style={styles.slotPillRow}>
          {Object.entries(mealCounts).map(([label, count]) => (
            <View key={label} style={[styles.slotPill, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <Text style={[styles.slotPillText, { color: colors.textSecondary }]}>{label.slice(0, 1)}</Text>
              <Text style={[styles.slotPillValue, { color: colors.text }]}>{count}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

export default function AiGeneratedPlanHistoryScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const isCompact = width <= 360 || height <= 720;
  const profile = useUserStore((s) => s.profile);

  const [items, setItems] = useState<SavedAiDietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const listTransition = useState(() => new Animated.Value(1))[0];

  const loadPage = useCallback(async (offset: number, reset: boolean) => {
    if (!profile?.id) {
      if (reset) setItems([]);
      setHasMore(false);
      setError('Please login to view uploaded plan history.');
      return;
    }

    setError('');
    const page = await getUploadedUserAiDietPlansPage(profile.id, {
      offset,
      limit: PAGE_SIZE,
    });
    setHasMore(page.hasMore);
    if (reset) {
      setItems(page.items);
    } else {
      setItems((prev) => [...prev, ...page.items]);
    }
  }, [profile?.id]);

  useEffect(() => {
    setLoading(true);
    loadPage(0, true)
      .catch((e: any) => setError(e?.message ?? 'Failed to load uploaded plan history.'))
      .finally(() => setLoading(false));
  }, [loadPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPage(0, true);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to refresh history.');
    } finally {
      setRefreshing(false);
    }
  }, [loadPage]);

  const onEndReached = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await loadPage(items.length, false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load more history.');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, items.length, loadPage, loading, loadingMore]);

  useEffect(() => {
    listTransition.setValue(0.92);
    Animated.timing(listTransition, {
      toValue: 1,
      duration: Motion.TRANSITION_SHORT_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [items.length, listTransition]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}> 
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, isCompact && styles.headerCompact, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.surface },
            pressed && styles.backBtnPressed,
          ]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, isCompact && styles.titleCompact, { color: colors.text }]}>Uploaded AI Plan History</Text>
          <Text style={[styles.subtitle, isCompact && styles.subtitleCompact, { color: colors.textSecondary }]}>Only plans you uploaded to community</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      ) : (
        <Animated.View
          style={{
            flex: 1,
            opacity: listTransition,
            transform: [
              {
                translateY: listTransition.interpolate({
                  inputRange: [0.92, 1],
                  outputRange: [6, 0],
                }),
              },
            ],
          }}
        >
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.content, isCompact && styles.contentCompact]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
              />
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={error ? (
              <View style={[styles.errorCard, { backgroundColor: '#EF444415', borderColor: '#EF444455' }]}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
              </View>
            ) : null}
            renderItem={({ item, index }) => (
              <StaggeredEntry
                delay={(index % Motion.STAGGER_MAX_ITEMS) * Motion.STAGGER_BASE_MS}
                triggerKey={`${item.id}-${items.length}`}
              >
                <HistoryCard
                  item={item}
                  colors={colors}
                  compact={isCompact}
                  onPress={() =>
                    router.push({
                      pathname: '/ai-generated-plan-history/[id]',
                      params: { id: item.id },
                    } as any)
                  }
                />
              </StaggeredEntry>
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No uploaded plans yet</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Generate a plan and upload it to see history here.</Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing.md }} />
              ) : (
                <View style={{ height: Spacing.xl }} />
              )
            }
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerCompact: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
  },
  titleCompact: {
    fontSize: Typography.fontSize.lg,
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  subtitleCompact: {
    fontSize: 11,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.sm,
    paddingBottom: Spacing['3xl'],
  },
  contentCompact: {
    padding: Spacing.sm,
    gap: 6,
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardCompact: {
    padding: Spacing.sm,
    gap: 6,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.96,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardRight: {
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
  },
  cardTitleCompact: {
    fontSize: Typography.fontSize.sm,
  },
  publicBadge: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  publicBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  metaTextCompact: {
    fontSize: Typography.fontSize.xs,
  },
  metaDot: {
    fontSize: Typography.fontSize.base,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  statsRowCompact: {
    gap: 4,
  },
  statPill: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
  },
  statValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  slotBreakdown: {
    borderTopWidth: 1,
    paddingTop: Spacing.xs,
    gap: 6,
  },
  slotBreakdownTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  slotPillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  slotPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotPillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  slotPillValue: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: Spacing['3xl'],
    gap: 4,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
});
