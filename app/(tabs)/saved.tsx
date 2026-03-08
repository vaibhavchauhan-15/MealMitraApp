import React from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography } from '../../src/theme';
import { RecipeCard } from '../../src/components/RecipeCard';
import { useSavedStore } from '../../src/store/savedStore';
import { useRecipeStore } from '../../src/store/recipeStore';

export default function SavedScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const savedIds = useSavedStore((s) => s.savedIds);
  const getRecipeById = useRecipeStore((s) => s.getRecipeById);

  const savedRecipes = savedIds.map((id) => getRecipeById(id)).filter(Boolean) as ReturnType<typeof getRecipeById>[];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Saved Recipes</Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {savedRecipes.length} saved
        </Text>
      </View>

      {savedRecipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emoji}>🔖</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved recipes yet</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Tap the bookmark icon on any recipe to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedRecipes}
          keyExtractor={(item) => item!.id}
          renderItem={({ item }) => item ? <RecipeCard recipe={item} horizontal /> : null}
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
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
  },
  count: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing['3xl'],
  },
  emoji: { fontSize: 56 },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
  },
});
