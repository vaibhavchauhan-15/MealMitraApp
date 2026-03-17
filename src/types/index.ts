// ─── Recipe Types ─────────────────────────────────────────────────────────────

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface PreparationStep {
  ingredient: string;
  cut: string;
}

export interface Nutrition {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface CookingStep {
  step: number;
  instruction: string;
  time: number; // minutes
}

export interface Recipe {
  id: string;
  name: string;
  source?: 'app' | 'user_upload' | 'ai';
  cuisine: string;
  diet: 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Eggetarian';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cook_time: number; // minutes
  prep_time: number; // minutes
  servings: number;
  calories: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  ingredients: Ingredient[];
  preparation: PreparationStep[];
  nutrition: Nutrition;
  equipment: string[];
  steps: CookingStep[];
  tips: string[];
  tags: string[];
}

export type RecipeSource = 'master' | 'ai';

// ─── Meal Planner Types ────────────────────────────────────────────────────────

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface MealEntry {
  id: string;
  day: DayOfWeek;
  mealType: MealType;
  recipeId: string;
  recipeSource?: RecipeSource;
  servings: number;
}

// ─── Grocery List Types ────────────────────────────────────────────────────────

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  recipeId?: string;
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface RecipeFilters {
  diet?: string;
  cuisine?: string;
  difficulty?: string;
  maxCookTime?: number;
  maxCalories?: number;
}

// ─── User Health & Fitness Types ──────────────────────────────────────────────

/** Mirrors aiDietService.ts DietGoal — keep in sync */
export type FitnessGoal = 'muscle_gain' | 'fat_loss' | 'maintain' | 'weight_gain';

/** Mirrors aiDietService.ts ActivityLevel — keep in sync */
export type UserActivityLevel =
  | 'sedentary'
  | 'light_1_3'
  | 'moderate_3_5'
  | 'gym_5_days'
  | 'very_active';

export type BodyGender = 'male' | 'female';

/** Mirrors aiDietService.ts DietType — keep in sync */
export type AppDietType = 'vegetarian' | 'non_veg' | 'vegan' | 'eggetarian';

/**
 * Comprehensive health & fitness sub-profile.
 * Stored inside UserProfile.healthProfile.
 * Indexed fields: fitnessGoal, activityLevel for fast recommendation lookups.
 */
export interface UserHealthProfile {
  // ── Identity metrics ────────────────────────────────────────────────────────
  age?: number;             // years
  gender?: BodyGender;
  weight?: number;          // kg
  height?: number;          // cm

  // ── Fitness & goals ─────────────────────────────────────────────────────────
  /** @index used for goal-based recipe filtering */
  fitnessGoal?: FitnessGoal;
  /** @index used for TDEE calculation */
  activityLevel?: UserActivityLevel;

  // ── Diet constraints ─────────────────────────────────────────────────────────
  /** e.g. ['Nuts', 'Dairy', 'Gluten'] */
  allergies?: string[];
  /** e.g. ['Diabetes', 'Hypertension'] */
  healthConditions?: string[];

  // ── Planning preferences ─────────────────────────────────────────────────────
  mealsPerDay?: 2 | 3 | 4 | 5;
  /** Manual override; if absent, calculated TDEE is used */
  dailyCalorieTarget?: number;

  // ── Computed fields (cached, recalculated on save) ───────────────────────────
  bmr?: number;
  tdee?: number;
}

// ─── User Profile Types ────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
  avatarIcon?: string;

  // Food & cooking preferences
  /** Multiple diet preferences — a user may eat both Vegetarian and Non-Vegetarian */
  dietPreferences?: string[];
  favoriteCuisines: string[];
  cookingLevel: 'Beginner' | 'Intermediate' | 'Expert';

  // Health & fitness data (optional, filled during profile setup)
  healthProfile?: UserHealthProfile;

  /** ISO date-time of last profile completion */
  profileCompletedAt?: string;
}

// ─── Review Type ──────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  userId: string;
  userName: string;
  recipeId: string;
  rating: number;
  comment: string;
  date: string;
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  '(tabs)': undefined;
  '(onboarding)': undefined;
  'recipe/[id]': { id: string; source?: 'master' | 'ai' };
  'recipe/cooking/[id]': { id: string; source?: 'master' | 'ai' };
  'category/[name]': { name: string };
};

// ─── Supabase DB Row Types ─────────────────────────────────────────────────────

export interface DbIngredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface DbStep {
  step_number: number;
  instruction: string;
  duration_min: number;
}

export interface DbRecipeRow {
  id: string;
  recipe_slug?: string | null;
  uploaded_by?: string | null;
  source?: 'app' | 'user_upload' | 'ai';
  title: string;
  description?: string;
  cuisine?: string;
  diet?: string;
  difficulty?: string;
  cook_time?: number;
  prep_time?: number;
  servings?: number;
  image_url?: string;
  tags?: string[];
  is_public?: boolean;
  deleted_at?: string | null;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  ingredient_fts?: string | null;
  fts_vector?: string | null;
  ingredients?: DbIngredient[];
  steps?: DbStep[];
  extra?: {
    local_id?: string;
    rating?: number;
    reviews?: number;
    preparation?: PreparationStep[];
    equipment?: string[];
    tips?: string[];
    [key: string]: unknown;
  };
  created_at?: string;
  updated_at?: string;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.trim();
    if (!cleaned) return fallback;
    const n = Number(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function mapIngredientRow(raw: unknown) {
  if (typeof raw === 'string') {
    return { name: raw, quantity: 0, unit: '' };
  }

  const item = (raw ?? {}) as Record<string, unknown>;
  const name = String(
    item.name ?? item.ingredient ?? item.item ?? item.title ?? ''
  );
  const quantity = toFiniteNumber(item.quantity ?? item.qty, 0);
  const amountText = typeof item.amount === 'string' ? item.amount.trim() : '';
  const unit = String(item.unit ?? amountText);

  return { name, quantity, unit };
}

function mapStepRow(raw: unknown, index: number) {
  if (typeof raw === 'string') {
    return { step: index + 1, instruction: raw, time: 0 };
  }

  const item = (raw ?? {}) as Record<string, unknown>;
  return {
    step: toFiniteNumber(item.step_number ?? item.step ?? item.order, index + 1),
    instruction: String(item.instruction ?? item.text ?? item.description ?? ''),
    time: toFiniteNumber(item.duration_min ?? item.time ?? item.minutes ?? item.duration, 0),
  };
}

function tryParseJsonArray(value: unknown): unknown[] {
  if (!value || typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Maps a Supabase master_recipes row to the app's Recipe type */
export function mapDbToRecipe(row: DbRecipeRow): Recipe {
  const extra = (row.extra ?? {}) as NonNullable<DbRecipeRow['extra']>;
  const ingredientRows = Array.isArray(row.ingredients)
    ? row.ingredients
    : tryParseJsonArray(row.ingredients);
  const stepRows = Array.isArray(row.steps)
    ? row.steps
    : tryParseJsonArray(row.steps);

  return {
    id: row.id,
    name: row.title,
    source: row.source ?? 'app',
    cuisine: row.cuisine ?? '',
    diet: (row.diet ?? 'Vegetarian') as Recipe['diet'],
    difficulty: (row.difficulty ?? 'Medium') as Recipe['difficulty'],
    cook_time: row.cook_time ?? 0,
    prep_time: row.prep_time ?? 0,
    servings: row.servings ?? 2,
    calories: toFiniteNumber(row.calories, 0),
    rating: extra.rating ?? 4.5,
    reviews: extra.reviews ?? 0,
    image: row.image_url ?? '',
    description: row.description ?? '',
    ingredients: ingredientRows.map((ing) => mapIngredientRow(ing)),
    preparation: extra.preparation ?? [],
    nutrition: {
      protein: toFiniteNumber(row.protein_g, 0),
      carbs: toFiniteNumber(row.carbs_g, 0),
      fat: toFiniteNumber(row.fat_g, 0),
      fiber: toFiniteNumber(row.fiber_g, 0),
      sugar: toFiniteNumber(row.sugar_g, 0),
    },
    equipment: extra.equipment ?? [],
    steps: stepRows.map((s, idx) => mapStepRow(s, idx)),
    tips: extra.tips ?? [],
    tags: row.tags ?? [],
  };
}
