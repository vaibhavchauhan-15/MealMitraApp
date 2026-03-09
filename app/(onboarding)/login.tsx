import React, { useState, useEffect } from 'react';
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
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET ?? '';

// Expo Go uses the auth.expo.io proxy (Web OAuth client in Google Cloud Console)
// Standalone uses the registered custom scheme (Android/iOS OAuth client)
const isExpoGo = Constants.executionEnvironment === 'storeClient';
const REDIRECT_URI = isExpoGo
  ? 'https://auth.expo.io/@vaibhavchauhan_15/mealmitra'
  : 'mealmitra://oauth2redirect/google';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setProfile, setHasOnboarded } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { toast, showToast } = useToast();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        fetchGoogleUser(authentication.accessToken);
      }
    }
    if (response?.type === 'error' || response?.type === 'dismiss') {
      setGoogleLoading(false);
    }
  }, [response]);

  const fetchGoogleUser = async (accessToken: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = await res.json();
      setProfile({
        id: user.id,
        name: user.name ?? user.email?.split('@')[0] ?? 'User',
        email: user.email ?? '',
        avatar: user.picture ?? undefined,
        favoriteCuisines: [],
        cookingLevel: 'Intermediate',
      });
      setHasOnboarded(true);
      router.replace('/(tabs)' as any);
    } catch {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await promptAsync();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Please enter your email and password.', 'error', 'Error');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });
    setLoading(false);
    if (error) {
      showToast(error.message, 'error', 'Sign In Failed');
      return;
    }
    const user = data.user;
    setProfile({
      id: user.id,
      name: user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User',
      email: user.email ?? '',
      avatar: user.user_metadata?.avatar_url ?? undefined,
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
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
            onPress={handleGoogleSignIn}
            disabled={!request || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={[styles.googleBtnText, { color: colors.text }]}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

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

      <Toast visible={toast.visible} message={toast.message} type={toast.type} title={toast.title} />
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
  googleBtn: {
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4285F4',
  },
  googleBtnText: {
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
