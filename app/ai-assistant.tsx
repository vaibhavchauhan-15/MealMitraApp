import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  canonicalizeIngredients,
  searchRecipesByIngredients,
  IngredientMatchResult,
  invalidateRecipeQueryCaches,
} from '../src/services/searchService';
import {
  generateRecipesFromIngredients,
  AIRecipeSuggestion,
} from '../src/services/aiDietService';
import { useUserStore } from '../src/store/userStore';
import { useSavedStore } from '../src/store/savedStore';
import { usePlannerStore } from '../src/store/plannerStore';
import { supabase } from '../src/services/supabase';
import { FallbackImage } from '../src/components/FallbackImage';
import { DayOfWeek, MealType, RecipeSource } from '../src/types';
import { useTheme } from '../src/theme/useTheme';
import { ThemeColors } from '../src/theme';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const POPULAR_INGREDIENTS = [
  'onion',
  'potato',
  'garlic',
  'paneer',
  'rice',
  'chicken',
  'tomato',
  'egg',
  'capsicum',
  'spinach',
];

type Phase = 'idle' | 'searching' | 'db_results' | 'generating_ai' | 'ai_results' | 'error';

interface PlanTarget {
  recipeId: string;
  recipeName: string;
  recipeSource: RecipeSource;
}

interface Palette {
  background: string;
  card: string;
  cardStrong: string;
  input: string;
  surface: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderSoft: string;
  orange: string;
  orangeSoft: string;
  orangeGradientEnd: string;
  orangeWash: string;
  orangeBadge: string;
  green: string;
  greenBg: string;
  progressTrack: string;
  overlay: string;
  white70: string;
  white12: string;
  veg: string;
  nonVeg: string;
  emptyIconBg: string;
}

type AssistantStyles = ReturnType<typeof createStyles>;

interface AddToPlanModalProps {
  visible: boolean;
  recipeName: string;
  onClose: () => void;
  onConfirm: (day: DayOfWeek, mealType: MealType) => void;
  palette: Palette;
  styles: AssistantStyles;
}

interface MatchCardProps {
  result: IngredientMatchResult;
  onPlanPress: () => void;
  palette: Palette;
  styles: AssistantStyles;
}

interface AIRecipeCardProps {
  recipe: AIRecipeSuggestion;
  onSave: () => void;
  onUpload: () => void;
  isUploaded: boolean;
  isSavedRecipe: boolean;
  onPlanPress: () => void;
  sourceLabel: string;
  palette: Palette;
  styles: AssistantStyles;
}

function normalizeIngredient(value: string) {
  return value.trim().toLowerCase();
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function getSourceLabel(resultSource: 'master' | 'ai' | undefined, recipeSource?: string) {
  if (resultSource === 'ai') return 'Source: user_ai_generated_recipes';
  if (recipeSource === 'user_upload') return 'Source: master_recipes (user_upload)';
  if (recipeSource === 'ai') return 'Source: master_recipes (ai)';
  return 'Source: master_recipes (MealMitra)';
}

function ScalePressable({
  children,
  style,
  pressedScale = 0.98,
  disabled,
  ...props
}: any) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={({ pressed }) => [
        typeof style === 'function' ? style({ pressed }) : style,
        pressed && !disabled ? { transform: [{ scale: pressedScale }] } : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

function getPalette(colors: ThemeColors, isDark: boolean): Palette {
  return {
    background: colors.background,
    card: colors.card,
    cardStrong: isDark ? '#1A1A1A' : '#FFFFFF',
    input: colors.inputBackground,
    surface: colors.surface,
    text: colors.text,
    textSecondary: colors.textSecondary,
    textMuted: colors.textTertiary,
    border: colors.border,
    borderSoft: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    orange: '#FF7A3D',
    orangeSoft: '#FF9A5A',
    orangeGradientEnd: '#FF9A5A',
    orangeWash: isDark ? 'rgba(255,122,61,0.18)' : 'rgba(255,122,61,0.14)',
    orangeBadge: isDark ? 'rgba(255,122,61,0.15)' : 'rgba(255,122,61,0.12)',
    green: colors.success,
    greenBg: isDark ? '#0F3D2E' : '#E8F9F0',
    progressTrack: isDark ? '#2B2B2B' : '#E5E7EB',
    overlay: colors.overlay,
    white70: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(17,17,17,0.7)',
    white12: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(17,17,17,0.12)',
    veg: colors.veg,
    nonVeg: colors.nonVeg,
    emptyIconBg: isDark ? '#1E1E1E' : '#F4F4F5',
  };
}

async function saveAIRecipeToSupabase(
  recipe: AIRecipeSuggestion,
  userId?: string | null,
  sourceIngredients?: string[],
): Promise<string | null> {
  if (!userId) return null;

  try {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;

    if (authUser) {
      await supabase.from('user_profiles').upsert(
        {
          id: authUser.id,
          name:
            (authUser.user_metadata?.name as string | undefined) ??
            authUser.email?.split('@')[0] ??
            'User',
          email: authUser.email ?? '',
        },
        { onConflict: 'id', ignoreDuplicates: true },
      );
    }

    const { data, error } = await supabase.rpc('save_ai_generated_recipe', {
      p_user_id: userId,
      p_title: recipe.name,
      p_description: recipe.description,
      p_cuisine: recipe.cuisine,
      p_diet: recipe.diet,
      p_difficulty: recipe.difficulty?.toLowerCase?.() ?? 'medium',
      p_cook_time: recipe.cook_time,
      p_prep_time: recipe.prep_time,
      p_servings: recipe.servings,
      p_calories: recipe.calories,
      p_protein_g: recipe.nutrition?.protein ?? null,
      p_carbs_g: recipe.nutrition?.carbs ?? null,
      p_fat_g: recipe.nutrition?.fat ?? null,
      p_fiber_g: recipe.nutrition?.fiber ?? null,
      p_sugar_g: recipe.nutrition?.sugar ?? null,
      p_tags: recipe.tags ?? [],
      p_source_ingredients: (sourceIngredients ?? []).map((x) => x.trim().toLowerCase()).filter(Boolean),
      p_ingredients:
        recipe.ingredients?.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit ?? '',
        })) ?? [],
      p_steps:
        recipe.steps?.map((step) => ({
          step_number: step.step,
          instruction: step.instruction,
          duration_min: step.time ?? 0,
        })) ?? [],
      p_is_public: false,
    });

    if (error) {
      console.warn('[AIAssistant] saveAIRecipe:', error.message);
      return null;
    }

    void invalidateRecipeQueryCaches();

    return (data as string | null) ?? null;
  } catch (error) {
    console.warn('[AIAssistant] saveAIRecipe exception:', error);
    return null;
  }
}

function AddToPlanModal({
  visible,
  recipeName,
  onClose,
  onConfirm,
  palette,
  styles,
}: AddToPlanModalProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Mon');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('Lunch');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add to Planner</Text>
          <Text style={styles.modalRecipeName} numberOfLines={1}>
            {recipeName}
          </Text>

          <Text style={styles.modalLabel}>Select Day</Text>
          <View style={styles.pillRow}>
            {DAYS.map((day) => {
              const active = day === selectedDay;
              return (
                <ScalePressable
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  style={[styles.pill, active && styles.pillActive]}
                  pressedScale={0.97}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{day}</Text>
                </ScalePressable>
              );
            })}
          </View>

          <Text style={styles.modalLabel}>Meal Type</Text>
          <View style={styles.pillRow}>
            {MEAL_TYPES.map((meal) => {
              const active = meal === selectedMeal;
              return (
                <ScalePressable
                  key={meal}
                  onPress={() => setSelectedMeal(meal)}
                  style={[styles.pill, active && styles.pillActive]}
                  pressedScale={0.97}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{meal}</Text>
                </ScalePressable>
              );
            })}
          </View>

          <View style={styles.modalActions}>
            <ScalePressable onPress={onClose} style={styles.modalCancelBtn} pressedScale={0.97}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </ScalePressable>
            <ScalePressable
              onPress={() => onConfirm(selectedDay, selectedMeal)}
              style={styles.modalConfirmBtn}
              pressedScale={0.97}
            >
              <Ionicons name="calendar-outline" size={16} color="#fff" />
              <Text style={styles.modalConfirmText}>Add to Plan</Text>
            </ScalePressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MatchCard({ result, onPlanPress, palette, styles }: MatchCardProps) {
  const router = useRouter();
  const { toggleSaved, isSaved } = useSavedStore();
  const { recipe, missing_ingredients, match_count, total_ingredients, match_score, source, generated_by_name } = result;

  const isAiRecipe = source === 'ai';
  const sourceLabel = getSourceLabel(source, recipe.source);
  const saved = isSaved(recipe.id, isAiRecipe ? 'ai' : 'master');
  const pct = Math.max(8, Math.round(match_score * 100));
  const dietColor =
    recipe.diet === 'Vegetarian' || recipe.diet === 'Vegan' ? palette.veg : palette.nonVeg;

  return (
    <View style={styles.matchCard}>
      <ScalePressable
        onPress={() => {
          if (!isAiRecipe) {
            router.push({
              pathname: '/recipe/[id]',
              params: { id: recipe.id, source: 'master' },
            } as any);
          }
        }}
        style={styles.cardMainPressable}
        pressedScale={isAiRecipe ? 1 : 1.02}
        disabled={isAiRecipe}
      >
        <View style={styles.matchMediaWrap}>
          <View style={[styles.matchMedia, (!recipe.image || isAiRecipe) && styles.matchMediaFallback]}>
            <FallbackImage
              uri={recipe.image}
              forcePlaceholder={isAiRecipe}
              style={isAiRecipe ? styles.matchPlaceholderImage : styles.matchImage}
              resizeMode={isAiRecipe ? 'contain' : 'cover'}
            />
            <View style={[styles.dietDot, { backgroundColor: dietColor }]} />
          </View>
        </View>

        <View style={styles.matchContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.cardEyebrow} numberOfLines={1}>
              {recipe.cuisine || (isAiRecipe ? 'AI recipe' : 'Recipe match')}
            </Text>
            {isAiRecipe && (
              <View style={styles.aiInlineBadge}>
                <Text style={styles.aiInlineBadgeText}>AI</Text>
              </View>
            )}
          </View>
          <Text style={styles.matchTitle} numberOfLines={2}>
            {recipe.name}
          </Text>
          <Text style={styles.sourceText}>{sourceLabel}</Text>
          {isAiRecipe && generated_by_name ? (
            <Text style={styles.generatedByText}>Generated by {generated_by_name}</Text>
          ) : null}

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={palette.textMuted} />
            <Text style={styles.metaText}>{recipe.cook_time} min</Text>
            <Text style={styles.metaSeparator}>·</Text>
            <Ionicons name="flame-outline" size={13} color={palette.textMuted} />
            <Text style={styles.metaText}>{recipe.calories} kcal</Text>
          </View>

          <View style={styles.matchBarRow}>
            <View style={styles.matchBarBg}>
              <View style={[styles.matchBarFill, { width: `${pct}%` as any }]} />
            </View>
            <Text style={styles.matchBarLabel}>
              {match_count}/{total_ingredients} ingredients
            </Text>
          </View>

          <Text style={styles.missingText} numberOfLines={1}>
            {missing_ingredients.length > 0
              ? `Need: ${missing_ingredients.join(', ')}`
              : 'Everything essential is already in your list'}
          </Text>
        </View>
      </ScalePressable>

      <View style={styles.cardActionRow}>
        <ScalePressable
          onPress={() => toggleSaved(recipe.id, isAiRecipe ? 'ai' : 'master')}
          style={[styles.outlineAction, saved && styles.outlineActionActive]}
          pressedScale={0.96}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={14}
            color={saved ? palette.orange : palette.textSecondary}
          />
          <Text style={[styles.outlineActionText, saved && styles.outlineActionTextActive]}>
            Save
          </Text>
        </ScalePressable>

        <ScalePressable onPress={onPlanPress} style={styles.primaryAction} pressedScale={0.96}>
          <Ionicons name="calendar-outline" size={14} color="#fff" />
          <Text style={styles.primaryActionText}>Plan</Text>
        </ScalePressable>
      </View>
    </View>
  );
}

function AIRecipeCard({
  recipe,
  onSave,
  onUpload,
  isUploaded,
  isSavedRecipe,
  onPlanPress,
  sourceLabel,
  palette,
  styles,
}: AIRecipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const totalTime = (recipe.cook_time ?? 0) + (recipe.prep_time ?? 0);

  return (
    <View style={styles.aiCard}>
      <ScalePressable
        onPress={() => setExpanded((value) => !value)}
        style={styles.cardMainPressable}
        pressedScale={1.02}
      >
        <View style={styles.aiThumbWrap}>
          <View style={styles.aiThumb}>
            <Ionicons name="sparkles-outline" size={28} color={palette.orange} />
          </View>
        </View>

        <View style={styles.aiCardContent}>
          <View style={styles.aiCardHeaderRow}>
            <Text style={styles.cardEyebrow} numberOfLines={1}>
              {recipe.cuisine || 'AI recipe'}
            </Text>
            <View style={styles.aiInlineBadge}>
              <Text style={styles.aiInlineBadgeText}>AI</Text>
            </View>
          </View>

          <Text style={styles.matchTitle} numberOfLines={2}>
            {recipe.name}
          </Text>
          <Text style={styles.sourceText}>{sourceLabel}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={palette.textMuted} />
            <Text style={styles.metaText}>{totalTime} min</Text>
            <Text style={styles.metaSeparator}>·</Text>
            <Ionicons name="flame-outline" size={13} color={palette.textMuted} />
            <Text style={styles.metaText}>{recipe.calories} kcal</Text>
          </View>

          <Text style={styles.aiCardDesc} numberOfLines={expanded ? undefined : 3}>
            {recipe.description}
          </Text>

          {recipe.tags?.length > 0 && (
            <View style={styles.tagRow}>
              {recipe.tags.slice(0, 4).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScalePressable>

      {expanded && (
        <>
          <View style={styles.divider} />

          <View style={styles.nutritionRow}>
            {[
              { label: 'Protein', value: `${recipe.nutrition?.protein ?? 0}g` },
              { label: 'Carbs', value: `${recipe.nutrition?.carbs ?? 0}g` },
              { label: 'Fat', value: `${recipe.nutrition?.fat ?? 0}g` },
              { label: 'Fiber', value: `${recipe.nutrition?.fiber ?? 0}g` },
            ].map((item) => (
              <View key={item.label} style={styles.nutritionPill}>
                <Text style={styles.nutritionValue}>{item.value}</Text>
                <Text style={styles.nutritionLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionBlockHeader}>
              <Text style={styles.sectionBlockTitle}>Ingredients</Text>
              <Text style={styles.sectionBlockCount}>{recipe.ingredients?.length ?? 0} items</Text>
            </View>
            <View style={styles.ingredientGrid}>
              {(recipe.ingredients ?? []).map((ingredient, index) => (
                <View key={`${ingredient.name}-${index}`} style={styles.ingredientChip}>
                  <View style={styles.ingDot} />
                  <Text style={styles.ingName}>{ingredient.name}</Text>
                  {(ingredient.quantity || ingredient.unit) && (
                    <Text style={styles.ingQty}>
                      {[ingredient.quantity, ingredient.unit].filter(Boolean).join(' ')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionBlockHeader}>
              <Text style={styles.sectionBlockTitle}>Steps</Text>
              <Text style={styles.sectionBlockCount}>{recipe.steps?.length ?? 0} steps</Text>
            </View>
            {(recipe.steps ?? []).map((step) => (
              <View key={step.step} style={styles.stepRow}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>{step.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>{step.instruction}</Text>
                  {step.time > 0 && (
                    <View style={styles.stepTimeRow}>
                      <Ionicons name="time-outline" size={11} color={palette.textMuted} />
                      <Text style={styles.stepTimeText}>{step.time} min</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.aiFooterRow}>
        <ScalePressable
          onPress={() => setExpanded((value) => !value)}
          style={styles.expandLink}
          pressedScale={0.98}
        >
          <Text style={styles.expandLinkText}>{expanded ? 'Show Less' : 'View Full Recipe'}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={palette.orange}
          />
        </ScalePressable>

        <View style={styles.cardActionRowCompact}>
          <ScalePressable
            onPress={onUpload}
            style={[styles.outlineAction, styles.compactActionHalf, isUploaded && styles.outlineActionActive]}
            pressedScale={0.96}
          >
            <Ionicons
              name={isUploaded ? 'cloud-done-outline' : 'cloud-upload-outline'}
              size={14}
              color={isUploaded ? palette.orange : palette.textSecondary}
            />
            <Text style={[styles.outlineActionText, isUploaded && styles.outlineActionTextActive]}>
              {isUploaded ? 'Uploaded' : 'Upload'}
            </Text>
          </ScalePressable>

          <ScalePressable
            onPress={onSave}
            style={[styles.outlineAction, styles.compactActionHalf, isSavedRecipe && styles.outlineActionActive]}
            pressedScale={0.96}
          >
            <Ionicons
              name={isSavedRecipe ? 'bookmark' : 'bookmark-outline'}
              size={14}
              color={isSavedRecipe ? palette.orange : palette.textSecondary}
            />
            <Text style={[styles.outlineActionText, isSavedRecipe && styles.outlineActionTextActive]}>
              Save
            </Text>
          </ScalePressable>

          <ScalePressable
            onPress={onPlanPress}
            style={[styles.primaryAction, styles.compactActionFull]}
            pressedScale={0.96}
          >
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Text style={styles.primaryActionText}>Plan</Text>
          </ScalePressable>
        </View>
      </View>
    </View>
  );
}

export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const profile = useUserStore((state) => state.profile);
  const { toggleSaved, isSaved } = useSavedStore();
  const addMeal = usePlannerStore((state) => state.addMeal);

  const palette = useMemo(() => getPalette(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [inputText, setInputText] = useState('');
  const [chips, setChips] = useState<string[]>([]);
  const [recentIngredients, setRecentIngredients] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [dbResults, setDbResults] = useState<IngredientMatchResult[]>([]);
  const [aiRecipes, setAiRecipes] = useState<AIRecipeSuggestion[]>([]);
  const [uploadedRecipeIds, setUploadedRecipeIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [planTarget, setPlanTarget] = useState<PlanTarget | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const pushRecentIngredient = useCallback((value: string) => {
    const normalized = normalizeIngredient(value);
    if (!normalized) {
      return;
    }
    setRecentIngredients((previous) => [normalized, ...previous.filter((item) => item !== normalized)].slice(0, 6));
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const addChipValue = useCallback((value: string) => {
    const normalized = normalizeIngredient(value);
    if (!normalized) {
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setChips((previous) => (previous.includes(normalized) ? previous : [...previous, normalized]));
    pushRecentIngredient(normalized);
  }, [pushRecentIngredient]);

  const removeChip = useCallback((chip: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setChips((previous) => previous.filter((item) => item !== chip));
  }, []);

  const handleInputChange = useCallback((text: string) => {
    if (!text.includes(',')) {
      setInputText(text);
      return;
    }

    const parts = text.split(',');
    const remainder = parts.pop() ?? '';
    const committed = parts.map(normalizeIngredient).filter(Boolean);

    if (committed.length > 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setChips((previous) => {
        const next = [...previous];
        committed.forEach((item) => {
          if (!next.includes(item)) {
            next.push(item);
          }
          pushRecentIngredient(item);
        });
        return next;
      });
    }

    setInputText(remainder.trimStart());
  }, [pushRecentIngredient]);

  const commitCurrentInput = useCallback(() => {
    const normalized = normalizeIngredient(inputText);
    if (!normalized) {
      return;
    }
    addChipValue(normalized);
    setInputText('');
  }, [addChipValue, inputText]);

  const runAIGeneration = useCallback(
    async (ingredientList: string[]) => {
      setPhase('generating_ai');
      const dietPref = profile?.dietPreferences?.[0];
      const userId = profile?.id ?? null;

      try {
        const suggestions = await generateRecipesFromIngredients(ingredientList, dietPref);

        const savedRecipes = await Promise.all(
          suggestions.map(async (recipe) => {
            const supabaseId = await saveAIRecipeToSupabase(recipe, userId, ingredientList);
            return supabaseId ? { ...recipe, id: supabaseId } : recipe;
          }),
        );

        setAiRecipes(savedRecipes);
        setUploadedRecipeIds([]);
        setPhase('ai_results');
      } catch (error: any) {
        setErrorMsg(error?.message ?? 'AI generation failed. Please try again.');
        setPhase('error');
      }
    },
    [profile],
  );

  const handleSearch = useCallback(async () => {
    const currentInput = normalizeIngredient(inputText);
    const allChips = currentInput ? [...chips, currentInput] : chips;

    if (allChips.length === 0) {
      return;
    }

    allChips.forEach(pushRecentIngredient);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setChips(Array.from(new Set(allChips)));
    setInputText('');
    setPhase('searching');
    setDbResults([]);
    setAiRecipes([]);
    setErrorMsg('');

    try {
      const canonicalIngredients = await canonicalizeIngredients(allChips);
      const ingredientsForSearch = canonicalIngredients.length > 0 ? canonicalIngredients : allChips;

      const results = await searchRecipesByIngredients(ingredientsForSearch, { limit: 3 });
      setDbResults(results);

      if (results.length > 0) {
        setPhase('db_results');
      } else {
        await runAIGeneration(ingredientsForSearch);
      }
    } catch (error: any) {
      setErrorMsg(error?.message ?? 'Search failed. Please try again.');
      setPhase('error');
    }
  }, [chips, inputText, runAIGeneration, pushRecentIngredient]);

  const handleReset = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPhase('idle');
    setDbResults([]);
    setAiRecipes([]);
    setUploadedRecipeIds([]);
    setChips([]);
    setInputText('');
    setErrorMsg('');
  }, []);

  const handlePlanConfirm = useCallback(
    (day: DayOfWeek, mealType: MealType) => {
      if (!planTarget) {
        return;
      }

      addMeal(day, mealType, planTarget.recipeId, 2, planTarget.recipeSource);
      setPlanTarget(null);
      showToast(`Added to ${day} ${mealType}`);
    },
    [addMeal, planTarget, showToast],
  );

  const handleUploadRecipe = useCallback(
    async (recipe: AIRecipeSuggestion) => {
      const userId = profile?.id ?? null;
      if (!userId) {
        showToast('Please login to upload recipe');
        return;
      }

      if (!isUuidLike(recipe.id)) {
        showToast('Recipe must be saved before uploading');
        return;
      }

      if (uploadedRecipeIds.includes(recipe.id)) {
        return;
      }

      const { error } = await supabase
        .from('user_ai_generated_recipes')
        .update({ is_public: true })
        .eq('id', recipe.id)
        .eq('user_id', userId);

      if (error) {
        showToast('Upload failed. Please try again');
        return;
      }

      void invalidateRecipeQueryCaches();
      setUploadedRecipeIds((previous) => (previous.includes(recipe.id) ? previous : [...previous, recipe.id]));
      showToast('Recipe uploaded to public');
    },
    [profile?.id, showToast, uploadedRecipeIds],
  );

  const normalizedInput = normalizeIngredient(inputText);
  const suggestedIngredients = useMemo(() => {
    const source = normalizedInput.length > 0
      ? POPULAR_INGREDIENTS.filter((ingredient) => ingredient.includes(normalizedInput))
      : POPULAR_INGREDIENTS;

    return source.filter((ingredient) => !chips.includes(ingredient)).slice(0, 6);
  }, [chips, normalizedInput]);

  const recentIngredientChips = recentIngredients.filter((ingredient) => !chips.includes(ingredient)).slice(0, 4);

  const isLoading = phase === 'searching' || phase === 'generating_ai';
  const showResults = phase === 'db_results' || phase === 'ai_results';
  const showIngredientComposer = phase === 'idle' || phase === 'error';
  const hasStateToReset = chips.length > 0 || inputText.trim().length > 0 || showResults;
  const canSearch = (chips.length > 0 || inputText.trim().length > 0) && !isLoading;
  const showEmptyState =
    showIngredientComposer && phase === 'idle' && chips.length === 0 && inputText.trim().length === 0;

  return (
    <KeyboardAvoidingView style={styles.keyboardRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.screen}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <ScalePressable onPress={() => router.back()} style={styles.headerIcon} pressedScale={0.95}>
            <Ionicons name="arrow-back" size={22} color={palette.white70} />
          </ScalePressable>

          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>AI Recipe Finder</Text>
            <Text style={styles.headerSubtitle}>Find recipes using ingredients you have</Text>
          </View>

          <ScalePressable
            onPress={handleReset}
            style={[styles.headerIcon, !hasStateToReset && styles.headerIconDisabled]}
            pressedScale={0.95}
            disabled={!hasStateToReset}
          >
            <Ionicons name="refresh-outline" size={22} color={palette.white70} />
          </ScalePressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
        >
          {showIngredientComposer && (
            <View style={styles.inputCard}>
              <View style={styles.inputHeadingBlock}>
                <Text style={styles.inputTitle}>Add Ingredients</Text>
                <Text style={styles.inputCaption}>Add items you have in your kitchen</Text>
              </View>

              <View style={styles.tipRow}>
                <Ionicons name="sparkles-outline" size={13} color={palette.orange} />
                <Text style={styles.tipText}>Tip: Add 2-5 ingredients for best AI results</Text>
              </View>

              <View style={styles.inputShell}>
                <Ionicons name="add-circle-outline" size={20} color={palette.textMuted} />
                <TextInput
                  ref={inputRef}
                  style={styles.textInput}
                  placeholder="Add ingredient (tomato, egg...)"
                  placeholderTextColor={palette.textMuted}
                  value={inputText}
                  onChangeText={handleInputChange}
                  onSubmitEditing={commitCurrentInput}
                  returnKeyType="done"
                  editable={!isLoading}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {inputText.trim().length > 0 && (
                  <ScalePressable onPress={commitCurrentInput} style={styles.inlineAddBtn} pressedScale={0.95}>
                    <Text style={styles.inlineAddBtnText}>Add</Text>
                  </ScalePressable>
                )}
              </View>

              <View style={styles.sectionMiniHeader}>
                <Text style={styles.sectionMiniTitle}>Selected ({chips.length})</Text>
              </View>

              {chips.length > 0 ? (
                <View style={styles.chipWrap}>
                  {chips.map((chip) => (
                    <ScalePressable
                      key={chip}
                      onPress={() => removeChip(chip)}
                      style={styles.chip}
                      pressedScale={0.96}
                    >
                      <Text style={styles.chipText}>{chip}</Text>
                      <Ionicons name="close" size={13} color={palette.orangeSoft} />
                    </ScalePressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.sectionEmptyText}>No ingredients selected yet</Text>
              )}

              {recentIngredientChips.length > 0 && normalizedInput.length === 0 && (
                <>
                  <View style={styles.sectionMiniHeader}>
                    <Text style={styles.sectionMiniTitle}>Recent</Text>
                  </View>
                  <View style={styles.suggestionsWrap}>
                    {recentIngredientChips.map((ingredient) => (
                      <ScalePressable
                        key={`recent-${ingredient}`}
                        onPress={() => addChipValue(ingredient)}
                        style={styles.recentChip}
                        pressedScale={0.96}
                      >
                        <Ionicons name="time-outline" size={12} color={palette.textSecondary} />
                        <Text style={styles.recentChipText}>{ingredient}</Text>
                      </ScalePressable>
                    ))}
                  </View>
                </>
              )}

              <View style={styles.sectionMiniHeader}>
                <Text style={styles.sectionMiniTitle}>Suggestions</Text>
              </View>
              <View style={styles.suggestionsWrap}>
                {suggestedIngredients.map((ingredient) => (
                  <ScalePressable
                    key={ingredient}
                    onPress={() => {
                      addChipValue(ingredient);
                      setInputText('');
                    }}
                    style={styles.suggestionChip}
                    pressedScale={0.96}
                  >
                    <Ionicons name="add" size={14} color={palette.textSecondary} />
                    <Text style={styles.suggestionChipText}>{ingredient}</Text>
                  </ScalePressable>
                ))}
              </View>

              <ScalePressable onPress={handleSearch} disabled={!canSearch} style={styles.searchBtn} pressedScale={0.96}>
                {canSearch ? (
                  <LinearGradient
                    colors={[palette.orange, palette.orangeGradientEnd]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.searchGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="search-outline" size={21} color="#fff" />
                        <Text style={styles.searchBtnText}>Find Recipes</Text>
                      </>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={[styles.searchGradient, styles.searchDisabled]}>
                    <Ionicons name="search-outline" size={21} color={palette.textMuted} />
                    <Text style={[styles.searchBtnText, styles.searchBtnTextDisabled]}>Find Recipes</Text>
                  </View>
                )}
              </ScalePressable>
            </View>
          )}

          {showEmptyState && (
            <View style={styles.emptyStateBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="nutrition-outline" size={26} color={palette.orange} />
              </View>
              <Text style={styles.emptyTitle}>Add ingredients to find recipes</Text>
              <Text style={styles.emptySubtitle}>Start with 2 to 5 ingredients to get better matching and AI suggestions</Text>
            </View>
          )}

          {phase === 'searching' && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={palette.orange} size="large" />
              <Text style={styles.loadingTitle}>Finding recipes...</Text>
              <Text style={styles.loadingSubtitle}>Looking through the database for the closest matches</Text>
            </View>
          )}

          {phase === 'generating_ai' && (
            <View style={styles.loadingBox}>
              <View style={styles.aiSectionIconBadge}>
                <Ionicons name="sparkles-outline" size={18} color={palette.orange} />
              </View>
              <ActivityIndicator color={palette.orange} size="large" />
              <Text style={styles.loadingTitle}>
                {dbResults.length === 0 ? 'Generating recipes with AI' : 'Generating more recipes'}
              </Text>
              <Text style={styles.loadingSubtitle}>Crafting personalised options from your ingredients</Text>
            </View>
          )}

          {phase === 'error' && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={32} color={palette.orangeSoft} />
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorMsg}>{errorMsg}</Text>
              <ScalePressable onPress={handleSearch} style={styles.retryBtn} pressedScale={0.96}>
                <Text style={styles.retryText}>Try Again</Text>
              </ScalePressable>
            </View>
          )}

          {(phase === 'db_results' || phase === 'ai_results') && dbResults.length > 0 && (
            <View style={styles.resultsSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBadge}>
                  <Ionicons name="albums-outline" size={16} color={palette.green} />
                </View>
                <View style={styles.sectionCopy}>
                  <Text style={styles.sectionTitle}>Top Matches</Text>
                  <Text style={styles.sectionSubtitle}>{dbResults.length} recipes from database</Text>
                </View>
              </View>

              {dbResults.map((result) => (
                <MatchCard
                  key={result.recipe.id}
                  result={result}
                  onPlanPress={() =>
                    setPlanTarget({
                      recipeId: result.recipe.id,
                      recipeName: result.recipe.name,
                      recipeSource: result.source === 'ai' ? 'ai' : 'master',
                    })
                  }
                  palette={palette}
                  styles={styles}
                />
              ))}

              {phase === 'db_results' && (
                <ScalePressable
                  onPress={() => runAIGeneration(chips)}
                  style={styles.generateMoreBtn}
                  pressedScale={0.98}
                >
                  <View style={styles.generateMoreLeft}>
                    <Ionicons name="sparkles-outline" size={18} color={palette.orange} />
                  </View>
                  <View style={styles.generateMoreCopy}>
                    <Text style={styles.generateMoreTitle}>Create More Recipes With AI</Text>
                    <Text style={styles.generateMoreSub}>Let AI create personalised recipes</Text>
                  </View>
                  <Ionicons name="arrow-forward-outline" size={18} color={palette.orange} />
                </ScalePressable>
              )}
            </View>
          )}

          {phase === 'ai_results' && aiRecipes.length > 0 && (
            <View style={styles.resultsSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.aiSectionIconBadge}>
                  <Ionicons name="hardware-chip-outline" size={16} color={palette.orange} />
                </View>
                <View style={styles.sectionCopy}>
                  <Text style={styles.sectionTitle}>AI Created Recipes</Text>
                  <Text style={styles.sectionSubtitle}>Personalised for your ingredients</Text>
                </View>
              </View>

              {aiRecipes.map((recipe) => (
                <AIRecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onUpload={() => handleUploadRecipe(recipe)}
                  isUploaded={uploadedRecipeIds.includes(recipe.id)}
                  isSavedRecipe={isSaved(recipe.id, 'ai')}
                  onSave={() => toggleSaved(recipe.id, 'ai')}
                  onPlanPress={() =>
                    setPlanTarget({ recipeId: recipe.id, recipeName: recipe.name, recipeSource: 'ai' })
                  }
                  sourceLabel="Source: user_ai_generated_recipes (Groq)"
                  palette={palette}
                  styles={styles}
                />
              ))}

              <ScalePressable
                onPress={() => runAIGeneration(chips)}
                style={styles.generateMoreBtn}
                pressedScale={0.98}
              >
                <View style={styles.generateMoreLeft}>
                  <Ionicons name="sparkles-outline" size={18} color={palette.orange} />
                </View>
                <View style={styles.generateMoreCopy}>
                  <Text style={styles.generateMoreTitle}>Create More Recipes With AI</Text>
                  <Text style={styles.generateMoreSub}>Generate another fresh set from your ingredients</Text>
                </View>
                <Ionicons name="arrow-forward-outline" size={18} color={palette.orange} />
              </ScalePressable>
            </View>
          )}
        </ScrollView>

        {toast !== null && (
          <View style={[styles.toastBar, { bottom: insets.bottom + 16 }]} pointerEvents="none">
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}

        <AddToPlanModal
          visible={planTarget !== null}
          recipeName={planTarget?.recipeName ?? ''}
          onClose={() => setPlanTarget(null)}
          onConfirm={handlePlanConfirm}
          palette={palette}
          styles={styles}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(palette: Palette) {
  return StyleSheet.create({
    keyboardRoot: { flex: 1 },
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      gap: 12,
    },
    headerIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    headerIconDisabled: {
      opacity: 0.35,
    },
    headerCopy: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: palette.text,
    },
    headerSubtitle: {
      marginTop: 4,
      fontSize: 14,
      color: palette.textSecondary,
      opacity: 0.8,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    inputCard: {
      backgroundColor: palette.cardStrong,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: palette.border,
      marginBottom: 24,
    },
    inputHeadingBlock: {
      marginBottom: 10,
    },
    inputTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.text,
    },
    inputCaption: {
      marginTop: 4,
      fontSize: 14,
      color: palette.textSecondary,
      opacity: 0.9,
    },
    tipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    tipText: {
      color: palette.textSecondary,
      fontSize: 12,
    },
    inputShell: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: palette.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.borderSoft,
      paddingHorizontal: 14,
    },
    textInput: {
      flex: 1,
      color: palette.text,
      fontSize: 16,
      paddingVertical: 11,
    },
    inlineAddBtn: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: palette.white12,
      backgroundColor: palette.surface,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    inlineAddBtnText: {
      color: palette.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    sectionMiniHeader: {
      marginTop: 14,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionMiniTitle: {
      color: palette.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    sectionEmptyText: {
      color: palette.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: palette.orangeWash,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.orange,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipText: {
      fontSize: 13,
      color: palette.text,
      fontWeight: '600',
    },
    suggestionsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    suggestionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: 'transparent',
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    suggestionChipText: {
      color: palette.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    recentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.borderSoft,
      backgroundColor: palette.surface,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    recentChipText: {
      color: palette.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    searchBtn: {
      marginTop: 16,
    },
    searchGradient: {
      height: 52,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    searchDisabled: {
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.borderSoft,
      shadowOpacity: 0,
      elevation: 0,
    },
    searchBtnText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '600',
    },
    searchBtnTextDisabled: {
      color: palette.textMuted,
    },
    emptyStateBox: {
      alignItems: 'center',
      gap: 8,
      padding: 22,
      marginBottom: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.borderSoft,
      backgroundColor: palette.card,
    },
    emptyIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.emptyIconBg,
      marginBottom: 4,
    },
    emptyTitle: {
      color: palette.text,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    emptySubtitle: {
      color: palette.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
    },
    loadingBox: {
      alignItems: 'center',
      gap: 12,
      paddingVertical: 42,
      marginBottom: 28,
      backgroundColor: palette.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.borderSoft,
    },
    loadingTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.text,
    },
    loadingSubtitle: {
      fontSize: 13,
      color: palette.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 28,
      lineHeight: 20,
    },
    errorBox: {
      backgroundColor: palette.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.borderSoft,
      alignItems: 'center',
      gap: 10,
      padding: 24,
      marginBottom: 28,
    },
    errorTitle: {
      fontSize: 18,
      color: palette.text,
      fontWeight: '600',
    },
    errorMsg: {
      color: palette.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
    },
    retryBtn: {
      marginTop: 4,
      backgroundColor: palette.orange,
      borderRadius: 12,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    retryText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    resultsSection: {
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    sectionCopy: {
      flex: 1,
    },
    sectionIconBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: palette.greenBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiSectionIconBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: palette.orangeBadge,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      color: palette.text,
      fontSize: 18,
      fontWeight: '600',
    },
    sectionSubtitle: {
      marginTop: 2,
      color: palette.textSecondary,
      fontSize: 13,
    },
    matchCard: {
      backgroundColor: palette.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.borderSoft,
      padding: 14,
      marginBottom: 16,
    },
    aiCard: {
      backgroundColor: palette.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.borderSoft,
      padding: 14,
      marginBottom: 16,
    },
    cardMainPressable: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
    },
    matchMediaWrap: {
      paddingTop: 2,
    },
    matchMedia: {
      width: 64,
      height: 64,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: palette.surface,
    },
    matchMediaFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.orangeBadge,
    },
    matchImage: {
      width: '100%',
      height: '100%',
    },
    matchPlaceholderImage: {
      width: 42,
      height: 42,
    },
    dietDot: {
      position: 'absolute',
      top: 6,
      left: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    matchContent: {
      flex: 1,
      gap: 8,
    },
    aiCardContent: {
      flex: 1,
      gap: 8,
    },
    aiThumbWrap: {
      paddingTop: 2,
    },
    aiThumb: {
      width: 64,
      height: 64,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.orangeBadge,
    },
    aiCardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    cardEyebrow: {
      color: palette.textSecondary,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontWeight: '600',
      flex: 1,
    },
    aiInlineBadge: {
      backgroundColor: palette.orange,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    aiInlineBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
    matchTitle: {
      color: palette.text,
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 22,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      color: palette.textMuted,
      fontSize: 13,
    },
    metaSeparator: {
      color: palette.textMuted,
      fontSize: 13,
      marginHorizontal: 2,
    },
    matchBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    matchBarBg: {
      flex: 1,
      height: 6,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: palette.progressTrack,
    },
    matchBarFill: {
      height: '100%',
      borderRadius: 10,
      backgroundColor: palette.orange,
    },
    matchBarLabel: {
      minWidth: 108,
      color: palette.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    missingText: {
      color: palette.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    cardActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    cardActionRowCompact: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap',
      width: '100%',
    },
    compactActionHalf: {
      flexBasis: '48%',
      flexGrow: 1,
      minWidth: 0,
      paddingHorizontal: 10,
    },
    compactActionFull: {
      width: '100%',
      minWidth: 0,
    },
    outlineAction: {
      minWidth: 90,
      height: 38,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.white12,
      backgroundColor: palette.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    outlineActionActive: {
      borderColor: palette.orange,
      backgroundColor: palette.orangeBadge,
    },
    outlineActionText: {
      color: palette.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    outlineActionTextActive: {
      color: palette.orange,
    },
    primaryAction: {
      minWidth: 90,
      height: 38,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: palette.orange,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    primaryActionText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    aiCardDesc: {
      color: palette.textSecondary,
      fontSize: 14,
      lineHeight: 22,
    },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: palette.surface,
    },
    tagText: {
      color: palette.textMuted,
      fontSize: 11,
      fontWeight: '500',
    },
    divider: {
      height: 1,
      backgroundColor: palette.borderSoft,
      marginVertical: 14,
    },
    nutritionRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    nutritionPill: {
      flex: 1,
      backgroundColor: palette.surface,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: 'center',
      gap: 4,
    },
    nutritionValue: {
      color: palette.orange,
      fontSize: 15,
      fontWeight: '700',
    },
    nutritionLabel: {
      color: palette.textMuted,
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionBlock: {
      marginBottom: 16,
    },
    sectionBlockHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 10,
    },
    sectionBlockTitle: {
      color: palette.text,
      fontSize: 15,
      fontWeight: '600',
    },
    sectionBlockCount: {
      color: palette.textMuted,
      fontSize: 12,
    },
    ingredientGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    ingredientChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: palette.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.borderSoft,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    ingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: palette.orange,
    },
    ingName: {
      color: palette.text,
      fontSize: 13,
      fontWeight: '600',
    },
    ingQty: {
      color: palette.textMuted,
      fontSize: 11,
    },
    stepRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
      alignItems: 'flex-start',
    },
    stepNumCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: palette.orange,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
    stepContent: {
      flex: 1,
      gap: 4,
    },
    stepText: {
      color: palette.text,
      fontSize: 13,
      lineHeight: 20,
    },
    stepTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    stepTimeText: {
      color: palette.textMuted,
      fontSize: 11,
    },
    aiFooterRow: {
      marginTop: 8,
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: 10,
    },
    expandLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
    },
    expandLinkText: {
      color: palette.orange,
      fontSize: 13,
      fontWeight: '600',
    },
    generateMoreBtn: {
      borderRadius: 16,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: palette.orange,
      backgroundColor: palette.card,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    generateMoreLeft: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.orangeBadge,
    },
    generateMoreCopy: {
      flex: 1,
    },
    generateMoreTitle: {
      color: palette.text,
      fontSize: 16,
      fontWeight: '600',
    },
    generateMoreSub: {
      marginTop: 2,
      color: palette.textSecondary,
      fontSize: 13,
    },
    generatedByText: {
      color: palette.orangeSoft,
      fontSize: 11,
      fontWeight: '500',
    },
    sourceText: {
      color: palette.textMuted,
      fontSize: 11,
      fontWeight: '500',
    },
    toastBar: {
      position: 'absolute',
      left: 20,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 14,
      backgroundColor: palette.orange,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    toastText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: palette.overlay,
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: palette.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 30,
    },
    modalHandle: {
      alignSelf: 'center',
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: palette.white12,
      marginBottom: 16,
    },
    modalTitle: {
      color: palette.text,
      fontSize: 20,
      fontWeight: '600',
    },
    modalRecipeName: {
      marginTop: 6,
      marginBottom: 14,
      color: palette.orangeSoft,
      fontSize: 15,
      fontWeight: '600',
    },
    modalLabel: {
      color: palette.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      marginTop: 12,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    pill: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.white12,
      backgroundColor: palette.surface,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    pillActive: {
      backgroundColor: palette.orange,
      borderColor: palette.orange,
    },
    pillText: {
      color: palette.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    pillTextActive: {
      color: '#fff',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 18,
    },
    modalCancelBtn: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.white12,
      backgroundColor: palette.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCancelText: {
      color: palette.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    modalConfirmBtn: {
      flex: 1.4,
      height: 46,
      borderRadius: 12,
      backgroundColor: palette.orange,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    modalConfirmText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
