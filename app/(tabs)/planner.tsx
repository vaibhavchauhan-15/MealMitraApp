import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '../../src/theme';
import { usePlannerStore } from '../../src/store/plannerStore';
import { useGroceryStore } from '../../src/store/groceryStore';
import { useRecipeStore } from '../../src/store/recipeStore';
import { DayOfWeek, MealType } from '../../src/types';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const MEAL_ICONS: Record<MealType, string> = {
  Breakfast: '☀️',
  Lunch: '🌤️',
  Dinner: '🌙',
  Snack: '☕',
};

export default function PlannerScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Mon');
  const { meals, removeMeal, clearWeek, getMealsForDay } = usePlannerStore();
  const { addItems } = useGroceryStore();
  const { getRecipeById, recipes } = useRecipeStore();

  const dayMeals = getMealsForDay(selectedDay);

  const generateGroceryList = () => {
    const allIds = [...new Set(meals.map((m) => m.recipeId))];
    const ingredients = allIds.flatMap((id) => {
      const r = getRecipeById(id);
      return r ? r.ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        recipeId: id,
      })) : [];
    });
    addItems(ingredients);
    router.push('/grocery' as any);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Meal Planner</Text>
        <View style={styles.headerActions}>
          {meals.length > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surface }]}
              onPress={() =>
                Alert.alert('Clear Week', 'Remove all planned meals?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: clearWeek },
                ])
              }
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          )}
          {meals.length > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              onPress={generateGroceryList}
            >
              <Ionicons name="cart-outline" size={18} color="#FFF" />
              <Text style={styles.groceryBtnText}>Grocery List</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Day Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelectorContainer}>
        <View style={styles.daySelector}>
          {DAYS.map((day) => {
            const count = getMealsForDay(day).length;
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayBtn,
                  {
                    backgroundColor: selectedDay === day ? colors.accent : colors.surface,
                  },
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: selectedDay === day ? '#FFF' : colors.text },
                  ]}
                >
                  {day}
                </Text>
                {count > 0 && (
                  <View style={[styles.dayDot, { backgroundColor: selectedDay === day ? '#FFF' : colors.accent }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Meal Slots */}
      <ScrollView
        contentContainerStyle={styles.mealsContent}
        showsVerticalScrollIndicator={false}
      >
        {MEAL_TYPES.map((mealType) => {
          const mealEntries = dayMeals.filter((m) => m.mealType === mealType);

          return (
            <View key={mealType} style={[styles.mealSlot, { backgroundColor: colors.surface }]}>
              <View style={styles.mealSlotHeader}>
                <Text style={styles.mealIcon}>{MEAL_ICONS[mealType]}</Text>
                <Text style={[styles.mealTypeText, { color: colors.text }]}>{mealType}</Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/add-to-planner',
                      params: { day: selectedDay, mealType },
                    } as any)
                  }
                  style={[styles.addBtn, { backgroundColor: colors.accentLight }]}
                >
                  <Ionicons name="add" size={18} color={colors.accent} />
                </TouchableOpacity>
              </View>

              {mealEntries.length === 0 ? (
                <TouchableOpacity
                  style={[styles.emptySlot, { borderColor: colors.border }]}
                  onPress={() =>
                    router.push({
                      pathname: '/add-to-planner',
                      params: { day: selectedDay, mealType },
                    } as any)
                  }
                >
                  <Text style={[styles.emptySlotText, { color: colors.textTertiary }]}>
                    + Add {mealType.toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ) : (
                mealEntries.map((entry) => {
                  const recipe = getRecipeById(entry.recipeId);
                  if (!recipe) return null;
                  return (
                    <TouchableOpacity
                      key={entry.id}
                      style={[styles.mealEntry, { ...Shadow.sm, backgroundColor: colors.card }]}
                      onPress={() => router.push(`/recipe/${recipe.id}` as any)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.mealEntryName, { color: colors.text }]} numberOfLines={1}>
                          {recipe.name}
                        </Text>
                        <Text style={[styles.mealEntrySub, { color: colors.textSecondary }]}>
                          {recipe.cook_time} min · {recipe.calories} kcal · {entry.servings} servings
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeMeal(entry.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle-outline" size={20} color={colors.textTertiary} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          );
        })}
        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  groceryBtnText: {
    color: '#FFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  daySelectorContainer: {
    maxHeight: 64,
    marginBottom: Spacing.sm,
  },
  daySelector: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dayBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    minWidth: 60,
  },
  dayText: {
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 3,
  },
  mealsContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  mealSlot: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  mealSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mealIcon: { fontSize: 18 },
  mealTypeText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlot: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  emptySlotText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  mealEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  mealEntryName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  mealEntrySub: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
});
