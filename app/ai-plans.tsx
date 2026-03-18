import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/useTheme';
import { BorderRadius, Shadow, Spacing, Typography } from '../src/theme';
import { SearchBar } from '../src/components/SearchBar';
import {
  getPublicAiDietPlanById,
  getPublicAiDietPlansPage,
  PublicAiDietPlanCard,
  SavedAiDietPlanMeal,
} from '../src/services/aiPlanSupabaseService';
import { useLocalRecentSearches } from '../src/hooks/useLocalRecentSearches';
import { useUserStore } from '../src/store/userStore';
import { usePlannerStore } from '../src/store/plannerStore';
import { useRecipeStore } from '../src/store/recipeStore';
import { useToast } from '../src/hooks/useToast';
import { Toast } from '../src/components/Toast';
import { DayOfWeek, MealType } from '../src/types';
import { getRecipeByIdFromSource } from '../src/services/searchService';
import { getDailyNutritionTargets, getExceededTargetKeys, sumNutritionFromRecipes } from '../src/utils/plannerNutrition';

const PAGE_SIZE = 16;
const MAX_RESULTS = 30;

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

function toPlannerDay(value: string): DayOfWeek {
  const labels: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(`${value}T12:00:00Z`);
  return labels[d.getUTCDay()] ?? 'Mon';
}

function normalizePlanMealsForPlanner(meals: SavedAiDietPlanMeal[]) {
  const bySlot = new Map<string, { day: DayOfWeek; mealType: MealType; recipeId: string; recipeSource: 'master' | 'ai'; servings: number }>();

  meals.forEach((meal) => {
    const day = toPlannerDay(meal.day);
    const mealType = meal.meal_type as MealType;
    const key = `${day}-${mealType}`;
    bySlot.set(key, {
      day,
      mealType,
      recipeId: meal.recipe_id,
      recipeSource: (meal.recipe_source ?? 'master') as 'master' | 'ai',
      servings: meal.servings ?? 1,
    });
  });

  return Array.from(bySlot.values());
}

function PlanCard({
  item,
  colors,
  onPress,
  onAddToPlanner,
  adding,
}: {
  item: PublicAiDietPlanCard;
  colors: any;
  onPress: () => void;
  onAddToPlanner: () => void;
  adding: boolean;
}) {
  const kcal = item.plan_calories ?? item.total_calories;
  const protein = item.total_protein;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, Shadow.sm]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <View style={styles.cardTopRow}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
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
        <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{item.source_label}</Text>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="nutrition-outline" size={13} color={colors.textTertiary} />
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.plan_diet_type ?? item.diet_type ?? 'Mixed'}</Text>
        <Text style={[styles.metaDot, { color: colors.textTertiary }]}>·</Text>
        <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.days ?? 7} days</Text>
      </View>

      {!!item.goal && (
        <View style={styles.metaRow}>
          <Ionicons name="flag-outline" size={13} color={colors.textTertiary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.goal.replace(/_/g, ' ')}</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={[styles.statPill, { backgroundColor: colors.accent + '16', borderColor: colors.accent + '50' }]}> 
          <Text style={[styles.statLabel, { color: colors.accent }]}>Calories</Text>
          <Text style={[styles.statValue, { color: colors.accent }]}>{kcal ?? '-'} kcal</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: '#3B82F615', borderColor: '#3B82F655' }]}> 
          <Text style={[styles.statLabel, { color: '#3B82F6' }]}>Protein</Text>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{protein ?? '-'} g</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.addPlanBtn, { backgroundColor: colors.accent }]}
        onPress={(e) => {
          e.stopPropagation();
          onAddToPlanner();
        }}
        disabled={adding}
        activeOpacity={0.88}
      >
        {adding ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Ionicons name="calendar-outline" size={16} color="#FFF" />
            <Text style={styles.addPlanBtnText}>Add Plan</Text>
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function AiPlansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const profile = useUserStore((s) => s.profile);
  const plannerMeals = usePlannerStore((s) => s.meals);
  const addMeal = usePlannerStore((s) => s.addMeal);
  const { getRecipeById } = useRecipeStore();
  const { toast, showToast } = useToast();
  const nutritionTargets = getDailyNutritionTargets(profile);

  const [items, setItems] = useState<PublicAiDietPlanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'trending' | 'recently_active'>('trending');
  const [dietFilter, setDietFilter] = useState<string | undefined>(undefined);
  const [calorieFilter, setCalorieFilter] = useState<number | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [addingPlanId, setAddingPlanId] = useState<string | null>(null);
  const queryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = useLocalRecentSearches('recent_ai_diet_plan_searches');

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((v) => !v);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sortBy !== 'trending') count += 1;
    if (dietFilter) count += 1;
    if (typeof calorieFilter === 'number') count += 1;
    return count;
  }, [sortBy, dietFilter, calorieFilter]);

  const fetchPage = useCallback(async (offset: number, reset: boolean) => {
    const page = await getPublicAiDietPlansPage({
      offset,
      limit: PAGE_SIZE,
      maxResults: MAX_RESULTS,
      sortBy,
      titleQuery: query,
      dietType: dietFilter,
      maxCalories: calorieFilter,
    });
    setHasMore(page.hasMore);
    if (reset) {
      setItems(page.items);
    } else {
      setItems((prev) => [...prev, ...page.items]);
    }
  }, [query, sortBy, dietFilter, calorieFilter]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      await fetchPage(0, true);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    if (queryDebounceRef.current) clearTimeout(queryDebounceRef.current);

    queryDebounceRef.current = setTimeout(() => {
      loadInitial();
    }, 250);

    return () => {
      if (queryDebounceRef.current) clearTimeout(queryDebounceRef.current);
    };
  }, [loadInitial]);

  useEffect(() => {
    if (saveSearchDebounceRef.current) clearTimeout(saveSearchDebounceRef.current);

    const normalized = query.trim();
    if (!normalized) return;

    saveSearchDebounceRef.current = setTimeout(() => {
      void addRecentSearch(normalized);
    }, 900);

    return () => {
      if (saveSearchDebounceRef.current) clearTimeout(saveSearchDebounceRef.current);
    };
  }, [query, addRecentSearch]);

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

  const handleAddPlan = useCallback(async (planId: string) => {
    if (!profile?.id) {
      showToast('Please login to add plans to planner.', 'error', 'Login required');
      return;
    }

    setAddingPlanId(planId);
    try {
      const fullPlan = await getPublicAiDietPlanById(planId);
      const planMeals = fullPlan?.diet_plan_meals ?? [];

      if (planMeals.length === 0) {
        showToast('No meal slots found in this plan.', 'error', 'Nothing to add');
        return;
      }

      const normalized = normalizePlanMealsForPlanner(planMeals);
      const existingBySlot = new Map(plannerMeals.map((m) => [`${m.day}-${m.mealType}`, m]));

      const isDuplicatePlan =
        normalized.length > 0 &&
        normalized.every((slot) => {
          const existing = existingBySlot.get(`${slot.day}-${slot.mealType}`);
          return (
            !!existing &&
            existing.recipeId === slot.recipeId &&
            (existing.recipeSource ?? 'master') === slot.recipeSource
          );
        });

      if (isDuplicatePlan) {
        showToast('This plan already exists in your planner.', 'error', 'Duplicate plan');
        return;
      }

      if (nutritionTargets) {
        const planByDay = new Map<DayOfWeek, typeof normalized>();
        normalized.forEach((slot) => {
          if (!planByDay.has(slot.day)) planByDay.set(slot.day, []);
          planByDay.get(slot.day)!.push(slot);
        });

        const exceededDays: string[] = [];
        const labelMap: Record<string, string> = {
          calories: 'Calories',
          protein: 'Protein',
          carbs: 'Carbs',
          fat: 'Fat',
          fiber: 'Fiber',
        };

        for (const [day, slots] of planByDay.entries()) {
          const incomingSlotKeys = new Set(slots.map((slot) => `${slot.day}-${slot.mealType}`));
          const existingForDay = plannerMeals.filter(
            (m) => m.day === day && !incomingSlotKeys.has(`${m.day}-${m.mealType}`)
          );
          const existingRecipes = await Promise.all(
            existingForDay.map(async (meal) => {
              const cached = getRecipeById(meal.recipeId);
              if (cached) return cached;
              return getRecipeByIdFromSource(meal.recipeId, meal.recipeSource ?? 'master');
            })
          );

          const incomingRecipes = await Promise.all(
            slots.map(async (slot) => {
              const cached = getRecipeById(slot.recipeId);
              if (cached) return cached;
              return getRecipeByIdFromSource(slot.recipeId, slot.recipeSource);
            })
          );

          const totals = sumNutritionFromRecipes([...existingRecipes, ...incomingRecipes]);
          const exceeded = getExceededTargetKeys(totals, nutritionTargets);
          if (exceeded.length > 0) {
            exceededDays.push(`${day} (${exceeded.map((k) => labelMap[k]).join(', ')})`);
          }
        }

        if (exceededDays.length > 0) {
          showToast(`Plan exceeds target on: ${exceededDays.join(' · ')}`, 'error', 'Target exceeded');
          return;
        }
      }

      normalized.forEach((slot) => {
        addMeal(slot.day, slot.mealType, slot.recipeId, slot.servings, slot.recipeSource);
      });
      showToast(`Added ${normalized.length} meal slots to planner.`, 'success', 'Plan added');
    } catch (e: any) {
      showToast(e?.message ?? 'Failed to add this plan to planner.', 'error', 'Add failed');
    } finally {
      setAddingPlanId(null);
    }
  }, [addMeal, getRecipeById, nutritionTargets, plannerMeals, profile?.id, showToast]);

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
          <Text style={[styles.title, { color: colors.text }]}>Ai diet plans</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Fast, filterable, and community powered</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchGrow}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search by plan title, diet, goal..."
          />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: showFilters ? colors.accentLight : colors.surface }]}
          onPress={toggleFilters}
        >
          <Ionicons name="options-outline" size={18} color={showFilters ? colors.accent : colors.text} />
          {activeFilterCount > 0 && <View style={[styles.filterDot, { backgroundColor: colors.accent }]} />}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.surface }]}> 
          <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Sort</Text>
          <View style={styles.filterRowWrap}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: sortBy === 'trending' ? colors.accent : colors.background,
                  borderColor: sortBy === 'trending' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSortBy('trending')}
            >
              <Text style={[styles.filterChipText, { color: sortBy === 'trending' ? '#FFF' : colors.textSecondary }]}>Trending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: sortBy === 'recently_active' ? colors.accent : colors.background,
                  borderColor: sortBy === 'recently_active' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSortBy('recently_active')}
            >
              <Text style={[styles.filterChipText, { color: sortBy === 'recently_active' ? '#FFF' : colors.textSecondary }]}>Recently active</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Diet</Text>
          <View style={styles.filterRowWrap}>
            {DIET_FILTERS.map((item) => {
              const active = dietFilter === item.value;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? colors.accent : colors.background,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setDietFilter(item.value)}
                >
                  <Text style={[styles.filterChipText, { color: active ? '#FFF' : colors.textSecondary }]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Calories</Text>
          <View style={styles.filterRowWrap}>
            {CALORIE_FILTERS.map((item) => {
              const active = calorieFilter === item.value;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? colors.accent : colors.background,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setCalorieFilter(item.value)}
                >
                  <Text style={[styles.filterChipText, { color: active ? '#FFF' : colors.textSecondary }]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {recentSearches.length > 0 && !query.trim() && (
        <View style={styles.recentWrap}>
          <View style={styles.recentHeadRow}>
            <Text style={[styles.recentTitle, { color: colors.textSecondary }]}>Recent searches</Text>
            <TouchableOpacity onPress={() => void clearRecentSearches()}>
              <Text style={[styles.clearText, { color: colors.accent }]}>Clear</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={recentSearches}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setQuery(item)}
              >
                <Text style={[styles.filterChipText, { color: colors.textSecondary }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlanCard
              item={item}
              colors={colors}
              adding={addingPlanId === item.id}
              onAddToPlanner={() => void handleAddPlan(item.id)}
              onPress={() =>
                router.push({
                  pathname: '/public-ai-plan/[id]',
                  params: { id: item.id },
                } as any)
              }
            />
          )}
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
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        title={toast.title}
        onHide={toast.hide}
      />
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
  searchRow: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchGrow: {
    flex: 1,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  filtersPanel: {
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  filterGroupLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  filterRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
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
  recentWrap: {
    paddingTop: Spacing.sm,
  },
  recentHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
  },
  recentTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  clearText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  recentList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
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
    borderWidth: 1,
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
  addPlanBtn: {
    marginTop: 2,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addPlanBtnText: {
    color: '#FFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
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
