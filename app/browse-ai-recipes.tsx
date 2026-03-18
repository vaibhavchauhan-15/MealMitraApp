import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/useTheme';
import { BorderRadius, Shadow, Spacing, Typography } from '../src/theme';
import { SearchBar } from '../src/components/SearchBar';
import { FallbackImage } from '../src/components/FallbackImage';
import { BrowseAiRecipeCard, BrowseSortOption, getPublicAiRecipePage } from '../src/services/searchService';
import { useLocalRecentSearches } from '../src/hooks/useLocalRecentSearches';

const PAGE_SIZE = 14;
const MAX_RESULTS = 30;

export default function BrowseAiRecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [query, setQuery] = useState('');
  const [items, setItems] = useState<BrowseAiRecipeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<BrowseSortOption>('trending');
  const [showFilters, setShowFilters] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = useLocalRecentSearches('recent_ai_recipe_searches');

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((v) => !v);
  }, []);

  const fetchPage = useCallback(
    async (offset: number, reset: boolean) => {
      const page = await getPublicAiRecipePage({
        query: query.trim(),
        offset,
        limit: PAGE_SIZE,
        maxResults: MAX_RESULTS,
        sortBy,
      });
      setHasMore(page.hasMore);
      if (reset) {
        setItems(page.items);
      } else {
        setItems((prev) => [...prev, ...page.items]);
      }
    },
    [query, sortBy]
  );

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      setLoading(true);
      fetchPage(0, true).finally(() => setLoading(false));
    }, 260);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [fetchPage]);

  useEffect(() => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);

    const normalized = query.trim();
    if (!normalized) return;

    saveDebounceRef.current = setTimeout(() => {
      void addRecentSearch(normalized);
    }, 950);

    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [query, addRecentSearch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPage(0, true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage]);

  const onEndReached = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await fetchPage(items.length, false);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, items.length, loading, loadingMore]);

  const renderCard = ({ item }: { item: BrowseAiRecipeCard }) => (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, Shadow.sm]}
      onPress={() =>
        router.push({
          pathname: '/recipe/[id]',
          params: { id: item.id, source: 'ai' },
        } as any)
      }
    >
      <FallbackImage uri={item.image_url} style={styles.cardImage} resizeMode="cover" />

      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.aiBadge, { backgroundColor: colors.accentLight }]}> 
            <Text style={[styles.aiBadgeText, { color: colors.accent }]}>AI</Text>
          </View>
        </View>

        {!!item.description && (
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={13} color={colors.textTertiary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{item.created_by_name}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="restaurant-outline" size={13} color={colors.textTertiary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.cuisine ?? 'Mixed'}</Text>
          <Text style={[styles.metaDot, { color: colors.textTertiary }]}>�</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.diet ?? 'Balanced'}</Text>
          <Text style={[styles.metaDot, { color: colors.textTertiary }]}>�</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.cook_time ?? '-'} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Browse Ai Recipes</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>From public user_ai_generated_recipes</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchGrow}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search AI recipes by title, cuisine, details..."
          />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: showFilters ? colors.accentLight : colors.surface }]}
          onPress={toggleFilters}
        >
          <Ionicons name="options-outline" size={18} color={showFilters ? colors.accent : colors.text} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.surface }]}> 
          <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Sort</Text>
          <View style={styles.sortWrap}>
            <TouchableOpacity
              style={[
                styles.sortChip,
                {
                  backgroundColor: sortBy === 'trending' ? colors.accent : colors.background,
                  borderColor: sortBy === 'trending' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSortBy('trending')}
            >
              <Text style={[styles.sortChipText, { color: sortBy === 'trending' ? '#FFF' : colors.textSecondary }]}>Trending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortChip,
                {
                  backgroundColor: sortBy === 'recently_active' ? colors.accent : colors.background,
                  borderColor: sortBy === 'recently_active' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSortBy('recently_active')}
            >
              <Text style={[styles.sortChipText, { color: sortBy === 'recently_active' ? '#FFF' : colors.textSecondary }]}>Recently active</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {recentSearches.length > 0 && !query.trim() && (
        <View style={styles.recentWrap}>
          <View style={styles.recentHeadRow}>
            <Text style={[styles.recentTitle, { color: colors.textSecondary }]}>Recent searches</Text>
            <TouchableOpacity onPress={() => void clearRecentSearches()}>
              <Text style={[styles.clearText, { color: colors.accent }]}>Clear</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentSearches}
            horizontal
            keyExtractor={(item) => item}
            contentContainerStyle={styles.recentList}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.recentChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setQuery(item)}
              >
                <Text style={[styles.recentChipText, { color: colors.text }]} numberOfLines={1}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          onEndReachedThreshold={0.45}
          onEndReached={onEndReached}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No AI recipes found</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try a different keyword or browse later.</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing.md }} />
              : <View style={{ height: Spacing.xl }} />
          }
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={8}
        />
      )}
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
    borderBottomWidth: 1,
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
  subtitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  searchRow: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchGrow: {
    flex: 1,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersPanel: {
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  filterGroupLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sortWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  sortChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  sortChipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  recentWrap: {
    paddingTop: Spacing.sm,
  },
  recentHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
  },
  recentTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  clearText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  recentList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
  },
  recentChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    maxWidth: 180,
  },
  recentChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing['2xl'],
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardImage: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.md,
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
  },
  aiBadge: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: Typography.fontSize.base,
    marginHorizontal: 2,
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
