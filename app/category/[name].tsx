import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography } from '../../src/theme';
import { RecipeCard } from '../../src/components/RecipeCard';
import { getRecipesByCuisine } from '../../src/services/searchService';
import { useRecipeStore } from '../../src/store/recipeStore';
import { Recipe } from '../../src/types';

export default function CategoryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const addToCache = useRecipeStore((s) => s.addToCache);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const decoded = decodeURIComponent(name ?? '');

  useEffect(() => {
    getRecipesByCuisine(decoded, 50).then((data) => {
      setRecipes(data);
      addToCache(data);
      setLoading(false);
    });
  }, [decoded]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {decoded}
        </Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {loading ? '…' : `${recipes.length} recipes`}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing['3xl'] }} />
      ) : recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No recipes found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            We'll add more {decoded} recipes soon!
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
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
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: { flex: 1, fontSize: Typography.fontSize.xl, fontWeight: '800' },
  count: { fontSize: Typography.fontSize.sm },
  grid: { padding: Spacing.base, gap: Spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  emptySubtitle: { fontSize: Typography.fontSize.base, textAlign: 'center', paddingHorizontal: Spacing['2xl'] },
});
