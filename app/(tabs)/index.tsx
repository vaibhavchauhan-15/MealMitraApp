import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '../../src/theme';
import { RecipeCard } from '../../src/components/RecipeCard';
import { CuisineCard } from '../../src/components/CuisineCard';
import { SearchBar } from '../../src/components/SearchBar';
import {
  getFeaturedRecipes,
  getTrendingRecipes,
  getQuickRecipes,
  CUISINE_LIST,
} from '../../src/services/searchService';
import { useUserStore } from '../../src/store/userStore';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);

  const featured = getFeaturedRecipes();
  const trending = getTrendingRecipes();
  const quick = getQuickRecipes();

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
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {greeting()}, {profile?.name || 'Foodie'} 👋
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            What will you{'\n'}cook today?
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/notifications' as any)}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={() => router.push('/(tabs)/search' as any)}
          activeOpacity={0.9}
        >
          <View pointerEvents="none">
            <SearchBar value="" onChangeText={() => {}} placeholder="Search 10,000+ recipes…" />
          </View>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {[
            { icon: 'restaurant-outline', label: '10K+', sub: 'Recipes' },
            { icon: 'location-outline', label: '12', sub: 'Cuisines' },
            { icon: 'star-outline', label: '4.8', sub: 'Avg Rating' },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Ionicons name={stat.icon as any} size={20} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.label}</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>{stat.sub}</Text>
            </View>
          ))}
        </View>

        {/* Featured Recipes */}
        {renderSectionHeader('⭐ Featured', () => router.push('/(tabs)/search' as any))}
        <FlatList
          data={featured}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />

        {/* Cuisines */}
        {renderSectionHeader('🍽️ By Cuisine')}
        <FlatList
          data={CUISINE_LIST}
          renderItem={({ item }) => <CuisineCard name={item} />}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
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
        />

        {/* AI Assistant Banner */}
        <TouchableOpacity
          style={[styles.aiBanner, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/ai-assistant' as any)}
          activeOpacity={0.88}
        >
          <View>
            <Text style={styles.aiTitle}>🤖 AI Cooking Assistant</Text>
            <Text style={styles.aiSub}>Ask anything about cooking!</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={36} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>

        {/* Trending */}
        {renderSectionHeader('🔥 Trending Now', () => router.push('/(tabs)/search' as any))}
        {trending.slice(0, 5).map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} horizontal />
        ))}

        {/* Meal Planner CTA */}
        <TouchableOpacity
          style={[styles.plannerBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)/planner' as any)}
          activeOpacity={0.88}
        >
          <Ionicons name="calendar-outline" size={32} color={colors.accent} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={[styles.plannerTitle, { color: colors.text }]}>Weekly Meal Planner</Text>
            <Text style={[styles.plannerSub, { color: colors.textSecondary }]}>
              Plan your meals and auto-generate grocery list
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    lineHeight: 32,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
  },
  searchContainer: {
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
  },
  statSub: {
    fontSize: Typography.fontSize.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
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
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  aiBanner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  aiTitle: {
    color: '#FFF',
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    marginBottom: 3,
  },
  aiSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: Typography.fontSize.sm,
  },
  plannerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  plannerTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  plannerSub: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
});
