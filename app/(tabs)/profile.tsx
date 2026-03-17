import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../../src/theme';
import { useUserStore } from '../../src/store/userStore';
import { useSavedStore } from '../../src/store/savedStore';
import { getProfileIconById } from '../../src/constants/profileIcons';

type MenuItem = { icon: string; label: string; badge?: number; onPress: () => void };

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const logout = useUserStore((s) => s.logout);
  const setHasOnboarded = useUserStore((s) => s.setHasOnboarded);
  const savedCount = useSavedStore((s) => s.savedIds.length);
  const avatarIcon = getProfileIconById(profile?.avatarIcon);
  const hasCompletedProfile = Boolean(profile?.profileCompletedAt);

  const libraryMenu: MenuItem[] = [
    { icon: 'bookmark-outline', label: 'Saved Recipes', badge: savedCount || undefined, onPress: () => router.push('/(tabs)/saved' as any) },
    { icon: 'time-outline', label: 'Recently Viewed', onPress: () => router.push('/recently-viewed' as any) },
  ];

  const appMenu: MenuItem[] = [
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/notifications' as any) },
    { icon: 'settings-outline', label: 'Settings', onPress: () => router.push('/settings' as any) },
  ];

  const supportMenu: MenuItem[] = [
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => router.push('/help' as any) },
    { icon: 'shield-outline', label: 'Privacy Policy', onPress: () => router.push('/privacy' as any) },
  ];

  const MenuGroup = ({ title, items }: { title: string; items: MenuItem[] }) => (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.groupCard, { backgroundColor: colors.surface }]}>
        {items.map((item, idx) => (
          <React.Fragment key={item.label}>
            <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}>
                <Ionicons name={item.icon as any} size={18} color={colors.accent} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              {item.badge ? (
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
            </TouchableOpacity>
            {idx < items.length - 1 && (
              <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6, borderBottomColor: colors.border }]}>
        <Text style={[styles.topTitle, { color: colors.text }]}>Profile</Text>
        <TouchableOpacity
          style={[styles.topIconBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/settings' as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={19} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          {/* Avatar + pencil edit button */}
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
              {profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
              ) : avatarIcon ? (
                <Ionicons name={avatarIcon.icon} size={34} color="#FFF" />
              ) : (
                <Text style={styles.avatarLetter}>
                  {profile?.name ? profile.name[0].toUpperCase() : '👤'}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.avatarEditBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/edit-profile' as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="pencil" size={11} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.heroName, { color: colors.text }]}>
            {profile?.name || 'Food Enthusiast'}
          </Text>
          {!!profile?.username && (
            <Text style={[styles.heroUsername, { color: colors.accent }]}>@{profile.username}</Text>
          )}
          <Text style={[styles.heroEmail, { color: colors.textSecondary }]}>
            {profile?.email || 'Tap the pencil to set up your profile'}
          </Text>

          {/* Chips: cooking level + first diet */}
          {(profile?.cookingLevel || profile?.dietPreferences?.[0]) && (
            <View style={styles.chipsRow}>
              {profile?.cookingLevel && (
                <View style={[styles.chip, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="flame-outline" size={11} color={colors.accent} />
                  <Text style={[styles.chipTxt, { color: colors.accent }]}>{profile.cookingLevel} Cook</Text>
                </View>
              )}
              {profile?.dietPreferences?.[0] && (
                <View style={[styles.chip, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="leaf-outline" size={11} color={colors.accent} />
                  <Text style={[styles.chipTxt, { color: colors.accent }]}>{profile.dietPreferences[0]}</Text>
                </View>
              )}
            </View>
          )}

          {/* Stats */}
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.text }]}>{savedCount}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Saved</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.text }]}>0</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Reviews</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.text }]}>0</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Recipes</Text>
            </View>
          </View>
        </View>

        {/* ── Health snapshot / nudge ──────────────────────────────────────── */}
        {hasCompletedProfile ? (
          <View style={[styles.healthCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.healthTitle, { color: colors.textSecondary }]}>HEALTH STATS</Text>
            <View style={styles.healthRow}>
              {[
                { label: 'TDEE', value: `${profile?.healthProfile?.tdee ?? '—'}`, unit: 'kcal', color: colors.accent },
                { label: 'Weight', value: `${profile?.healthProfile?.weight ?? '—'}`, unit: 'kg', color: '#22C55E' },
                { label: 'Goal', value: (profile?.healthProfile?.fitnessGoal ?? '—').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), unit: '', color: '#F59E0B' },
              ].map((item, i, arr) => (
                <React.Fragment key={item.label}>
                  <View style={styles.healthItem}>
                    <Text style={[styles.healthVal, { color: item.color }]}>
                      {item.value}{item.unit ? <Text style={styles.healthUnit}> {item.unit}</Text> : null}
                    </Text>
                    <Text style={[styles.healthLbl, { color: colors.textSecondary }]}>{item.label}</Text>
                  </View>
                  {i < arr.length - 1 && (
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.nudgeCard, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/edit-profile' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.nudgeIcon}>
              <Ionicons name="analytics-outline" size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nudgeTitle}>Complete Your Profile</Text>
              <Text style={styles.nudgeSub}>Get personalised recipes & AI diet plans</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* ── My Recipes quick actions ─────────────────────────────────── */}
        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>MY RECIPES</Text>
          <View style={[styles.recipeActionsCard, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.recipeActionBtn, { backgroundColor: colors.accentLight }]}
              onPress={() => router.push('/my-recipes' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="restaurant-outline" size={18} color={colors.accent} />
              <Text style={[styles.recipeActionText, { color: colors.accent }]}>View My Recipes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.recipeActionBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/upload-recipe' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#FFF" />
              <Text style={[styles.recipeActionText, { color: '#FFF' }]}>Upload Recipe</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Menu groups ─────────────────────────────────────────────────── */}
        <MenuGroup title="MY LIBRARY" items={libraryMenu} />
        <MenuGroup title="APP" items={appMenu} />
        <MenuGroup title="SUPPORT" items={supportMenu} />

        {/* ── Log Out ─────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.error }]}
          onPress={() => { logout(); setHasOnboarded(false); router.replace('/(onboarding)' as any); }}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={[styles.logoutTxt, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textTertiary }]}>MealMitra v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  topIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    gap: Spacing.sm,
  },

  // hero card
  heroCard: {
    borderRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 0,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    overflow: 'hidden',
  },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 84, height: 84, borderRadius: 42 },
  avatarLetter: { fontSize: 36, color: '#FFF', fontWeight: '800' },
  avatarEditBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  heroName: { fontSize: Typography.fontSize['2xl'], fontWeight: '800', marginTop: 4 },
  heroUsername: { fontSize: Typography.fontSize.sm, fontWeight: '700' },
  heroEmail: { fontSize: Typography.fontSize.sm, marginBottom: 4 },

  chipsRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  chipTxt: { fontSize: 11, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.md,
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center', gap: 2 },
  statVal: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  statLbl: { fontSize: Typography.fontSize.xs, fontWeight: '500' },
  statDivider: { width: 1, height: 28 },

  // health card
  healthCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
  },
  healthTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  healthRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  healthItem: { alignItems: 'center', gap: 2 },
  healthVal: { fontSize: Typography.fontSize.base, fontWeight: '800' },
  healthUnit: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  healthLbl: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  // nudge / complete profile banner
  nudgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
  },
  nudgeIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  nudgeTitle: { color: '#FFF', fontSize: Typography.fontSize.base, fontWeight: '800' },
  nudgeSub: { color: 'rgba(255,255,255,0.82)', fontSize: Typography.fontSize.xs, marginTop: 1 },

  // grouped menu
  group: { gap: 6 },
  groupLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.4,
    marginLeft: 4,
  },
  groupCard: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  recipeActionsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  recipeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
  },
  recipeActionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: '600' },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  rowDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing.base },

  // logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, borderRadius: BorderRadius.xl,
    paddingVertical: 14, borderWidth: 1.5, marginTop: 4,
  },
  logoutTxt: { fontSize: Typography.fontSize.base, fontWeight: '700' },

  version: { textAlign: 'center', fontSize: Typography.fontSize.xs, paddingBottom: 4 },
});
