import type { UserProfile } from '../types';

/**
 * Route authenticated users to profile setup until they complete it once.
 * We rely on profile_completed_at synced from Supabase as source of truth.
 */
export function shouldForceProfileSetup(profile: UserProfile | null | undefined): boolean {
  if (!profile || profile.id === 'guest') return false;
  return !profile.profileCompletedAt;
}
