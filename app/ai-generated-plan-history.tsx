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
import { usePlannerStore } from '../src/store/plannerStore';
import { useRecipeStore } from '../src/store/recipeStore';
import { Toast } from '../src/components/Toast';
import { useToast } from '../src/hooks/useToast';
import { DayOfWeek, MealType } from '../src/types';
import { getRecipeByIdFromSource } from '../src/services/searchService';
import { getDailyNutritionTargets, getExceededTargetKeys, sumNutritionFromRecipes } from '../src/utils/plannerNutrition';
import {
  getUploadedUserAiDietPlansPage,
  getUserAiDietPlanMealsPage,
  SavedAiDietPlan,
  SavedAiDietPlanMeal,
} from '../src/services/aiPlanSupabaseService';

const PAGE_SIZE = 14;

const SLOT_COLORS: Record<string, string> = {
  Breakfast: '#F59E0B',
  Lunch: '#22C55E',
  Snack: '#8B5CF6',
  Dinner: '#3B82F6',
};

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
  onAddToPlanner,
  adding,
}: {
  item: SavedAiDietPlan;
  colors: any;
  compact: boolean;
  onPress: () => void;
  onAddToPlanner: () => void;
  adding: boolean;
}) {
  const totalSlots = item.diet_plan_meals?.length ?? 0;
  const totalDays = item.days ?? 0;
  const mealCounts = (item.diet_plan_meals ?? []).reduce(
    (acc, meal) => {
      if (meal.meal_type in acc) acc[meal.meal_type as keyof typeof acc] += 1;
      return acc;
    },
    {
      Breakfast: 0,
      Lunch: 0,
      Snack: 0,
      Dinner: 0,
    }
  );

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
          <View style={[styles.publicBadge, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '55' }]}>
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
        <View style={[styles.statPill, { backgroundColor: colors.accent + '16', borderColor: colors.accent + '55' }]}> 
          <Text style={[styles.statLabel, { color: colors.accent }]}>Calories</Text>
          <Text style={[styles.statValue, { color: colors.accent }]}>{item.total_calories} kcal</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: '#3B82F615', borderColor: '#3B82F655' }]}> 
          <Text style={[styles.statLabel, { color: '#3B82F6' }]}>Protein</Text>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{item.total_protein} g</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: '#22C55E15', borderColor: '#22C55E55' }]}> 
          <Text style={[styles.statLabel, { color: '#22C55E' }]}>Slots</Text>
          <Text style={[styles.statValue, { color: '#22C55E' }]}>{totalSlots}</Text>
        </View>
      </View>

      <View style={[styles.slotBreakdown, { borderTopColor: colors.border }]}> 
        <Text style={[styles.slotBreakdownTitle, { color: colors.textTertiary }]}>Meal slots</Text>
        <View style={styles.slotPillRow}>
          {Object.entries(mealCounts).map(([label, count]) => (
            <View key={label} style={[styles.slotPill, { backgroundColor: (SLOT_COLORS[label] ?? colors.accent) + '14', borderColor: (SLOT_COLORS[label] ?? colors.accent) + '60' }]}> 
              <Text style={[styles.slotPillText, { color: SLOT_COLORS[label] ?? colors.accent }]}>{label.slice(0, 1)}</Text>
              <Text style={[styles.slotPillValue, { color: SLOT_COLORS[label] ?? colors.accent }]}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onAddToPlanner();
        }}
        style={({ pressed }) => [
          styles.addPlanBtn,
          { backgroundColor: colors.accent },
          pressed && styles.cardPressed,
        ]}
      >
        {adding ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Ionicons name="calendar-outline" size={16} color="#FFF" />
            <Text style={styles.addPlanBtnText}>Add to Planner</Text>
          </>
        )}
      </Pressable>
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
  const plannerMeals = usePlannerStore((s) => s.meals);
  const addMeal = usePlannerStore((s) => s.addMeal);
  const { getRecipeById } = useRecipeStore();
  const { toast, showToast } = useToast();

  const [items, setItems] = useState<SavedAiDietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [addingPlanId, setAddingPlanId] = useState<string | null>(null);
  const listTransition = useState(() => new Animated.Value(1))[0];
  const nutritionTargets = getDailyNutritionTargets(profile);

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

  const handleAddPlanFromHistory = useCallback(async (plan: SavedAiDietPlan) => {
    if (!profile?.id) {
      showToast('Please login to add plans to planner.', 'error', 'Login required');
      return;
    }

    setAddingPlanId(plan.id);
    try {
      let planMeals = plan.diet_plan_meals ?? [];
      if (planMeals.length === 0) {
        const all: SavedAiDietPlanMeal[] = [];
        let offset = 0;
        let hasMoreMeals = true;
        while (hasMoreMeals) {
          const page = await getUserAiDietPlanMealsPage(profile.id, plan.id, { offset, limit: 100 });
          all.push(...page.items);
          hasMoreMeals = page.hasMore && page.items.length > 0;
          offset += page.items.length;
        }
        planMeals = all;
      }

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
        <ActivityIndicator color={colors.textSecondary} style={{ marginTop: Spacing['2xl'] }} />
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
                  adding={addingPlanId === item.id}
                  onAddToPlanner={() => handleAddPlanFromHistory(item)}
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
                <ActivityIndicator color={colors.textSecondary} style={{ marginTop: Spacing.md }} />
              ) : (
                <View style={{ height: Spacing.xl }} />
              )
            }
          />
        </Animated.View>
      )}

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        title={toast.title}
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
    borderWidth: 1,
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
    borderWidth: 1,
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
  addPlanBtn: {
    marginTop: 2,
    borderRadius: BorderRadius.full,
    paddingVertical: 11,
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
