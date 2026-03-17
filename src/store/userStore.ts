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
  logout: () => void;

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

      logout: () => set({ profile: null, hasOnboarded: false }),

      syncFromSupabase: async (options) => {
        const force = options?.force ?? false;
        const last = get().lastCloudSyncAt;
        if (!force && last && Date.now() - last < USER_SYNC_TTL_MS) {
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
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
          hasOnboarded: true,
          lastCloudSyncAt: Date.now(),
          profile: {
            // Preserve any local-only fields not yet pushed
            ...s.profile,
            id: data.id,
            name: data.name ?? s.profile?.name ?? '',
            email: data.email ?? s.profile?.email ?? '',
            username: data.username ?? s.profile?.username,
            avatar: data.avatar_url ?? s.profile?.avatar,
            avatarIcon: data.avatar_icon ?? s.profile?.avatarIcon,
            dietPreferences: data.diet_preferences ?? s.profile?.dietPreferences ?? [],
            favoriteCuisines: data.favorite_cuisines ?? s.profile?.favoriteCuisines ?? [],
            cookingLevel: data.cooking_level ?? s.profile?.cookingLevel ?? 'Beginner',
            // Reconstruct nested healthProfile from flat DB columns (v3 schema)
            healthProfile: {
              ...s.profile?.healthProfile,
              age: data.age ?? s.profile?.healthProfile?.age,
              gender: data.gender ?? s.profile?.healthProfile?.gender,
              height: data.height_cm ?? s.profile?.healthProfile?.height,
              weight: data.weight_kg ?? s.profile?.healthProfile?.weight,
              fitnessGoal: data.fitness_goal ?? s.profile?.healthProfile?.fitnessGoal,
              activityLevel: data.activity_level ?? s.profile?.healthProfile?.activityLevel,
            },
            profileCompletedAt: data.profile_completed_at ?? s.profile?.profileCompletedAt,
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
              ...s.profile,
              id: data.id,
              name: data.name ?? s.profile?.name ?? fallbackName,
              email: data.email ?? fallbackEmail ?? s.profile?.email ?? '',
              username,
              avatar: data.avatar_url ?? s.profile?.avatar ?? authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? undefined,
              avatarIcon:
                data.avatar_icon ??
                s.profile?.avatarIcon ??
                (authUser.user_metadata?.avatar_icon as string | undefined),
              dietPreferences: data.diet_preferences ?? s.profile?.dietPreferences ?? [],
              favoriteCuisines: data.favorite_cuisines ?? s.profile?.favoriteCuisines ?? [],
              cookingLevel: data.cooking_level ?? s.profile?.cookingLevel ?? 'Beginner',
              healthProfile: {
                ...s.profile?.healthProfile,
                age: data.age ?? s.profile?.healthProfile?.age,
                gender: data.gender ?? s.profile?.healthProfile?.gender,
                height: data.height_cm ?? s.profile?.healthProfile?.height,
                weight: data.weight_kg ?? s.profile?.healthProfile?.weight,
                fitnessGoal: data.fitness_goal ?? s.profile?.healthProfile?.fitnessGoal,
                activityLevel: data.activity_level ?? s.profile?.healthProfile?.activityLevel,
              },
              profileCompletedAt: data.profile_completed_at ?? s.profile?.profileCompletedAt,
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
