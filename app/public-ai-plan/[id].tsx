import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/useTheme';
import { BorderRadius, Shadow, Spacing, Typography } from '../../src/theme';
import { getPublicAiDietPlanById, PublicAiDietPlanCard } from '../../src/services/aiPlanSupabaseService';
import { useUserStore } from '../../src/store/userStore';
import { usePlannerStore } from '../../src/store/plannerStore';
import { useRecipeStore } from '../../src/store/recipeStore';
import { useToast } from '../../src/hooks/useToast';
import { Toast } from '../../src/components/Toast';
import { DayOfWeek, MealType } from '../../src/types';
import { getRecipeByIdFromSource } from '../../src/services/searchService';
import { getDailyNutritionTargets, getExceededTargetKeys, sumNutritionFromRecipes } from '../../src/utils/plannerNutrition';

function toPlannerDay(value: string): DayOfWeek {
  const labels: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(`${value}T12:00:00Z`);
  return labels[d.getUTCDay()] ?? 'Mon';
}

function normalizePlanMealsForPlanner(meals: NonNullable<PublicAiDietPlanCard['diet_plan_meals']>) {
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

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return value;
  }
}

export default function PublicAiPlanDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const profile = useUserStore((s) => s.profile);
  const plannerMeals = usePlannerStore((s) => s.meals);
  const addMeal = usePlannerStore((s) => s.addMeal);
  const { getRecipeById } = useRecipeStore();
  const { toast, showToast } = useToast();
  const nutritionTargets = getDailyNutritionTargets(profile);
  const params = useLocalSearchParams<{ id?: string }>();
  const planId = typeof params.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PublicAiDietPlanCard | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!planId) {
      setPlan(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getPublicAiDietPlanById(planId)
      .then(setPlan)
      .finally(() => setLoading(false));
  }, [planId]);

  const stats = useMemo(() => {
    const calories = plan?.plan_calories ?? plan?.total_calories ?? 0;
    const protein = plan?.total_protein ?? 0;
    const days = plan?.days ?? 0;
    return { calories, protein, days };
  }, [plan]);

  const handleAddPlan = async () => {
    if (!profile?.id) {
      showToast('Please login to add plans to planner.', 'error', 'Login required');
      return;
    }
    if (!plan) return;

    const planMeals = plan.diet_plan_meals ?? [];
    if (planMeals.length === 0) {
      showToast('No meal slots found in this plan.', 'error', 'Nothing to add');
      return;
    }

    setAdding(true);
    try {
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
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Ai diet plan</Text>
        </View>
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Plan not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Ai diet plan</Text>
      </View>

      <FlatList
        data={plan.diet_plan_meals ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }, Shadow.sm]}>
            <Text style={[styles.planTitle, { color: colors.text }]}>{plan.title}</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>By {plan.source_label} · {formatDate(plan.created_at)}</Text>

            <View style={styles.metaRow}>
              <Text style={[styles.metaPill, { backgroundColor: colors.accentLight, color: colors.accent }]}>{plan.plan_diet_type ?? plan.diet_type ?? 'mixed'}</Text>
              <Text style={[styles.metaPill, { backgroundColor: colors.accentLight, color: colors.accent }]}>{stats.days} days</Text>
              <Text style={[styles.metaPill, { backgroundColor: colors.accentLight, color: colors.accent }]}>{plan.goal?.replace(/_/g, ' ') ?? 'goal'}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statTile, { backgroundColor: colors.background }]}> 
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Calories</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.calories} kcal</Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: colors.background }]}> 
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Protein</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.protein} g</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.addPlanBtn, { backgroundColor: colors.accent }]}
              onPress={handleAddPlan}
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
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.mealCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.mealTopRow}>
              <Text style={[styles.mealType, { color: colors.accent }]}>{item.meal_type}</Text>
              <Text style={[styles.mealDate, { color: colors.textSecondary }]}>{formatDate(item.day)}</Text>
            </View>
            <Text style={[styles.mealMeta, { color: colors.textSecondary }]}>Source: {item.recipe_source}</Text>
            <Text style={[styles.mealMeta, { color: colors.textSecondary }]}>Servings: {item.servings}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No meals available</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>This public plan has no visible meal slots.</Text>
          </View>
        }
      />
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
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  planCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  planTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  subText: {
    fontSize: Typography.fontSize.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  metaPill: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statTile: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
  },
  statValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    marginTop: 2,
  },
  addPlanBtn: {
    marginTop: 4,
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
  mealCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 4,
  },
  mealTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealType: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
  },
  mealDate: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  mealMeta: {
    fontSize: Typography.fontSize.sm,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['3xl'],
    gap: 6,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: Typography.fontSize.base,
  },
});
