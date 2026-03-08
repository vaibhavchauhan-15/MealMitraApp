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

// ─── Meal Planner Types ────────────────────────────────────────────────────────

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface MealEntry {
  id: string;
  day: DayOfWeek;
  mealType: MealType;
  recipeId: string;
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

// ─── User Profile Types ────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  dietPreference?: string;
  favoriteCuisines: string[];
  cookingLevel: 'Beginner' | 'Intermediate' | 'Expert';
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
  'recipe/[id]': { id: string };
  'recipe/cooking/[id]': { id: string };
  'category/[name]': { name: string };
};
