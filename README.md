# MealMitra

MealMitra is an Expo + React Native recipe and meal-planning app focused on Indian food, AI-assisted cooking, and profile-aware nutrition.

It combines:
- Supabase-backed recipe discovery and social engagement
- AI recipe generation from available ingredients
- AI diet planning with public-plan reuse and planner hydration
- Weekly planner and grocery generation
- Public user discovery with creator profile pages
- Real-time interaction notifications (likes, comments, replies)

This README reflects the current codebase, including the latest social and public discovery flows.

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

## Feature Overview

### 1) Recipe Discovery and Search
- Search and filter recipes by title, cuisine, diet, difficulty, cook time, and calories.
- Curated sections on Home: Featured, Trending, Quick, and For You chips.
- Cuisine browsing from Home.
- Recently viewed and recent searches syncing to profile columns.

### 2) AI Assistant (What can I cook?)
- Accepts available ingredients.
- Performs ingredient-matching against existing recipes first.
- Falls back to Groq generation (`llama-3.3-70b-versatile`) when needed.
- AI recipes can be saved, uploaded publicly, viewed in browse feeds, and added to planner.

### 3) Social Recipe Interactions
- Recipe likes and dislikes with source-aware recipe identity (`master` or `ai`).
- Threaded comments and replies.
- Comment likes.
- Recipe cards and detail pages display engagement counters.
- Owners can see dislike counts for their own uploaded recipes.

### 4) Notifications
- Real-time interaction notifications for:
  - `recipe_liked`
  - `recipe_disliked`
  - `recipe_commented`
  - `comment_replied`
  - `comment_liked`
- Realtime bridge hydrates notifications and updates Zustand store.
- Local notification fallback for background app state in dev/prod builds (not Expo Go).

### 5) Public Discovery
- Browse public AI recipes (`/browse-ai-recipes`) with query, recent local searches, and sorting.
- Browse public users (`/browse-users`) with filters and sorting.
- Public user profile route (`/user/[id]`) with uploaded recipes and engagement preview.

### 6) AI Diet Planner
- Calculates BMR/TDEE-derived targets from fitness profile.
- Supports goals: `muscle_gain`, `fat_loss`, `maintain`, `weight_gain`.
- Supports diet types: `vegetarian`, `non_veg`, `vegan`, `eggetarian`.
- Public plan reuse flow before regeneration.
- Public plan detail route (`/public-ai-plan/[id]`) can map meals into planner.
- Nutrition guard prevents adding plans that exceed daily targets.

### 7) Planner and Grocery
- Weekly planner for Breakfast/Lunch/Dinner/Snack.
- Source-aware recipe references in planner meals.
- Grocery list generated from selected planner days.
- Single slot remove and full clear support.

### 8) Auth, Profile, and OTP
- Supabase auth with email/password and Google OAuth.
- OTP edge functions for signup and account actions.
- Profile setup gating on first authenticated login.
- Cloud sync for profile, planner, saved recipes, AI recipes, and interaction notifications.

## Deep-Dive Docs

Use these for implementation-level details:
- [Documentation Index](./docs/README.md)
- [Social, Public Discovery, and Notifications](./docs/social-discovery-notifications.md)
- [AI Planner and Nutrition Guardrails](./docs/ai-planner-deep-dive.md)

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile | React Native 0.81 + Expo SDK 54 |
| Routing | Expo Router |
| Language | TypeScript |
| State | Zustand + AsyncStorage |
| Backend | Supabase (Auth, Postgres, RLS, RPC, Realtime) |
| AI | Groq Chat Completions API |
| Search | Supabase/Postgres query + ranking + ingredient alias normalization |
| Notifications | expo-notifications + realtime bridge |

## Architecture Notes

- App entry is Expo Router (`main: expo-router/entry`).
- Runtime route shell is `app/_layout.tsx`.
- `App.tsx` is present but navigation lives under `app/`.
- Core search and browse logic is in `src/services/searchService.ts`.
- Recipe social logic is in `src/services/recipeSocialService.ts`.
- Interaction notification bridge is in `src/services/interactionNotificationService.ts`.
- Diet-plan persistence is in `src/services/aiPlanSupabaseService.ts`.

## Project Structure

```text
MealMitraApp/
|- app/                               # Expo Router routes
|  |- (onboarding)/                   # Auth and onboarding
|  |- (tabs)/                         # Home/search/saved/planner/profile
|  |- browse-ai-recipes.tsx           # Public AI recipe feed
|  |- browse-users.tsx                # Public creator browse
|  |- user/[id].tsx                   # Public creator profile
|  |- notifications.tsx               # Social interaction notifications
|  |- public-ai-plan/[id].tsx         # Public AI plan detail
|  |- recipe/[id].tsx                 # Recipe detail + social interactions
|  |- recipe/cooking/[id].tsx         # Cooking mode timer flow
|  \- ...
|- src/
|  |- components/                     # UI components
|  |- hooks/                          # Hooks incl. local recent searches
|  |- services/                       # Supabase/search/social/AI services
|  |- store/                          # Zustand stores
|  |- theme/                          # Theme tokens/hook
|  \- types/                          # App types
|- scripts/                           # Seeding and checks
|- supabase/
|  |- functions/                      # Edge functions (OTP and auth flows)
|  \- migrations/                     # SQL migrations
|- docs/                              # In-depth project docs
|- app.json
\- package.json
```

## Environment Variables

Create `.env` in project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key

# OAuth (if using Google login flow)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Seed scripts use `scripts/.env.seed`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Setup

### 1) Install

```bash
npm install
```

### 2) Configure env files

- Add root `.env`.
- Add `scripts/.env.seed` (for seeding scripts).

### 3) Run Supabase migrations

Apply files in `supabase/migrations/` in ascending order.

Core schema and features include:
- `20260312_v3_reset.sql`
- `20260312_add_recipe_slug.sql`
- `20260313_user_ai_recipes.sql`
- `20260313_ai_recipe_reference_fix.sql`
- `20260313_master_recipes_nutrition_defaults.sql`
- `20260313_recent_searches_user_profiles.sql`
- `20260313_recently_viewed_user_profiles.sql`
- `20260314_diet_planner_system.sql`
- `20260314_diet_planner_fk_hotfix.sql`
- `20260316_master_recipe_batch_match_rpc.sql`
- `20260316_plan_meals_ordered_pagination_rpc.sql`
- `20260316_usernames_profile_icons.sql`
- `20260317_public_user_profiles_select.sql`
- `20260317_recipe_social_features.sql`
- `20260317_social_interaction_notifications.sql`
- `20260317_signup_otps.sql`
- `20260317_account_action_otps.sql`
- `20260317_password_reset_otps.sql`
- `20260317_otp_hourly_resend_limit.sql`
- `20260317_otp_last_sent_rate_limit.sql`
- `canonical_inredients.sql`

### 4) Start app

```bash
npm start
```

### 5) Optional seed

```bash
npm run seed
```

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Run native Android build |
| `npm run ios` | Run native iOS build |
| `npm run web` | Run web target |
| `npm run migrate` | Placeholder (`scripts/migrate.js`) |
| `npm run seed` | Seed into `master_recipes` |
| `npm run seed:reset` | Seed with reset flag |
| `npm run duplicate` | Duplicate title check |

## Supabase Data Model (Current)

Key tables:
- `user_profiles`
- `master_recipes`
- `user_ai_generated_recipes`
- `saved_recipes`
- `planner_meals`
- `diet_plans`
- `diet_plan_meals`
- `recipe_reactions`
- `recipe_comments`
- `comment_likes`
- `user_notifications`
- `ingredient_aliases`

All critical tables use RLS policies.

## Deep Linking

Configured in `app.json`:
- App scheme: `mealmitra`
- Google OAuth callback: `com.mealmitra.app://oauth2redirect/google`
- Auth confirm callback: `mealmitra://auth/confirm`
- Auth callback: `mealmitra://auth/callback`
- Recipe deep link handling: `mealmitra://recipe/<id>?source=master|ai`

## Android Build

From project root:

```bash
cd android
./gradlew assembleRelease
```

Windows PowerShell:

```powershell
cd android
.\gradlew.bat assembleRelease
```

APK output:
- `android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

- Supabase client errors:
  - verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in root `.env`.
- AI generation fails:
  - verify `EXPO_PUBLIC_GROQ_API_KEY` is set and valid.
- OTP flow issues:
  - verify all `20260317_*otp*` migrations are applied.
- No notifications showing:
  - verify `user_notifications` table/triggers migrations are applied.
  - verify app is logged in and realtime is enabled.
- Public browse pages empty:
  - verify `20260317_public_user_profiles_select.sql` applied.
  - verify users have public uploaded recipes.
- Planner insert errors for source-aware recipes:
  - verify `20260313_ai_recipe_reference_fix.sql` and `20260314_diet_planner_fk_hotfix.sql`.

## License

Private project. All rights reserved.
