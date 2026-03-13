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
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { Spacing, Typography } from '../src/theme';
import { useRecipeStore } from '../src/store/recipeStore';
import { RecipeCard } from '../src/components/RecipeCard';
import { Recipe } from '../src/types';

export default function RecentlyViewedScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recentIds = useRecipeStore((s) => s.recentlyViewed);
  const { fetchById, addToCache } = useRecipeStore();
  const [recent, setRecent] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recentIds.length === 0) { setRecent([]); setLoading(false); return; }
    Promise.all(recentIds.map((id) => fetchById(id))).then((results) => {
      const valid = results.filter(Boolean) as Recipe[];
      setRecent(valid);
      addToCache(valid);
      setLoading(false);
    });
  }, [recentIds.join(',')]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Recently Viewed</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing['3xl'] }} />
      ) : recent.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🕐</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing viewed yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Start exploring recipes and they'll appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={recent}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <RecipeCard recipe={item} horizontal />}
          contentContainerStyle={{ padding: Spacing.base, gap: Spacing.sm }}
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  emptySubtitle: { fontSize: Typography.fontSize.base, textAlign: 'center', paddingHorizontal: Spacing['2xl'] },
});
