import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Share,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '../../src/theme';
import { useRecipeStore } from '../../src/store/recipeStore';
import { useSavedStore } from '../../src/store/savedStore';
import { NutritionBadge } from '../../src/components/NutritionBadge';
import { RecipeCard } from '../../src/components/RecipeCard';
import { FallbackImage } from '../../src/components/FallbackImage';
import { Recipe } from '../../src/types';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;

export default function RecipeDetailScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const routeSource: 'master' | 'ai' = source === 'ai' ? 'ai' : 'master';
  const { fetchById, fetchSimilar, addRecentlyViewed } = useRecipeStore();
  const { toggleSaved, isSaved } = useSavedStore();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [similar, setSimilar] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(2);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');

  useEffect(() => {
    if (!id) return;
    fetchById(id, routeSource).then((r) => {
      if (r) {
        addRecentlyViewed(r.id);
        setRecipe(r);
        setServings(r.servings);
        fetchSimilar(r).then(setSimilar);
      }
      setLoading(false);
    });
  }, [id, routeSource]);

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.notFound, { color: colors.text }]}>Recipe not found</Text>
      </View>
    );
  }

  const saved = isSaved(recipe.id);
  const servingRatio = servings / recipe.servings;

  const dietColor =
    recipe.diet === 'Vegetarian' || recipe.diet === 'Vegan'
      ? colors.veg
      : colors.nonVeg;

  const handleShare = async () => {
    await Share.share({
      message: `Check out this recipe: ${recipe.name} — ${recipe.cook_time} min, ${recipe.calories} kcal`,
    });
  };

  const scaledQty = (qty: number) => {
    const scaled = qty * servingRatio;
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Floating Header Buttons */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.floatingRight}>
          <TouchableOpacity style={styles.floatingBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingBtn} onPress={() => toggleSaved(recipe.id)}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? '#FF6B35' : '#FFF'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <FallbackImage
          uri={recipe.image}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={styles.content}>
          {/* Recipe Header */}
          <View style={styles.recipeHeader}>
            <View style={styles.cuisineRow}>
              <View style={[styles.dietDot, { backgroundColor: dietColor }]} />
              <Text style={[styles.cuisineText, { color: colors.textSecondary }]}>{recipe.cuisine}</Text>
              <Text style={[styles.dietText, { color: dietColor }]}>{recipe.diet}</Text>
            </View>
            <Text style={[styles.recipeName, { color: colors.text }]}>{recipe.name}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{recipe.description}</Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
                <Ionicons name="time-outline" size={18} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.text }]}>{recipe.cook_time}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>mins</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
                <Ionicons name="people-outline" size={18} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.text }]}>{recipe.servings}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>serves</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
                <Ionicons name="flame-outline" size={18} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.text }]}>{recipe.calories}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>kcal</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
                <Ionicons name="star" size={18} color={colors.starFilled} />
                <Text style={[styles.statValue, { color: colors.text }]}>{recipe.rating}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>rating</Text>
              </View>
            </View>

            {/* Difficulty Badge */}
            <View style={[styles.badgeRow]}>
              <View style={[styles.badge, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.badgeText, { color: colors.accent }]}>
                  {recipe.difficulty} Difficulty
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                  Prep: {recipe.prep_time} min
                </Text>
              </View>
            </View>
          </View>

          {/* Start Cooking Button */}
          <TouchableOpacity
            style={[styles.cookBtn, { backgroundColor: colors.accent }]}
            onPress={() =>
              router.push({
                pathname: '/recipe/cooking/[id]',
                params: { id: recipe.id, source: routeSource },
              } as any)
            }
          >
            <Ionicons name="play-circle-outline" size={24} color="#FFF" />
            <Text style={styles.cookBtnText}>Start Cooking</Text>
          </TouchableOpacity>

          {/* Nutrition */}
          <NutritionBadge
            protein={recipe.nutrition.protein}
            carbs={recipe.nutrition.carbs}
            fat={recipe.nutrition.fat}
            fiber={recipe.nutrition.fiber}
            sugar={recipe.nutrition.sugar}
            calories={recipe.calories}
          />

          {/* Servings Scaler */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Adjust Servings</Text>
            <View style={styles.servingsRow}>
              <TouchableOpacity
                style={[styles.servingBtn, { backgroundColor: colors.accent }]}
                onPress={() => setServings(Math.max(1, servings - 1))}
              >
                <Ionicons name="remove" size={20} color="#FFF" />
              </TouchableOpacity>
              <Text style={[styles.servingsValue, { color: colors.text }]}>{servings}</Text>
              <TouchableOpacity
                style={[styles.servingBtn, { backgroundColor: colors.accent }]}
                onPress={() => setServings(servings + 1)}
              >
                <Ionicons name="add" size={20} color="#FFF" />
              </TouchableOpacity>
              <Text style={[styles.servingsLabel, { color: colors.textSecondary }]}>servings</Text>
            </View>
          </View>

          {/* Tabs: Ingredients / Steps */}
          <View style={[styles.tabRow, { backgroundColor: colors.surface }]}>
            {(['ingredients', 'steps'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && { backgroundColor: colors.accent },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === tab ? '#FFF' : colors.textSecondary },
                  ]}
                >
                  {tab === 'ingredients' ? '🧾 Ingredients' : '👣 Steps'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'ingredients' ? (
            <View style={styles.ingList}>
              {recipe.ingredients.map((ing, idx) => (
                <View key={idx} style={[styles.ingRow, { backgroundColor: colors.surface }]}>
                  <View style={[styles.ingDot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.ingName, { color: colors.text }]}>{ing.name}</Text>
                  <View style={[styles.ingQtyPill, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '55' }]}>
                    <Text style={[styles.ingQtyText, { color: colors.accent }]}>
                      {ing.quantity > 0 ? `${scaledQty(ing.quantity)} ${ing.unit}`.trim() : ing.unit}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.stepsContainer}>
              {recipe.steps.map((step) => (
                <View key={step.step} style={[styles.stepCard, { backgroundColor: colors.surface }]}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.accent }]}>
                    <Text style={styles.stepNumberText}>{step.step}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={[styles.stepInstruction, { color: colors.text }]}>
                      {step.instruction}
                    </Text>
                    {step.time > 0 && (
                      <View style={styles.stepTimeRow}>
                        <Ionicons name="time-outline" size={14} color={colors.accent} />
                        <Text style={[styles.stepTime, { color: colors.accent }]}>
                          {step.time} min
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Preparation */}
          {recipe.preparation.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔪 Preparation</Text>
              {recipe.preparation.map((prep, idx) => (
                <View key={idx} style={[styles.prepRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={[styles.prepIngredient, { color: colors.text }]}>{prep.ingredient}</Text>
                  <Text style={[styles.prepCut, { color: colors.textSecondary }]}>{prep.cut}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Equipment */}
          {recipe.equipment.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🍳 Equipment Needed</Text>
              <View style={styles.equipRow}>
                {recipe.equipment.map((eq, idx) => (
                  <View key={idx} style={[styles.equipBadge, { backgroundColor: colors.accentLight }]}>
                    <Text style={[styles.equipText, { color: colors.accent }]}>{eq}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Chef Tips */}
          {recipe.tips.length > 0 && (
            <View style={[styles.tipsSection, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
              <Text style={[styles.sectionTitle, { color: colors.accent }]}>💡 Chef Tips</Text>
              {recipe.tips.map((tip, idx) => (
                <View key={idx} style={styles.tipRow}>
                  <Text style={{ color: colors.accent }}>→</Text>
                  <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tags */}
          <View style={styles.tagsRow}>
            {recipe.tags.map((tag) => (
              <View key={tag} style={[styles.tagChip, { backgroundColor: colors.surface }]}>
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Similar Recipes */}
          {similar.length > 0 && (
            <View>
              <Text style={[styles.sectionTitleLg, { color: colors.text }]}>Similar Recipes</Text>
              {similar.slice(0, 3).map((r) => (
                <RecipeCard key={r.id} recipe={r} horizontal />
              ))}
            </View>
          )}

          <View style={{ height: insets.bottom + Spacing['2xl'] }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heroImage: {
    width,
    height: IMAGE_HEIGHT,
  },
  heroPlaceholder: {
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderImg: {
    width: IMAGE_HEIGHT,
    height: IMAGE_HEIGHT,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
  },
  floatingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingRight: { flexDirection: 'row', gap: Spacing.sm },
  content: { padding: Spacing.base, gap: Spacing.md },
  recipeHeader: { gap: Spacing.sm },
  cuisineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dietDot: { width: 8, height: 8, borderRadius: 4 },
  cuisineText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  dietText: { fontSize: Typography.fontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  recipeName: { fontSize: Typography.fontSize['2xl'], fontWeight: '900', lineHeight: 32 },
  description: { fontSize: Typography.fontSize.base, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  statItem: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 3,
  },
  statValue: { fontSize: Typography.fontSize.md, fontWeight: '800' },
  statLabel: { fontSize: Typography.fontSize.xs },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: '700' },
  cookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    height: 54,
    ...Shadow.md,
  },
  cookBtnText: { color: '#FFF', fontSize: Typography.fontSize.lg, fontWeight: '800' },
  section: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', marginBottom: 2 },
  sectionTitleLg: { fontSize: Typography.fontSize.lg, fontWeight: '800', marginBottom: Spacing.sm },
  servingsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  servingBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsValue: { fontSize: Typography.fontSize.xl, fontWeight: '800', minWidth: 30, textAlign: 'center' },
  servingsLabel: { fontSize: Typography.fontSize.base },
  tabRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.full,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  tabText: { fontWeight: '700', fontSize: Typography.fontSize.base },
  ingList: {
    gap: Spacing.sm,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  ingDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  ingName: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: '600', lineHeight: 20 },
  ingQtyPill: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
    maxWidth: 160,
  },
  ingQtyText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  ingQty: { fontSize: Typography.fontSize.base, fontWeight: '700' },
  stepsContainer: { gap: Spacing.sm },
  stepCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumberText: { color: '#FFF', fontWeight: '800', fontSize: Typography.fontSize.base },
  stepInstruction: { fontSize: Typography.fontSize.base, lineHeight: 22 },
  stepTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepTime: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  prepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  prepIngredient: { fontWeight: '600', fontSize: Typography.fontSize.base },
  prepCut: { fontSize: Typography.fontSize.sm },
  equipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  equipBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  equipText: { fontWeight: '600', fontSize: Typography.fontSize.sm },
  tipsSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderLeftWidth: 4,
    gap: Spacing.sm,
  },
  tipRow: { flexDirection: 'row', gap: Spacing.sm },
  tipText: { flex: 1, fontSize: Typography.fontSize.base, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tagChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tagText: { fontSize: Typography.fontSize.xs, fontWeight: '500' },
  notFound: { fontSize: Typography.fontSize.lg },
});
