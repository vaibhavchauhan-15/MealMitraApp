import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../../src/theme';
import { RecipeCard } from '../../src/components/RecipeCard';
import { CuisineCard } from '../../src/components/CuisineCard';
import { SearchBar } from '../../src/components/SearchBar';
import {
  getPersonalizedRecipes,
  getLowCalorieRecipes,
  getHighProteinRecipes,
  CUISINE_LIST,
} from '../../src/services/searchService';
import { useUserStore } from '../../src/store/userStore';
import { useRecipeStore } from '../../src/store/recipeStore';
import { Recipe } from '../../src/types';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const syncUserFromSupabase = useUserStore((s) => s.syncFromSupabase);

  const {
    featured, trending, quick, totalCount, initialLoaded, loadInitialData, addToCache, syncAiRecipesFromSupabase,
  } = useRecipeStore();
  const [refreshing, setRefreshing] = useState(false);

  // Personalized sections
  const [personalized, setPersonalized] = useState<Recipe[]>([]);
  const [lowCalorie, setLowCalorie] = useState<Recipe[]>([]);
  const [highProtein, setHighProtein] = useState<Recipe[]>([]);
  const [forYouView, setForYouView] = useState<'recommended' | 'fat_loss' | 'low_calorie' | 'high_protein'>('recommended');

  // Load home-screen data once
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load personalized section whenever profile changes
  useEffect(() => {
    getPersonalizedRecipes(profile ?? null, 12).then((r) => {
      setPersonalized(r);
      addToCache(r);
    });
  }, [profile?.id, profile?.healthProfile?.fitnessGoal]);

  // Load reusable "For You" collections once
  useEffect(() => {
    Promise.all([
      getLowCalorieRecipes(320, 10),
      getHighProteinRecipes(20, 10),
    ]).then(([lowCal, highProt]) => {
      setLowCalorie(lowCal);
      setHighProtein(highProt);
      addToCache(lowCal);
      addToCache(highProt);
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncUserFromSupabase({ force: true });
      await syncAiRecipesFromSupabase();

      // Bypass initial-load short-circuit so Home sections are re-fetched.
      useRecipeStore.setState({ initialLoaded: false });
      await loadInitialData();

      const [freshPersonalized, lowCal, highProt] = await Promise.all([
        getPersonalizedRecipes(useUserStore.getState().profile ?? null, 12),
        getLowCalorieRecipes(320, 10),
        getHighProteinRecipes(20, 10),
      ]);

      setPersonalized(freshPersonalized);
      setLowCalorie(lowCal);
      setHighProtein(highProt);
      addToCache(freshPersonalized);
      addToCache(lowCal);
      addToCache(highProt);
    } finally {
      setRefreshing(false);
    }
  }, [syncUserFromSupabase, syncAiRecipesFromSupabase, loadInitialData, addToCache]);

  useEffect(() => {
    const goal = profile?.healthProfile?.fitnessGoal;
    if (goal === 'fat_loss') {
      setForYouView('fat_loss');
      return;
    }
    if (goal === 'muscle_gain') {
      setForYouView('high_protein');
      return;
    }
    setForYouView('recommended');
  }, [profile?.healthProfile?.fitnessGoal]);

  const goal = profile?.healthProfile?.fitnessGoal;

  const forYouData = useMemo(() => {
    if (forYouView === 'fat_loss') {
      if (goal === 'fat_loss' && personalized.length > 0) return personalized;
      return lowCalorie;
    }
    if (forYouView === 'low_calorie') return lowCalorie;
    if (forYouView === 'high_protein') return highProtein;
    if (personalized.length > 0) return personalized;
    return featured;
  }, [forYouView, goal, personalized, lowCalorie, highProtein, featured]);

  const forYouChips = useMemo(
    () => [
      { key: 'recommended' as const, label: 'Recommended' },
      { key: 'fat_loss' as const, label: 'Fat Loss' },
      { key: 'low_calorie' as const, label: 'Low Calorie' },
      { key: 'high_protein' as const, label: 'High Protein' },
    ],
    []
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const renderSectionHeader = useCallback(
    (title: string, onSeeAll?: () => void) => (
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [colors]
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/logo/logo.png')} style={styles.headerLogo} resizeMode="contain" />
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {greeting()}, {profile?.name || 'Foodie'} 👋
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Trending today</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={() => router.push('/(tabs)/search' as any)}
          activeOpacity={0.9}
        >
          <View pointerEvents="none">
            <SearchBar value="" onChangeText={() => {}} placeholder={totalCount > 0 ? `Search ${totalCount}+ recipes…` : 'Search recipes…'} />
          </View>
        </TouchableOpacity>

        {/* Featured Recipes */}
        {renderSectionHeader('⭐ Featured', () => router.push('/(tabs)/search' as any))}
        {!initialLoaded ? (
          <ActivityIndicator color={colors.accent} style={{ marginBottom: Spacing.lg }} />
        ) : (
          <FlatList
            data={featured}
            renderItem={({ item }) => <RecipeCard recipe={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            initialNumToRender={4}
            maxToRenderPerBatch={6}
            windowSize={5}
          />
        )}

        {/* Personalized "For You" */}
        {(forYouData.length > 0 || personalized.length > 0) && (
          <>
            {renderSectionHeader('🤖 Recommended For You', () => router.push('/(tabs)/search' as any))}
            <FlatList
              data={forYouChips}
              renderItem={({ item }) => {
                const active = forYouView === item.key;
                return (
                  <TouchableOpacity
                    style={[
                      styles.forYouChip,
                      {
                        backgroundColor: active ? colors.accentLight : colors.surface,
                        borderColor: active ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setForYouView(item.key)}
                  >
                    <Text style={[styles.forYouChipText, { color: active ? colors.accent : colors.textSecondary }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item.key}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            />
            <FlatList
              data={forYouData}
              renderItem={({ item }) => <RecipeCard recipe={item} />}
              keyExtractor={(item) => item.id + '-for-you'}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              initialNumToRender={4}
              maxToRenderPerBatch={6}
              windowSize={5}
            />
          </>
        )}

        {/* Cuisines */}
        {renderSectionHeader('🍲 Browse by Cuisine')}
        <FlatList
          data={CUISINE_LIST.slice(0, 8)}
          renderItem={({ item }) => <CuisineCard name={item} />}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={3}
        />

        {/* Quick Recipes */}
        {renderSectionHeader('⚡ Quick Recipes (≤ 20 min)', () => router.push('/(tabs)/search' as any))}
        <FlatList
          data={quick}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          initialNumToRender={4}
          maxToRenderPerBatch={6}
          windowSize={5}
        />

        {/* Trending */}
        {renderSectionHeader('🔥 Trending Now', () => router.push('/(tabs)/search' as any))}
        {trending.slice(0, 5).map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} horizontal />
        ))}

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>

      {/* Floating AI Assistant Button */}
      <TouchableOpacity
        style={[styles.floatingAiBtn, { backgroundColor: colors.accent }]}
        onPress={() => router.push('/ai-assistant' as any)}
        activeOpacity={0.88}
      >
        <Text style={styles.floatingAiIcon}>🤖</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  headerLogo: {
    width: 44,
    height: 44,
  },
  greeting: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    lineHeight: 24,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
  },
  searchContainer: {
    marginBottom: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  seeAll: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  horizontalList: {
    paddingBottom: Spacing.base,
    gap: Spacing.base,
  },
  chipsRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  forYouChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  forYouChipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  floatingAiBtn: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  floatingAiIcon: {
    fontSize: 26,
  },
});
