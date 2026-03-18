import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ConfirmModal } from '../src/components/ConfirmModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../src/theme';
import { useUserStore } from '../src/store/userStore';
import type { ThemePreference } from '../src/store/userStore';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light',  label: 'Light',  icon: 'sunny-outline' },
  { value: 'dark',   label: 'Dark',   icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, themePreference, setThemePreference } = useUserStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => setShowLogoutModal(true);

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
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Appearance ───────────────────────────────────────────────────── */}
        <SectionLabel label="Appearance" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={[styles.row, { backgroundColor: colors.surface }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="contrast-outline" size={18} color={colors.accent} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Theme</Text>
          </View>
          {/* 3-way segment: System / Light / Dark */}
          <View style={[styles.segmentWrapper, { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base }]}>
            <View style={[styles.segmentTrack, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {THEME_OPTIONS.map((opt) => {
                const active = themePreference === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.segmentItem,
                      active && { backgroundColor: colors.accent },
                    ]}
                    onPress={() => setThemePreference(opt.value)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={14}
                      color={active ? '#FFF' : colors.textSecondary}
                    />
                    <Text style={[styles.segmentLabel, { color: active ? '#FFF' : colors.textSecondary }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Account ──────────────────────────────────────────────────────── */}
        <SectionLabel label="Account" />
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingRow icon="person-outline" label="Edit Profile" onPress={() => router.push('/edit-profile' as any)} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow icon="time-outline" label="Recently Viewed" onPress={() => router.push('/recently-viewed' as any)} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow icon="at-outline" label="Change Username" onPress={() => router.push('/change-username' as any)} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow icon="mail-outline" label="Change Email" onPress={() => router.push('/change-email' as any)} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow icon="lock-closed-outline" label="Change Password" onPress={() => router.push('/change-password' as any)} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow icon="help-circle-outline" label="Help & Support" onPress={() => router.push('/help' as any)} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => router.push('/privacy' as any)} />
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: '#E53935' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Text style={[styles.versionFooter, { color: colors.textTertiary, paddingBottom: insets.bottom + 8 }]}>MealMitra v1.0.0</Text>

      <ConfirmModal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        destructive
        icon="log-out-outline"
        iconColor="#EF4444"
        onConfirm={async () => {
          setShowLogoutModal(false);
          await logout();
          router.replace('/(onboarding)' as any);
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
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
  segmentWrapper: {},
  segmentTrack: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  segmentLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
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
  versionFooter: {
    textAlign: 'center',
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
});
