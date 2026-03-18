import React, { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../theme';
import { ConfirmModal } from './ConfirmModal';
import {
  UserFitnessProfile,
  AIDietPlan,
  MealItem,
  ActivityLevel,
  DietGoal,
  DietType,
  Gender,
  calculateNutrition,
  generateAIDietPlan,
} from '../services/aiDietService';
import {
  saveAiDietPlan,
  deleteAiDietPlan,
  uploadAiDietPlan,
  upsertAiDietPlanMeals,
  AiDietPlanMealSelection,
  SavedAiDietPlanMeal,
  findMasterRecipeMatchesForMealsBatch,
} from '../services/aiPlanSupabaseService';
import { useRouter } from 'expo-router';
import { usePlannerStore } from '../store/plannerStore';
import { useRecipeStore } from '../store/recipeStore';
import { useUserStore } from '../store/userStore';
import { DayOfWeek, MealType, Recipe, UserHealthProfile } from '../types';
import { getDailyNutritionTargets, getExceededTargetKeys, sumNutritionFromRecipes } from '../utils/plannerNutrition';
import { getRecipeByIdFromSource } from '../services/searchService';
import * as Crypto from 'expo-crypto';

// diet preference string → DietType mapping
const DIET_PREF_TO_TYPE: Record<string, DietType> = {
  Vegetarian:       'vegetarian',
  Vegan:            'vegan',
  'Non-Vegetarian': 'non_veg',
  Eggetarian:       'eggetarian',
  Jain:             'vegetarian',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MEAL_MAP: {
  key: keyof Pick<AIDietPlan, 'breakfast' | 'lunch' | 'dinner' | 'snacks'>;
  mealType: MealType;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { key: 'breakfast', mealType: 'Breakfast', label: 'Breakfast', emoji: '☀️', color: '#F59E0B' },
  { key: 'lunch',     mealType: 'Lunch',     label: 'Lunch',     emoji: '🌤️', color: '#22C55E' },
  { key: 'snacks',    mealType: 'Snack',     label: 'Snacks',    emoji: '☕', color: '#8B5CF6' },
  { key: 'dinner',    mealType: 'Dinner',    label: 'Dinner',    emoji: '🌙', color: '#3B82F6' },
];

const DIET_LABEL_MAP: Record<string, Recipe['diet']> = {
  vegetarian: 'Vegetarian',
  eggetarian: 'Eggetarian',
  non_veg: 'Non-Vegetarian',
  vegan: 'Vegan',
};

const PROMPT_SUGGESTIONS = [
  'South Indian style',
  'North Indian style',
  'Low budget',
  'No onion garlic',
  'Quick to cook',
  'High fiber',
];

// ─── Build one Recipe per MealItem ───────────────────────────────────────────
// Each food item in the AI plan becomes its own Recipe with real cooking steps.

function buildRecipeFromItem(
  item: MealItem,
  mealType: string,
  goalLabel: string,
  dietType: string,
  plan: AIDietPlan,
  fraction: number
): Recipe {
  // Generate a UUID so this recipe can be stored in user_recipes (v3: UUID PK)
  const id = Crypto.randomUUID();

  // Cooking steps from the item, or a sensible fallback
  const steps: Recipe['steps'] =
    item.steps && item.steps.length > 0
      ? item.steps.map((s) => ({ step: s.step, instruction: s.instruction, time: s.time }))
      : [
          { step: 1, instruction: `Prepare ${item.quantity} of ${item.name}.`, time: 5 },
          { step: 2, instruction: 'Cook as per standard method until done.', time: 10 },
          { step: 3, instruction: 'Plate and serve hot.', time: 2 },
        ];

  const totalStepTime = steps.reduce((s, st) => s + st.time, 0);

  // Map individual ingredients; fall back to a single entry using quantity summary
  const ingredients: Recipe['ingredients'] =
    item.ingredients && item.ingredients.length > 0
      ? item.ingredients.map((ing) => ({ name: ing.name, quantity: 0, unit: ing.amount }))
      : [{ name: item.name, quantity: 0, unit: item.quantity }];

  return {
    id,
    name: item.name,
    cuisine: 'AI Coach',
    diet: DIET_LABEL_MAP[dietType] ?? 'Vegetarian',
    difficulty: 'Easy',
    cook_time: totalStepTime || 15,
    prep_time: 5,
    servings: 1,
    calories: item.calories ?? Math.round(plan.total_calories * fraction),
    rating: 0,
    reviews: 0,
    image: '',
    description: `${item.quantity}`,
    ingredients,
    preparation: [],
    nutrition: {
      protein: item.protein_g ?? Math.round(plan.protein_g * fraction),
      carbs: Math.round(plan.carbs_g * fraction),
      fat: Math.round(plan.fat_g * fraction),
      fiber: Math.round(plan.carbs_g * fraction * 0.1),
      sugar: 0,
    },
    equipment: [],
    steps,
    tips: goalLabel ? [`Optimized for ${goalLabel}`] : [],
    tags: ['AI Generated'],
  };
}

// ─── Day Selector (multi-select) ─────────────────────────────────────────────

function DaySelector({
  selected,
  onToggle,
  onToggleAll,
  colors,
  compact,
}: {
  selected: DayOfWeek[];
  onToggle: (d: DayOfWeek) => void;
  onToggleAll: () => void;
  colors: any;
  compact?: boolean;
}) {
  const allSelected = selected.length === ALL_DAYS.length;
  return (
    <View style={[ds.container, compact && ds.containerCompact]}>
      <Text style={[ds.label, compact && ds.labelCompact, { color: colors.text }]}>Add to Planner — Select Day(s)</Text>
      <View style={[ds.row, compact && ds.rowCompact]}>
        <TouchableOpacity
          onPress={onToggleAll}
          style={[ds.chip, compact && ds.chipCompact, {
            backgroundColor: allSelected ? colors.accent : colors.surface,
            borderColor: allSelected ? colors.accent : colors.border,
          }]}
          activeOpacity={0.75}
        >
          <Text style={[ds.chipText, compact && ds.chipTextCompact, { color: allSelected ? '#FFF' : colors.textSecondary }]}>All</Text>
        </TouchableOpacity>
        {ALL_DAYS.map((day) => {
          const active = selected.includes(day);
          return (
            <TouchableOpacity
              key={day}
              onPress={() => onToggle(day)}
              style={[ds.chip, compact && ds.chipCompact, {
                backgroundColor: active ? colors.accent : colors.surface,
                borderColor: active ? colors.accent : colors.border,
              }]}
              activeOpacity={0.75}
            >
              <Text style={[ds.chipText, compact && ds.chipTextCompact, { color: active ? '#FFF' : colors.textSecondary }]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {selected.length > 0 && (
        <Text style={[ds.hint, compact && ds.hintCompact, { color: colors.textTertiary }]}>
          {selected.length === 7
            ? 'Full week plan selected'
            : `${selected.length} day${selected.length > 1 ? 's' : ''} selected: ${selected.join(', ')}`}
        </Text>
      )}
    </View>
  );
}

// ─── Meal Section — with per-item recipe toggle ───────────────────────────────

const MealSection = memo(function MealSection({
  title,
  emoji,
  items,
  colors,
  accentColor,
  compact,
}: {
  title: string;
  emoji: string;
  items: MealItem[];
  colors: any;
  accentColor?: string;
  compact?: boolean;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [detailTab, setDetailTab] = useState<'ingredients' | 'steps'>('ingredients');
  const color = accentColor ?? colors.accent;
  const totalCal = items.reduce((s, i) => s + (i.calories ?? 0), 0);
  const totalProt = items.reduce((s, i) => s + (i.protein_g ?? 0), 0);

  const activeIdx = selectedIdx ?? 0;
  const activeItem = items[activeIdx] ?? items[0] ?? null;

  useEffect(() => {
    setExpanded(false);
    setDetailTab('ingredients');
    setSelectedIdx(null);
  }, [items.length]);

  return (
    <View style={[ms.card, compact && ms.cardCompact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={[ms.header, compact && ms.headerCompact]}>
        <View style={[ms.iconWrap, { backgroundColor: color + '22' }]}>
          <Text style={ms.emoji}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[ms.title, compact && ms.titleCompact, { color: colors.text }]}>{title}</Text>
          <Text style={[ms.meta, compact && ms.metaCompact, { color: colors.textTertiary }]}>
            ~{totalCal} kcal · {totalProt}g protein
          </Text>
        </View>
      </View>

      {/* Recipe Toggle — one chip per item */}
      {items.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: Spacing.md, marginBottom: 4 }}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedIdx(null)}
            style={[
              ms.recipeChip,
              {
                backgroundColor: selectedIdx === null ? color : colors.background,
                borderColor: selectedIdx === null ? color : colors.border,
              },
            ]}
            activeOpacity={0.75}
          >
            <Text style={[ms.recipeChipText, { color: selectedIdx === null ? '#FFF' : colors.textSecondary }]}>
              All
            </Text>
          </TouchableOpacity>
          {items.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setSelectedIdx(selectedIdx === i ? null : i)}
              style={[
                ms.recipeChip,
                {
                  backgroundColor: selectedIdx === i ? color : colors.background,
                  borderColor: selectedIdx === i ? color : colors.border,
                },
              ]}
              activeOpacity={0.75}
            >
              <Text
                style={[ms.recipeChipText, { color: selectedIdx === i ? '#FFF' : colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Compact list */}
      {items.map((item, i) => {
        const active = i === activeIdx;
        return (
          <TouchableOpacity
            key={`${item.name}-${i}`}
            onPress={() => setSelectedIdx(i)}
            activeOpacity={0.82}
            style={[
              ms.itemRow,
              compact && ms.itemRowCompact,
              {
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: active ? color + '14' : 'transparent',
              },
            ]}
          >
            <View style={[ms.dot, { backgroundColor: color }]} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[ms.itemName, compact && ms.itemNameCompact, { color: colors.text }]}>{item.name}</Text>
              <Text style={[ms.itemQty, compact && ms.itemQtyCompact, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.quantity}
              </Text>
            </View>
            <View style={ms.itemNutrition}>
              {item.calories != null && (
                <Text style={[ms.itemCal, compact && ms.itemCalCompact, { color: colors.textTertiary }]}>{item.calories} kcal</Text>
              )}
              {item.protein_g != null && item.protein_g > 0 && (
                <Text style={[ms.itemProt, compact && ms.itemProtCompact, { color: '#3B82F6' }]}>{item.protein_g}g P</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {!!activeItem && (
        <View style={[ms.expandWrap, { borderTopColor: colors.border }]}> 
          <TouchableOpacity
            onPress={() => setExpanded((prev) => !prev)}
            style={[ms.expandBtn, { borderColor: color, backgroundColor: expanded ? color + '16' : 'transparent' }]}
            activeOpacity={0.8}
          >
            <Ionicons name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={14} color={color} />
            <Text style={[ms.expandBtnText, { color }]}>
              {expanded ? 'Hide Details' : 'Show More'}
            </Text>
          </TouchableOpacity>

          {expanded && (
            <View style={[ms.detailsCard, { backgroundColor: color + '0D', borderColor: colors.border }]}> 
              <View style={ms.detailToggleRow}>
                <TouchableOpacity
                  onPress={() => setDetailTab('ingredients')}
                  style={[
                    ms.detailTabBtn,
                    {
                      backgroundColor: detailTab === 'ingredients' ? color : colors.background,
                      borderColor: detailTab === 'ingredients' ? color : colors.border,
                    },
                  ]}
                >
                  <Text style={[ms.detailTabText, { color: detailTab === 'ingredients' ? '#FFF' : colors.textSecondary }]}>
                    Ingredients
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDetailTab('steps')}
                  style={[
                    ms.detailTabBtn,
                    {
                      backgroundColor: detailTab === 'steps' ? color : colors.background,
                      borderColor: detailTab === 'steps' ? color : colors.border,
                    },
                  ]}
                >
                  <Text style={[ms.detailTabText, { color: detailTab === 'steps' ? '#FFF' : colors.textSecondary }]}>
                    Steps
                  </Text>
                </TouchableOpacity>
              </View>

              {detailTab === 'ingredients' ? (
                <View style={ms.partitionWrap}>
                  {(activeItem.ingredients ?? []).length > 0 ? (
                    activeItem.ingredients.map((ing, idx) => (
                      <View
                        key={`${ing.name}-${idx}`}
                        style={[
                          ms.partitionRow,
                          { borderTopColor: colors.border, borderTopWidth: idx === 0 ? 0 : 1 },
                        ]}
                      >
                        <Text style={[ms.ingName, { color: colors.text }]}>{ing.name}</Text>
                        <Text style={[ms.ingAmt, { color }]}>{ing.amount || '-'}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[ms.emptyHint, { color: colors.textTertiary }]}>No ingredient details available.</Text>
                  )}
                </View>
              ) : (
                <View style={ms.partitionWrap}>
                  {(activeItem.steps ?? []).length > 0 ? (
                    activeItem.steps.map((s, idx) => (
                      <View
                        key={s.step}
                        style={[
                          ms.partitionRow,
                          ms.stepPartitionRow,
                          { borderTopColor: colors.border, borderTopWidth: idx === 0 ? 0 : 1 },
                        ]}
                      >
                        <View style={[ms.stepBadge, { backgroundColor: color }]}>
                          <Text style={ms.stepBadgeText}>{s.step}</Text>
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={[ms.stepInstruction, { color: colors.text }]}>{s.instruction}</Text>
                          {s.time > 0 && (
                            <Text style={[ms.stepTime, { color: color }]}>⏱ {s.time} min</Text>
                          )}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={[ms.emptyHint, { color: colors.textTertiary }]}>No cooking steps available.</Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
});

// ─── Macro Bar ────────────────────────────────────────────────────────────────

const MacroBar = memo(function MacroBar({
  label,
  value,
  unit,
  color,
  total,
  colors,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  total: number;
  colors: any;
}) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <View style={mb.row}>
      <Text style={[mb.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[mb.track, { backgroundColor: colors.border }]}>
        <View style={[mb.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[mb.val, { color: color }]}>
        {value}
        {unit}
      </Text>
    </View>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Step = 'form' | 'loading' | 'result';
type PlanOrigin = 'public' | 'ai';

interface UploadDialogState {
  visible: boolean;
  title: string;
  message: string;
  icon: string;
  iconColor: string;
}

type DailyPlanMap = Partial<Record<DayOfWeek, AIDietPlan>>;

function normalizeMealName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

const REQUIRED_FIELDS: { key: keyof UserHealthProfile; label: string }[] = [
  { key: 'age',           label: 'Age' },
  { key: 'gender',        label: 'Gender' },
  { key: 'weight',        label: 'Weight' },
  { key: 'height',        label: 'Height' },
  { key: 'fitnessGoal',   label: 'Fitness Goal' },
  { key: 'activityLevel', label: 'Activity Level' },
];

const GOAL_DISPLAY: Record<string, { label: string; emoji: string; color: string }> = {
  muscle_gain: { label: 'Muscle Gain', emoji: '💪', color: '#3B82F6' },
  fat_loss:    { label: 'Fat Loss',    emoji: '🔥', color: '#EF4444' },
  maintain:    { label: 'Maintain',    emoji: '⚖️', color: '#22C55E' },
  weight_gain: { label: 'Weight Gain', emoji: '📈', color: '#F59E0B' },
};

const ACTIVITY_DISPLAY: Record<string, string> = {
  sedentary:    'Sedentary 💼',
  light_1_3:    'Light 🚶',
  moderate_3_5: 'Moderate 🏃',
  gym_5_days:   'Active 🏋️',
  very_active:  'Athlete ⚡',
};

const DIET_DISPLAY: Record<string, string> = {
  vegetarian: 'Vegetarian 🥦',
  vegan:      'Vegan 🌱',
  non_veg:    'Non-Veg 🍗',
  eggetarian: 'Eggetarian 🥚',
};

export function AiDietPlannerModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isCompact = width <= 360 || height <= 720;
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { addMeal, meals } = usePlannerStore();
  const { addAiRecipes, getRecipeById } = useRecipeStore();
  const userProfile = useUserStore((s) => s.profile);

  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<AIDietPlan | null>(null);
  const [dailyPlans, setDailyPlans] = useState<DailyPlanMap>({});
  const [previewDay, setPreviewDay] = useState<DayOfWeek>('Mon');
  const [savedProfile, setSavedProfile] = useState<UserFitnessProfile | null>(null);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(['Mon']);
  const [addedDays, setAddedDays] = useState<DayOfWeek[]>([]);
  const [justAdded, setJustAdded] = useState(false);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isUploadingPlan, setIsUploadingPlan] = useState(false);
  const [masterMatchCount, setMasterMatchCount] = useState(0);
  const [matchedPublicCount, setMatchedPublicCount] = useState(0);
  const [planOrigin, setPlanOrigin] = useState<PlanOrigin>('ai');
  const [planSourceLabel, setPlanSourceLabel] = useState('AI Generated');
  const [matchedPlanMeals, setMatchedPlanMeals] = useState<SavedAiDietPlanMeal[]>([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [showOptionalPrefs, setShowOptionalPrefs] = useState(false);
  const [uploadDialog, setUploadDialog] = useState<UploadDialogState>({
    visible: false,
    title: '',
    message: '',
    icon: 'checkmark-circle',
    iconColor: '#22C55E',
  });

  // User-editable in modal (avoid pre-filled from profile allergies)
  const [avoid, setAvoid] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  // Pre-fill avoid from profile allergies when modal opens
  useEffect(() => {
    if (!visible) return;
    const hp = userProfile?.healthProfile;
    if (hp?.allergies?.length) setAvoid(hp.allergies.join(', '));
    setError('');
  }, [visible]);

  // ── Derived profile data ────────────────────────────────────────────────────
  const hp = userProfile?.healthProfile;

  const missingFields = REQUIRED_FIELDS
    .filter(({ key }) => !hp?.[key])
    .map((f) => f.label);

  const profileComplete = missingFields.length === 0;

  // Resolve most-permissive diet type from multiple preferences
  // Priority: Non-Vegetarian > Eggetarian > Vegan > Vegetarian/Jain
  const DIET_PRIORITY: DietType[] = ['non_veg', 'eggetarian', 'vegan', 'vegetarian'];
  const dietType: DietType = (() => {
    const prefs = userProfile?.dietPreferences ?? [];
    if (prefs.length === 0) return 'vegetarian';
    const mapped = prefs.map((p) => DIET_PREF_TO_TYPE[p] ?? 'vegetarian');
    return DIET_PRIORITY.find((d) => mapped.includes(d)) ?? 'vegetarian';
  })();

  const goalInfo = hp?.fitnessGoal ? GOAL_DISPLAY[hp.fitnessGoal] : null;
  const currentUserName = userProfile?.name?.trim() || 'MealMitra User';
  const previewPlan = useMemo(() => {
    if (!plan) return null;
    return dailyPlans[previewDay] ?? plan;
  }, [dailyPlans, plan, previewDay]);
  const nutritionTargets = useMemo(() => getDailyNutritionTargets(userProfile), [userProfile]);

  const validateNutritionGuardrail = useCallback(async (
    incomingSlots: Array<{ day: DayOfWeek; mealType: MealType; recipeId: string; recipeSource: 'master' | 'ai' }>
  ) => {
    if (!nutritionTargets) return { ok: true as const, message: '' };

    const incomingByDay = new Map<DayOfWeek, typeof incomingSlots>();
    incomingSlots.forEach((slot) => {
      if (!incomingByDay.has(slot.day)) incomingByDay.set(slot.day, []);
      incomingByDay.get(slot.day)!.push(slot);
    });

    const labelMap: Record<string, string> = {
      calories: 'Calories',
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      fiber: 'Fiber',
    };
    const exceededByDay: string[] = [];

    for (const [day, slots] of incomingByDay.entries()) {
      const incomingSlotKeys = new Set(slots.map((slot) => `${slot.day}-${slot.mealType}`));
      const existingForDay = meals.filter(
        (entry) => entry.day === day && !incomingSlotKeys.has(`${entry.day}-${entry.mealType}`)
      );
      const existingRecipes = await Promise.all(
        existingForDay.map(async (entry) => {
          const cached = getRecipeById(entry.recipeId);
          if (cached) return cached;
          return getRecipeByIdFromSource(entry.recipeId, entry.recipeSource ?? 'master');
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
        exceededByDay.push(`${day} (${exceeded.map((k) => labelMap[k]).join(', ')})`);
      }
    }

    if (exceededByDay.length > 0) {
      return {
        ok: false as const,
        message: `This plan exceeds your daily target on: ${exceededByDay.join(' · ')}`,
      };
    }

    return { ok: true as const, message: '' };
  }, [getRecipeById, meals, nutritionTargets]);

  const generatePlansForDays = useCallback(
    async (fitnessProfile: UserFitnessProfile, selected: DayOfWeek[]) => {
      const nutrition = calculateNutrition(fitnessProfile);
      const byDay: DailyPlanMap = {};
      const usedMealNames = new Set<string>();

      for (const day of selected) {
        const dayPrompt = [
          fitnessProfile.customPrompt?.trim() || '',
          `Generate a distinct plan for ${day}.`,
          usedMealNames.size > 0
            ? `Do not repeat these dish names: ${Array.from(usedMealNames).slice(0, 40).join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join(' ');

        const dayPlan = await generateAIDietPlan(
          { ...fitnessProfile, customPrompt: dayPrompt },
          nutrition
        );

        byDay[day] = dayPlan;

        MEAL_MAP.forEach(({ key }) => {
          dayPlan[key].forEach((item) => {
            const n = normalizeMealName(item.name);
            if (n) usedMealNames.add(n);
          });
        });
      }

      return { byDay, nutrition };
    },
    []
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const resetAll = () => {
    setStep('form');
    setError('');
    setPlan(null);
    setDailyPlans({});
    setPreviewDay('Mon');
    setSavedProfile(null);
    setAddedDays([]);
    setJustAdded(false);
    setSelectedDays(['Mon']);
    setSavedPlanId(null);
    setIsSaving(false);
    setIsDeleting(false);
    setIsGeneratingMore(false);
    setIsUploadingPlan(false);
    setMasterMatchCount(0);
    setMatchedPublicCount(0);
    setPlanOrigin('ai');
    setPlanSourceLabel('AI Generated');
    setMatchedPlanMeals([]);
    setDeleteConfirmVisible(false);
    setShowOptionalPrefs(false);
    setUploadDialog((prev) => ({ ...prev, visible: false }));
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleGoToProfile = () => {
    handleClose();
    router.push('/(onboarding)/profile-setup' as any);
  };

  const handleDoneAndViewPlanner = () => {
    handleClose();
    router.push('/(tabs)/planner' as any);
  };

  const toggleDay = (day: DayOfWeek) => {
    setJustAdded(false);
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleAllDays = () => {
    setJustAdded(false);
    setSelectedDays(selectedDays.length === ALL_DAYS.length ? ['Mon'] : [...ALL_DAYS]);
  };

  const handleGenerate = async () => {
    if (!profileComplete || !hp) {
      setError('Please complete your health profile first.');
      return;
    }
    setError('');
    setStep('loading');
    setJustAdded(false);

    try {
      const fitnessProfile: UserFitnessProfile = {
        age: hp.age!,
        gender: hp.gender as Gender,
        weight: hp.weight!,
        height: hp.height!,
        goal: hp.fitnessGoal as DietGoal,
        activity_level: hp.activityLevel as ActivityLevel,
        diet_type: dietType,
        avoid: avoid.trim() || undefined,
        customPrompt: customPrompt.trim() || undefined,
      };
      const { byDay } = await generatePlansForDays(fitnessProfile, selectedDays);
      const firstDay = selectedDays[0];
      const result = byDay[firstDay] ?? Object.values(byDay)[0] ?? null;
      if (!result) {
        throw new Error('Could not generate day-wise plan. Please try again.');
      }

      setSavedProfile(fitnessProfile);
      setPlan(result);
      setDailyPlans(byDay);
      setPreviewDay(firstDay);
      setMasterMatchCount(0);

      let generatedPlanId: string | null = null;
      try {
        const saved = await saveAiDietPlan(
          userProfile?.id,
          {
            ...result,
            // Keep all day-wise plan data in plan_data for future expansion/history.
            daily_plans: byDay,
          } as AIDietPlan,
          selectedDays,
          fitnessProfile,
          []
        );
        generatedPlanId = saved.id;
      } catch (saveErr: any) {
        console.warn('[AiDietPlanner] Generated plan could not be auto-saved:', saveErr?.message ?? saveErr);
      }

      setSavedPlanId(generatedPlanId);
      setMatchedPlanMeals([]);
      setPlanOrigin('ai');
      setPlanSourceLabel(currentUserName);
      setMatchedPublicCount(0);
      setStep('result');
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate plan. Please try again.');
      setStep('form');
    }
  };

  const handleGenerateMorePlans = async () => {
    if (!savedProfile) return;
    setIsGeneratingMore(true);
    setError('');
    try {
      const { byDay } = await generatePlansForDays(savedProfile, selectedDays);
      const firstDay = selectedDays[0];
      const result = byDay[firstDay] ?? Object.values(byDay)[0] ?? null;
      if (!result) {
        throw new Error('Could not generate day-wise plan. Please try again.');
      }

      setPlan(result);
      setDailyPlans(byDay);
      setPreviewDay(firstDay);
      setMasterMatchCount(0);

      let generatedPlanId: string | null = null;
      try {
        const saved = await saveAiDietPlan(
          userProfile?.id,
          {
            ...result,
            daily_plans: byDay,
          } as AIDietPlan,
          selectedDays,
          savedProfile,
          []
        );
        generatedPlanId = saved.id;
      } catch (saveErr: any) {
        console.warn('[AiDietPlanner] Additional generated plan could not be auto-saved:', saveErr?.message ?? saveErr);
      }

      setSavedPlanId(generatedPlanId);
      setMatchedPlanMeals([]);
      setPlanOrigin('ai');
      setPlanSourceLabel(currentUserName);
      setMatchedPublicCount(0);
      setJustAdded(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate more plans. Please try again.');
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleUploadPlan = async () => {
    if (!savedPlanId) return;
    setIsUploadingPlan(true);
    try {
      await uploadAiDietPlan(savedPlanId);
      setPlanOrigin('public');
      setPlanSourceLabel(currentUserName);
      setUploadDialog({
        visible: true,
        title: 'Plan Uploaded',
        message: 'Your plan is now public and available to other users.',
        icon: 'checkmark-circle',
        iconColor: '#22C55E',
      });
    } catch (e: any) {
      setUploadDialog({
        visible: true,
        title: 'Upload Failed',
        message: e?.message ?? 'Failed to upload plan. Please try again.',
        icon: 'alert-circle',
        iconColor: '#EF4444',
      });
    } finally {
      setIsUploadingPlan(false);
    }
  };

  const handleAddToPlanner = async () => {
    if (!plan || !savedProfile || selectedDays.length === 0) return;

    // For matched public plans, reuse persisted recipe IDs from diet_plan_meals.
    if (planOrigin === 'public' && savedPlanId && matchedPlanMeals.length > 0) {
      const mealByType = new Map<MealType, SavedAiDietPlanMeal>();
      matchedPlanMeals.forEach((meal) => {
        if (!mealByType.has(meal.meal_type)) {
          mealByType.set(meal.meal_type, meal);
        }
      });

      const pendingPublicSlots: Array<{ day: DayOfWeek; mealType: MealType; recipeId: string; recipeSource: 'master' | 'ai' }> = [];

      selectedDays.forEach((day) => {
        (['Breakfast', 'Lunch', 'Snack', 'Dinner'] as MealType[]).forEach((mealType) => {
          const mapped = mealByType.get(mealType);
          if (!mapped) return;
          pendingPublicSlots.push({
            day,
            mealType,
            recipeId: mapped.recipe_id,
            recipeSource: (mapped.recipe_source ?? 'master') as 'master' | 'ai',
          });
        });
      });

      const guard = await validateNutritionGuardrail(pendingPublicSlots);
      if (!guard.ok) {
        setUploadDialog({
          visible: true,
          title: 'Target Exceeded',
          message: guard.message,
          icon: 'alert-circle',
          iconColor: '#EF4444',
        });
        return;
      }

      selectedDays.forEach((day) => {
        (['Breakfast', 'Lunch', 'Snack', 'Dinner'] as MealType[]).forEach((mealType) => {
          const mapped = mealByType.get(mealType);
          if (!mapped) return;
          addMeal(day, mealType, mapped.recipe_id, mapped.servings ?? 1, mapped.recipe_source ?? 'master');
        });
      });

      setAddedDays(selectedDays);
      setJustAdded(true);
      setUploadDialog({
        visible: true,
        title: 'Plan Added',
        message: 'Meals have been added to your planner successfully.',
        icon: 'checkmark-circle',
        iconColor: '#22C55E',
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 350);
      return;
    }

    const fractions: Record<string, number> = {
      breakfast: 0.25, lunch: 0.35, snacks: 0.1, dinner: 0.3,
    };
    const goalLabel = savedProfile.goal.replace(/_/g, ' ');

    // Build one unique recipe per day+meal slot.
    const aiPlannerPairs: Array<{ recipe: Recipe; day: DayOfWeek; mealType: MealType }> = [];
    const planMeals: AiDietPlanMealSelection[] = [];
    const usedRecipeIds = new Set<string>();
    const usedMealNames = new Set<string>();
    let matchedFromMaster = 0;

    const slotCandidates = new Map<string, string[]>();
    const allCandidateNames = new Set<string>();

    for (const day of selectedDays) {
      const dayPlan = dailyPlans[day] ?? plan;
      for (const { key, mealType } of MEAL_MAP) {
        const items = dayPlan[key];
        if (!items || items.length === 0) continue;
        const names = Array.from(new Set(items.map((item) => item.name).filter(Boolean)));
        slotCandidates.set(`${day}-${mealType}`, names);
        names.forEach((name) => allCandidateNames.add(name));
      }
    }

    let batchedMatches = new Map<string, Array<{ recipeId: string; recipeSource: 'master' }>>();
    try {
      batchedMatches = await findMasterRecipeMatchesForMealsBatch({
        mealNames: Array.from(allCandidateNames),
        dietType: savedProfile.diet_type,
      });
    } catch (batchErr) {
      console.warn('[AiDietPlanner] master recipe batch match failed:', batchErr);
    }

    for (const day of selectedDays) {
      const dayPlan = dailyPlans[day] ?? plan;

      for (const { key, mealType } of MEAL_MAP) {
        const items = dayPlan[key];
        if (!items || items.length === 0) continue;

        const uniqueItem =
          items.find((item) => !usedMealNames.has(normalizeMealName(item.name))) ??
          items[0];
        const fallbackItem = uniqueItem;

        const candidateNames = slotCandidates.get(`${day}-${mealType}`) ?? [];
        let matched: { recipeId: string; recipeSource: 'master' } | null = null;
        for (const candidateName of candidateNames) {
          const keyName = normalizeMealName(candidateName);
          const options = batchedMatches.get(keyName) ?? [];
          const unused = options.find((opt) => !usedRecipeIds.has(opt.recipeId));
          if (unused) {
            matched = unused;
            break;
          }
        }

        if (matched) {
          usedRecipeIds.add(matched.recipeId);
          if (fallbackItem?.name) usedMealNames.add(normalizeMealName(fallbackItem.name));
          matchedFromMaster += 1;
          addMeal(day, mealType, matched.recipeId, 1, matched.recipeSource);
          planMeals.push({
            day,
            mealType,
            recipeId: matched.recipeId,
            recipeSource: matched.recipeSource,
            servings: 1,
          });
          continue;
        }

        const recipe = buildRecipeFromItem(
          fallbackItem,
          mealType,
          goalLabel,
          savedProfile.diet_type,
          dayPlan,
          fractions[key]
        );
        usedRecipeIds.add(recipe.id);
        usedMealNames.add(normalizeMealName(fallbackItem.name));
        aiPlannerPairs.push({ recipe, day, mealType });
      }
    }

    const pendingGeneratedSlots: Array<{ day: DayOfWeek; mealType: MealType; recipeId: string; recipeSource: 'master' | 'ai' }> = [
      ...planMeals.map((m) => ({
        day: m.day,
        mealType: m.mealType,
        recipeId: m.recipeId,
        recipeSource: (m.recipeSource ?? 'master') as 'master' | 'ai',
      })),
      ...aiPlannerPairs.map((p) => ({
        day: p.day,
        mealType: p.mealType,
        recipeId: p.recipe.id,
        recipeSource: 'ai' as const,
      })),
    ];

    const guard = await validateNutritionGuardrail(pendingGeneratedSlots);
    if (!guard.ok) {
      setUploadDialog({
        visible: true,
        title: 'Target Exceeded',
        message: guard.message,
        icon: 'alert-circle',
        iconColor: '#EF4444',
      });
      return;
    }

    // Insert only fallback AI recipes into user_ai_generated_recipes first.
    await addAiRecipes(aiPlannerPairs.map((p) => p.recipe));

    aiPlannerPairs.forEach(({ recipe, day, mealType }) => {
      addMeal(day, mealType, recipe.id, 1, 'ai');
      planMeals.push({
        day,
        mealType,
        recipeId: recipe.id,
        recipeSource: 'ai',
        servings: 1,
      });
    });

    setMasterMatchCount(matchedFromMaster);

    setAddedDays(selectedDays);
    setJustAdded(true);
    setUploadDialog({
      visible: true,
      title: 'Plan Added',
      message: 'Meals have been added to your planner successfully.',
      icon: 'checkmark-circle',
      iconColor: '#22C55E',
    });

    // Save / link plan-meals in Supabase.
    setIsSaving(true);
    try {
      if (savedPlanId) {
        await upsertAiDietPlanMeals(savedPlanId, planMeals);
      } else {
        const saved = await saveAiDietPlan(userProfile?.id, plan, selectedDays, savedProfile, planMeals);
        setSavedPlanId(saved.id);
      }
      setPlanSourceLabel(currentUserName);
    } catch (e: any) {
      console.error('[AiDietPlanner] Failed to save plan to Supabase:', e?.message ?? e);
      setUploadDialog({
        visible: true,
        title: 'Save Error',
        message: 'Plan added to planner but could not be saved to cloud. Check your connection.',
        icon: 'alert-circle',
        iconColor: '#EF4444',
      });
    } finally {
      setIsSaving(false);
    }

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 350);
  };

  const handleDeletePlan = () => {
    if (!savedPlanId) return;
    setDeleteConfirmVisible(true);
  };

  const confirmDeletePlan = async () => {
    if (!savedPlanId || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteAiDietPlan(savedPlanId);
      setSavedPlanId(null);
    } catch (e: any) {
      setUploadDialog({
        visible: true,
        title: 'Delete Failed',
        message: e?.message ?? 'Failed to delete plan. Please try again.',
        icon: 'alert-circle',
        iconColor: '#EF4444',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmVisible(false);
    }
  };

  const macroTotal = useMemo(
    () => previewPlan ? (previewPlan.protein_g ?? 0) + (previewPlan.carbs_g ?? 0) + (previewPlan.fat_g ?? 0) : 0,
    [previewPlan]
  );

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <Pressable style={[StyleSheet.absoluteFillObject, { backgroundColor: 'transparent' }]} onPress={handleClose} />
          <View style={[styles.sheet, isCompact && styles.sheetCompact, { backgroundColor: colors.card }]}>
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={[styles.sheetHeader, isCompact && styles.sheetHeaderCompact, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.aiIconBadge, { backgroundColor: colors.accent + '22' }]}>
                <Ionicons name="sparkles" size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.headerTitle, isCompact && styles.headerTitleCompact, { color: colors.text }]}>MealMitra AI Coach</Text>
                <Text style={[styles.headerSubtitle, isCompact && styles.headerSubtitleCompact, { color: colors.textTertiary }]}>
                  {step === 'result' ? 'Review your personalized plan' : 'AI-powered diet planner'}
                </Text>
              </View>
            </View>
            {step === 'result' && (
              <TouchableOpacity
                onPress={resetAll}
                style={[styles.backBtn, { borderColor: colors.border }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="refresh-outline" size={14} color={colors.accent} />
                <Text style={[styles.backBtnText, { color: colors.accent }]}>New</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            key={step}
            ref={scrollRef}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            decelerationRate="normal"
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── FORM STEP ── */}
            {step === 'form' && (
              <View style={[styles.formContainer, isCompact && styles.formContainerCompact]}>

                {/* Profile Summary Card  /  Incomplete Warning */}
                {profileComplete && hp ? (
                  <View style={[pf.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={pf.topRow}>
                      <View style={[pf.avatar, { backgroundColor: colors.accent }]}>
                        <Text style={pf.avatarText}>
                          {userProfile?.name?.[0]?.toUpperCase() ?? '?'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[pf.name, { color: colors.text }]}>
                          {userProfile?.name ?? 'Your Profile'}
                        </Text>
                        <Text style={[pf.subline, { color: colors.textSecondary }]}>
                          {hp.age}y · {hp.weight}kg · {hp.height}cm · {hp.gender === 'male' ? '♂' : '♀'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleGoToProfile}
                        style={[pf.editBtn, { borderColor: colors.accent }]}
                      >
                        <Ionicons name="pencil-outline" size={12} color={colors.accent} />
                        <Text style={[pf.editBtnText, { color: colors.accent }]}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[pf.divider, { backgroundColor: colors.border }]} />
                    <View style={pf.statsGrid}>
                      {[
                        {
                          icon: 'flag-outline',
                          label: 'Goal',
                          value: goalInfo ? `${goalInfo.emoji} ${goalInfo.label}` : '—',
                          color: goalInfo?.color ?? colors.accent,
                        },
                        {
                          icon: 'flash-outline',
                          label: 'Activity',
                          value: hp.activityLevel ? ACTIVITY_DISPLAY[hp.activityLevel] : '—',
                          color: '#F59E0B',
                        },
                        {
                          icon: 'leaf-outline',
                          label: 'Diet',
                          value: DIET_DISPLAY[dietType] ?? dietType,
                          color: '#22C55E',
                        },
                        {
                          icon: 'flame-outline',
                          label: 'TDEE',
                          value: hp.tdee ? `${hp.tdee} kcal` : 'Auto',
                          color: '#EF4444',
                        },
                      ].map((stat) => (
                        <View key={stat.label} style={[pf.statItem, { backgroundColor: colors.background }]}>
                          <Ionicons name={stat.icon as any} size={13} color={stat.color} />
                          <Text style={[pf.statValue, { color: colors.text }]} numberOfLines={1}>
                            {stat.value}
                          </Text>
                          <Text style={[pf.statLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={[pf.incompleteCard, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B55' }]}>
                    <View style={pf.incompleteHeader}>
                      <View style={pf.incompleteIconWrap}>
                        <Ionicons name="warning-outline" size={22} color="#F59E0B" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[pf.incompleteTitle, { color: '#F59E0B' }]}>Profile Incomplete</Text>
                        <Text style={[pf.incompleteSubtitle, { color: colors.textSecondary }]}>
                          Complete your profile so the AI can craft a plan tailored to your body and goals.
                        </Text>
                      </View>
                    </View>
                    <View style={pf.missingList}>
                      {missingFields.map((f) => (
                        <View key={f} style={pf.missingItem}>
                          <View style={pf.missingDot} />
                          <Text style={[pf.missingText, { color: colors.textSecondary }]}>
                            {f} not set
                          </Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={[pf.goProfileBtn, { backgroundColor: '#F59E0B' }]}
                      onPress={handleGoToProfile}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="person-outline" size={16} color="#FFF" />
                      <Text style={pf.goProfileBtnText}>Complete My Profile →</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Day Selection */}
                <DaySelector
                  selected={selectedDays}
                  onToggle={toggleDay}
                  onToggleAll={toggleAllDays}
                  colors={colors}
                  compact={isCompact}
                />

                {/* Optional personalization */}
                <View style={[styles.optionalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.optionalHeader}
                    onPress={() => setShowOptionalPrefs((prev) => !prev)}
                    activeOpacity={0.75}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionalTitle, { color: colors.text }]}>Optional Preferences</Text>
                      <Text style={[styles.optionalHint, { color: colors.textTertiary }]}>
                        Add foods to avoid or style preferences
                      </Text>
                    </View>
                    <Ionicons
                      name={showOptionalPrefs ? 'chevron-up-outline' : 'chevron-down-outline'}
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {showOptionalPrefs && (
                    <>
                      <Text style={[styles.sectionLabel, { color: colors.text }]}>Foods to Avoid</Text>
                      <TextInput
                        style={[styles.textArea, {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                        }]}
                        placeholder="e.g. mushroom, broccoli, peanuts"
                        placeholderTextColor={colors.textTertiary}
                        value={avoid}
                        onChangeText={setAvoid}
                      />

                      <Text style={[styles.sectionLabel, { color: colors.text }]}>Preferences</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.suggestionScroll}
                        contentContainerStyle={styles.suggestionRow}
                      >
                        {PROMPT_SUGGESTIONS.map((s) => (
                          <TouchableOpacity
                            key={s}
                            onPress={() =>
                              setCustomPrompt((p) => {
                                if (p.includes(s)) return p.replace(`, ${s}`, '').replace(s, '').trim().replace(/^,\s*/, '');
                                return p ? `${p}, ${s}` : s;
                              })
                            }
                            style={[styles.suggestionChip, {
                              backgroundColor: customPrompt.includes(s) ? colors.accent + '22' : colors.background,
                              borderColor: customPrompt.includes(s) ? colors.accent : colors.border,
                            }]}
                          >
                            <Text style={[styles.suggestionChipText, {
                              color: customPrompt.includes(s) ? colors.accent : colors.textSecondary,
                            }]}>
                              {s}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <TextInput
                        style={[styles.textArea, {
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                          minHeight: 64,
                        }]}
                        placeholder="e.g. South Indian style, low budget, no garlic"
                        placeholderTextColor={colors.textTertiary}
                        value={customPrompt}
                        onChangeText={setCustomPrompt}
                        multiline
                        numberOfLines={2}
                        textAlignVertical="top"
                      />
                    </>
                  )}
                </View>

                {/* Error */}
                {error !== '' && (
                  <View style={[styles.errorBox, { backgroundColor: '#EF444422' }]}>
                    <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                    <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
                  </View>
                )}

                {/* Generate CTA */}
                <TouchableOpacity
                  style={[styles.primaryBtn, {
                    backgroundColor: profileComplete && selectedDays.length > 0 ? colors.accent : colors.border,
                    opacity: profileComplete && selectedDays.length > 0 ? 1 : 0.65,
                  }]}
                  onPress={handleGenerate}
                  disabled={!profileComplete || selectedDays.length === 0}
                  activeOpacity={0.85}
                >
                  <Ionicons name="sparkles" size={18} color="#FFF" />
                  <Text style={styles.primaryBtnText}>
                    {!profileComplete
                      ? 'Complete Profile First'
                      : selectedDays.length === 0
                      ? 'Select at Least One Day'
                      : 'Generate My Diet Plan'}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
                  Powered by Groq AI · Llama 3.3 70B · For informational purposes only
                </Text>
              </View>
            )}

            {/* ── LOADING STEP ── */}
            {step === 'loading' && (
              <View style={styles.loadingContainer}>
                <View style={[styles.loadingIconWrap, { backgroundColor: colors.accent + '22' }]}>
                  <Ionicons name="sparkles" size={40} color={colors.accent} />
                </View>
                <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 24 }} />
                <Text style={[styles.loadingTitle, { color: colors.text }]}>Crafting Your Plan...</Text>
                <Text style={[styles.loadingSubtitle, { color: colors.textSecondary }]}>
                  {'Personalised Indian diet plan for '}
                  <Text style={{ fontWeight: '700', color: colors.text }}>
                    {selectedDays.length === 7 ? 'all 7 days' : selectedDays.join(', ')}
                  </Text>
                </Text>
                <View style={[styles.loadingTips, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.loadingTipsText, { color: colors.textSecondary }]}>
                    {'Calculating calories and macros\nSelecting practical Indian meals\nBalancing nutrition for your goal'}
                    {customPrompt ? `\n✨ Applying: ${customPrompt}` : ''}
                  </Text>
                </View>
              </View>
            )}

            {/* ── RESULT STEP ── */}
            {step === 'result' && previewPlan && (
              <View style={[styles.resultContainer, isCompact && styles.resultContainerCompact]}>
                <View style={[styles.sourceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.sourceTopRow}>
                    <Text style={[styles.sourceTitle, { color: colors.text }]}>Plan Source</Text>
                    {planOrigin === 'ai' && (
                      <Ionicons name="sparkles" size={14} color={colors.accent} />
                    )}
                  </View>
                  <Text style={[styles.sourceValue, { color: colors.textSecondary }]}>
                    {planSourceLabel}
                  </Text>
                  {matchedPublicCount > 0 && (
                    <Text style={[styles.sourceHint, { color: colors.textTertiary }]}>
                      Matched {matchedPublicCount} public plan{matchedPublicCount > 1 ? 's' : ''}.
                    </Text>
                  )}
                  {masterMatchCount > 0 && (
                    <Text style={[styles.sourceHint, { color: colors.textTertiary }]}>
                      {masterMatchCount} slots will use exact matches from master recipes.
                    </Text>
                  )}
                </View>

                {selectedDays.length > 1 && (
                  <View style={[styles.dayPreviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.dayPreviewTitle, { color: colors.text }]}>Preview Day Plan</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPreviewRow}>
                      {selectedDays.map((day) => {
                        const active = previewDay === day;
                        return (
                          <TouchableOpacity
                            key={day}
                            onPress={() => setPreviewDay(day)}
                            style={[
                              styles.dayPreviewChip,
                              {
                                backgroundColor: active ? colors.accent : colors.background,
                                borderColor: active ? colors.accent : colors.border,
                              },
                            ]}
                          >
                            <Text style={[styles.dayPreviewChipText, { color: active ? '#FFF' : colors.textSecondary }]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Summary card */}
                <View style={[styles.summaryCard, { backgroundColor: colors.accent }]}>
                  <Text style={styles.summaryTitle}>🎯 Your Daily Target</Text>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryStat}>
                      <Text style={styles.summaryStatVal}>{previewPlan.total_calories}</Text>
                      <Text style={styles.summaryStatLabel}>Calories</Text>
                    </View>
                    <View style={styles.summarySep} />
                    <View style={styles.summaryStat}>
                      <Text style={styles.summaryStatVal}>{previewPlan.protein_g}g</Text>
                      <Text style={styles.summaryStatLabel}>Protein</Text>
                    </View>
                    <View style={styles.summarySep} />
                    <View style={styles.summaryStat}>
                      <Text style={styles.summaryStatVal}>{previewPlan.carbs_g}g</Text>
                      <Text style={styles.summaryStatLabel}>Carbs</Text>
                    </View>
                    <View style={styles.summarySep} />
                    <View style={styles.summaryStat}>
                      <Text style={styles.summaryStatVal}>{previewPlan.fat_g}g</Text>
                      <Text style={styles.summaryStatLabel}>Fat</Text>
                    </View>
                  </View>
                  <View style={styles.tdeeRow}>
                    <Text style={styles.tdeeText}>BMR: {previewPlan.bmr} kcal</Text>
                    <View style={styles.tdeeDot} />
                    <Text style={styles.tdeeText}>TDEE: {previewPlan.tdee} kcal</Text>
                  </View>
                  <View style={[styles.tdeeRow, { marginTop: 2 }]}>
                    <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.tdeeText}>
                      {selectedDays.length > 1
                        ? `Showing ${previewDay} · ${selectedDays.length} days selected`
                        : `Showing ${previewDay}`}
                    </Text>
                  </View>
                </View>

                {/* Macro bars */}
                <View style={[styles.macroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.macroTitle, { color: colors.text }]}>Macro Distribution</Text>
                  <MacroBar label="Protein" value={previewPlan.protein_g} unit="g" color="#3B82F6" total={macroTotal} colors={colors} />
                  <MacroBar label="Carbs" value={previewPlan.carbs_g} unit="g" color="#F59E0B" total={macroTotal} colors={colors} />
                  <MacroBar label="Fat" value={previewPlan.fat_g} unit="g" color="#EF4444" total={macroTotal} colors={colors} />
                </View>

                {/* Meals — scroll through to review */}
                {MEAL_MAP.map((section) => (
                  <MealSection
                    key={section.key}
                    title={section.label}
                    emoji={section.emoji}
                    items={previewPlan[section.key]}
                    colors={colors}
                    accentColor={section.color}
                    compact={isCompact}
                  />
                ))}

                {/* Coach tip */}
                {previewPlan.coach_tip && (
                  <View style={[styles.tipCard, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '44' }]}>
                    <Ionicons name="fitness-outline" size={18} color={colors.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tipTitle, { color: colors.accent }]}>Coach Tip</Text>
                      <Text style={[styles.tipText, { color: colors.text }]}>{previewPlan.coach_tip}</Text>
                    </View>
                  </View>
                )}

                {/* Hydration tip */}
                {previewPlan.hydration_tip && (
                  <View style={[styles.tipCard, { backgroundColor: '#3B82F615', borderColor: '#3B82F644' }]}>
                    <Ionicons name="water-outline" size={18} color="#3B82F6" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tipTitle, { color: '#3B82F6' }]}>Hydration</Text>
                      <Text style={[styles.tipText, { color: colors.text }]}>{previewPlan.hydration_tip}</Text>
                    </View>
                  </View>
                )}

                {/* Success banner */}
                {justAdded && (
                  <View style={[styles.successBanner, { backgroundColor: '#22C55E22', borderColor: '#22C55E44' }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.successTitle, { color: '#22C55E' }]}>Added to Planner!</Text>
                      <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                        {addedDays.length === 7
                          ? 'Full week added with one recipe per meal slot'
                          : `${addedDays.join(', ')} added with one recipe per meal slot`}
                      </Text>
                      {isSaving && (
                        <Text style={[styles.successSubtitle, { color: colors.textTertiary, marginTop: 4 }]}>
                          ☁️ Saving to cloud…
                        </Text>
                      )}
                      {savedPlanId && !isSaving && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <Text style={[styles.successSubtitle, { color: colors.textTertiary }]}>
                            ✅ Saved to Supabase
                          </Text>
                          <TouchableOpacity
                            onPress={handleDeletePlan}
                            disabled={isDeleting}
                            style={[styles.deletePlanBtn, { borderColor: '#EF444466' }]}
                          >
                            {isDeleting ? (
                              <ActivityIndicator size={10} color="#EF4444" />
                            ) : (
                              <Ionicons name="trash-outline" size={12} color="#EF4444" />
                            )}
                            <Text style={[styles.deletePlanBtnText, { color: '#EF4444' }]}>
                              {isDeleting ? 'Deleting…' : 'Delete Plan'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Save / Done button */}
                <TouchableOpacity
                  style={[styles.primaryBtn, {
                    backgroundColor: justAdded ? '#22C55E' : colors.accent,
                  }]}
                  onPress={justAdded ? handleDoneAndViewPlanner : handleAddToPlanner}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#FFF"
                  />
                  <Text style={styles.primaryBtnText}>
                    {justAdded
                      ? 'View Planner'
                      : 'Save to Planner'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={handleGenerateMorePlans}
                  disabled={isGeneratingMore}
                  activeOpacity={0.85}
                >
                  {isGeneratingMore ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
                  )}
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Generate More Plans</Text>
                </TouchableOpacity>

                {planOrigin === 'ai' && savedPlanId && (
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { borderColor: colors.accent + '55', backgroundColor: colors.accent + '12' }]}
                    onPress={handleUploadPlan}
                    disabled={isUploadingPlan}
                    activeOpacity={0.85}
                  >
                    {isUploadingPlan ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <Ionicons name="cloud-upload-outline" size={16} color={colors.accent} />
                    )}
                    <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>Upload Plan</Text>
                  </TouchableOpacity>
                )}

                <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
                  Powered by Groq AI · Llama 3.3 70B · Consult a nutritionist for medical advice
                </Text>
              </View>
            )}
          </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={uploadDialog.visible}
        title={uploadDialog.title}
        message={uploadDialog.message}
        confirmText="OK"
        hideCancelButton
        icon={uploadDialog.icon}
        iconColor={uploadDialog.iconColor}
        onConfirm={() => setUploadDialog((prev) => ({ ...prev, visible: false }))}
        onCancel={() => setUploadDialog((prev) => ({ ...prev, visible: false }))}
      />

      <ConfirmModal
        visible={deleteConfirmVisible}
        title="Delete AI Diet Plan"
        message="This will permanently remove this plan from your saved plans in Supabase. Your local planner entries will remain."
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        destructive
        icon="warning"
        iconColor="#EF4444"
        onConfirm={confirmDeletePlan}
        onCancel={() => {
          if (!isDeleting) setDeleteConfirmVisible(false);
        }}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '93%',
    width: '100%',
  },
  sheetCompact: {
    height: '95%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  sheetHeaderCompact: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  aiIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
  },
  headerTitleCompact: {
    fontSize: Typography.fontSize.sm,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: 1,
  },
  headerSubtitleCompact: {
    fontSize: 11,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  backBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
  },

  // Form
  formContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  formContainerCompact: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    gap: 6,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statInput: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    textAlign: 'center',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: Typography.fontSize.sm,
  },
  optionalCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  optionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionalTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  optionalHint: {
    fontSize: Typography.fontSize.xs,
    marginTop: 1,
  },
  suggestionScroll: {
    marginBottom: 4,
  },
  suggestionRow: {
    gap: 8,
    paddingRight: 16,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  suggestionChipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: 4,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    flex: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
  },
  disclaimer: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    marginTop: 4,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['3xl'],
    gap: 8,
  },
  loadingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingTips: {
    marginTop: 20,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    width: '100%',
  },
  loadingTipsText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 24,
  },

  // Result
  resultContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  resultContainerCompact: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  sourceCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 4,
  },
  sourceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sourceValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  sourceHint: {
    fontSize: Typography.fontSize.xs,
  },
  dayPreviewCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    gap: 8,
  },
  dayPreviewTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  dayPreviewRow: {
    gap: 8,
  },
  dayPreviewChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dayPreviewChipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  summaryTitle: {
    color: '#FFF',
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatVal: {
    color: '#FFF',
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
  },
  summaryStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.fontSize.xs,
    marginTop: 1,
  },
  summarySep: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tdeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  tdeeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  tdeeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  macroCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  macroTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  tipTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tipText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  successTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
  },
  successSubtitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  deletePlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  deletePlanBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: 4,
  },
  secondaryBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
});

// ─── DaySelector styles ────────────────────────────────────────────────────────────────

const ds = StyleSheet.create({
  container: {
    gap: 8,
    paddingTop: 4,
  },
  containerCompact: {
    gap: 6,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  labelCompact: {
    fontSize: Typography.fontSize.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rowCompact: {
    gap: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  chipCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  chipTextCompact: {
    fontSize: Typography.fontSize.xs,
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  hintCompact: {
    fontSize: 11,
  },
});

// ─── MealSection styles ───────────────────────────────────────────────────────

const ms = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardCompact: {
    borderRadius: BorderRadius.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  headerCompact: {
    padding: Spacing.sm,
    gap: 6,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 18,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  titleCompact: {
    fontSize: Typography.fontSize.sm,
  },
  meta: {
    fontSize: Typography.fontSize.xs,
    marginTop: 1,
  },
  metaCompact: {
    fontSize: 11,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  itemRowCompact: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  itemName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  itemNameCompact: {
    fontSize: Typography.fontSize.xs,
  },
  itemQty: {
    fontSize: Typography.fontSize.xs,
    marginTop: 1,
  },
  itemQtyCompact: {
    fontSize: 11,
  },
  itemNutrition: {
    alignItems: 'flex-end',
    gap: 2,
  },
  itemCal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  itemCalCompact: {
    fontSize: 11,
  },
  itemProt: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  itemProtCompact: {
    fontSize: 11,
  },
  expandWrap: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  expandBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  expandBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  detailsCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  detailToggleRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
  },
  detailTabBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  detailTabText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  partitionWrap: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  partitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
  },
  stepPartitionRow: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  ingName: {
    fontSize: Typography.fontSize.sm,
    flex: 1,
  },
  ingAmt: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Recipe toggle chips
  recipeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    maxWidth: 140,
  },
  recipeChipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepInstruction: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 18,
  },
  stepTime: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: Typography.fontSize.xs,
    paddingVertical: Spacing.sm,
  },
});

// ─── MacroBar styles ──────────────────────────────────────────────────────────

const mb = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    width: 50,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  val: {
    width: 40,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    textAlign: 'right',
  },
});

// ─── Profile Card styles ───────────────────────────────────────────────────────

const pf = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 18,
  },
  name: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
  },
  subline: {
    fontSize: Typography.fontSize.xs,
    marginTop: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  editBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statValue: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  incompleteCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  incompleteHeader: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  incompleteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B22',
  },
  incompleteTitle: {
    fontWeight: '800',
    fontSize: Typography.fontSize.base,
  },
  incompleteSubtitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  missingList: {
    gap: 4,
  },
  missingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  missingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  missingText: {
    fontSize: Typography.fontSize.xs,
  },
  goProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
  },
  goProfileBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: Typography.fontSize.sm,
  },
});
