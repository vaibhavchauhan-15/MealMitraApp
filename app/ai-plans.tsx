import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/useTheme';
import { BorderRadius, Shadow, Spacing, Typography } from '../src/theme';
import {
  getPublicAiDietPlansPage,
  PublicAiDietPlanCard,
} from '../src/services/aiPlanSupabaseService';

const PAGE_SIZE = 16;

const DIET_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Non-Veg', value: 'non_veg' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Eggetarian', value: 'eggetarian' },
] as const;

const CALORIE_FILTERS = [
  { label: 'Any', value: undefined },
  { label: '<= 1800', value: 1800 },
  { label: '<= 2200', value: 2200 },
  { label: '<= 2600', value: 2600 },
] as const;

function PlanCard({ item, colors }: { item: PublicAiDietPlanCard; colors: any }) {
  const kcal = item.plan_calories ?? item.total_calories;
  const protein = item.total_protein;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, Shadow.sm]}>
      <View style={styles.cardTopRow}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.topRightWrap}>
          {item.created_by_ai && (
            <View style={[styles.aiIconBadge, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="sparkles" size={12} color={colors.accent} />
            </View>
          )}
          <View style={[styles.publicBadge, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.publicBadgeText, { color: colors.accent }]}>Public</Text>
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="person-outline" size={13} color={colors.textTertiary} />
        <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.source_label}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="nutrition-outline" size={13} color={colors.textTertiary} />
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          {item.plan_diet_type ?? item.diet_type ?? 'Mixed'}
        </Text>
        <Text style={[styles.metaDot, { color: colors.textTertiary }]}>·</Text>
        <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.days ?? 7} days</Text>
      </View>

      {!!item.goal && (
        <View style={styles.metaRow}>
          <Ionicons name="flag-outline" size={13} color={colors.textTertiary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {item.goal.replace(/_/g, ' ')}
          </Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={[styles.statPill, { backgroundColor: colors.background }]}>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Calories</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{kcal ?? '-'} kcal</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: colors.background }]}>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Protein</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{protein ?? '-'} g</Text>
        </View>
      </View>
    </View>
  );
}

export default function AiPlansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [items, setItems] = useState<PublicAiDietPlanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [dietFilter, setDietFilter] = useState<string | undefined>(undefined);
  const [calorieFilter, setCalorieFilter] = useState<number | undefined>(undefined);

  const title = useMemo(() => {
    if (dietFilter) return 'Public AI Diet Plans';
    return 'Community AI Diet Plans';
  }, [dietFilter]);

  const fetchPage = useCallback(async (offset: number, reset: boolean) => {
    const page = await getPublicAiDietPlansPage({
      offset,
      limit: PAGE_SIZE,
      dietType: dietFilter,
      maxCalories: calorieFilter,
    });
    setHasMore(page.hasMore);
    if (reset) {
      setItems(page.items);
    } else {
      setItems((prev) => [...prev, ...page.items]);
    }
  }, [dietFilter, calorieFilter]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      await fetchPage(0, true);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPage(0, true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage]);

  const onEndReached = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    try {
      await fetchPage(items.length, false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMore, fetchPage, items.length]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Fast, filterable, and community powered</Text>
        </View>
      </View>

      <View style={styles.filtersWrap}>
        <FlatList
          horizontal
          data={DIET_FILTERS}
          keyExtractor={(f) => f.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const active = dietFilter === item.value;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.accent : colors.surface,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setDietFilter(item.value)}
              >
                <Text style={[styles.filterChipText, { color: active ? '#FFF' : colors.textSecondary }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <FlatList
          horizontal
          data={CALORIE_FILTERS}
          keyExtractor={(f) => f.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const active = calorieFilter === item.value;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.accent : colors.surface,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setCalorieFilter(item.value)}
              >
                <Text style={[styles.filterChipText, { color: active ? '#FFF' : colors.textSecondary }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PlanCard item={item} colors={colors} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          onEndReachedThreshold={0.5}
          onEndReached={onEndReached}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No public plans yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try another filter or check back later.</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing.md }} /> : <View style={{ height: Spacing.xl }} />
          }
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={8}
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
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  filtersWrap: {
    paddingTop: Spacing.sm,
  },
  filterList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  filterChipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    paddingBottom: Spacing['2xl'],
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  topRightWrap: {
    alignItems: 'flex-end',
    gap: 6,
  },
  aiIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
  },
  publicBadge: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  publicBadgeText: {
    fontSize: 11,
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
  metaDot: {
    fontSize: Typography.fontSize.base,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  },
});
