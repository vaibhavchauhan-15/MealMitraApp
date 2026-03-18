import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../../src/theme';
import { useUserStore } from '../../src/store/userStore';
import { useSavedStore } from '../../src/store/savedStore';
import { usePlannerStore } from '../../src/store/plannerStore';
import { useRecipeStore } from '../../src/store/recipeStore';
import { useInteractionNotificationStore } from '../../src/store/interactionNotificationStore';
import { getProfileIconById } from '../../src/constants/profileIcons';

type MenuItem = { icon: string; label: string; badge?: number; onPress: () => void };

function toNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value.trim());
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light_1_3: 1.375,
  moderate_3_5: 1.55,
  gym_5_days: 1.725,
  very_active: 1.9,
};

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const profile = useUserStore((s) => s.profile);
  const logout = useUserStore((s) => s.logout);
  const userLastCloudSyncAt = useUserStore((s) => s.lastCloudSyncAt);
  const syncUserFromSupabase = useUserStore((s) => s.syncFromSupabase);

  const savedCount = useSavedStore((s) => s.savedIds.length);
  const savedLastCloudSyncAt = useSavedStore((s) => s.lastCloudSyncAt);
  const syncSavedFromSupabase = useSavedStore((s) => s.syncFromSupabase);

  const plannerMealsCount = usePlannerStore((s) => s.meals.length);
  const plannerSyncStatus = usePlannerStore((s) => s.syncStatus);
  const plannerLastSyncedAt = usePlannerStore((s) => s.lastSyncedAt);
  const syncPlannerFromSupabase = usePlannerStore((s) => s.syncFromSupabase);

  const aiRecipeCount = useRecipeStore((s) => s.aiRecipes.length);
  const syncAiRecipesFromSupabase = useRecipeStore((s) => s.syncAiRecipesFromSupabase);
  const unreadNotificationCount = useInteractionNotificationStore((s) => s.unreadCount);

  const avatarIcon = getProfileIconById(profile?.avatarIcon);

  useFocusEffect(
    useCallback(() => {
      void Promise.all([
        syncUserFromSupabase({ force: true }),
        syncSavedFromSupabase({ force: true }),
        syncPlannerFromSupabase({ force: true }),
        syncAiRecipesFromSupabase(),
      ]);
    }, [syncUserFromSupabase, syncSavedFromSupabase, syncPlannerFromSupabase, syncAiRecipesFromSupabase])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        syncUserFromSupabase({ force: true }),
        syncSavedFromSupabase({ force: true }),
        syncPlannerFromSupabase({ force: true }),
        syncAiRecipesFromSupabase(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [syncUserFromSupabase, syncSavedFromSupabase, syncPlannerFromSupabase, syncAiRecipesFromSupabase]);

  const cloudLastSyncedAt = useMemo(
    () =>
      [userLastCloudSyncAt, savedLastCloudSyncAt, plannerLastSyncedAt]
        .filter(Boolean)
        .sort((a, b) => (b as number) - (a as number))[0] ?? null,
    [userLastCloudSyncAt, savedLastCloudSyncAt, plannerLastSyncedAt]
  );

  const cloudSyncLabel = useMemo(() => {
    if (!profile?.id) return 'Cloud sync inactive';
    if (plannerSyncStatus === 'syncing') return 'Cloud syncing';
    if (plannerSyncStatus === 'error') return 'Cloud sync issue';
    const syncedAtLabel = cloudLastSyncedAt
      ? new Date(cloudLastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : null;
    return syncedAtLabel ? `Cloud synced ${syncedAtLabel}` : 'Cloud sync ready';
  }, [profile?.id, plannerSyncStatus, cloudLastSyncedAt]);

  const cloudSyncColor = useMemo(() => {
    if (!profile?.id) return colors.textSecondary;
    if (plannerSyncStatus === 'syncing') return colors.warning;
    if (plannerSyncStatus === 'error') return colors.error;
    return colors.veg;
  }, [profile?.id, plannerSyncStatus, colors]);

  const health = profile?.healthProfile;
  const tdee = useMemo(() => {
    const cloudTdee = toNumberOrUndefined(health?.tdee);
    if (cloudTdee) return Math.round(cloudTdee);

    const age = toNumberOrUndefined(health?.age);
    const weightValue = toNumberOrUndefined(health?.weight);
    const height = toNumberOrUndefined(health?.height);
    const gender = health?.gender;
    const activityLevel = health?.activityLevel;

    if (!age || !weightValue || !height || !gender || !activityLevel) return undefined;
    const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel];
    if (!activityMultiplier) return undefined;

    const base = 10 * weightValue + 6.25 * height - 5 * age;
    const bmr = Math.round(gender === 'male' ? base + 5 : base - 161);
    return Math.round(bmr * activityMultiplier);
  }, [health?.tdee, health?.age, health?.weight, health?.height, health?.gender, health?.activityLevel]);
  const weight = useMemo(() => {
    const n = toNumberOrUndefined(health?.weight);
    return n ? Math.round(n * 10) / 10 : undefined;
  }, [health?.weight]);
  const goalLabel = useMemo(() => {
    const goal = health?.fitnessGoal;
    if (!goal) return 'Not set';
    return goal.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }, [health?.fitnessGoal]);

  const libraryMenu: MenuItem[] = [
    { icon: 'bookmark-outline', label: 'Saved Recipes', badge: savedCount || undefined, onPress: () => router.push('/(tabs)/saved' as any) },
    { icon: 'time-outline', label: 'Recently Viewed', onPress: () => router.push('/recently-viewed' as any) },
  ];

  const appMenu: MenuItem[] = [
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      badge: unreadNotificationCount || undefined,
      onPress: () => router.push('/notifications' as any),
    },
    { icon: 'settings-outline', label: 'Settings', onPress: () => router.push('/settings' as any) },
  ];

  const supportMenu: MenuItem[] = [
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => router.push('/help' as any) },
    { icon: 'shield-outline', label: 'Privacy Policy', onPress: () => router.push('/privacy' as any) },
  ];

  const MenuGroup = ({ title, items }: { title: string; items: MenuItem[] }) => (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.groupCard, { backgroundColor: colors.surface }]}> 
        {items.map((item, idx) => (
          <React.Fragment key={item.label}>
            <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.75}>
              <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                <Ionicons name={item.icon as any} size={18} color={colors.accent} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              {item.badge ? (
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
            </TouchableOpacity>
            {idx < items.length - 1 && <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.topBar, { paddingTop: insets.top + 6, borderBottomColor: colors.border }]}>
        <Text style={[styles.topTitle, { color: colors.text }]}>Profile</Text>
        <TouchableOpacity
          style={[styles.topIconBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/settings' as any)}
          activeOpacity={0.75}
        >
          <Ionicons name="settings-outline" size={19} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}> 
          <View style={[styles.syncRow, { borderColor: colors.border, backgroundColor: colors.background }]}> 
            <Ionicons name="cloud-done-outline" size={13} color={cloudSyncColor} />
            <Text style={[styles.syncText, { color: cloudSyncColor }]}>{cloudSyncLabel}</Text>
          </View>

          <View style={[styles.avatar, { backgroundColor: colors.accent }]}> 
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
            ) : avatarIcon ? (
              <Ionicons name={avatarIcon.icon} size={28} color="#FFF" />
            ) : (
              <Text style={styles.avatarLetter}>{profile?.name ? profile.name[0].toUpperCase() : 'U'}</Text>
            )}
          </View>

          <Text style={[styles.name, { color: colors.text }]}>{profile?.name || 'Food Enthusiast'}</Text>
          {!!profile?.username && <Text style={[styles.username, { color: colors.accent }]}>@{profile.username}</Text>}
          <Text style={[styles.email, { color: colors.textSecondary }]}>{profile?.email || 'Complete your profile details'}</Text>

          <TouchableOpacity
            style={[styles.editBtn, { borderColor: colors.border }]}
            onPress={() => router.push('/edit-profile' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={15} color={colors.text} />
            <Text style={[styles.editBtnText, { color: colors.text }]}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={[styles.quickStats, { borderTopColor: colors.border }]}>
            <View style={styles.quickStatItem}>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>{savedCount}</Text>
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Saved</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.quickStatItem}>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>{plannerMealsCount}</Text>
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Planner</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.quickStatItem}>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>{aiRecipeCount}</Text>
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>AI Recipes</Text>
            </View>
          </View>
        </View>

        <View style={[styles.healthCard, { backgroundColor: colors.surface }]}> 
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HEALTH STATS</Text>
          <View style={styles.healthGrid}>
            <View style={[styles.healthTile, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.healthValue, { color: colors.accent }]}>{tdee ? `${tdee} kcal` : 'Not set'}</Text>
              <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>TDEE</Text>
            </View>
            <View style={[styles.healthTile, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.healthValue, { color: colors.success }]}>{weight ? `${weight} kg` : 'Not set'}</Text>
              <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>Weight</Text>
            </View>
            <View style={[styles.healthTile, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.healthValue, { color: '#F59E0B' }]}>{goalLabel}</Text>
              <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>Goal</Text>
            </View>
          </View>
        </View>

        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>MY RECIPES</Text>
          <View style={[styles.actionCard, { backgroundColor: colors.surface }]}> 
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accentLight }]}
              onPress={() => router.push('/my-recipes' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="restaurant-outline" size={18} color={colors.accent} />
              <Text style={[styles.actionText, { color: colors.accent }]}>View My Recipes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/upload-recipe' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#FFF" />
              <Text style={[styles.actionText, { color: '#FFF' }]}>Upload Recipe</Text>
            </TouchableOpacity>
          </View>
        </View>

        <MenuGroup title="MY LIBRARY" items={libraryMenu} />
        <MenuGroup title="APP" items={appMenu} />
        <MenuGroup title="SUPPORT" items={supportMenu} />

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.error }]}
          onPress={async () => {
            await logout();
            router.replace('/(onboarding)' as any);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={[styles.logoutTxt, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textTertiary }]}>MealMitra v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  topIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    gap: Spacing.sm,
  },
  syncRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '90%',
  },
  syncText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  profileCard: {
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    paddingTop: Spacing.xl,
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  avatarImg: { width: 76, height: 76, borderRadius: 38 },
  avatarLetter: { fontSize: 30, fontWeight: '800', color: '#FFF' },
  name: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  username: { fontSize: Typography.fontSize.sm, fontWeight: '700' },
  email: { fontSize: Typography.fontSize.xs, marginBottom: 8 },
  editBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtnText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  quickStats: {
    width: '100%',
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickStatItem: { flex: 1, alignItems: 'center' },
  quickStatValue: { fontSize: Typography.fontSize.lg, fontWeight: '800' },
  quickStatLabel: { fontSize: Typography.fontSize.xs, marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, height: 28 },
  healthCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  healthGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  healthTile: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 76,
  },
  healthValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  healthLabel: {
    marginTop: 4,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  group: { gap: 6 },
  groupLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginLeft: 4,
  },
  groupCard: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  actionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
  },
  actionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: '600' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  rowDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing.base },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    borderWidth: 1.5,
    marginTop: 4,
  },
  logoutTxt: { fontSize: Typography.fontSize.base, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: Typography.fontSize.xs, paddingBottom: 4 },
});
