import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Modal,
  Pressable,
} from 'react-native';
import { ConfirmModal } from '../../src/components/ConfirmModal';
import { AiDietPlannerModal } from '../../src/components/AiDietPlannerModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '../../src/theme';
import { usePlannerStore } from '../../src/store/plannerStore';
import { useGroceryStore } from '../../src/store/groceryStore';
import { useRecipeStore } from '../../src/store/recipeStore';
import { DayOfWeek, MealType } from '../../src/types';
import { FallbackImage } from '../../src/components/FallbackImage';

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
  const [showClearModal, setShowClearModal] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const [groceryDays, setGroceryDays] = useState<DayOfWeek[]>([...DAYS]);
  const { meals, removeMeal, clearWeek, getMealsForDay } = usePlannerStore();
  const { addItems } = useGroceryStore();
  const { getRecipeById, fetchById, addToCache } = useRecipeStore();

  const dayMeals = getMealsForDay(selectedDay);

  // Pre-load recipe data for all planned meals so getRecipeById works synchronously
  useEffect(() => {
    const refs = meals.map((m) => ({ id: m.recipeId, source: m.recipeSource ?? 'master' }));
    const uniqueRefs = Array.from(new Map(refs.map((r) => [`${r.source}:${r.id}`, r])).values());
    const missing = uniqueRefs.filter(({ id }) => !getRecipeById(id));
    if (missing.length === 0) return;
    Promise.all(missing.map(({ id, source }) => fetchById(id, source))).then((results) => {
      addToCache(results.filter(Boolean) as any[]);
    });
  }, [meals.length]);

  // Days that actually have meals planned
  const daysWithMeals = useMemo(
    () => DAYS.filter((d) => getMealsForDay(d).length > 0),
    [meals]
  );

  const openGroceryModal = () => {
    // Pre-select all days that have meals
    setGroceryDays([...daysWithMeals]);
    setShowGroceryModal(true);
  };

  const toggleGroceryDay = (day: DayOfWeek) => {
    setGroceryDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleAllDays = () => {
    setGroceryDays(
      groceryDays.length === daysWithMeals.length ? [] : [...daysWithMeals]
    );
  };

  const generateGroceryList = () => {
    const filteredMeals = meals.filter((m) => groceryDays.includes(m.day as DayOfWeek));
    const recipeIds = [...new Set(filteredMeals.map((m) => m.recipeId))];
    const ingredients = recipeIds.flatMap((id) => {
      const r = getRecipeById(id);
      return r ? r.ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        recipeId: id,
      })) : [];
    });
    addItems(ingredients);
    setShowGroceryModal(false);
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
              onPress={() => setShowClearModal(true)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          )}
          {meals.length > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              onPress={openGroceryModal}
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
                  const dietColor =
                    recipe.diet === 'Vegetarian' ? colors.veg
                    : recipe.diet === 'Vegan' ? colors.vegan
                    : recipe.diet === 'Non-Vegetarian' ? colors.nonVeg
                    : colors.warning;
                  return (
                    <TouchableOpacity
                      key={entry.id}
                      style={[styles.mealEntry, { ...Shadow.sm, backgroundColor: colors.card }]}
                      onPress={() => {
                        if ((entry.recipeSource ?? 'master') === 'master') {
                          router.push({
                            pathname: '/recipe/[id]',
                            params: { id: recipe.id, source: 'master' },
                          } as any);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <FallbackImage
                        uri={recipe.image}
                        style={styles.mealEntryImage}
                        resizeMode="cover"
                      />
                      <View style={styles.mealEntryBody}>
                        {/* Name */}
                        <Text style={[styles.mealEntryName, { color: colors.text }]} numberOfLines={1}>
                          {recipe.name}
                        </Text>
                        {/* Cuisine + Diet */}
                        <View style={styles.mealEntryBadgeRow}>
                          <Text style={[styles.mealEntryCuisine, { color: colors.textSecondary }]}>
                            {recipe.cuisine}
                          </Text>
                          <View style={[styles.mealEntryDietBadge, { backgroundColor: dietColor + '22', borderColor: dietColor }]}>
                            <View style={[styles.mealEntryDietDot, { backgroundColor: dietColor }]} />
                            <Text style={[styles.mealEntryDietText, { color: dietColor }]}>{recipe.diet}</Text>
                          </View>
                        </View>
                        {/* Time + Calories */}
                        <View style={styles.mealEntryMeta}>
                          <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
                          <Text style={[styles.mealEntryMetaText, { color: colors.textTertiary }]}>{recipe.cook_time} min</Text>
                          <Text style={[styles.mealEntryDotSep, { color: colors.textTertiary }]}>·</Text>
                          <Ionicons name="flame-outline" size={12} color={colors.textTertiary} />
                          <Text style={[styles.mealEntryMetaText, { color: colors.textTertiary }]}>{recipe.calories} kcal</Text>
                        </View>
                        {/* Nutrition row */}
                        <View style={styles.mealEntryNutrition}>
                          <View style={styles.mealEntryNutriChip}>
                            <Text style={[styles.mealEntryNutriVal, { color: '#3B82F6' }]}>{recipe.nutrition.protein}g</Text>
                            <Text style={[styles.mealEntryNutriLabel, { color: colors.textTertiary }]}>P</Text>
                          </View>
                          <View style={styles.mealEntryNutriChip}>
                            <Text style={[styles.mealEntryNutriVal, { color: '#F59E0B' }]}>{recipe.nutrition.carbs}g</Text>
                            <Text style={[styles.mealEntryNutriLabel, { color: colors.textTertiary }]}>C</Text>
                          </View>
                          <View style={styles.mealEntryNutriChip}>
                            <Text style={[styles.mealEntryNutriVal, { color: '#EF4444' }]}>{recipe.nutrition.fat}g</Text>
                            <Text style={[styles.mealEntryNutriLabel, { color: colors.textTertiary }]}>F</Text>
                          </View>
                          <View style={styles.mealEntryNutriChip}>
                            <Text style={[styles.mealEntryNutriVal, { color: '#22C55E' }]}>{recipe.nutrition.fiber}g</Text>
                            <Text style={[styles.mealEntryNutriLabel, { color: colors.textTertiary }]}>Fb</Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeMeal(entry.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.mealEntryRemove}
                      >
                        <Ionicons name="close-circle-outline" size={22} color={colors.textTertiary} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          );
        })}
        <View style={{ height: Spacing['3xl'] + 80 }} />
      </ScrollView>

      {/* Floating AI Diet Planner Button */}
      <TouchableOpacity
        style={[
          styles.aiFab,
          {
            backgroundColor: colors.accent,
            bottom: insets.bottom + 16,
            ...Shadow.md,
          },
        ]}
        onPress={() => setShowAiPlanner(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="sparkles" size={22} color="#FFF" />
        <Text style={styles.aiFabText}>AI Diet Plan</Text>
      </TouchableOpacity>

      {/* AI Diet Planner Modal */}
      <AiDietPlannerModal
        visible={showAiPlanner}
        onClose={() => setShowAiPlanner(false)}
      />

      <ConfirmModal
        visible={showClearModal}
        title="Clear Week"
        message="Remove all planned meals for the week?"
        confirmText="Clear"
        cancelText="Cancel"
        destructive
        icon="trash-outline"
        iconColor="#EF4444"
        onConfirm={() => {
          setShowClearModal(false);
          clearWeek();
        }}
        onCancel={() => setShowClearModal(false)}
      />

      {/* Grocery Day Selector Modal */}
      <Modal
        visible={showGroceryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroceryModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowGroceryModal(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.card }]} onPress={() => {}}>
            {/* Handle */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Grocery List</Text>
                <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                  Select days to include in the list
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowGroceryModal(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Select All toggle */}
            <TouchableOpacity
              style={[styles.selectAllRow, { borderColor: colors.border }]}
              onPress={toggleAllDays}
              activeOpacity={0.75}
            >
              <View style={[styles.checkbox,
                groceryDays.length === daysWithMeals.length
                  ? { backgroundColor: colors.accent, borderColor: colors.accent }
                  : { backgroundColor: 'transparent', borderColor: colors.border }
              ]}>
                {groceryDays.length === daysWithMeals.length && (
                  <Ionicons name="checkmark" size={13} color="#FFF" />
                )}
              </View>
              <Text style={[styles.selectAllText, { color: colors.text }]}>Select All Days</Text>
              <Text style={[styles.selectAllCount, { color: colors.textTertiary }]}>
                {groceryDays.length}/{daysWithMeals.length} days
              </Text>
            </TouchableOpacity>

            {/* Day chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayChipRow}
            >
              {DAYS.map((day) => {
                const count = getMealsForDay(day).length;
                const hasMeals = count > 0;
                const isSelected = groceryDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    disabled={!hasMeals}
                    onPress={() => toggleGroceryDay(day)}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: !hasMeals
                          ? colors.surface
                          : isSelected
                          ? colors.accent
                          : colors.surface,
                        borderColor: !hasMeals
                          ? colors.border
                          : isSelected
                          ? colors.accent
                          : colors.border,
                        opacity: hasMeals ? 1 : 0.4,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={[
                      styles.dayChipLabel,
                      { color: isSelected && hasMeals ? '#FFF' : colors.text },
                    ]}>
                      {day}
                    </Text>
                    {hasMeals && (
                      <View style={[styles.dayChipBadge,
                        { backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : colors.accentLight }
                      ]}>
                        <Text style={[
                          styles.dayChipBadgeText,
                          { color: isSelected ? '#FFF' : colors.accent },
                        ]}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Summary */}
            {groceryDays.length > 0 && (() => {
              const totalMeals = groceryDays.reduce(
                (acc, d) => acc + getMealsForDay(d).length, 0
              );
              const recipeIds = [...new Set(
                meals
                  .filter((m) => groceryDays.includes(m.day as DayOfWeek))
                  .map((m) => m.recipeId)
              )];
              return (
                <View style={[styles.summaryRow, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
                  <Text style={[styles.summaryText, { color: colors.accent }]}>
                    {totalMeals} meal{totalMeals !== 1 ? 's' : ''} · {recipeIds.length} recipe{recipeIds.length !== 1 ? 's' : ''} across {groceryDays.length} day{groceryDays.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              );
            })()}

            {/* Action buttons */}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowGroceryModal(false)}
              >
                <Text style={[styles.sheetCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sheetGenerateBtn,
                  {
                    backgroundColor: groceryDays.length > 0 ? colors.accent : colors.border,
                  },
                ]}
                disabled={groceryDays.length === 0}
                onPress={generateGroceryList}
              >
                <Ionicons name="cart-outline" size={18} color="#FFF" />
                <Text style={styles.sheetGenerateText}>Generate List</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  aiFab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 40,
    elevation: 6,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  aiFabText: {
    color: '#FFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
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
  mealEntry: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    alignItems: 'stretch',
  },
  mealEntryImage: {
    width: 88,
    height: 88,
  },
  mealEntryImagePlaceholder: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealEntryBody: {
    flex: 1,
    padding: Spacing.sm,
    gap: 3,
    justifyContent: 'center',
  },
  mealEntryName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    lineHeight: 18,
  },
  mealEntryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  mealEntryCuisine: {
    fontSize: 11,
    fontWeight: '600',
  },
  mealEntryDietBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  mealEntryDietDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  mealEntryDietText: {
    fontSize: 9,
    fontWeight: '700',
  },
  mealEntryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  mealEntryMetaText: {
    fontSize: 11,
  },
  mealEntryDotSep: {
    fontSize: 11,
    marginHorizontal: 1,
  },
  mealEntryNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  mealEntryNutriChip: {
    alignItems: 'center',
  },
  mealEntryNutriVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  mealEntryNutriLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  mealEntryRemove: {
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
  },
  mealEntrySub: {
    fontSize: Typography.fontSize.xs,
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

  // ── Grocery Modal ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sheetTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
  },
  sheetSubtitle: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAllText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  selectAllCount: {
    fontSize: Typography.fontSize.sm,
  },
  dayChipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  dayChipLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  dayChipBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dayChipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  summaryText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  sheetCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  sheetGenerateBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
  },
  sheetGenerateText: {
    color: '#FFF',
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
});
