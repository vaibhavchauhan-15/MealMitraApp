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

const FAQ = [
  {
    q: 'How do I save a recipe?',
    a: 'Tap the bookmark icon on any recipe card or on the recipe detail page to save it to your collection.',
  },
  {
    q: 'How does the Meal Planner work?',
    a: 'Go to the Planner tab, select a day and meal slot, then tap + to add a recipe. Your weekly plan helps generate a grocery list automatically.',
  },
  {
    q: 'Can I use MealMitra offline?',
    a: 'Yes! All recipes are available offline. Your saved recipes, planner, and grocery list are stored locally on your device.',
  },
  {
    q: 'How do I generate a grocery list?',
    a: 'After adding meals to your planner, tap "Generate Grocery List" on the Planner page. All ingredients will be merged and added to your list.',
  },
  {
    q: 'What is Cooking Mode?',
    a: 'Cooking Mode shows step-by-step instructions in a large, easy-to-read format. Each step can have a built-in timer — just tap "Start Timer".',
  },
  {
    q: 'How do I scale a recipe?',
    a: 'On the Recipe Detail page, use the + / − buttons next to "Adjust Servings" to scale all ingredient quantities automatically.',
  },
  {
    q: 'How do I upload my own recipe?',
    a: 'Go to Profile → My Recipes → tap the + button to submit your recipe. It will be reviewed and added to the app.',
  },
];

export default function HelpScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expanded, setExpanded] = React.useState<number | null>(null);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: colors.accentLight }]}>
          <Text style={styles.bannerEmoji}>🍛</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: colors.accent }]}>How can we help?</Text>
            <Text style={[styles.bannerSubtitle, { color: colors.text }]}>
              Browse FAQs below or contact our support team.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>

        {FAQ.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.faqItem, { backgroundColor: colors.surface }]}
            onPress={() => setExpanded(expanded === idx ? null : idx)}
            activeOpacity={0.8}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQ, { color: colors.text, flex: 1 }]}>{item.q}</Text>
              <Ionicons
                name={expanded === idx ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.accent}
              />
            </View>
            {expanded === idx && (
              <Text style={[styles.faqA, { color: colors.textSecondary }]}>{item.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.contactTitle, { color: colors.text }]}>Still need help?</Text>
          <Text style={[styles.contactSub, { color: colors.textSecondary }]}>
            Email us at support@mealmitra.app and we'll get back within 24 hours.
          </Text>
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
  content: { padding: Spacing.base, gap: Spacing.md },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    borderRadius: BorderRadius.xl,
  },
  bannerEmoji: { fontSize: 40 },
  bannerTitle: { fontWeight: '800', fontSize: Typography.fontSize.lg },
  bannerSubtitle: { fontSize: Typography.fontSize.base, marginTop: 2 },
  sectionTitle: { fontWeight: '800', fontSize: Typography.fontSize.lg },
  faqItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  faqQ: { fontWeight: '600', fontSize: Typography.fontSize.base, lineHeight: 22 },
  faqA: { fontSize: Typography.fontSize.base, lineHeight: 22 },
  contactCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  contactTitle: { fontWeight: '700', fontSize: Typography.fontSize.lg },
  contactSub: { fontSize: Typography.fontSize.base, textAlign: 'center' },
});
