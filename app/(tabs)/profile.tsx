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
  ActivityIndicator,
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
import { getProfileIconById } from '../../src/constants/profileIcons';
import { supabase } from '../../src/services/supabase';
import { DbRecipeRow, mapDbToRecipe, Recipe } from '../../src/types';
import { RecipeCard } from '../../src/components/RecipeCard';
import { ConfirmModal } from '../../src/components/ConfirmModal';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';

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

function humanizeGender(gender?: string): string {
  if (!gender) return 'Not set';
  return gender.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [uploadedRecipes, setUploadedRecipes] = useState<Recipe[]>([]);
  const [loadingUploadedRecipes, setLoadingUploadedRecipes] = useState(false);
  const [deleteTargetRecipe, setDeleteTargetRecipe] = useState<Recipe | null>(null);
  const [deletingRecipeId, setDeletingRecipeId] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const profile = useUserStore((s) => s.profile);
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

  const avatarIcon = getProfileIconById(profile?.avatarIcon);

  const loadUploadedRecipes = useCallback(async () => {
    if (!profile?.id) {
      setUploadedRecipes([]);
      setLoadingUploadedRecipes(false);
      return;
    }

    setLoadingUploadedRecipes(true);
    const { data, error } = await supabase
      .from('master_recipes')
      .select(
        'id,title,description,cuisine,diet,difficulty,cook_time,prep_time,servings,calories,' +
          'protein_g,carbs_g,fat_g,fiber_g,sugar_g,image_url,tags,ingredients,steps,source,uploaded_by,created_at'
      )
      .eq('uploaded_by', profile.id)
      .eq('source', 'user_upload')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      setUploadedRecipes([]);
      setLoadingUploadedRecipes(false);
      return;
    }

    const next = (data ?? []).map((row: any) => mapDbToRecipe(row as DbRecipeRow));
    setUploadedRecipes(next);
    setLoadingUploadedRecipes(false);
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      void Promise.all([
        syncUserFromSupabase({ force: true }),
        syncSavedFromSupabase({ force: true }),
        syncPlannerFromSupabase({ force: true }),
        syncAiRecipesFromSupabase(),
        loadUploadedRecipes(),
      ]);
    }, [syncUserFromSupabase, syncSavedFromSupabase, syncPlannerFromSupabase, syncAiRecipesFromSupabase, loadUploadedRecipes])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        syncUserFromSupabase({ force: true }),
        syncSavedFromSupabase({ force: true }),
        syncPlannerFromSupabase({ force: true }),
        syncAiRecipesFromSupabase(),
        loadUploadedRecipes(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [syncUserFromSupabase, syncSavedFromSupabase, syncPlannerFromSupabase, syncAiRecipesFromSupabase, loadUploadedRecipes]);

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
  const genderLabel = useMemo(() => humanizeGender(health?.gender), [health?.gender]);
  const dietSummary = useMemo(() => {
    if (!profile?.dietPreferences || profile.dietPreferences.length === 0) return 'Not set';
    return profile.dietPreferences.slice(0, 2).join(' • ');
  }, [profile?.dietPreferences]);
  const cuisineSummary = useMemo(() => {
    if (!profile?.favoriteCuisines || profile.favoriteCuisines.length === 0) return 'Not set';
    return profile.favoriteCuisines.slice(0, 2).join(' • ');
  }, [profile?.favoriteCuisines]);

  const handleDeleteUploadedRecipe = useCallback(async () => {
    if (!deleteTargetRecipe || !profile?.id) return;

    setDeletingRecipeId(deleteTargetRecipe.id);
    const target = deleteTargetRecipe;
    setDeleteTargetRecipe(null);

    const { error } = await supabase
      .from('master_recipes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', target.id)
      .eq('uploaded_by', profile.id)
      .eq('source', 'user_upload');

    if (error) {
      showToast(error.message, 'error', 'Delete Failed');
      setDeletingRecipeId(null);
      return;
    }

    setUploadedRecipes((prev) => prev.filter((recipe) => recipe.id !== target.id));
    setDeletingRecipeId(null);
    showToast('Recipe deleted successfully.', 'success', 'Deleted');
  }, [deleteTargetRecipe, profile?.id, showToast]);

  const openRecipeEdit = useCallback(
    (recipeId: string) => {
      router.push({ pathname: '/my-recipes', params: { editRecipeId: recipeId } } as any);
    },
    [router]
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.topBar, { paddingTop: insets.top + 6, borderBottomColor: colors.border }]}>
        <Text style={[styles.topTitle, { color: colors.text }]}>Profile</Text>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.topIconBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/upload-recipe' as any)}
            activeOpacity={0.75}
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.topIconBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/settings' as any)}
            activeOpacity={0.75}
          >
            <Ionicons name="settings-outline" size={19} color={colors.text} />
          </TouchableOpacity>
        </View>
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

        <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}> 
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PROFILE DETAILS</Text>
          <View style={styles.detailsGrid}>
            <View style={[styles.detailTile, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Cooking Level</Text>
              <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{profile?.cookingLevel || 'Not set'}</Text>
            </View>
            <View style={[styles.detailTile, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Gender</Text>
              <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{genderLabel}</Text>
            </View>
            <View style={[styles.detailTileWide, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Diet Preferences</Text>
              <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{dietSummary}</Text>
            </View>
            <View style={[styles.detailTileWide, { backgroundColor: colors.background, borderColor: colors.border }]}> 
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Favorite Cuisines</Text>
              <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{cuisineSummary}</Text>
            </View>
          </View>
        </View>

        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>UPLOADED RECIPES</Text>
          {loadingUploadedRecipes ? (
            <View style={[styles.uploadedStateCard, { backgroundColor: colors.surface }]}> 
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.uploadedStateText, { color: colors.textSecondary }]}>Loading your recipes...</Text>
            </View>
          ) : uploadedRecipes.length === 0 ? (
            <View style={[styles.uploadedStateCard, { backgroundColor: colors.surface }]}> 
              <Ionicons name="restaurant-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.uploadedStateText, { color: colors.textSecondary }]}>No uploaded recipes yet.</Text>
            </View>
          ) : (
            <View style={styles.uploadedList}>
              {uploadedRecipes.map((recipe) => (
                <View key={recipe.id} style={styles.uploadedRecipeItem}>
                  <View style={styles.uploadedRecipeCardWrap}>
                    <RecipeCard
                      recipe={recipe}
                      horizontal
                      style={styles.uploadedRecipeCard}
                      horizontalActions={[
                        {
                          key: 'edit',
                          icon: 'create-outline',
                          onPress: () => openRecipeEdit(recipe.id),
                          color: colors.accent,
                        },
                        {
                          key: 'delete',
                          icon: 'trash-outline',
                          onPress: () => setDeleteTargetRecipe(recipe),
                          color: colors.error,
                          disabled: deletingRecipeId === recipe.id,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      <ConfirmModal
        visible={!!deleteTargetRecipe}
        title="Delete Recipe"
        message={
          deleteTargetRecipe
            ? `Delete ${deleteTargetRecipe.name}? This recipe will be removed from your uploaded list.`
            : 'Delete this recipe?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        icon="trash-outline"
        iconColor={colors.error}
        onCancel={() => setDeleteTargetRecipe(null)}
        onConfirm={handleDeleteUploadedRecipe}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        title={toast.title}
      />
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
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
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
    gap: Spacing.md,
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
    gap: 6,
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
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  detailsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  detailTile: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 82,
    justifyContent: 'space-between',
  },
  detailTileWide: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 70,
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    marginTop: 6,
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
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
  uploadedList: { gap: Spacing.sm },
  uploadedRecipeItem: { gap: Spacing.xs },
  uploadedRecipeCardWrap: {
    position: 'relative',
    zIndex: 1,
  },
  uploadedRecipeCard: { width: '100%' },
  uploadedStateCard: {
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  uploadedStateText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
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
});
