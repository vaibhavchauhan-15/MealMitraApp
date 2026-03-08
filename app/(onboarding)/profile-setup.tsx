import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '../../src/theme';
import { useUserStore } from '../../src/store/userStore';
import { UserProfile } from '../../src/types';

const COOKING_LEVELS: UserProfile['cookingLevel'][] = ['Beginner', 'Intermediate', 'Expert'];
const CUISINES = ['North Indian', 'South Indian', 'Street Food', 'Mughlai', 'Bengali', 'Gujarati', 'Punjabi', 'Goan'];
const DIET_OPTIONS = ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Jain'] as const;
type DietOption = typeof DIET_OPTIONS[number];

export default function ProfileSetupScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateProfile, setHasOnboarded } = useUserStore();

  const [cookingLevel, setCookingLevel] = useState<UserProfile['cookingLevel']>(
    profile?.cookingLevel ?? 'Beginner'
  );
  const [diet, setDiet] = useState<DietOption>(
    (profile?.dietPreference as DietOption) ?? 'Vegetarian'
  );
  const [favCuisines, setFavCuisines] = useState<string[]>(profile?.favoriteCuisines ?? []);

  const toggleCuisine = (c: string) => {
    setFavCuisines((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleFinish = () => {
    updateProfile({ cookingLevel, dietPreference: diet, favoriteCuisines: favCuisines });
    setHasOnboarded(true);
    router.replace('/(tabs)' as any);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Personalise Your Experience</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tell us about yourself so we can recommend the best recipes for you
        </Text>
      </View>

      <FlatList
        data={[1]}
        keyExtractor={() => 'setup'}
        renderItem={() => (
          <View style={styles.content}>
            {/* Cooking Level */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🍳 Cooking Level</Text>
              <View style={styles.row}>
                {COOKING_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.chip,
                      { backgroundColor: cookingLevel === level ? colors.accent : colors.surface, borderColor: cookingLevel === level ? colors.accent : colors.border },
                    ]}
                    onPress={() => setCookingLevel(level)}
                  >
                    <Text style={[styles.chipText, { color: cookingLevel === level ? '#FFF' : colors.text }]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Diet Preference */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🥗 Dietary Preference</Text>
              <View style={styles.row}>
                {DIET_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.chip,
                      { backgroundColor: diet === d ? colors.accent : colors.surface, borderColor: diet === d ? colors.accent : colors.border },
                    ]}
                    onPress={() => setDiet(d)}
                  >
                    <Text style={[styles.chipText, { color: diet === d ? '#FFF' : colors.text }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Favourite Cuisines */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🌶️ Favourite Cuisines</Text>
              <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
                Select all that you enjoy
              </Text>
              <View style={styles.row}>
                {CUISINES.map((c) => {
                  const selected = favCuisines.includes(c);
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.chip,
                        { backgroundColor: selected ? colors.accent : colors.surface, borderColor: selected ? colors.accent : colors.border },
                      ]}
                      onPress={() => toggleCuisine(c)}
                    >
                      {selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      <Text style={[styles.chipText, { color: selected ? '#FFF' : colors.text }]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Bottom CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.accent, ...Shadow.md }]}
          onPress={handleFinish}
        >
          <Text style={styles.btnText}>Let's Cook! 🎉</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleFinish}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: Typography.fontSize.base, textAlign: 'center', lineHeight: 22 },
  content: { paddingHorizontal: Spacing.base, gap: Spacing.xl },
  section: { gap: Spacing.md },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: '800' },
  sectionHint: { fontSize: Typography.fontSize.sm, marginTop: -Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  chipText: { fontWeight: '600', fontSize: Typography.fontSize.sm },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  btn: {
    width: '100%',
    height: 54,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: Typography.fontSize.lg },
  skipText: { fontWeight: '600', fontSize: Typography.fontSize.base },
});
