import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../../src/theme';
import { SearchBar } from '../../src/components/SearchBar';
import { FilterChip } from '../../src/components/FilterChip';
import { RecipeCard } from '../../src/components/RecipeCard';
import { searchRecipes, DIET_FILTERS, DIFFICULTY_FILTERS, CUISINE_LIST } from '../../src/services/searchService';
import { RecipeFilters } from '../../src/types';

const TIME_FILTERS = [
  { label: '≤ 15 min', value: 15 },
  { label: '≤ 30 min', value: 30 },
  { label: '≤ 60 min', value: 60 },
];

export default function SearchScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<RecipeFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(
    () => searchRecipes(query, filters),
    [query, filters]
  );

  const toggleDiet = useCallback((diet: string) => {
    setFilters((f) => ({ ...f, diet: f.diet === diet ? undefined : diet }));
  }, []);

  const toggleCuisine = useCallback((cuisine: string) => {
    setFilters((f) => ({ ...f, cuisine: f.cuisine === cuisine ? undefined : cuisine }));
  }, []);

  const toggleDifficulty = useCallback((difficulty: string) => {
    setFilters((f) => ({ ...f, difficulty: f.difficulty === difficulty ? undefined : difficulty }));
  }, []);

  const toggleTime = useCallback((time: number) => {
    setFilters((f) => ({ ...f, maxCookTime: f.maxCookTime === time ? undefined : time }));
  }, []);

  const clearAll = useCallback(() => {
    setQuery('');
    setFilters({});
  }, []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Search Recipes</Text>
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name, cuisine, ingredient…"
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
            <Text style={[styles.filterBtnText, { color: activeFilterCount > 0 ? colors.accent : colors.text }]}>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View style={[styles.filtersPanel, { backgroundColor: colors.surface }]}>
            <View style={styles.filterRow}>
              <Text style={[styles.filterGroupLabel, { color: colors.textSecondary }]}>Diet</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {DIET_FILTERS.map((d) => (
                  <FilterChip
                    key={d}
                    label={d}
                    active={filters.diet === d}
                    onPress={() => toggleDiet(d)}
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
                    active={filters.difficulty === d}
                    onPress={() => toggleDifficulty(d)}
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
                    active={filters.maxCookTime === t.value}
                    onPress={() => toggleTime(t.value)}
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
                    active={filters.cuisine === c}
                    onPress={() => toggleCuisine(c)}
                  />
                ))}
              </ScrollView>
            </View>
            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={clearAll} style={styles.clearAllBtn}>
                <Text style={[styles.clearAllText, { color: colors.accent }]}>Clear all filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {results.length} recipe{results.length !== 1 ? 's' : ''}
          {query ? ` for "${query}"` : ''}
        </Text>
      </View>

      {results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No recipes found</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Try a different search or remove some filters.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RecipeCard recipe={item} horizontal />}
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
    marginBottom: Spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  filterBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.xl,
  },
  filterBtnText: {
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
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
  resultsCount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing['2xl'],
  },
  emptyEmoji: { fontSize: 48 },
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
