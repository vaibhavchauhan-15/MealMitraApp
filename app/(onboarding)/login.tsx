import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../../src/theme';
import { useUserStore } from '../../src/store/userStore';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setProfile, setHasOnboarded } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email.trim()) return;
    setProfile({
      id: Date.now().toString(),
      name: email.split('@')[0],
      email: email.trim(),
      favoriteCuisines: [],
      cookingLevel: 'Intermediate',
    });
    setHasOnboarded(true);
    router.replace('/(tabs)' as any);
  };

  const handleGuest = () => {
    setProfile({
      id: 'guest',
      name: 'Guest User',
      email: '',
      favoriteCuisines: [],
      cookingLevel: 'Beginner',
    });
    setHasOnboarded(true);
    router.replace('/(tabs)' as any);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing['2xl'] }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>🍛</Text>
        <Text style={[styles.title, { color: colors.text }]}>Welcome Back!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to continue cooking
        </Text>

        <View style={styles.form}>
          <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email address"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            onPress={handleLogin}
          >
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={handleGuest}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signupRow}>
          <Text style={[styles.signupText, { color: colors.textSecondary }]}>
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={() => router.push('/(onboarding)/signup' as any)}>
            <Text style={[styles.signupLink, { color: colors.accent }]}> Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  logo: { fontSize: 60, marginBottom: Spacing.sm },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: '900' },
  subtitle: { fontSize: Typography.fontSize.base, marginBottom: Spacing.md },
  form: { width: '100%', gap: Spacing.md },
  inputContainer: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
  },
  input: {
    height: 52,
    fontSize: Typography.fontSize.base,
  },
  primaryBtn: {
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: Typography.fontSize.sm },
  secondaryBtn: {
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  signupRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  signupText: { fontSize: Typography.fontSize.base },
  signupLink: { fontSize: Typography.fontSize.base, fontWeight: '700' },
});
