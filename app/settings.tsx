import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useTheme } from '../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../src/theme';
import { useUserStore } from '../src/store/userStore';

const CUISINES = ['North Indian', 'South Indian', 'Street Food', 'Mughlai', 'Bengali', 'Gujarati', 'Punjabi'];
const DIET_OPTIONS = ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Jain'];

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateProfile, logout } = useUserStore();
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(onboarding)' as any);
        },
      },
    ]);
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{label.toUpperCase()}</Text>
  );

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    right,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    right?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface }]}
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.accentLight }]}>
        <Ionicons name={icon as any} size={18} color={colors.accent} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>}
        {right}
        {onPress && !right && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label="Appearance" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="moon-outline" size={18} color={colors.accent} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Mode</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
                {isDark ? 'On' : 'Off'} (System)
              </Text>
            </View>
          </View>
        </View>

        <SectionLabel label="Preferences" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingRow
            icon="restaurant-outline"
            label="Default Diet"
            value={profile?.dietPreference ?? 'All'}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="scale-outline"
            label="Units"
            value={units === 'metric' ? 'Metric (g, ml)' : 'Imperial (oz, fl oz)'}
            onPress={() => setUnits((u) => (u === 'metric' ? 'imperial' : 'metric'))}
          />
        </View>

        <SectionLabel label="Account" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingRow icon="person-outline" label="Edit Profile" onPress={() => router.back()} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow icon="lock-closed-outline" label="Change Password" onPress={() => {}} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => router.push('/privacy' as any)} />
        </View>

        <SectionLabel label="About" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingRow icon="information-circle-outline" label="Version" value="1.0.0" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow icon="help-circle-outline" label="Help & Support" onPress={() => router.push('/help' as any)} />
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: '#E53935' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  content: { padding: Spacing.base, gap: Spacing.sm },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: Spacing.md,
    marginBottom: 2,
  },
  section: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontWeight: '600', fontSize: Typography.fontSize.base },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowValue: { fontSize: Typography.fontSize.sm },
  divider: { height: 1, marginHorizontal: Spacing.base },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 50,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  logoutText: { color: '#FFF', fontWeight: '700', fontSize: Typography.fontSize.base },
});
