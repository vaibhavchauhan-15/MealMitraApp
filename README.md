# MealMitra

MealMitra is an Expo + React Native recipe and meal-planning app focused on Indian food.

It combines:
- Supabase-backed recipe discovery and search
- AI recipe generation from available ingredients
- AI diet planning with public-plan reuse
- Weekly planner + grocery flow
- Profile-driven recommendations

This README is updated to match the current codebase and migration system.

---

## Screenshots

| Login | Sign Up | Home |
|---|---|---|
| ![Login](./assets/images/loginpage.png) | ![Signup](./assets/images/signuppage.png) | ![Home](./assets/images/homepage.png) |

| Search | Saved Recipes | Meal Planner |
|---|---|---|
| ![Search](./assets/images/searchpage.png) | ![Saved](./assets/images/savedrecipe.png) | ![Planner](./assets/images/plannerpage.png) |

| Profile | Settings |
|---|---|
| ![Profile](./assets/images/userprofile.png) | ![Settings](./assets/images/settingpage.png) |

---

## Feature Overview

### Recipe Discovery
- Search and filter recipes by title, cuisine, diet, difficulty, cook time, and calories.
- Curated sections: Featured, Trending, and Quick recipes.
- Cuisine-first browsing from the home screen.
- Personalized suggestions using user health profile and goals.

### Cooking Mode
- Full-screen step-by-step cooking view.
- Per-step timer with start, pause, and resume.
- Background-safe timer behavior with local notifications via `expo-notifications`.
- Vibration feedback on timer completion.

### AI Assistant ("What can I cook?")
- Input available ingredients.
- App first searches recipe DB by ingredient match.
- If no strong match, generates AI recipes through Groq (`llama-3.3-70b-versatile`).
- AI recipes can be saved, uploaded (public), and added to meal planner slots.

### AI Diet Planner
- Uses user fitness profile to calculate BMR/TDEE and target calories/protein.
- Supports goals: `muscle_gain`, `fat_loss`, `maintain`, `weight_gain`.
- Supports diet types: `vegetarian`, `non_veg`, `vegan`, `eggetarian`.
- Public-plan-first flow: exact public plan matches are reused before generating a new one.
- Generated plans can be saved, uploaded publicly, and mapped into planner meals.

### Planner + Grocery
- Weekly planner for Breakfast/Lunch/Dinner/Snack.
- Add recipes to specific day + slot.
- Generate grocery list from selected planner days.
- Remove single meals or clear full week.

### Profiles, Auth, and Sync
- Supabase auth (email/password + Google OAuth + guest mode in app flow).
- User profile and health data synced to `user_profiles`.
- Recent searches and recently viewed recipes synced to profile columns.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile | React Native 0.81 + Expo SDK 54 |
| Routing | Expo Router |
| Language | TypeScript |
| State | Zustand + AsyncStorage persist |
| Backend | Supabase (Auth, Postgres, RLS, RPC) |
| AI | Groq Chat Completions API |
| Search | Postgres FTS + trigram + ingredient alias normalization |
| Notifications | expo-notifications |

---

## Current Architecture Notes

- App entry uses Expo Router (`main: expo-router/entry`).
- `App.tsx` is not the runtime app shell for navigation; routes live under `app/`.
- Core recipe search is Supabase-based (`src/services/searchService.ts`), not local Fuse.js indexing.
- AI user recipes are stored in `user_ai_generated_recipes`.
- Planner/diet-plan meal rows support polymorphic recipe references using `recipe_source` (`master` or `ai`).

---

## Project Structure

```text
MealMitraApp/
├── app/                          # Expo Router routes
│   ├── (onboarding)/             # Login/signup/profile setup flow
│   ├── (tabs)/                   # Home/search/saved/planner/profile tabs
│   ├── ai-assistant.tsx          # Ingredient-based assistant
│   ├── recipe/[id].tsx           # Recipe detail
│   ├── recipe/cooking/[id].tsx   # Cooking mode with timers
│   └── ...
├── src/
│   ├── components/               # UI components (incl. AiDietPlannerModal)
│   ├── data/                     # Seed recipe datasets by cuisine
│   ├── services/                 # Supabase, search, AI diet/recipe services
│   ├── store/                    # Zustand stores (planner, recipes, user, saved, grocery)
│   ├── theme/                    # Theme tokens + hook
│   └── types/                    # App and DB mapping types
├── scripts/
│   ├── seed-recipes.ts           # Seed `master_recipes` via service role
│   ├── check-dupes.ts            # Duplicate title check in seeded app recipes
│   └── migrate.js                # currently empty placeholder
├── supabase/
│   └── migrations/               # SQL migrations (v3 schema + fixes)
├── app.json
└── package.json
```

---

## Environment Variables

Create `.env` in project root for app runtime:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key

# OAuth (if using Google login flow)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Notes:
- `.env.example` currently includes Google OAuth keys only.
- For seed scripts, create `scripts/.env.seed`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure env files

- Add root `.env` for app runtime.
- Add `scripts/.env.seed` for seeding tools.

### 3) Run Supabase migrations

Apply SQL files from `supabase/migrations/` in ascending filename order.

Important migrations in current flow include:
- `20260312_v3_reset.sql`
- `20260312_add_recipe_slug.sql`
- `20260313_user_ai_recipes.sql`
- `20260313_ai_recipe_reference_fix.sql`
- `20260313_master_recipes_nutrition_defaults.sql`
- `20260313_recent_searches_user_profiles.sql`
- `20260313_recently_viewed_user_profiles.sql`
- `20260314_diet_planner_system.sql`
- `20260314_diet_planner_fk_hotfix.sql`
- `canonical_inredients.sql`

### 4) Start app

```bash
npm start
```

### 5) (Optional) seed master recipes

```bash
npm run seed
```

---

## Available Scripts

| Command | Purpose |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Run native Android build |
| `npm run ios` | Run native iOS build |
| `npm run web` | Run web target |
| `npm run migrate` | Placeholder script (`scripts/migrate.js` currently empty) |
| `npm run seed` | Seed recipes into `master_recipes` |
| `npm run seed:reset` | Seed script with reset flag |
| `npm run duplicate` | Check duplicates in seeded app recipes |

---

## Supabase Data Model (Current)

Key tables used by the app:
- `user_profiles`
  - profile + fitness fields
  - includes `recent_searches` and `recent_viewed_recipe_ids`
- `master_recipes`
  - canonical public/app/user-uploaded recipes
  - FTS/trigram/index-heavy search fields
- `user_ai_generated_recipes`
  - user-owned/generated AI recipes
  - can be private or public
- `saved_recipes`
  - bookmarks with `recipe_source` + `recipe_id`
- `planner_meals`
  - weekly planner entries with source-aware recipe refs
- `diet_plans`
  - saved/generated/public diet plan payloads
- `diet_plan_meals`
  - normalized meal-slot rows attached to a diet plan
- `ingredient_aliases`
  - alias-to-canonical ingredient mapping for better search matching

All critical tables are protected by RLS policies.

---

## Deep Linking

Configured in `app.json`:
- App scheme: `mealmitra`
- Google OAuth callback: `com.mealmitra.app://oauth2redirect/google`
- Auth confirm callback: `mealmitra://auth/confirm`
- Auth callback: `mealmitra://auth/callback`

---

## Build (Android)

From project root:

```bash
cd android
./gradlew assembleRelease
```

On Windows PowerShell use:

```powershell
cd android
.\gradlew.bat assembleRelease
```

Release APK path:
- `android/app/build/outputs/apk/release/app-release.apk`

---

## Troubleshooting

- App fails with Supabase client errors:
  - confirm `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set in root `.env`.
- AI generation fails:
  - confirm `EXPO_PUBLIC_GROQ_API_KEY` is set and valid.
- Seed script fails with missing credentials:
  - confirm `scripts/.env.seed` exists with service role key.
- Planner insert errors with recipe reference:
  - ensure latest 20260313/20260314 migrations were applied (source-aware reference triggers).

---

## License

Private project. All rights reserved.
