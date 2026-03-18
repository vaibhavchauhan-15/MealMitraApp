import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Animated,
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '../../src/theme';
import { SearchBar } from '../../src/components/SearchBar';
import { FilterChip } from '../../src/components/FilterChip';
import { RecipeCard } from '../../src/components/RecipeCard';
import { FallbackImage } from '../../src/components/FallbackImage';
import {
  searchRecipes,
  getTotalRecipeCount,
  DIET_FILTERS,
  DIFFICULTY_FILTERS,
  CUISINE_LIST,
  BrowseAiRecipeCard,
  BrowsePublicUserCard,
  BrowseSortOption,
  UserBrowseSortOption,
  getPublicAiRecipePage,
  getPublicUsersWithUploadsPage,
} from '../../src/services/searchService';
import { PublicAiDietPlanCard, getPublicAiDietPlansPage } from '../../src/services/aiPlanSupabaseService';
import { RecipeFilters, Recipe } from '../../src/types';
import { useRecipeStore } from '../../src/store/recipeStore';
import { useLocalRecentSearches } from '../../src/hooks/useLocalRecentSearches';
import { getProfileIconById } from '../../src/constants/profileIcons';

type SearchMode = 'master_recipe' | 'ai_recipe' | 'diet_plan' | 'users';

const PAGE_SIZE = 30;
const MAX_RESULTS = 30;

const TIME_FILTERS = [
  { label: '<= 15 min', value: 15 },
  { label: '<= 30 min', value: 30 },
  { label: '<= 60 min', value: 60 },
];

const MODE_OPTIONS: { label: string; value: SearchMode }[] = [
  { label: 'Recipe', value: 'master_recipe' },
  { label: 'AI Recipe', value: 'ai_recipe' },
  { label: 'AI Diet', value: 'diet_plan' },
  { label: 'Users', value: 'users' },
];

const AI_RECIPE_SORT_OPTIONS: { label: string; value: BrowseSortOption }[] = [
  { label: 'Trending', value: 'trending' },
  { label: 'Recently active', value: 'recently_active' },
];

const PLAN_SORT_OPTIONS: { label: string; value: 'trending' | 'recently_active' }[] = [
  { label: 'Trending', value: 'trending' },
  { label: 'Recently active', value: 'recently_active' },
];

const USER_SORT_OPTIONS: { label: string; value: UserBrowseSortOption }[] = [
  { label: 'Trending', value: 'trending' },
  { label: 'A-Z', value: 'a_z' },
  { label: 'Most recent uploader', value: 'recent_uploader' },
];

const PLAN_DIET_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Non-Veg', value: 'non_veg' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Eggetarian', value: 'eggetarian' },
] as const;

const CALORIE_FILTERS = [
  { label: 'Any', value: undefined },
  { label: '<= 1800', value: 1800 },
  { label: '<= 2200', value: 2200 },
  { label: '<= 2600', value: 2600 },
] as const;

const USER_DIET_FILTERS = ['All', 'Vegetarian', 'Vegan', 'Non-Vegetarian', 'Eggetarian'] as const;
const USER_COOKING_FILTERS = ['All', 'Beginner', 'Intermediate', 'Expert'] as const;

export default function SearchScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<SearchMode>('master_recipe');
  const [query, setQuery] = useState('');

  const [masterFilters, setMasterFilters] = useState<RecipeFilters>({});
  const [aiRecipeSortBy, setAiRecipeSortBy] = useState<BrowseSortOption>('trending');
  const [planSortBy, setPlanSortBy] = useState<'trending' | 'recently_active'>('trending');
  const [planDietFilter, setPlanDietFilter] = useState<string | undefined>(undefined);
  const [planCalorieFilter, setPlanCalorieFilter] = useState<number | undefined>(undefined);
  const [userSortBy, setUserSortBy] = useState<UserBrowseSortOption>('trending');
  const [userDietFilter, setUserDietFilter] = useState<string>('All');
  const [userCookingFilter, setUserCookingFilter] = useState<string>('All');

  const [showFilters, setShowFilters] = useState(false);
  const [masterResults, setMasterResults] = useState<Recipe[]>([]);
  const [aiRecipeResults, setAiRecipeResults] = useState<BrowseAiRecipeCard[]>([]);
  const [planResults, setPlanResults] = useState<PublicAiDietPlanCard[]>([]);
  const [userResults, setUserResults] = useState<BrowsePublicUserCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(1000);

  const addToCache = useRecipeStore((s) => s.addToCache);

  const {
    recentSearches: recentMasterSearches,
    addRecentSearch: addMasterRecentSearch,
    clearRecentSearches: clearMasterRecentSearches,
  } = useLocalRecentSearches('recent_master_recipe_searches');

  const {
    recentSearches: recentAiRecipeSearches,
    addRecentSearch: addAiRecipeRecentSearch,
    clearRecentSearches: clearAiRecipeRecentSearches,
  } = useLocalRecentSearches('recent_ai_recipe_searches');

  const {
    recentSearches: recentPlanSearches,
    addRecentSearch: addPlanRecentSearch,
    clearRecentSearches: clearPlanRecentSearches,
  } = useLocalRecentSearches('recent_ai_diet_plan_searches');

  const {
    recentSearches: recentUserSearches,
    addRecentSearch: addUserRecentSearch,
    clearRecentSearches: clearUserRecentSearches,
  } = useLocalRecentSearches('recent_user_browse_searches');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeScale = useRef<Record<SearchMode, Animated.Value>>({
    master_recipe: new Animated.Value(1),
    ai_recipe: new Animated.Value(0.985),
    diet_plan: new Animated.Value(0.985),
    users: new Animated.Value(0.985),
  }).current;

  useEffect(() => {
    getTotalRecipeCount().then(setTotalCount);
  }, []);

  const springModePill = useCallback((targetMode: SearchMode, toValue: number) => {
    Animated.spring(modeScale[targetMode], {
      toValue,
      friction: 9,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [modeScale]);

  const activeFilterCount = useMemo(() => {
    if (mode === 'master_recipe') {
      return Object.values(masterFilters).filter((v) => v !== undefined && v !== null && v !== '').length;
    }

    if (mode === 'ai_recipe') {
      return aiRecipeSortBy !== 'trending' ? 1 : 0;
    }

    if (mode === 'diet_plan') {
      let count = 0;
      if (planSortBy !== 'trending') count += 1;
      if (planDietFilter) count += 1;
      if (typeof planCalorieFilter === 'number') count += 1;
      return count;
    }

    let count = 0;
    if (userSortBy !== 'trending') count += 1;
    if (userDietFilter !== 'All') count += 1;
    if (userCookingFilter !== 'All') count += 1;
    return count;
  }, [
    mode,
    masterFilters,
    aiRecipeSortBy,
    planSortBy,
    planDietFilter,
    planCalorieFilter,
    userSortBy,
    userDietFilter,
    userCookingFilter,
  ]);

  const hasQuery = query.trim().length > 0;

  const headerTitle =
    mode === 'master_recipe'
      ? 'Master Recipe'
      : mode === 'ai_recipe'
      ? 'AI Recipe'
      : mode === 'diet_plan'
      ? 'AI Diet Plan'
      : 'Users';

  const searchPlaceholder =
    mode === 'master_recipe'
      ? 'Search recipes by name, cuisine, ingredient...'
      : mode === 'ai_recipe'
      ? 'Search AI recipes by title, cuisine, details...'
      : mode === 'diet_plan'
      ? 'Search AI diet plans by title...'
      : 'Search users by name or username';

  const currentRecentSearches =
    mode === 'master_recipe'
      ? recentMasterSearches
      : mode === 'ai_recipe'
      ? recentAiRecipeSearches
      : mode === 'diet_plan'
      ? recentPlanSearches
      : recentUserSearches;

  const clearCurrentRecentSearches = useCallback(() => {
    if (mode === 'master_recipe') {
      void clearMasterRecentSearches();
      return;
    }
    if (mode === 'ai_recipe') {
      void clearAiRecipeRecentSearches();
      return;
    }
    if (mode === 'diet_plan') {
      void clearPlanRecentSearches();
      return;
    }
    void clearUserRecentSearches();
  }, [
    mode,
    clearMasterRecentSearches,
    clearAiRecipeRecentSearches,
    clearPlanRecentSearches,
    clearUserRecentSearches,
  ]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const shouldShowMasterRecentOnly = mode === 'master_recipe' && !hasQuery && activeFilterCount === 0;
    if (shouldShowMasterRecentOnly) {
      setLoading(false);
      setMasterResults([]);
      setAiRecipeResults([]);
      setPlanResults([]);
      setUserResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (mode === 'master_recipe') {
          const limit = hasQuery || activeFilterCount > 0 ? totalCount : 30;
          const data = await searchRecipes(query, masterFilters, limit);
          setMasterResults(data);
          addToCache(data);
          setAiRecipeResults([]);
          setPlanResults([]);
          setUserResults([]);
        } else if (mode === 'ai_recipe') {
          const page = await getPublicAiRecipePage({
            query: query.trim(),
            offset: 0,
            limit: PAGE_SIZE,
            maxResults: MAX_RESULTS,
            sortBy: aiRecipeSortBy,
          });
          setAiRecipeResults(page.items);
          setMasterResults([]);
          setPlanResults([]);
          setUserResults([]);
        } else if (mode === 'diet_plan') {
          const page = await getPublicAiDietPlansPage({
            offset: 0,
            limit: PAGE_SIZE,
            maxResults: MAX_RESULTS,
            sortBy: planSortBy,
            titleQuery: query.trim(),
            dietType: planDietFilter,
            maxCalories: planCalorieFilter,
          });
          setPlanResults(page.items);
          setMasterResults([]);
          setAiRecipeResults([]);
          setUserResults([]);
        } else {
          const page = await getPublicUsersWithUploadsPage({
            query: query.trim(),
            offset: 0,
            limit: PAGE_SIZE,
            maxResults: MAX_RESULTS,
            sortBy: userSortBy,
            dietPreference: userDietFilter === 'All' ? undefined : userDietFilter,
            cookingLevel: userCookingFilter === 'All' ? undefined : userCookingFilter,
          });
          setUserResults(page.items);
          setMasterResults([]);
          setAiRecipeResults([]);
          setPlanResults([]);
        }
      } catch (error) {
        console.warn('[search] unified search failed', error);
        setMasterResults([]);
        setAiRecipeResults([]);
        setPlanResults([]);
        setUserResults([]);
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    mode,
    query,
    hasQuery,
    activeFilterCount,
    masterFilters,
    aiRecipeSortBy,
    planSortBy,
    planDietFilter,
    planCalorieFilter,
    userSortBy,
    userDietFilter,
    userCookingFilter,
    totalCount,
    addToCache,
  ]);

  useEffect(() => {
    if (saveSearchDebounceRef.current) clearTimeout(saveSearchDebounceRef.current);

    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    saveSearchDebounceRef.current = setTimeout(() => {
      if (mode === 'master_recipe') {
        void addMasterRecentSearch(normalizedQuery);
        return;
      }
      if (mode === 'ai_recipe') {
        void addAiRecipeRecentSearch(normalizedQuery);
        return;
      }
      if (mode === 'diet_plan') {
        void addPlanRecentSearch(normalizedQuery);
        return;
      }
      void addUserRecentSearch(normalizedQuery);
    }, 1000);

    return () => {
      if (saveSearchDebounceRef.current) clearTimeout(saveSearchDebounceRef.current);
    };
  }, [
    mode,
    query,
    addMasterRecentSearch,
    addAiRecipeRecentSearch,
    addPlanRecentSearch,
    addUserRecentSearch,
  ]);

  const toggleMasterDiet = useCallback((diet: string) => {
    setMasterFilters((f) => ({ ...f, diet: f.diet === diet ? undefined : diet }));
  }, []);

  const toggleMasterCuisine = useCallback((cuisine: string) => {
    setMasterFilters((f) => ({ ...f, cuisine: f.cuisine === cuisine ? undefined : cuisine }));
  }, []);

  const toggleMasterDifficulty = useCallback((difficulty: string) => {
    setMasterFilters((f) => ({ ...f, difficulty: f.difficulty === difficulty ? undefined : difficulty }));
  }, []);

  const toggleMasterTime = useCallback((time: number) => {
    setMasterFilters((f) => ({ ...f, maxCookTime: f.maxCookTime === time ? undefined : time }));
  }, []);

  const clearAll = useCallback(() => {
    if (mode === 'master_recipe') {
      setMasterFilters({});
      return;
    }
    if (mode === 'ai_recipe') {
      setAiRecipeSortBy('trending');
      return;
    }
    if (mode === 'diet_plan') {
      setPlanSortBy('trending');
      setPlanDietFilter(undefined);
      setPlanCalorieFilter(undefined);
      return;
    }

    setUserSortBy('trending');
    setUserDietFilter('All');
    setUserCookingFilter('All');
  }, [mode]);

  const onModeChange = useCallback((nextMode: SearchMode) => {
    setMode(nextMode);
    setShowFilters(false);
    setQuery('');

    MODE_OPTIONS.forEach((option) => {
      springModePill(option.value, option.value === nextMode ? 1 : 0.985);
    });
  }, [springModePill]);

  const shouldShowRecentSearches = mode === 'master_recipe' && !loading && !hasQuery && activeFilterCount === 0;

  const resultCount =
    mode === 'master_recipe'
      ? masterResults.length
      : mode === 'ai_recipe'
      ? aiRecipeResults.length
      : mode === 'diet_plan'
      ? planResults.length
      : userResults.length;

  const resultLabel =
    mode === 'master_recipe'
      ? 'recipe'
      : mode === 'ai_recipe'
      ? 'ai recipe'
      : mode === 'diet_plan'
      ? 'plan'
      : 'user';

  const renderAiRecipeCard = ({ item }: { item: BrowseAiRecipeCard }) => (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }, Shadow.sm]}
      onPress={() =>
        router.push({
          pathname: '/recipe/[id]',
          params: { id: item.id, source: 'ai' },
        } as any)
      }
    >
      <FallbackImage uri={item.image_url} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.cardBadge, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.cardBadgeText, { color: colors.accent }]}>AI</Text>
          </View>
        </View>
        {!!item.description && (
          <Text style={[styles.cardSubText, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.cuisine ?? 'Mixed'} | {item.diet ?? 'Balanced'} | {item.cook_time ?? '-'} min
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderPlanCard = ({ item }: { item: PublicAiDietPlanCard }) => (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }, Shadow.sm]}
      onPress={() =>
        router.push({
          pathname: '/public-ai-plan/[id]',
          params: { id: item.id },
        } as any)
      }
    >
      <View style={styles.cardBodyOnly}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.cardBadge, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.cardBadgeText, { color: colors.accent }]}>Public</Text>
          </View>
        </View>
        <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.plan_diet_type ?? item.diet_type ?? 'Mixed'} | {item.days ?? 7} days
        </Text>
        <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
          {(item.plan_calories ?? item.total_calories ?? '-') + ' kcal'} | by {item.source_label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderUserCard = ({ item }: { item: BrowsePublicUserCard }) => {
    const icon = getProfileIconById(item.avatar_icon);

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }, Shadow.sm]}
        onPress={() =>
          router.push({
            pathname: '/user/[id]',
            params: { id: item.id },
          } as any)
        }
      >
        <View style={[styles.userAvatarWrap, { backgroundColor: colors.accent }]}> 
          {item.avatar_url ? (
            <FallbackImage uri={item.avatar_url} style={styles.userAvatarImage} resizeMode="cover" />
          ) : icon ? (
            <Ionicons name={icon.icon} size={22} color="#FFF" />
          ) : (
            <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() ?? 'U'}</Text>
          )}
        </View>

        <View style={styles.userCardBody}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          {!!item.username && (
            <Text style={[styles.userHandle, { color: colors.accent }]} numberOfLines={1}>@{item.username}</Text>
          )}
          <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.recipe_count} {item.recipe_count === 1 ? 'recipe' : 'recipes'}
            {item.cooking_level ? ` | ${item.cooking_level}` : ''}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{headerTitle}</Text>

        <View style={[styles.modeSwitch, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {MODE_OPTIONS.map((option) => {
            const active = mode === option.value;

            return (
              <Animated.View
                key={option.value}
                style={[styles.modePillWrap, { transform: [{ scale: modeScale[option.value] }] }]}
              >
                <TouchableOpacity
                  onPress={() => onModeChange(option.value)}
                  onPressIn={() => springModePill(option.value, 0.97)}
                  onPressOut={() => springModePill(option.value, active ? 1 : 0.985)}
                  activeOpacity={0.95}
                  style={[
                    styles.modePill,
                    {
                      backgroundColor: active ? colors.accent : 'transparent',
                      borderColor: active ? colors.accent : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modePillText,
                      { color: active ? '#FFF' : colors.textSecondary, opacity: active ? 1 : 0.8 },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              autoFocus={false}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: activeFilterCount > 0 ? colors.accentLight : colors.surface },
            ]}
            onPress={() => setShowFilters((v) => !v)}
          >
            <Ionicons name="options-outline" size={18} color={activeFilterCount > 0 ? colors.accent : colors.text} />
            {activeFilterCount > 0 && (
              <View style={[styles.filterCountDot, { backgroundColor: colors.accent }]}>
                <Text style={styles.filterCountDotText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={[styles.filtersPanel, { backgroundColor: colors.surface }]}>
            {mode === 'master_recipe' && (
              <>
                <View style={styles.filterRow}>
                  <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Diet</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {DIET_FILTERS.map((d) => (
                      <FilterChip
                        key={d}
                        label={d}
                        active={masterFilters.diet === d}
                        onPress={() => toggleMasterDiet(d)}
                      />
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.filterRow}>
                  <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Difficulty</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {DIFFICULTY_FILTERS.map((d) => (
                      <FilterChip
                        key={d}
                        label={d}
                        active={masterFilters.difficulty === d}
                        onPress={() => toggleMasterDifficulty(d)}
                      />
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.filterRow}>
                  <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Cook Time</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {TIME_FILTERS.map((t) => (
                      <FilterChip
                        key={t.label}
                        label={t.label}
                        active={masterFilters.maxCookTime === t.value}
                        onPress={() => toggleMasterTime(t.value)}
                      />
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.filterRow}>
                  <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Cuisine</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {CUISINE_LIST.map((c) => (
                      <FilterChip
                        key={c}
                        label={c}
                        active={masterFilters.cuisine === c}
                        onPress={() => toggleMasterCuisine(c)}
                      />
                    ))}
                  </ScrollView>
                </View>
              </>
            )}

            {mode === 'ai_recipe' && (
              <View style={styles.filterRow}>
                <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Sort</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {AI_RECIPE_SORT_OPTIONS.map((item) => (
                    <FilterChip
                      key={item.value}
                      label={item.label}
                      active={aiRecipeSortBy === item.value}
                      onPress={() => setAiRecipeSortBy(item.value)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {mode === 'diet_plan' && (
              <>
                <View style={styles.filterRow}>
                  <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Sort</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {PLAN_SORT_OPTIONS.map((item) => (
                      <FilterChip
                        key={item.value}
                        label={item.label}
                        active={planSortBy === item.value}
                        onPress={() => setPlanSortBy(item.value)}
                      />
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.filterRow}>
                  <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Diet</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {PLAN_DIET_FILTERS.map((item) => (
                      <FilterChip
                        key={item.label}
                        label={item.label}
                        active={planDietFilter === item.value}
                        onPress={() => setPlanDietFilter(item.value)}
                      />
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.filterRow}>
                  <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Calories</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {CALORIE_FILTERS.map((item) => (
                      <FilterChip
                        key={item.label}
                        label={item.label}
                        active={planCalorieFilter === item.value}
                        onPress={() => setPlanCalorieFilter(item.value)}
                      />
                    ))}
                  </ScrollView>
                </View>
              </>
            )}

            {mode === 'users' && (
              <>
                <View style={styles.filterRow}>
                  <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Sort</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {USER_SORT_OPTIONS.map((item) => (
                      <FilterChip
                        key={item.value}
                        label={item.label}
                        active={userSortBy === item.value}
                        onPress={() => setUserSortBy(item.value)}
                      />
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.filterRow}>
                  <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Diet preference</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {USER_DIET_FILTERS.map((item) => (
                      <FilterChip
                        key={item}
                        label={item}
                        active={userDietFilter === item}
                        onPress={() => setUserDietFilter(item)}
                      />
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.filterRow}>
                  <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Cooking level</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {USER_COOKING_FILTERS.map((item) => (
                      <FilterChip
                        key={item}
                        label={item}
                        active={userCookingFilter === item}
                        onPress={() => setUserCookingFilter(item)}
                      />
                    ))}
                  </ScrollView>
                </View>
              </>
            )}

            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={clearAll} style={styles.clearAllBtn}>
                <Text style={[styles.clearAllText, { color: colors.accent }]}>Clear all filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.resultsHeader}>
        {shouldShowRecentSearches ? (
          <View style={styles.recentHeaderRow}>
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>Recent searches</Text>
            {currentRecentSearches.length > 0 && (
              <TouchableOpacity onPress={clearCurrentRecentSearches}>
                <Text style={[styles.clearAllText, { color: colors.accent }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
            {loading ? 'Searching...' : `${resultCount} ${resultLabel}${resultCount !== 1 ? 's' : ''}${query ? ` for "${query}"` : ''}`}
          </Text>
        )}
      </View>

      {shouldShowRecentSearches ? (
        currentRecentSearches.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={42} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Search recipes</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Type recipe title, ingredient, cuisine, or use filters to see results.
            </Text>
          </View>
        ) : (
          <FlatList
            data={currentRecentSearches}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.recentList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.recentItem, { backgroundColor: colors.surface }]}
                onPress={() => setQuery(item)}
              >
                <Text style={[styles.recentItemText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      ) : resultCount === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={42} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No {resultLabel}s found</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try a different search or remove some filters.</Text>
        </View>
      ) : (
        <FlatList<any>
          data={
            mode === 'master_recipe'
              ? masterResults
              : mode === 'ai_recipe'
              ? aiRecipeResults
              : mode === 'diet_plan'
              ? planResults
              : userResults
          }
          keyExtractor={(item: any) => item.id}
          renderItem={
            mode === 'master_recipe'
              ? ({ item }: { item: Recipe }) => <RecipeCard recipe={item} horizontal />
              : mode === 'ai_recipe'
              ? (renderAiRecipeCard as any)
              : mode === 'diet_plan'
              ? (renderPlanCard as any)
              : (renderUserCard as any)
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  modeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius['2xl'],
    padding: 3,
    marginBottom: Spacing.base,
    overflow: 'hidden',
  },
  modePillWrap: {
    flex: 1,
    paddingHorizontal: 2,
  },
  modePill: {
    height: 40,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  modePillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  filterBtn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.xl,
    position: 'relative',
  },
  filterCountDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterCountDotText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  filtersPanel: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  filterRow: {
    gap: Spacing.xs,
  },
  filterGroupLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  clearAllBtn: {
    alignSelf: 'flex-end',
    marginTop: Spacing.xs,
  },
  clearAllText: {
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
  resultsHeader: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsCount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  recentList: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  recentItem: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  recentItemText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  cardImage: {
    width: 100,
    height: 100,
  },
  cardBody: {
    flex: 1,
    padding: Spacing.sm,
    gap: 6,
  },
  cardBodyOnly: {
    flex: 1,
    padding: Spacing.sm,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
  },
  cardBadge: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
  },
  cardBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  cardSubText: {
    fontSize: Typography.fontSize.sm,
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
  userAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginLeft: Spacing.sm,
    marginVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: Typography.fontSize.base,
  },
  userCardBody: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
    gap: 3,
  },
  userHandle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing['2xl'],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
  },
});
