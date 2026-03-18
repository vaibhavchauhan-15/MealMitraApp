import type { UserProfile } from '../types';

/**
 * Route authenticated users to profile setup until they complete it once.
 * We rely on profile_completed_at synced from Supabase as source of truth.
 */
export function shouldForceProfileSetup(profile: UserProfile | null | undefined): boolean {
  if (!profile || profile.id === 'guest') return false;

  if (profile.profileCompletedAt) return false;

  // Backward compatibility: older profile rows may miss profile_completed_at
  // even when preferences were already saved.
  const hasSavedPreferences =
    (profile.dietPreferences?.length ?? 0) > 0 ||
    (profile.favoriteCuisines?.length ?? 0) > 0;

  return !hasSavedPreferences;
}
