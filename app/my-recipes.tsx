import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../src/theme';
import { useUserStore } from '../src/store/userStore';

export default function MyRecipesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Recipes</Text>
        <TouchableOpacity onPress={() => router.push('/upload-recipe' as any)}>
          <Ionicons name="add-circle-outline" size={28} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No recipes created yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Share your favourite recipes with the MealMitra community!
          </Text>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/upload-recipe' as any)}
          >
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.createBtnText}>Create Recipe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingVertical: 80 },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  emptySubtitle: { fontSize: Typography.fontSize.base, textAlign: 'center', paddingHorizontal: Spacing['2xl'] },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: Typography.fontSize.base },
});
