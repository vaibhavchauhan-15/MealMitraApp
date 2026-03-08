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

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const Section = ({ title, content }: { title: string; content: string }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{content}</Text>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          Last updated: January 2025
        </Text>

        <Section
          title="1. Information We Collect"
          content="MealMitra is designed as an offline-first application. We collect only the information you provide during account creation (name, email) and your preferences (dietary restrictions, favourite cuisines). All recipe data, planner entries, and grocery lists are stored locally on your device."
        />
        <Section
          title="2. How We Use Information"
          content="Your information is used solely to personalise your experience within the app. We do not sell, share, or transmit your personal data to third parties. Profile information stays on your device using secure local storage."
        />
        <Section
          title="3. Data Storage"
          content="All app data including saved recipes, meal plans, and grocery lists are stored locally on your device using AsyncStorage. This data is not transmitted to any servers and remains private to you."
        />
        <Section
          title="4. Offline Usage"
          content="MealMitra works fully offline. The recipe database is bundled with the app. No internet connection is required for browsing recipes, cooking, or managing your meal plan."
        />
        <Section
          title="5. Analytics"
          content="We may collect anonymized, aggregated usage analytics (e.g. most viewed recipes) to improve the app experience. This data contains no personally identifiable information."
        />
        <Section
          title="6. Security"
          content="We implement industry-standard security measures to protect your information. Your data is stored locally and is protected by your device's built-in security mechanisms."
        />
        <Section
          title="7. Children's Privacy"
          content="MealMitra is not directed to children under 13. We do not knowingly collect personal information from children under 13 years of age."
        />
        <Section
          title="8. Changes to This Policy"
          content="We may update this privacy policy periodically. We will notify you of significant changes via an in-app notification. Continued use of the app after changes constitutes acceptance."
        />
        <Section
          title="9. Contact Us"
          content="If you have questions about this privacy policy or your data, please contact us at privacy@mealmitra.app."
        />
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
  content: { padding: Spacing.base, gap: Spacing.lg },
  lastUpdated: { fontSize: Typography.fontSize.sm, fontStyle: 'italic' },
  section: { gap: Spacing.sm },
  sectionTitle: { fontWeight: '700', fontSize: Typography.fontSize.base },
  sectionContent: { fontSize: Typography.fontSize.base, lineHeight: 24 },
});
