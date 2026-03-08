import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../src/theme';
import { useRecipeStore } from '../src/store/recipeStore';
import { usePlannerStore } from '../src/store/plannerStore';
import { RecipeCard } from '../src/components/RecipeCard';
import { DayOfWeek } from '../src/types';

export default function AddToPlannerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { day, mealType } = useLocalSearchParams<{ day: string; mealType: string }>();
  const recipes = useRecipeStore((s) => s.recipes);
  const addMeal = usePlannerStore((s) => s.addMeal);
  const [query, setQuery] = useState('');

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(query.toLowerCase()) ||
    r.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = (recipeId: string) => {
    if (day && mealType) {
      addMeal(day as DayOfWeek, mealType as any, recipeId, 2);
    }
    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Add to Planner</Text>
          {day && mealType && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {day} · {mealType}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.searchWrapper, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search recipes..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelect(item.id)} activeOpacity={0.8}>
            <RecipeCard recipe={item} horizontal />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: Spacing.base, gap: Spacing.sm }}
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
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  subtitle: { fontSize: Typography.fontSize.sm, marginTop: 2 },
  searchWrapper: { padding: Spacing.base, borderBottomWidth: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: Typography.fontSize.base },
});
