import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserHealthProfile } from '../types';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';
import { suggestUniqueUsername } from '../utils/username';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Upsert the profile into user_profiles in the background (fire-and-forget).
 *  Maps the nested healthProfile object → flat DB columns (v3 schema). */
function syncProfileToSupabase(profile: UserProfile) {
  const hp = profile.healthProfile;
  supabase.from('user_profiles').upsert({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    username: profile.username ?? null,
    avatar_url: profile.avatar ?? null,
    avatar_icon: profile.avatarIcon ?? null,
    // Flat health metric columns (replaces JSONB health_profile)
    age: hp?.age ?? null,
    gender: hp?.gender ?? null,
    height_cm: hp?.height ?? null,
    weight_kg: hp?.weight ?? null,
    fitness_goal: hp?.fitnessGoal ?? null,
    activity_level: hp?.activityLevel ?? null,
    diet_preferences: profile.dietPreferences ?? [],
    favorite_cuisines: profile.favoriteCuisines ?? [],
    cooking_level: profile.cookingLevel,
    profile_completed_at: profile.profileCompletedAt ?? null,
  }, { onConflict: 'id' }).then(({ error }) => {
    if (error) console.warn('[UserStore] syncToSupabase:', error.message);
  });
}

const ACTIVITY_MULTIPLIERS: Record<NonNullable<UserHealthProfile['activityLevel']>, number> = {
  sedentary: 1.2,
  light_1_3: 1.375,
  moderate_3_5: 1.55,
  gym_5_days: 1.725,
  very_active: 1.9,
};

const FITNESS_GOALS: NonNullable<UserHealthProfile['fitnessGoal']>[] = [
  'muscle_gain',
  'fat_loss',
  'maintain',
  'weight_gain',
];

const GENDERS: NonNullable<UserHealthProfile['gender']>[] = ['male', 'female'];

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value.trim());
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function normalizeActivityLevel(value: unknown): UserHealthProfile['activityLevel'] | undefined {
  if (typeof value !== 'string') return undefined;
  return value in ACTIVITY_MULTIPLIERS
    ? (value as UserHealthProfile['activityLevel'])
    : undefined;
}

function normalizeFitnessGoal(value: unknown): UserHealthProfile['fitnessGoal'] | undefined {
  if (typeof value !== 'string') return undefined;
  return FITNESS_GOALS.includes(value as NonNullable<UserHealthProfile['fitnessGoal']>)
    ? (value as UserHealthProfile['fitnessGoal'])
    : undefined;
}

function normalizeGender(value: unknown): UserHealthProfile['gender'] | undefined {
  if (typeof value !== 'string') return undefined;
  return GENDERS.includes(value as NonNullable<UserHealthProfile['gender']>)
    ? (value as UserHealthProfile['gender'])
    : undefined;
}

function getLegacyHealthData(data: Record<string, unknown>): Partial<UserHealthProfile> {
  const raw = data.health_profile ?? data.healthProfile;
  if (!raw || typeof raw !== 'object') return {};

  const health = raw as Record<string, unknown>;
  return {
    age: toOptionalNumber(health.age),
    gender: normalizeGender(health.gender),
    height: toOptionalNumber(health.height ?? health.height_cm),
    weight: toOptionalNumber(health.weight ?? health.weight_kg),
    fitnessGoal: normalizeFitnessGoal(health.fitnessGoal ?? health.fitness_goal ?? health.goal),
    activityLevel: normalizeActivityLevel(health.activityLevel ?? health.activity_level),
    bmr: toOptionalNumber(health.bmr),
    tdee: toOptionalNumber(health.tdee),
  };
}

function deriveEnergyMetrics(health: UserHealthProfile) {
  const { age, gender, weight, height, activityLevel } = health;
  if (!age || !gender || !weight || !height || !activityLevel) {
    return { bmr: health.bmr, tdee: health.tdee };
  }
  const base = 10 * weight + 6.25 * height - 5 * age;
  const bmr = Math.round(gender === 'male' ? base + 5 : base - 161);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
  return { bmr, tdee };
}

function buildHydratedHealthProfile(
  data: Record<string, unknown>,
  existing?: UserHealthProfile
): UserHealthProfile {
  const legacy = getLegacyHealthData(data);

  const merged: UserHealthProfile = {
    ...(existing ?? {}),
    age: toOptionalNumber(data.age) ?? legacy.age ?? existing?.age,
    gender: normalizeGender(data.gender) ?? legacy.gender ?? existing?.gender,
    height: toOptionalNumber(data.height_cm) ?? legacy.height ?? existing?.height,
    weight: toOptionalNumber(data.weight_kg) ?? legacy.weight ?? existing?.weight,
    fitnessGoal: normalizeFitnessGoal(data.fitness_goal) ?? legacy.fitnessGoal ?? existing?.fitnessGoal,
    activityLevel: normalizeActivityLevel(data.activity_level) ?? legacy.activityLevel ?? existing?.activityLevel,
    bmr: toOptionalNumber(data.bmr) ?? legacy.bmr ?? existing?.bmr,
    tdee: toOptionalNumber(data.tdee) ?? legacy.tdee ?? existing?.tdee,
  };

  const { bmr, tdee } = deriveEnergyMetrics(merged);
  return {
    ...merged,
    bmr,
    tdee,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemePreference = 'system' | 'light' | 'dark';
const USER_SYNC_TTL_MS = 1000 * 60;

interface UserState {
  profile: UserProfile | null;
  hasOnboarded: boolean;
  themePreference: ThemePreference;
  lastCloudSyncAt: number | null;

  // ── Setters ──────────────────────────────────────────────────────────────────
  setProfile: (p: UserProfile) => void;
  setThemePreference: (t: ThemePreference) => void;
  /** Shallow-merge top-level profile fields */
  updateProfile: (p: Partial<UserProfile>) => void;
  /** Deep-merge the nested healthProfile sub-object */
  updateHealthProfile: (h: Partial<UserHealthProfile>) => void;
  setHasOnboarded: (v: boolean) => void;
  logout: () => Promise<void>;

  // ── Sync ──────────────────────────────────────────────────────────────────────
  /** Call once on app start (after auth) to pull server profile into local store. */
  syncFromSupabase: (options?: { force?: boolean }) => Promise<void>;
  /** Build local profile from auth user and hydrate cloud profile when available. */
  hydrateFromAuthUser: (authUser: User) => Promise<void>;

  // ── Derived helpers ───────────────────────────────────────────────────────────
  /** Returns true when the user has filled the required health fields */
  isHealthProfileComplete: () => boolean;
  /** Completeness score 0–100 (used for profile progress UI) */
  profileCompleteness: () => number;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      hasOnboarded: false,
      themePreference: 'system',
      lastCloudSyncAt: null,

      setThemePreference: (t) => set({ themePreference: t }),

      setProfile: (p) => {
        set({ profile: p });
        syncProfileToSupabase(p);
      },

      updateProfile: (p) =>
        set((s) => {
          const updated = s.profile ? { ...s.profile, ...p } : null;
          if (updated) syncProfileToSupabase(updated);
          return { profile: updated };
        }),

      updateHealthProfile: (h) =>
        set((s) => {
          if (!s.profile) return {};
          const updated: UserProfile = {
            ...s.profile,
            healthProfile: { ...(s.profile.healthProfile ?? {}), ...h },
            profileCompletedAt: new Date().toISOString(),
          };
          syncProfileToSupabase(updated);
          return { profile: updated };
        }),

      setHasOnboarded: (v) => set({ hasOnboarded: v }),

      logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('[UserStore] logout signOut:', error.message);
        }
        set({ profile: null, hasOnboarded: false, lastCloudSyncAt: null });
      },

      syncFromSupabase: async (options) => {
        const force = options?.force ?? false;
        const last = get().lastCloudSyncAt;
        if (!force && last && Date.now() - last < USER_SYNC_TTL_MS) {
          return;
        }

        let uid: string | undefined;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const { data: { session } } = await supabase.auth.getSession();
          uid = session?.user?.id;
          if (uid) break;
          await new Promise((resolve) => setTimeout(resolve, 220));
        }
        if (!uid) return;
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', uid)
          .maybeSingle();
        if (error) { console.warn('[UserStore] sync:', error.message); return; }
        if (!data) {
          set({ hasOnboarded: true, lastCloudSyncAt: Date.now() });
          return;
        }
        set((s) => ({
          // Preserve local fields only for the same authenticated user.
          // This prevents stale profile data from another account after relogin.
          hasOnboarded: true,
          lastCloudSyncAt: Date.now(),
          profile: {
            ...(s.profile?.id === uid ? s.profile : null),
            id: data.id,
            name: data.name ?? (s.profile?.id === uid ? s.profile?.name : undefined) ?? '',
            email: data.email ?? (s.profile?.id === uid ? s.profile?.email : undefined) ?? '',
            username: data.username ?? (s.profile?.id === uid ? s.profile?.username : undefined),
            avatar: data.avatar_url ?? (s.profile?.id === uid ? s.profile?.avatar : undefined),
            avatarIcon: data.avatar_icon ?? (s.profile?.id === uid ? s.profile?.avatarIcon : undefined),
            dietPreferences: data.diet_preferences ?? (s.profile?.id === uid ? s.profile?.dietPreferences : undefined) ?? [],
            favoriteCuisines: data.favorite_cuisines ?? (s.profile?.id === uid ? s.profile?.favoriteCuisines : undefined) ?? [],
            cookingLevel: data.cooking_level ?? (s.profile?.id === uid ? s.profile?.cookingLevel : undefined) ?? 'Beginner',
            healthProfile: buildHydratedHealthProfile(
              data as Record<string, unknown>,
              s.profile?.id === uid ? s.profile?.healthProfile : undefined
            ),
            profileCompletedAt: data.profile_completed_at ?? (s.profile?.id === uid ? s.profile?.profileCompletedAt : undefined),
          },
        }));
      },

      hydrateFromAuthUser: async (authUser) => {
        const fallbackName =
          authUser.user_metadata?.full_name ??
          authUser.user_metadata?.name ??
          authUser.email?.split('@')[0] ??
          'User';
        const fallbackEmail = authUser.email ?? '';

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (error) {
          console.warn('[UserStore] hydrateFromAuthUser:', error.message);
        }

        if (data) {
          const desiredUsername =
            (data.username as string | null) ??
            (authUser.user_metadata?.username as string | undefined) ??
            fallbackName;
          const username = await suggestUniqueUsername(supabase, desiredUsername, {
            userId: authUser.id,
            name: fallbackName,
            email: fallbackEmail,
          });

          set((s) => ({
            hasOnboarded: true,
            profile: {
              ...(s.profile?.id === authUser.id ? s.profile : null),
              id: data.id,
              name: data.name ?? (s.profile?.id === authUser.id ? s.profile?.name : undefined) ?? fallbackName,
              email: data.email ?? fallbackEmail ?? (s.profile?.id === authUser.id ? s.profile?.email : undefined) ?? '',
              username,
              avatar:
                data.avatar_url ??
                (s.profile?.id === authUser.id ? s.profile?.avatar : undefined) ??
                authUser.user_metadata?.avatar_url ??
                authUser.user_metadata?.picture ??
                undefined,
              avatarIcon:
                data.avatar_icon ??
                (s.profile?.id === authUser.id ? s.profile?.avatarIcon : undefined) ??
                (authUser.user_metadata?.avatar_icon as string | undefined),
              dietPreferences: data.diet_preferences ?? (s.profile?.id === authUser.id ? s.profile?.dietPreferences : undefined) ?? [],
              favoriteCuisines: data.favorite_cuisines ?? (s.profile?.id === authUser.id ? s.profile?.favoriteCuisines : undefined) ?? [],
              cookingLevel: data.cooking_level ?? (s.profile?.id === authUser.id ? s.profile?.cookingLevel : undefined) ?? 'Beginner',
              healthProfile: buildHydratedHealthProfile(
                data as Record<string, unknown>,
                s.profile?.id === authUser.id ? s.profile?.healthProfile : undefined
              ),
              profileCompletedAt:
                data.profile_completed_at ??
                (s.profile?.id === authUser.id ? s.profile?.profileCompletedAt : undefined),
            },
          }));

          if (!data.username || data.username !== username) {
            supabase
              .from('user_profiles')
              .update({ username })
              .eq('id', authUser.id)
              .then(({ error: usernameError }) => {
                if (usernameError) {
                  console.warn('[UserStore] hydrate username sync:', usernameError.message);
                }
              });
          }
          return;
        }

        const username = await suggestUniqueUsername(
          supabase,
          (authUser.user_metadata?.username as string | undefined) ?? fallbackName,
          {
            userId: authUser.id,
            name: fallbackName,
            email: fallbackEmail,
          }
        );

        const fallbackProfile: UserProfile = {
          id: authUser.id,
          name: fallbackName,
          email: fallbackEmail,
          username,
          avatar: authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? undefined,
          avatarIcon: authUser.user_metadata?.avatar_icon as string | undefined,
          dietPreferences: [],
          favoriteCuisines: [],
          cookingLevel: 'Beginner',
        };

        set({ profile: fallbackProfile, hasOnboarded: true });
        syncProfileToSupabase(fallbackProfile);
      },

      isHealthProfileComplete: () => {
        const hp = get().profile?.healthProfile;
        return !!(hp?.age && hp?.gender && hp?.weight && hp?.height && hp?.fitnessGoal && hp?.activityLevel);
      },

      profileCompleteness: () => {
        const p = get().profile;
        if (!p) return 0;
        const checks = [
          !!p.name,
          !!p.email,
          (p.dietPreferences?.length ?? 0) > 0,
          p.favoriteCuisines.length > 0,
          !!p.cookingLevel,
          !!p.healthProfile?.age,
          !!p.healthProfile?.gender,
          !!p.healthProfile?.weight,
          !!p.healthProfile?.height,
          !!p.healthProfile?.fitnessGoal,
          !!p.healthProfile?.activityLevel,
        ];
        return Math.round((checks.filter(Boolean).length / checks.length) * 100);
      },
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
