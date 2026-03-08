import React from 'react';
import { View, Text, StatusBar, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/useTheme';
import { Spacing, Typography } from '../theme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, rightElement }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.header, paddingTop: insets.top },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.header}
      />
      <View style={styles.inner}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {rightElement || <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    minHeight: 50,
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
});
