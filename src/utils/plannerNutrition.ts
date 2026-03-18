import { Recipe, UserProfile } from '../types';

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface NutritionTargets extends NutritionTotals {}

const GOAL_ADJUSTMENTS: Record<string, number> = {
  muscle_gain: 300,
  weight_gain: 500,
  maintain: 0,
  fat_loss: -400,
};

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light_1_3: 1.375,
  moderate_3_5: 1.55,
  gym_5_days: 1.725,
  very_active: 1.9,
};

function computeTdee(profile: UserProfile): number | null {
  const hp = profile.healthProfile;
  if (!hp) return null;
  if (typeof hp.tdee === 'number' && Number.isFinite(hp.tdee)) {
    return Math.round(hp.tdee);
  }

  if (!hp.age || !hp.gender || !hp.weight || !hp.height || !hp.activityLevel) {
    return null;
  }

  const activity = ACTIVITY_MULTIPLIERS[hp.activityLevel];
  if (!activity) return null;

  const base = 10 * hp.weight + 6.25 * hp.height - 5 * hp.age;
  const bmr = hp.gender === 'male' ? base + 5 : base - 161;
  return Math.round(bmr * activity);
}

export function getDailyNutritionTargets(profile: UserProfile | null | undefined): NutritionTargets | null {
  if (!profile?.healthProfile) return null;

  const hp = profile.healthProfile;
  const baseCalories =
    typeof hp.dailyCalorieTarget === 'number' && Number.isFinite(hp.dailyCalorieTarget)
      ? Math.round(hp.dailyCalorieTarget)
      : (() => {
          const tdee = computeTdee(profile);
          if (!tdee) return null;
          const delta = GOAL_ADJUSTMENTS[hp.fitnessGoal ?? 'maintain'] ?? 0;
          return Math.round(tdee + delta);
        })();

  if (!baseCalories || baseCalories <= 0) return null;

  const protein =
    typeof hp.weight === 'number' && Number.isFinite(hp.weight)
      ? Math.round(hp.weight * (hp.fitnessGoal === 'fat_loss' ? 2.2 : hp.fitnessGoal === 'muscle_gain' ? 2.0 : 1.6))
      : Math.round((baseCalories * 0.25) / 4);

  const fat = Math.max(20, Math.round((baseCalories * 0.27) / 9));
  const carbs = Math.max(0, Math.round((baseCalories - protein * 4 - fat * 9) / 4));
  const fiber = baseCalories >= 2000 ? 32 : 28;

  return {
    calories: baseCalories,
    protein,
    carbs,
    fat,
    fiber,
  };
}

export function sumNutritionFromRecipes(recipes: Array<Recipe | null | undefined>): NutritionTotals {
  return recipes.reduce(
    (acc, recipe) => {
      if (!recipe) return acc;
      return {
        calories: acc.calories + (recipe.calories || 0),
        protein: acc.protein + (recipe.nutrition?.protein || 0),
        carbs: acc.carbs + (recipe.nutrition?.carbs || 0),
        fat: acc.fat + (recipe.nutrition?.fat || 0),
        fiber: acc.fiber + (recipe.nutrition?.fiber || 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

export function getExceededTargetKeys(totals: NutritionTotals, targets: NutritionTargets): Array<keyof NutritionTotals> {
  const keys: Array<keyof NutritionTotals> = ['calories', 'protein', 'carbs', 'fat', 'fiber'];
  return keys.filter((key) => totals[key] > targets[key]);
}
