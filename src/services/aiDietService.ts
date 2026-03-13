// ─── MealMitra AI Diet Planning Service ──────────────────────────────────────
// Uses Groq AI with structured prompts for professional nutrition planning

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityLevel =
  | 'sedentary'
  | 'light_1_3'
  | 'moderate_3_5'
  | 'gym_5_days'
  | 'very_active';

export type DietGoal = 'muscle_gain' | 'fat_loss' | 'maintain' | 'weight_gain';
export type DietType = 'vegetarian' | 'non_veg' | 'vegan' | 'eggetarian';
export type Gender = 'male' | 'female';

export interface UserFitnessProfile {
  age: number;
  gender: Gender;
  weight: number; // kg
  height: number; // cm
  goal: DietGoal;
  activity_level: ActivityLevel;
  diet_type: DietType;
  avoid?: string; // foods to avoid
  customPrompt?: string; // user's extra preferences (e.g. "south indian", "low budget")
}

export interface MealItemStep {
  step: number;
  instruction: string;
  time: number; // minutes
}

export interface MealItemIngredient {
  name: string;    // e.g. "Oatmeal"
  amount: string;  // e.g. "50g" | "1 medium" | "2 tbsp"
}

export interface MealItem {
  name: string;
  quantity: string;                   // brief serving summary, e.g. "1 bowl (~350g)"
  ingredients: MealItemIngredient[]; // individual ingredients with amounts
  protein_g?: number;
  calories?: number;
  steps?: MealItemStep[];
}

export interface AIDietPlan {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snacks: MealItem[];
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  hydration_tip: string;
  coach_tip: string;
  tdee: number;
  bmr: number;
}

export interface NutritionCalc {
  bmr: number;
  tdee: number;
  target_calories: number;
  target_protein: number;
}

// ─── Activity Multipliers ─────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light_1_3: 1.375,
  moderate_3_5: 1.55,
  gym_5_days: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<DietGoal, number> = {
  muscle_gain: 300,
  weight_gain: 500,
  maintain: 0,
  fat_loss: -400,
};

// ─── TDEE Calculator (Mifflin St Jeor) ───────────────────────────────────────

export function calculateNutrition(profile: UserFitnessProfile): NutritionCalc {
  const { age, gender, weight, height, goal, activity_level } = profile;

  // BMR - Mifflin St Jeor
  const bmr =
    gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activity_level]);
  const target_calories = tdee + GOAL_ADJUSTMENTS[goal];

  // Protein target: 1.8-2.2g per kg for muscle gain/maintain, 2.2g for fat loss
  const proteinMultiplier =
    goal === 'fat_loss' ? 2.2 : goal === 'muscle_gain' ? 2.0 : 1.6;
  const target_protein = Math.round(weight * proteinMultiplier);

  return {
    bmr: Math.round(bmr),
    tdee,
    target_calories,
    target_protein,
  };
}

// ─── Diet labels for prompt ───────────────────────────────────────────────────

const DIET_LABELS: Record<DietType, string> = {
  vegetarian: 'Vegetarian (no meat, fish, or eggs)',
  non_veg: 'Non-Vegetarian (chicken, fish, eggs allowed)',
  vegan: 'Vegan (no animal products at all)',
  eggetarian: 'Eggetarian (eggs allowed, no meat)',
};

const GOAL_LABELS: Record<DietGoal, string> = {
  muscle_gain: 'muscle gain (build lean muscle mass)',
  fat_loss: 'fat loss (reduce body fat while preserving muscle)',
  maintain: 'weight maintenance (maintain current physique)',
  weight_gain: 'weight gain (increase overall body weight)',
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'sedentary (desk job, no exercise)',
  light_1_3: 'lightly active (1-3 days/week exercise)',
  moderate_3_5: 'moderately active (3-5 days/week exercise)',
  gym_5_days: 'very active (gym 5 days/week)',
  very_active: 'extremely active (intense daily training)',
};

// ─── Generate Diet Plan via Groq ──────────────────────────────────────────────

export async function generateAIDietPlan(
  profile: UserFitnessProfile,
  nutrition: NutritionCalc
): Promise<AIDietPlan> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured. Set EXPO_PUBLIC_GROQ_API_KEY.');
  }

  const userData = {
    age: profile.age,
    gender: profile.gender,
    weight_kg: profile.weight,
    height_cm: profile.height,
    goal: GOAL_LABELS[profile.goal],
    activity: ACTIVITY_LABELS[profile.activity_level],
    diet_type: DIET_LABELS[profile.diet_type],
    calorie_target: nutrition.target_calories,
    protein_target_g: nutrition.target_protein,
    foods_to_avoid: profile.avoid || 'none',
  };

  const systemPrompt = `You are a certified sports nutritionist and Indian diet expert.
Create a detailed, practical Indian diet plan based on the user's profile.

Rules:
- Use ONLY simple, widely available Indian foods (dal, roti, rice, sabzi, paneer, eggs, chicken, curd, etc.)
- Keep it budget-friendly and easy to prepare
- Hit the exact calorie and protein targets
- Include proper macros (carbs, fat, fiber)
- Each meal item must list EVERY ingredient separately with its own precise amount and unit
- Amounts must be realistic and measurable (e.g. "50g", "1 medium", "200ml", "2 tbsp", "1 cup")
- Each item's steps must be clear, concise, and actionable (3-6 steps per item)
- Meals must be realistic and satisfying
- Avoid foods mentioned in foods_to_avoid

Respond with ONLY a valid JSON object. No markdown, no explanation, no extra text outside JSON.
JSON structure:
{
  "breakfast": [
    {
      "name": "Dish Name",
      "quantity": "1 serving (~350g)",
      "ingredients": [
        {"name": "Oatmeal", "amount": "50g"},
        {"name": "Banana", "amount": "1 medium"},
        {"name": "Almond Milk", "amount": "200ml"}
      ],
      "protein_g": 0,
      "calories": 0,
      "steps": [
        {"step": 1, "instruction": "Do this first", "time": 3},
        {"step": 2, "instruction": "Then do this", "time": 5}
      ]
    }
  ],
  "lunch": [ ...same format... ],
  "dinner": [ ...same format... ],
  "snacks": [ ...same format... ],
  "total_calories": 0,
  "protein_g": 0,
  "carbs_g": 0,
  "fat_g": 0,
  "hydration_tip": "...",
  "coach_tip": "..."
}`;

  const extraPrefs = profile.customPrompt?.trim()
    ? `\nExtra user preferences: ${profile.customPrompt.trim()}`
    : '';

  const userPrompt = `User Profile:
${JSON.stringify(userData, null, 2)}

Target TDEE: ${nutrition.tdee} kcal/day
Target Calories: ${nutrition.target_calories} kcal/day
Target Protein: ${nutrition.target_protein}g/day${extraPrefs}

Create a complete Indian diet plan for this person. Ensure the food is practical, tasty, and helps achieve the ${profile.goal.replace('_', ' ')} goal.`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_completion_tokens: 6000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';

  // Extract JSON object from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No valid JSON in AI response. Please try again.');

  const plan: AIDietPlan = JSON.parse(jsonMatch[0]);

  // Inject our calculated values for accuracy
  plan.tdee = nutrition.tdee;
  plan.bmr = nutrition.bmr;

  return plan;
}

// ─── Generate Recipes from Ingredients via Groq ───────────────────────────────

export interface AIRecipeSuggestion {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  diet: string;
  difficulty: string;
  cook_time: number;
  prep_time: number;
  servings: number;
  calories: number;
  tags: string[];
  ingredients: { name: string; quantity: string; unit: string }[];
  steps: { step: number; instruction: string; time: number }[];
  nutrition: { protein: number; carbs: number; fat: number; fiber: number; sugar: number };
}

export async function generateRecipesFromIngredients(
  ingredients: string[],
  dietPreference?: string,
): Promise<AIRecipeSuggestion[]> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured. Set EXPO_PUBLIC_GROQ_API_KEY.');
  }

  const ingList = ingredients.join(', ');
  const dietNote = dietPreference ? ` The user follows a ${dietPreference} diet.` : '';

  const systemPrompt = `You are an expert Indian chef and recipe creator.
Create practical, delicious Indian recipes using the provided ingredients.
Rules:
- Create exactly 3 recipe suggestions
- Use simple, widely available Indian ingredients
- Each recipe must be realistic and achievable at home
- Keep cook time under 45 minutes
- Provide accurate calorie estimates
- Respond with ONLY a valid JSON array. No markdown, no text outside JSON.

JSON structure:
[
  {
    "name": "Recipe Name",
    "description": "Brief appetizing description (1-2 sentences)",
    "cuisine": "Indian cuisine type e.g. Punjabi / South Indian / Street Food",
    "diet": "Vegetarian | Non-Vegetarian | Vegan | Eggetarian",
    "difficulty": "Easy | Medium | Hard",
    "cook_time": 20,
    "prep_time": 10,
    "servings": 2,
    "calories": 350,
    "tags": ["quick", "healthy"],
    "ingredients": [
      {"name": "Tomato", "quantity": "2", "unit": "medium"},
      {"name": "Salt", "quantity": "1", "unit": "tsp"}
    ],
    "steps": [
      {"step": 1, "instruction": "Chop the tomatoes finely.", "time": 5},
      {"step": 2, "instruction": "Heat oil in a pan over medium heat.", "time": 2}
    ],
    "nutrition": {"protein": 12, "carbs": 40, "fat": 8, "fiber": 5, "sugar": 3}
  }
]`;

  const userPrompt = `I have these ingredients: ${ingList}.${dietNote}
Please create 3 delicious Indian recipes I can make with these ingredients (I may add basic pantry staples like salt, oil, water, spices).`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_completion_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No valid JSON in AI response. Please try again.');

  const recipes: AIRecipeSuggestion[] = JSON.parse(jsonMatch[0]);

  // Assign a client-side UUID to each AI recipe for navigation keys
  return recipes.map((r) => ({
    ...r,
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }));
}
