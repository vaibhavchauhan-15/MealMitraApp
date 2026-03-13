import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Typography } from '../../src/theme';

// Splash screen — auto-redirects to slides
export default function SplashScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(onboarding)/slides' as any);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: '#FDF5EB' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDF5EB" />
      <Image source={require('../../assets/logo/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={[styles.appName, { color: colors.accent }]}>MealMitra</Text>
      <Text style={[styles.tagline, { color: colors.textSecondary }]}>Your Indian Recipe Companion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logo: { width: 120, height: 120, marginBottom: 8 },
  appName: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: '900',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
});
