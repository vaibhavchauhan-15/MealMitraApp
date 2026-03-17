import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { ConfirmModal } from '../../src/components/ConfirmModal';
import { AiDietPlannerModal } from '../../src/components/AiDietPlannerModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius, Shadow, Motion } from '../../src/theme';
import { usePlannerStore } from '../../src/store/plannerStore';
import { useGroceryStore } from '../../src/store/groceryStore';
import { useRecipeStore } from '../../src/store/recipeStore';
import { DayOfWeek, MealType } from '../../src/types';
import { FallbackImage } from '../../src/components/FallbackImage';
import { useFocusEffect } from '@react-navigation/native';

const DAYS: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const MEAL_ICONS: Record<MealType, string> = {
  Breakfast: '☀️',
  Lunch: '🌤️',
  Dinner: '🌙',
  Snack: '☕',
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
  const entry = useRef(new Animated.Value(0)).current;

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

export default function PlannerScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const isCompact = width <= 360 || height <= 720;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Mon');
  const [showClearModal, setShowClearModal] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const [groceryDays, setGroceryDays] = useState<DayOfWeek[]>([...DAYS]);
  const dayTransition = useRef(new Animated.Value(1)).current;
  const cloudFade = useRef(new Animated.Value(1)).current;
  const { meals, removeMeal, clearWeek, getMealsForDay, syncFromSupabase, syncStatus, lastSyncedAt } = usePlannerStore();
  const { addItems } = useGroceryStore();
  const { getRecipeById, fetchById, addToCache } = useRecipeStore();

  const dayMeals = getMealsForDay(selectedDay);

  const cloudState = useMemo(() => {
    if (syncStatus === 'syncing') {
      return { label: 'Syncing to cloud...', icon: 'cloud-upload-outline' as const, color: colors.warning };
    }
    if (syncStatus === 'error') {
      return { label: 'Cloud sync issue', icon: 'cloud-offline-outline' as const, color: colors.error };
    }
    if (syncStatus === 'synced') {
      const suffix = lastSyncedAt
        ? ` • ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : '';
      return { label: `Cloud synced${suffix}`, icon: 'cloud-done-outline' as const, color: colors.veg };
    }
    return { label: 'Cloud ready', icon: 'cloud-outline' as const, color: colors.textSecondary };
  }, [syncStatus, lastSyncedAt, colors]);

  useEffect(() => {
    dayTransition.setValue(0);
    Animated.timing(dayTransition, {
      toValue: 1,
      duration: Motion.TRANSITION_SHORT_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [selectedDay, dayTransition]);

  useEffect(() => {
    cloudFade.setValue(0.35);
    Animated.timing(cloudFade, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [syncStatus, lastSyncedAt, cloudFade]);

  // Re-sync whenever this tab gains focus so cloud state is restored after reinstall/login.
  useFocusEffect(
    useCallback(() => {
      syncFromSupabase();
    }, [syncFromSupabase])
  );

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
      <View style={[styles.header, isCompact && styles.headerCompact, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.title, isCompact && styles.titleCompact, { color: colors.text }]}>Meal Planner</Text>
        </View>
        <View style={[styles.headerActions, isCompact && styles.headerActionsCompact]}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              isCompact && styles.actionBtnCompact,
              { backgroundColor: colors.surface },
              pressed && styles.actionBtnPressed,
            ]}
            onPress={() => router.push('/ai-generated-plan-history' as any)}
          >
            <Ionicons name="time-outline" size={18} color={colors.accent} />
            <Text style={[styles.historyBtnText, isCompact && styles.headerBtnTextCompact, { color: colors.accent }]}>History</Text>
          </Pressable>
          {meals.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                isCompact && styles.actionBtnCompact,
                { backgroundColor: colors.surface },
                pressed && styles.actionBtnPressed,
              ]}
              onPress={() => setShowClearModal(true)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </Pressable>
          )}
          {meals.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                isCompact && styles.actionBtnCompact,
                { backgroundColor: colors.accent },
                pressed && styles.actionBtnPressed,
              ]}
              onPress={openGroceryModal}
            >
              <Ionicons name="cart-outline" size={18} color="#FFF" />
              <Text style={[styles.groceryBtnText, isCompact && styles.headerBtnTextCompact]}>Grocery</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.cloudRow, isCompact && styles.cloudRowCompact]}>
        <Animated.View
          style={[
            styles.cloudBadge,
            isCompact && styles.cloudBadgeCompact,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: cloudFade,
            },
          ]}
        >
          <Ionicons name={cloudState.icon} size={13} color={cloudState.color} />
          <Text style={[styles.cloudText, isCompact && styles.cloudTextCompact, { color: cloudState.color }]}>{cloudState.label}</Text>
        </Animated.View>
      </View>

      {/* Day Selector */}
      <View style={[styles.daySelectorContainer, isCompact && styles.daySelectorContainerCompact]}>
        <View style={[styles.daySelector, isCompact && styles.daySelectorCompact]}>
          {DAYS.map((day) => {
            const count = getMealsForDay(day).length;
            return (
              <Pressable
                key={day}
                style={({ pressed }) => [
                  styles.dayBtn,
                  isCompact && styles.dayBtnCompact,
                  {
                    backgroundColor: selectedDay === day ? colors.accent : colors.surface,
                    borderColor: selectedDay === day ? colors.accent : colors.border,
                  },
                  pressed && styles.dayBtnPressed,
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    isCompact && styles.dayTextCompact,
                    { color: selectedDay === day ? '#FFF' : colors.text },
                  ]}
                >
                  {day}
                </Text>
                {count > 0 && (
                  <View style={[styles.dayDot, { backgroundColor: selectedDay === day ? '#FFF' : colors.accent }]} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Meal Slots */}
      <ScrollView contentContainerStyle={styles.mealsContent} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.mealsMotionLayer,
            {
              opacity: dayTransition,
              transform: [
                {
                  translateY: dayTransition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}
        >
        {MEAL_TYPES.map((mealType, mealTypeIndex) => {
          const mealEntries = dayMeals.filter((m) => m.mealType === mealType);

          return (
            <View key={mealType} style={[styles.mealSlot, isCompact && styles.mealSlotCompact, { backgroundColor: colors.surface }]}>
              <View style={styles.mealSlotHeader}>
                <Text style={styles.mealIcon}>{MEAL_ICONS[mealType]}</Text>
                <Text style={[styles.mealTypeText, isCompact && styles.mealTypeTextCompact, { color: colors.text }]}>{mealType}</Text>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/add-to-planner',
                      params: { day: selectedDay, mealType },
                    } as any)
                  }
                  style={({ pressed }) => [
                    styles.addBtn,
                    { backgroundColor: colors.accentLight },
                    pressed && styles.actionBtnPressed,
                  ]}
                >
                  <Ionicons name="add" size={18} color={colors.accent} />
                </Pressable>
              </View>

              {mealEntries.length === 0 ? (
                <StaggeredEntry
                  delay={mealTypeIndex * Motion.STAGGER_BASE_MS}
                  triggerKey={`${selectedDay}-${mealType}-empty`}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.emptySlot,
                      isCompact && styles.emptySlotCompact,
                      { borderColor: colors.border },
                      pressed && styles.dayBtnPressed,
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: '/add-to-planner',
                        params: { day: selectedDay, mealType },
                      } as any)
                    }
                  >
                    <Text style={[styles.emptySlotText, isCompact && styles.emptySlotTextCompact, { color: colors.textTertiary }]}>
                      + Add {mealType.toLowerCase()}
                    </Text>
                  </Pressable>
                </StaggeredEntry>
              ) : (
                mealEntries.map((entry, entryIndex) => {
                  const recipe = getRecipeById(entry.recipeId);
                  if (!recipe) return null;
                  const dietColor =
                    recipe.diet === 'Vegetarian' ? colors.veg
                    : recipe.diet === 'Vegan' ? colors.vegan
                    : recipe.diet === 'Non-Vegetarian' ? colors.nonVeg
                    : colors.warning;
                  return (
                    <StaggeredEntry
                      key={entry.id}
                      delay={mealTypeIndex * Motion.STAGGER_BASE_MS + entryIndex * Motion.STAGGER_BASE_MS}
                      triggerKey={`${selectedDay}-${entry.id}`}
                    >
                      <Pressable
                        style={({ pressed }) => [
                          styles.mealEntry,
                          isCompact && styles.mealEntryCompact,
                          { ...Shadow.sm, backgroundColor: colors.card },
                          pressed && styles.mealEntryPressed,
                        ]}
                        onPress={() => {
                          const recipeSource = entry.recipeSource ?? 'master';
                          router.push({
                            pathname: '/recipe/[id]',
                            params: { id: recipe.id, source: recipeSource },
                          } as any);
                        }}
                      >
                      <FallbackImage
                        uri={recipe.image}
                        style={[styles.mealEntryImage, isCompact && styles.mealEntryImageCompact]}
                        resizeMode="cover"
                      />
                      <View style={[styles.mealEntryBody, isCompact && styles.mealEntryBodyCompact]}>
                        {/* Name */}
                        <Text style={[styles.mealEntryName, isCompact && styles.mealEntryNameCompact, { color: colors.text }]} numberOfLines={2}>
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
                        <Text style={[styles.mealEntryHint, isCompact && styles.mealEntryHintCompact, { color: colors.textTertiary }]}>Tap to view recipe</Text>
                      </View>
                        <TouchableOpacity
                          onPress={() => removeMeal(entry.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={styles.mealEntryRemove}
                        >
                          <Ionicons name="close-circle-outline" size={22} color={colors.textTertiary} />
                        </TouchableOpacity>
                      </Pressable>
                    </StaggeredEntry>
                  );
                })
              )}
            </View>
          );
        })}
        <View style={{ height: Spacing['3xl'] + 80 }} />
        </Animated.View>
      </ScrollView>

      {/* Floating AI Diet Planner Button */}
      <Pressable
        style={({ pressed }) => [
          styles.aiFab,
          isCompact && styles.aiFabCompact,
          {
            backgroundColor: colors.accent,
            bottom: insets.bottom + 16,
            ...Shadow.md,
          },
          pressed && styles.fabPressed,
        ]}
        onPress={() => setShowAiPlanner(true)}
      >
        <Ionicons name="sparkles" size={22} color="#FFF" />
        <Text style={[styles.aiFabText, isCompact && styles.aiFabTextCompact]}>AI Diet Plan</Text>
      </Pressable>

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
            <View style={styles.dayChipRow}>
              {DAYS.map((day) => {
                const count = getMealsForDay(day).length;
                const hasMeals = count > 0;
                const isSelected = groceryDays.includes(day);
                return (
                  <Pressable
                    key={day}
                    disabled={!hasMeals}
                    onPress={() => toggleGroceryDay(day)}
                    style={({ pressed }) => [
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
                      pressed && hasMeals && styles.dayBtnPressed,
                    ]}
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
                  </Pressable>
                );
              })}
            </View>

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
  aiFabCompact: {
    right: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 5,
  },
  aiFabText: {
    color: '#FFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  aiFabTextCompact: {
    fontSize: Typography.fontSize.xs,
  },
  fabPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.95,
  },
  header: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  headerCompact: {
    gap: 6,
    paddingBottom: Spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cloudRow: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  cloudRowCompact: {
    marginBottom: 6,
  },
  cloudBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  cloudBadgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  cloudText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  cloudTextCompact: {
    fontSize: 10,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    flexShrink: 1,
  },
  titleCompact: {
    fontSize: Typography.fontSize.xl,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  headerActionsCompact: {
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  actionBtnCompact: {
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionBtnPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  groceryBtnText: {
    color: '#FFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  historyBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  headerBtnTextCompact: {
    fontSize: Typography.fontSize.xs,
  },
  daySelectorContainer: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  daySelectorContainerCompact: {
    paddingHorizontal: Spacing.sm,
    marginBottom: 6,
  },
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    paddingVertical: 4,
  },
  daySelectorCompact: {
    gap: 4,
  },
  dayBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    borderWidth: 1,
  },
  dayBtnCompact: {
    paddingVertical: 6,
  },
  dayBtnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },
  dayText: {
    fontWeight: '700',
    fontSize: Typography.fontSize.xs,
  },
  dayTextCompact: {
    fontSize: 11,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 3,
  },
  mealsContent: {
    paddingHorizontal: Spacing.base,
  },
  mealsMotionLayer: {
    gap: Spacing.md,
  },
  mealSlot: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  mealSlotCompact: {
    padding: Spacing.sm,
    gap: 6,
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
  mealTypeTextCompact: {
    fontSize: Typography.fontSize.sm,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealEntry: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    alignItems: 'stretch',
    minHeight: 102,
    position: 'relative',
  },
  mealEntryCompact: {
    minHeight: 92,
  },
  mealEntryPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.96,
  },
  mealEntryImage: {
    width: 96,
    height: 96,
    margin: 8,
    borderRadius: BorderRadius.md,
  },
  mealEntryImageCompact: {
    width: 82,
    height: 82,
    margin: 6,
  },
  mealEntryImagePlaceholder: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealEntryBody: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingRight: 36,
    gap: 4,
    justifyContent: 'center',
  },
  mealEntryBodyCompact: {
    paddingVertical: 6,
    gap: 3,
  },
  mealEntryName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    lineHeight: 21,
  },
  mealEntryNameCompact: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 18,
  },
  mealEntryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  mealEntryCuisine: {
    fontSize: Typography.fontSize.sm,
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
    fontSize: 10,
    fontWeight: '700',
  },
  mealEntryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  mealEntryMetaText: {
    fontSize: Typography.fontSize.sm,
  },
  mealEntryDotSep: {
    fontSize: Typography.fontSize.sm,
    marginHorizontal: 1,
  },
  mealEntryNutrition: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
  },
  mealEntryNutriChip: {
    alignItems: 'center',
  },
  mealEntryNutriVal: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
  },
  mealEntryNutriLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  mealEntryHint: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  mealEntryHintCompact: {
    fontSize: 9,
  },
  mealEntryRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
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
  emptySlotCompact: {
    padding: Spacing.sm,
  },
  emptySlotText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  emptySlotTextCompact: {
    fontSize: Typography.fontSize.xs,
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
    flexWrap: 'wrap',
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
