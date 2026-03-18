import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/useTheme';
import { BorderRadius, Shadow, Spacing, Typography, Motion } from '../../src/theme';
import { useUserStore } from '../../src/store/userStore';
import {
  getUserAiDietPlanById,
  getUserAiDietPlanMealsPage,
  SavedAiDietPlan,
  SavedAiDietPlanMeal,
} from '../../src/services/aiPlanSupabaseService';
import { getRecipeByIdFromSource } from '../../src/services/searchService';
import { Recipe } from '../../src/types';
import { FallbackImage } from '../../src/components/FallbackImage';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PAGE_SIZE = 20;
const MEAL_COLORS: Record<string, string> = {
  Breakfast: '#F59E0B',
  Lunch: '#22C55E',
  Snack: '#8B5CF6',
  Dinner: '#3B82F6',
};

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

interface MealWithRecipe {
  meal: SavedAiDietPlanMeal;
  recipe: Recipe | null;
}

interface CloudPlanMealRow {
  key: string;
  day: string;
  dayLabel: string;
  mealType: string;
  recipeName: string;
  quantity: string;
}

const MEAL_KEY_ORDER: Array<{ key: keyof SavedAiDietPlan['plan_data']; mealType: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner' }> = [
  { key: 'breakfast', mealType: 'Breakfast' },
  { key: 'lunch', mealType: 'Lunch' },
  { key: 'snacks', mealType: 'Snack' },
  { key: 'dinner', mealType: 'Dinner' },
];

function toDayLabel(value: string) {
  const d = new Date(`${value}T12:00:00Z`);
  return DAY_LABELS[d.getUTCDay()] ?? value;
}

function toPrettyDate(value: string) {
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

function normalizeDayLabel(value: string): string {
  if (!value) return 'Plan';
  if (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].includes(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return toDayLabel(value);
  return value.slice(0, 3);
}

export default function AiGeneratedPlanDetailScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const isCompact = width <= 360 || height <= 720;
  const params = useLocalSearchParams<{ id?: string }>();
  const profile = useUserStore((s) => s.profile);

  const [plan, setPlan] = useState<SavedAiDietPlan | null>(null);
  const [rows, setRows] = useState<MealWithRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const contentTransition = useState(() => new Animated.Value(1))[0];

  const load = useCallback(async () => {
    if (!profile?.id) {
      setError('Please login to view plan details.');
      return;
    }

    const planId = String(params.id ?? '');
    if (!planId) {
      setError('Invalid plan id.');
      return;
    }

    const header = await getUserAiDietPlanById(profile.id, planId);
    if (!header) {
      setError('Plan not found.');
      setPlan(null);
      setRows([]);
      setHasMore(false);
      return;
    }

    setPlan(header);
    setRows([]);

    const page = await getUserAiDietPlanMealsPage(profile.id, planId, {
      offset: 0,
      limit: PAGE_SIZE,
    });

    const resolved = await Promise.all(
      page.items.map(async (meal) => {
        const recipe = await getRecipeByIdFromSource(meal.recipe_id, meal.recipe_source ?? 'master');
        return { meal, recipe } satisfies MealWithRecipe;
      })
    );

    setRows(resolved);
    setHasMore(page.hasMore);
    setError('');
  }, [params.id, profile?.id]);

  const loadMoreMeals = useCallback(async () => {
    if (!profile?.id || !params.id || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const page = await getUserAiDietPlanMealsPage(profile.id, String(params.id), {
        offset: rows.length,
        limit: PAGE_SIZE,
      });

      const resolved = await Promise.all(
        page.items.map(async (meal) => {
          const recipe = await getRecipeByIdFromSource(meal.recipe_id, meal.recipe_source ?? 'master');
          return { meal, recipe } satisfies MealWithRecipe;
        })
      );

      setRows((prev) => [...prev, ...resolved]);
      setHasMore(page.hasMore);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load more meal slots.');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, params.id, profile?.id, rows.length]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e: any) => setError(e?.message ?? 'Failed to load plan details.'))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    contentTransition.setValue(0.9);
    Animated.timing(contentTransition, {
      toValue: 1,
      duration: Motion.TRANSITION_MEDIUM_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [rows.length, contentTransition]);

  const grouped = useMemo(() => {
    const groupedByDay = new Map<string, MealWithRecipe[]>();
    rows.forEach((row) => {
      const key = row.meal.day;
      if (!groupedByDay.has(key)) groupedByDay.set(key, []);
      groupedByDay.get(key)!.push(row);
    });

    return Array.from(groupedByDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, entries]) => ({
        day,
        dayLabel: toDayLabel(day),
        entries,
      }));
  }, [rows]);

  const sourceBreakdown = useMemo(() => {
    const master = rows.filter((row) => row.meal.recipe_source === 'master').length;
    const ai = rows.filter((row) => row.meal.recipe_source === 'ai').length;
    return { master, ai, total: rows.length };
  }, [rows]);

  const cloudPlanRows = useMemo<CloudPlanMealRow[]>(() => {
    if (!plan?.plan_data) return [];

    const rowsFromPlan: CloudPlanMealRow[] = [];
    const dailyPlans = (plan.plan_data as any).daily_plans as Record<string, any> | undefined;

    if (dailyPlans && typeof dailyPlans === 'object' && Object.keys(dailyPlans).length > 0) {
      Object.entries(dailyPlans).forEach(([dayKey, dayPlan]) => {
        const dayLabel = normalizeDayLabel(dayKey);
        MEAL_KEY_ORDER.forEach(({ key, mealType }) => {
          const items = Array.isArray(dayPlan?.[key]) ? dayPlan[key] : [];
          items.forEach((item: any, idx: number) => {
            rowsFromPlan.push({
              key: `${dayKey}-${mealType}-${idx}`,
              day: dayKey,
              dayLabel,
              mealType,
              recipeName: item?.name || 'Meal',
              quantity: item?.quantity || '-',
            });
          });
        });
      });
      return rowsFromPlan;
    }

    const fallbackDay = (plan.plan_data as any).selected_days?.[0] ?? 'Plan';
    const dayLabel = normalizeDayLabel(String(fallbackDay));
    MEAL_KEY_ORDER.forEach(({ key, mealType }) => {
      const items = Array.isArray((plan.plan_data as any)?.[key]) ? (plan.plan_data as any)[key] : [];
      items.forEach((item: any, idx: number) => {
        rowsFromPlan.push({
          key: `${fallbackDay}-${mealType}-${idx}`,
          day: String(fallbackDay),
          dayLabel,
          mealType,
          recipeName: item?.name || 'Meal',
          quantity: item?.quantity || '-',
        });
      });
    });

    return rowsFromPlan;
  }, [plan]);

  const cloudGrouped = useMemo(() => {
    const byDay = new Map<string, CloudPlanMealRow[]>();
    cloudPlanRows.forEach((row) => {
      if (!byDay.has(row.day)) byDay.set(row.day, []);
      byDay.get(row.day)!.push(row);
    });
    return Array.from(byDay.entries()).map(([day, entries]) => ({
      day,
      dayLabel: entries[0]?.dayLabel ?? normalizeDayLabel(day),
      entries,
    }));
  }, [cloudPlanRows]);

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
          <Text style={[styles.title, isCompact && styles.titleCompact, { color: colors.text }]} numberOfLines={1}>Plan Details</Text>
          <Text style={[styles.subtitle, isCompact && styles.subtitleCompact, { color: colors.textSecondary }]} numberOfLines={1}>
            {plan?.title ?? 'Uploaded AI plan'}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      ) : error ? (
        <View style={styles.centerWrap}>
          <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
        </View>
      ) : !plan ? (
        <View style={styles.centerWrap}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No plan found.</Text>
        </View>
      ) : (
        <Animated.ScrollView
          contentContainerStyle={[styles.content, isCompact && styles.contentCompact]}
          style={{
            opacity: contentTransition,
            transform: [
              {
                translateY: contentTransition.interpolate({
                  inputRange: [0.9, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          }}
        >
          <View style={[styles.summaryCard, isCompact && styles.summaryCardCompact, { backgroundColor: colors.surface, borderColor: colors.border }, Shadow.sm]}>
            <Text style={[styles.summaryTitle, isCompact && styles.summaryTitleCompact, { color: colors.text }]}>{plan.title}</Text>
            <Text style={[styles.summaryLine, { color: colors.textSecondary }]}>Created: {toPrettyDate(plan.created_at)}</Text>
            <Text style={[styles.summaryLine, { color: colors.textSecondary }]}>Goal: {plan.goal?.replace(/_/g, ' ') || 'custom'}</Text>
            <View style={styles.nutritionRow}>
              <View style={[styles.nutritionPill, { backgroundColor: colors.accent + '16', borderColor: colors.accent + '55' }]}>
                <Text style={[styles.nutritionLabel, { color: colors.accent }]}>Calories</Text>
                <Text style={[styles.nutritionValue, { color: colors.accent }]}>{plan.total_calories} kcal</Text>
              </View>
              <View style={[styles.nutritionPill, { backgroundColor: '#3B82F615', borderColor: '#3B82F655' }]}>
                <Text style={[styles.nutritionLabel, { color: '#3B82F6' }]}>Protein</Text>
                <Text style={[styles.nutritionValue, { color: '#3B82F6' }]}>{plan.total_protein} g</Text>
              </View>
            </View>
            <View style={[styles.breakdownRow, { backgroundColor: colors.background }]}> 
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Match Source Breakdown</Text>
              <Text style={[styles.breakdownValue, { color: '#22C55E' }]}>Master {sourceBreakdown.master}</Text>
              <Text style={[styles.breakdownDot, { color: colors.textTertiary }]}>·</Text>
              <Text style={[styles.breakdownValue, { color: colors.accent }]}>AI {sourceBreakdown.ai}</Text>
              <Text style={[styles.breakdownDot, { color: colors.textTertiary }]}>·</Text>
              <Text style={[styles.breakdownValue, { color: '#8B5CF6' }]}>Total {sourceBreakdown.total}</Text>
            </View>
          </View>

          {(rows.length > 0 ? grouped : []).map((dayGroup, dayIndex) => (
            <StaggeredEntry
              key={dayGroup.day}
              delay={dayIndex * Motion.STAGGER_GROUP_MS}
              triggerKey={`${dayGroup.day}-${rows.length}`}
            >
              <View style={[styles.dayCard, isCompact && styles.dayCardCompact, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <Text style={[styles.dayTitle, isCompact && styles.dayTitleCompact, { color: colors.text }]}>
                  {dayGroup.dayLabel} · {toPrettyDate(dayGroup.day)}
                </Text>

                {dayGroup.entries.map(({ meal, recipe }, mealIndex) => (
                  <StaggeredEntry
                    key={meal.id}
                    delay={dayIndex * Motion.STAGGER_GROUP_MS + mealIndex * Motion.STAGGER_BASE_MS}
                    triggerKey={`${meal.id}-${rows.length}`}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        styles.mealRow,
                        { borderTopColor: colors.border },
                        pressed && styles.mealRowPressed,
                      ]}
                      onPress={() => {
                        if (!recipe) return;
                        router.push({
                          pathname: '/recipe/[id]',
                          params: { id: recipe.id, source: meal.recipe_source ?? 'master' },
                        } as any);
                      }}
                      disabled={!recipe}
                    >
                      <FallbackImage uri={recipe?.image ?? ''} style={styles.thumb} resizeMode="cover" />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.mealType, { color: MEAL_COLORS[meal.meal_type] ?? colors.accent }]}>{meal.meal_type}</Text>
                        <Text style={[styles.mealName, isCompact && styles.mealNameCompact, { color: colors.text }]} numberOfLines={2}>
                          {recipe?.name ?? 'Recipe unavailable'}
                        </Text>
                        <Text style={[styles.mealMeta, isCompact && styles.mealMetaCompact, { color: colors.textSecondary }]}>
                          {meal.recipe_source === 'master' ? 'Master recipe' : 'AI generated'} · Servings {meal.servings}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                    </Pressable>
                  </StaggeredEntry>
                ))}
              </View>
            </StaggeredEntry>
          ))}

          {rows.length === 0 && cloudGrouped.length > 0 && (
            <View style={[styles.dayCard, isCompact && styles.dayCardCompact, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[styles.dayTitle, isCompact && styles.dayTitleCompact, { color: colors.text }]}>Meals From Cloud Plan</Text>
              {cloudGrouped.map((dayGroup) => (
                <View key={dayGroup.day} style={[styles.cloudDayWrap, { borderTopColor: colors.border }]}>
                  <Text style={[styles.cloudDayTitle, { color: colors.textSecondary }]}>{dayGroup.dayLabel}</Text>
                  {dayGroup.entries.map((entry) => (
                    <View key={entry.key} style={[styles.cloudMealRow, { borderTopColor: colors.border }]}> 
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.mealType, { color: MEAL_COLORS[entry.mealType] ?? colors.accent }]}>{entry.mealType}</Text>
                        <Text style={[styles.mealName, isCompact && styles.mealNameCompact, { color: colors.text }]}>{entry.recipeName}</Text>
                        <Text style={[styles.mealMeta, isCompact && styles.mealMetaCompact, { color: colors.textSecondary }]}>{entry.quantity}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {hasMore && (
            <Pressable
              style={({ pressed }) => [
                styles.loadMoreBtn,
                { borderColor: colors.border, backgroundColor: colors.surface },
                pressed && styles.backBtnPressed,
              ]}
              onPress={loadMoreMeals}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Ionicons name="chevron-down-circle-outline" size={16} color={colors.accent} />
              )}
              <Text style={[styles.loadMoreText, { color: colors.text }]}>Load More Slots</Text>
            </Pressable>
          )}
        </Animated.ScrollView>
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
    opacity: 0.86,
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
  centerWrap: {
    marginTop: Spacing['3xl'],
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 4,
  },
  summaryCardCompact: {
    padding: Spacing.sm,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    marginBottom: 2,
  },
  summaryTitleCompact: {
    fontSize: Typography.fontSize.sm,
  },
  summaryLine: {
    fontSize: Typography.fontSize.sm,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  nutritionPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  nutritionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  nutritionValue: {
    marginTop: 2,
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
  },
  breakdownRow: {
    marginTop: 6,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  breakdownLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  breakdownValue: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  breakdownDot: {
    fontSize: Typography.fontSize.sm,
  },
  dayCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 4,
  },
  dayCardCompact: {
    padding: Spacing.sm,
  },
  dayTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    marginBottom: 2,
  },
  dayTitleCompact: {
    fontSize: Typography.fontSize.sm,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  mealRowPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.94,
  },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: BorderRadius.md,
  },
  mealType: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mealName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  mealNameCompact: {
    fontSize: Typography.fontSize.xs,
  },
  mealMeta: {
    fontSize: Typography.fontSize.xs,
  },
  mealMetaCompact: {
    fontSize: 11,
  },
  loadMoreBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  loadMoreText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  cloudDayWrap: {
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    gap: 4,
  },
  cloudDayTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  cloudMealRow: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 6,
  },
});
