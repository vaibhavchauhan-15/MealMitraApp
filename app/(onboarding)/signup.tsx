import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../../src/theme';
import { useUserStore } from '../../src/store/userStore';
import { supabase } from '../../src/services/supabase';
import * as Linking from 'expo-linking';

export default function SignupScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setProfile, setHasOnboarded } = useUserStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showToast } = useToast();

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast('Please fill in all fields.', 'error', 'Error');
      return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters.', 'error', 'Error');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: { name: name.trim() },
        emailRedirectTo: Linking.createURL('auth/confirm'),
      },
    });
    setLoading(false);

    if (error) {
      showToast(error.message, 'error', 'Sign Up Failed');
      return;
    }

    const user = data.user;
    const session = data.session;

    if (!user) {
      showToast('Could not create account. Please try again.', 'error', 'Error');
      return;
    }

    // session is null when Supabase "Confirm email" is ON — user is created but unconfirmed
    if (!session) {
      router.push({ pathname: '/(onboarding)/email-sent' as any, params: { email: email.trim() } });
      return;
    }

    // session exists — "Confirm email" is OFF in Supabase, user is live immediately
    setProfile({
      id: user.id,
      name: name.trim(),
      email: user.email ?? email.trim(),
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>

        <Image source={require('../../assets/logo/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Join thousands of home cooks
        </Text>

        <View style={styles.form}>
          <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Full name"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
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
              placeholder="Password (min 8 characters)"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
          By signing up, you agree to our Privacy Policy. No personal data is sold.
        </Text>
      </ScrollView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} title={toast.title} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: Spacing.sm },
  logo: { width: 80, height: 80, alignSelf: 'center', marginBottom: Spacing.sm },
  backText: { fontSize: Typography.fontSize.base, fontWeight: '600' },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: '900' },
  subtitle: { fontSize: Typography.fontSize.base, marginBottom: Spacing.md },
  form: { gap: Spacing.md },
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
  disclaimer: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
});
