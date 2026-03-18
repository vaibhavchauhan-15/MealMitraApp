import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/useTheme';
import { BorderRadius, Shadow, Spacing, Typography } from '../src/theme';
import { SearchBar } from '../src/components/SearchBar';
import { FallbackImage } from '../src/components/FallbackImage';
import { getProfileIconById } from '../src/constants/profileIcons';
import { BrowsePublicUserCard, getPublicUsersWithUploadsPage, UserBrowseSortOption } from '../src/services/searchService';
import { useLocalRecentSearches } from '../src/hooks/useLocalRecentSearches';

const PAGE_SIZE = 12;
const MAX_RESULTS = 30;
const DIET_FILTERS = ['All', 'Vegetarian', 'Vegan', 'Non-Vegetarian', 'Eggetarian'] as const;
const COOKING_FILTERS = ['All', 'Beginner', 'Intermediate', 'Expert'] as const;
const USER_SORT_OPTIONS: { label: string; value: UserBrowseSortOption }[] = [
  { label: 'Trending', value: 'trending' },
  { label: 'A-Z', value: 'a_z' },
  { label: 'Most recent uploader', value: 'recent_uploader' },
];

export default function BrowseUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [query, setQuery] = useState('');
  const [items, setItems] = useState<BrowsePublicUserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<UserBrowseSortOption>('trending');
  const [dietFilter, setDietFilter] = useState<string>('All');
  const [cookingFilter, setCookingFilter] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = useLocalRecentSearches('recent_user_browse_searches');

  useEffect(() => {
    const isNewArchitecture = (globalThis as any).nativeFabricUIManager != null;
    if (Platform.OS === 'android' && !isNewArchitecture && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((v) => !v);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sortBy !== 'trending') count += 1;
    if (dietFilter !== 'All') count += 1;
    if (cookingFilter !== 'All') count += 1;
    return count;
  }, [sortBy, dietFilter, cookingFilter]);

  const loadUsersPage = useCallback(async (offset: number, reset: boolean) => {
    const page = await getPublicUsersWithUploadsPage({
      query: query.trim(),
      offset,
      limit: PAGE_SIZE,
      maxResults: MAX_RESULTS,
      dietPreference: dietFilter === 'All' ? undefined : dietFilter,
      cookingLevel: cookingFilter === 'All' ? undefined : cookingFilter,
      sortBy,
    });
    setHasMore(page.hasMore);
    if (reset) {
      setItems(page.items);
    } else {
      setItems((prev) => [...prev, ...page.items]);
    }
  }, [query, dietFilter, cookingFilter, sortBy]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      setLoading(true);
      loadUsersPage(0, true).finally(() => setLoading(false));
    }, 260);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [loadUsersPage]);

  useEffect(() => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);

    const normalized = query.trim();
    if (!normalized) return;

    saveDebounceRef.current = setTimeout(() => {
      void addRecentSearch(normalized);
    }, 900);

    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [query, addRecentSearch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadUsersPage(0, true);
    } finally {
      setRefreshing(false);
    }
  }, [loadUsersPage]);

  const onEndReached = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await loadUsersPage(items.length, false);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, items.length, loadUsersPage, loading, loadingMore]);

  const renderUser = ({ item }: { item: BrowsePublicUserCard }) => {
    const icon = getProfileIconById(item.avatar_icon);
    const totalRecipesLabel = `${item.recipe_count} ${item.recipe_count === 1 ? 'recipe' : 'recipes'}`;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, Shadow.sm]}
        onPress={() =>
          router.push({
            pathname: '/user/[id]',
            params: { id: item.id },
          } as any)
        }
      >
        <View style={[styles.avatarWrap, { backgroundColor: colors.accent }]}> 
          {item.avatar_url ? (
            <FallbackImage uri={item.avatar_url} style={styles.avatarImage} resizeMode="cover" />
          ) : icon ? (
            <Ionicons name={icon.icon} size={24} color="#FFF" />
          ) : (
            <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() ?? 'U'}</Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          {!!item.username && (
            <Text style={[styles.userUsername, { color: colors.accent }]} numberOfLines={1}>@{item.username}</Text>
          )}
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{totalRecipesLabel}</Text>
            {!!item.cooking_level && (
              <>
                <Text style={[styles.metaDot, { color: colors.textTertiary }]}>|</Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.cooking_level}</Text>
              </>
            )}
          </View>
          {item.diet_preferences.length > 0 && (
            <Text style={[styles.prefText, { color: colors.textTertiary }]} numberOfLines={1}>
              {item.diet_preferences.join(' | ')}
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  };

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
          <Text style={[styles.title, { color: colors.text }]}>Browse Users</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Public profiles and uploads</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchGrow}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search users by name or username"
          />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: showFilters ? colors.accentLight : colors.surface }]}
          onPress={toggleFilters}
        >
          <Ionicons name="options-outline" size={18} color={showFilters ? colors.accent : colors.text} />
          {activeFilterCount > 0 && <View style={[styles.filterDot, { backgroundColor: colors.accent }]} />}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.surface }]}> 
          <View style={styles.filterGroup}>
            <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Sort</Text>
            <FlatList
              horizontal
              data={USER_SORT_OPTIONS}
              keyExtractor={(item) => item.value}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => {
                const active = sortBy === item.value;
                return (
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? colors.accent : colors.background,
                        borderColor: active ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setSortBy(item.value)}
                  >
                    <Text style={[styles.filterChipText, { color: active ? '#FFF' : colors.textSecondary }]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          <View style={styles.filterGroup}>
            <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Diet preference</Text>
            <FlatList
              horizontal
              data={DIET_FILTERS as readonly string[]}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => {
                const active = dietFilter === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? colors.accent : colors.background,
                        borderColor: active ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setDietFilter(item)}
                  >
                    <Text style={[styles.filterChipText, { color: active ? '#FFF' : colors.textSecondary }]}>{item}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          <View style={styles.filterGroup}>
            <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Cooking level</Text>
            <FlatList
              horizontal
              data={COOKING_FILTERS as readonly string[]}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => {
                const active = cookingFilter === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? colors.accent : colors.background,
                        borderColor: active ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setCookingFilter(item)}
                  >
                    <Text style={[styles.filterChipText, { color: active ? '#FFF' : colors.textSecondary }]}>{item}</Text>
                  </TouchableOpacity>
                );
              }}
            />
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

      {!loading && (
        <View style={styles.resultInfoRow}>
          <Text style={[styles.resultInfoText, { color: colors.textSecondary }]}>
            {items.length} user{items.length !== 1 ? 's' : ''}{query.trim() ? ` found for "${query.trim()}"` : ''}
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          onEndReachedThreshold={0.45}
          onEndReached={onEndReached}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No users found</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try a different search term.</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing.md }} />
              : <View style={{ height: Spacing.xl }} />
          }
          removeClippedSubviews
          initialNumToRender={10}
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
  filterDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  filtersPanel: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
  },
  filterGroup: {
    gap: 6,
    marginBottom: Spacing.xs,
  },
  filterGroupLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.base,
  },
  filterList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  filterChipText: {
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
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    paddingBottom: Spacing['2xl'],
  },
  resultInfoRow: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: 2,
  },
  resultInfoText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 52,
    height: 52,
  },
  avatarText: {
    color: '#FFF',
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
  },
  userUsername: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
  },
  metaDot: {
    fontSize: Typography.fontSize.base,
  },
  prefText: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
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
