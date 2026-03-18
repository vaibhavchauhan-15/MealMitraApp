import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '../src/theme';
import { useRecipeStore } from '../src/store/recipeStore';
import { usePlannerStore } from '../src/store/plannerStore';
import { searchRecipes, getRecipeByIdFromSource } from '../src/services/searchService';
import { useUserStore } from '../src/store/userStore';
import { DayOfWeek, Recipe } from '../src/types';
import { FallbackImage } from '../src/components/FallbackImage';
import { useToast } from '../src/hooks/useToast';
import { Toast } from '../src/components/Toast';
import { getDailyNutritionTargets, getExceededTargetKeys, sumNutritionFromRecipes } from '../src/utils/plannerNutrition';

const DIET_COLOR: Record<string, string> = {
  Vegetarian: '#22C55E',
  Vegan: '#3B82F6',
  'Non-Vegetarian': '#EF4444',
  Eggetarian: '#F59E0B',
};

export default function AddToPlannerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { day, mealType } = useLocalSearchParams<{ day: string; mealType: string }>();
  const addMeal = usePlannerStore((s) => s.addMeal);
  const getMealsForDay = usePlannerStore((s) => s.getMealsForDay);
  const profile = useUserStore((s) => s.profile);
  const { featured, addToCache, getRecipeById } = useRecipeStore();
  const { toast, showToast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Recipe[]>(featured);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seed with featured recipes initially; debouce-search on query change
  useEffect(() => {
    if (featured.length > 0 && !query) setResults(featured);
  }, [featured.length]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const data = await searchRecipes(query, {}, 40);
      setResults(data);
      addToCache(data);
      setLoading(false);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const targets = getDailyNutritionTargets(profile);

  const handleSelect = async (selectedRecipe: Recipe) => {
    if (!day || !mealType) return;

    const plannedMeals = getMealsForDay(day as DayOfWeek);
    const plannedRecipes = await Promise.all(
      plannedMeals.map(async (entry) => {
        const fromCache = getRecipeById(entry.recipeId);
        if (fromCache) return fromCache;
        return getRecipeByIdFromSource(entry.recipeId, entry.recipeSource ?? 'master');
      })
    );

    const nextTotals = sumNutritionFromRecipes([...plannedRecipes, selectedRecipe]);
    if (targets) {
      const exceeded = getExceededTargetKeys(nextTotals, targets);
      if (exceeded.length > 0) {
        const labelMap: Record<string, string> = {
          calories: 'Calories',
          protein: 'Protein',
          carbs: 'Carbs',
          fat: 'Fat',
          fiber: 'Fiber',
        };
        showToast(
          `Adding this meal will exceed: ${exceeded.map((k) => labelMap[k]).join(', ')}`,
          'error',
          'Target exceeded'
        );
        return;
      }
    }

    addMeal(day as DayOfWeek, mealType as any, selectedRecipe.id, 2, 'master');
    showToast('Meal added within your daily target.', 'success', 'Added');
    setTimeout(() => router.back(), 180);
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    const dietColor = DIET_COLOR[item.diet] ?? colors.accent;
    return (
      <TouchableOpacity
        style={[styles.recipeItem, { backgroundColor: colors.card, ...Shadow.sm }]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.75}
      >
        <FallbackImage uri={item.image} style={styles.recipeImage} resizeMode="cover" />
        <View style={styles.recipeInfo}>
          {/* Title row */}
          <Text style={[styles.recipeName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          {/* Cuisine + diet */}
          <View style={styles.badgeRow}>
            <Text style={[styles.cuisineTag, { color: colors.textSecondary }]}>
              {item.cuisine}
            </Text>
            <View style={[styles.dietBadge, { backgroundColor: dietColor + '22', borderColor: dietColor }]}>
              <View style={[styles.dietDot, { backgroundColor: dietColor }]} />
              <Text style={[styles.dietText, { color: dietColor }]}>{item.diet}</Text>
            </View>
          </View>
          {/* Meta: time · calories · difficulty */}
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>{item.cook_time} min</Text>
            <Text style={[styles.dot, { color: colors.textTertiary }]}>·</Text>
            <Ionicons name="flame-outline" size={13} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>{item.calories} kcal</Text>
            <Text style={[styles.dot, { color: colors.textTertiary }]}>·</Text>
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>{item.difficulty}</Text>
          </View>
          {/* Nutrition row */}
          <View style={styles.nutritionRow}>
            <View style={styles.nutriBadge}>
              <Text style={[styles.nutriValue, { color: '#3B82F6' }]}>{item.nutrition.protein}g</Text>
              <Text style={[styles.nutriLabel, { color: colors.textTertiary }]}>Protein</Text>
            </View>
            <View style={styles.nutriBadge}>
              <Text style={[styles.nutriValue, { color: '#F59E0B' }]}>{item.nutrition.carbs}g</Text>
              <Text style={[styles.nutriLabel, { color: colors.textTertiary }]}>Carbs</Text>
            </View>
            <View style={styles.nutriBadge}>
              <Text style={[styles.nutriValue, { color: '#EF4444' }]}>{item.nutrition.fat}g</Text>
              <Text style={[styles.nutriLabel, { color: colors.textTertiary }]}>Fat</Text>
            </View>
            <View style={styles.nutriBadge}>
              <Text style={[styles.nutriValue, { color: '#22C55E' }]}>{item.nutrition.fiber}g</Text>
              <Text style={[styles.nutriLabel, { color: colors.textTertiary }]}>Fiber</Text>
            </View>
          </View>
        </View>
        <View style={styles.addIconWrap}>
          <Ionicons name="add" size={22} color={colors.accent} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Add to Planner</Text>
          {day && mealType && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {day} · {mealType}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.searchWrapper, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search recipes, cuisine, tags..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(r) => r.id}
        renderItem={renderRecipeItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={loading ? <ActivityIndicator color={colors.accent} style={{ marginVertical: Spacing.md }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recipes found</Text>
            </View>
          ) : null
        }
      />

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
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  subtitle: { fontSize: Typography.fontSize.sm, marginTop: 2 },
  searchWrapper: { padding: Spacing.base, borderBottomWidth: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: Typography.fontSize.base },
  listContent: { padding: Spacing.base, gap: Spacing.md },
  recipeItem: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    alignItems: 'stretch',
  },
  recipeImage: {
    width: 100,
    height: undefined,
    aspectRatio: undefined,
    minHeight: 120,
  },
  recipeInfo: {
    flex: 1,
    padding: Spacing.md,
    gap: 4,
    justifyContent: 'center',
  },
  recipeName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  cuisineTag: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  dietBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  dietDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dietText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: { fontSize: Typography.fontSize.xs },
  dot: { fontSize: Typography.fontSize.xs },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  nutriBadge: {
    alignItems: 'center',
  },
  nutriValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  nutriLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  addIconWrap: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
});
