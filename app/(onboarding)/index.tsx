import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
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
    <View style={[styles.screen, { backgroundColor: colors.accent }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.accent} />
      <Text style={styles.logo}>🍛</Text>
      <Text style={styles.appName}>MealMitra</Text>
      <Text style={styles.tagline}>Your Indian Recipe Companion</Text>
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
  logo: { fontSize: 80 },
  appName: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
});
