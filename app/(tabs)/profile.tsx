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
import { Spacing, Typography, BorderRadius, Shadow } from '../../src/theme';
import { useUserStore } from '../../src/store/userStore';
import { useSavedStore } from '../../src/store/savedStore';

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const logout = useUserStore((s) => s.logout);
  const setHasOnboarded = useUserStore((s) => s.setHasOnboarded);
  const savedCount = useSavedStore((s) => s.savedIds.length);

  const menuItems = [
    { icon: 'bookmark-outline', label: 'Saved Recipes', badge: savedCount, onPress: () => router.push('/(tabs)/saved' as any) },
    { icon: 'time-outline', label: 'Recently Viewed', onPress: () => router.push('/recently-viewed' as any) },
    { icon: 'restaurant-outline', label: 'My Recipes', onPress: () => router.push('/my-recipes' as any) },
    { icon: 'cloud-upload-outline', label: 'Upload Recipe', onPress: () => router.push('/upload-recipe' as any) },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/notifications' as any) },
    { icon: 'settings-outline', label: 'Settings', onPress: () => router.push('/settings' as any) },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => router.push('/help' as any) },
    { icon: 'shield-outline', label: 'Privacy Policy', onPress: () => router.push('/privacy' as any) },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarEmoji}>
                {profile?.name ? profile.name[0].toUpperCase() : '👤'}
              </Text>
            )}
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {profile?.name || 'Food Enthusiast'}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {profile?.email || 'Set up your profile'}
          </Text>
          {profile?.cookingLevel && (
            <View style={[styles.levelBadge, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.levelText, { color: colors.accent }]}>
                {profile.cookingLevel} Cook
              </Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{savedCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Saved</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reviews</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recipes</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
          {menuItems.map((item, idx) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                <View style={[styles.menuIconContainer, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name={item.icon as any} size={20} color={colors.accent} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                {item.badge ? (
                  <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
              {idx < menuItems.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.surface, borderColor: colors.error }]}
          onPress={() => {
            logout();
            setHasOnboarded(false);
            router.replace('/(onboarding)' as any);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textTertiary }]}>MealMitra v1.0.0</Text>
        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  profileCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarEmoji: { fontSize: 36 },
  profileName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: Typography.fontSize.sm,
  },
  levelBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  levelText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    width: '100%',
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center', gap: 2 },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
  },
  statLabel: { fontSize: Typography.fontSize.xs },
  statDivider: { width: 1, height: 30 },
  menuCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  divider: { height: 1, marginHorizontal: Spacing.base },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1.5,
  },
  logoutText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.sm,
  },
});
