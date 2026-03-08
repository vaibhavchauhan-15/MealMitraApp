import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../src/theme';

const NOTIFICATIONS = [
  { id: 'meal_reminders', title: 'Meal Reminders', subtitle: 'Daily reminders for planned meals', icon: 'restaurant-outline' },
  { id: 'new_recipes', title: 'New Recipes', subtitle: 'Get notified when new recipes are added', icon: 'sparkles-outline' },
  { id: 'tips', title: 'Cooking Tips', subtitle: 'Daily cooking tips and tricks', icon: 'bulb-outline' },
  { id: 'weekly', title: 'Weekly Planner', subtitle: 'Weekly meal planning reminders', icon: 'calendar-outline' },
];

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    meal_reminders: true,
    new_recipes: true,
    tips: false,
    weekly: true,
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {NOTIFICATIONS.map((n, idx) => (
            <View
              key={n.id}
              style={[
                styles.notifRow,
                idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.accentLight }]}>
                <Ionicons name={n.icon as any} size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, { color: colors.text }]}>{n.title}</Text>
                <Text style={[styles.notifSubtitle, { color: colors.textSecondary }]}>{n.subtitle}</Text>
              </View>
              <Switch
                value={enabled[n.id]}
                onValueChange={(v) => setEnabled((p) => ({ ...p, [n.id]: v }))}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFF"
              />
            </View>
          ))}
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
  section: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: { fontWeight: '600', fontSize: Typography.fontSize.base },
  notifSubtitle: { fontSize: Typography.fontSize.sm, marginTop: 2 },
});
