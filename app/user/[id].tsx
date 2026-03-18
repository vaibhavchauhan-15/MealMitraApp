import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/useTheme';
import { BorderRadius, Spacing, Typography } from '../../src/theme';
import { FallbackImage } from '../../src/components/FallbackImage';
import { RecipeCard } from '../../src/components/RecipeCard';
import { getProfileIconById } from '../../src/constants/profileIcons';
import { useUserStore } from '../../src/store/userStore';
import { getRecipeEngagementMap } from '../../src/services/recipeSocialService';
import {
  BrowsePublicUserCard,
  getPublicUserProfile,
  getPublicUserUploadedRecipes,
} from '../../src/services/searchService';
import { Recipe } from '../../src/types';

export default function PublicUserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const userId = typeof params.id === 'string' ? params.id : '';
  const currentUserId = useUserStore((s) => s.profile?.id ?? null);

  const [profile, setProfile] = useState<BrowsePublicUserCard | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setRecipes([]);
      return;
    }

    const [userProfile, uploadedRecipes] = await Promise.all([
      getPublicUserProfile(userId),
      getPublicUserUploadedRecipes(userId),
    ]);

    const includeDislikes = currentUserId === userId;
    const masterRecipeIds = uploadedRecipes
      .filter((item) => item.source !== 'ai')
      .map((item) => item.id);
    const aiRecipeIds = uploadedRecipes
      .filter((item) => item.source === 'ai')
      .map((item) => item.id);

    const [masterEngagement, aiEngagement] = await Promise.all([
      getRecipeEngagementMap(masterRecipeIds, 'master', includeDislikes),
      getRecipeEngagementMap(aiRecipeIds, 'ai', includeDislikes),
    ]);

    const withEngagement = uploadedRecipes.map((item) => {
      const sourceEngagement = item.source === 'ai' ? aiEngagement : masterEngagement;
      const meta = sourceEngagement.get(item.id);
      return {
        ...item,
        likesCount: meta?.likesCount ?? 0,
        commentsCount: meta?.commentsCount ?? 0,
        dislikesCount: includeDislikes ? meta?.dislikesCount ?? 0 : 0,
      };
    });

    setProfile(userProfile);
    setRecipes(withEngagement);
  }, [currentUserId, userId]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const icon = getProfileIconById(profile?.avatar_icon);

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>User</Text>
        </View>

        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>User not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>User Profile</Text>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.recipeItemWrap}>
            <RecipeCard recipe={item} horizontal />
            <View style={styles.recipeMetaRow}>
              <View style={styles.recipeMetaPill}>
                <Ionicons name="heart-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.recipeMetaText, { color: colors.textSecondary }]}>{item.likesCount ?? 0}</Text>
              </View>
              {currentUserId === userId && (
                <View style={styles.recipeMetaPill}>
                  <Ionicons name="thumbs-down-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.recipeMetaText, { color: colors.textSecondary }]}>{item.dislikesCount ?? 0}</Text>
                </View>
              )}
              <View style={styles.recipeMetaPill}>
                <Ionicons name="chatbubble-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.recipeMetaText, { color: colors.textSecondary }]}>{item.commentsCount ?? 0}</Text>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.topSectionWrap}>
            <View style={[styles.heroCard, { backgroundColor: colors.surface }]}> 
              <View style={[styles.avatarWrap, { backgroundColor: colors.accent }]}> 
                {profile.avatar_url ? (
                  <FallbackImage uri={profile.avatar_url} style={styles.avatarImage} resizeMode="cover" />
                ) : icon ? (
                  <Ionicons name={icon.icon} size={34} color="#FFF" />
                ) : (
                  <Text style={styles.avatarText}>{profile.name?.[0]?.toUpperCase() ?? 'U'}</Text>
                )}
              </View>

              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{profile.name}</Text>
              {!!profile.username && (
                <Text style={[styles.username, { color: colors.accent }]} numberOfLines={1}>@{profile.username}</Text>
              )}
              <Text style={[styles.publicSubtext, { color: colors.textSecondary }]}>Public recipe creator</Text>

              <View style={styles.publicBadgeRow}>
                <View style={[styles.publicBadge, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="globe-outline" size={12} color={colors.accent} />
                  <Text style={[styles.publicBadgeText, { color: colors.accent }]}>Public user profile</Text>
                </View>
              </View>

              <View style={[styles.statsRow, { borderTopColor: colors.border }]}> 
                <View style={styles.statBlock}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{profile.recipe_count}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recipes</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBlock}>
                  <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>{profile.cooking_level || 'N/A'}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Cooking</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBlock}>
                  <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
                    {profile.diet_preferences.length > 0 ? profile.diet_preferences[0] : 'N/A'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Diet</Text>
                </View>
              </View>

              {profile.diet_preferences.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.prefChipsRow}
                >
                  {profile.diet_preferences.map((pref) => (
                    <View key={pref} style={[styles.prefChip, { backgroundColor: colors.background, borderColor: colors.border }]}> 
                      <Text style={[styles.prefChipText, { color: colors.textSecondary }]}>{pref}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Uploaded Recipes</Text>
              <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>{recipes.length}</Text>
            </View>
            <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No uploaded recipes yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>This user has not shared recipes publicly.</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  topSectionWrap: {
    marginBottom: Spacing.sm,
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
    alignItems: 'center',
    gap: 4,
  },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  avatarImage: {
    width: 76,
    height: 76,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '800',
  },
  name: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
  },
  username: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  publicSubtext: {
    fontSize: Typography.fontSize.xs,
    marginBottom: 8,
  },
  publicBadgeRow: {
    marginTop: 2,
  },
  publicBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  publicBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  statsRow: {
    width: '100%',
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  prefChipsRow: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
    paddingHorizontal: 2,
  },
  prefChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  prefChipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  sectionRow: {
    marginTop: Spacing.md,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginLeft: 2,
  },
  sectionCount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  sectionDivider: {
    height: 1,
    width: '100%',
  },
  recipeItemWrap: {
    gap: 6,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  recipeMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetaText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['3xl'],
    gap: 6,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: Typography.fontSize.base,
  },
});
