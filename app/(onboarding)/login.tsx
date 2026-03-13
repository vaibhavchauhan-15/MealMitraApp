import React, { useState, useEffect, useRef } from 'react';
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
  AppState,
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
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
WebBrowser.maybeCompleteAuthSession();

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
  const googleLoadingRef = useRef(false);

  // Safety net: when the app comes back to the foreground while googleLoading is true,
  // check if auth succeeded. If not, the user cancelled — reset loading state.
  // This covers Android's case where openAuthSessionAsync never resolves.
  useEffect(() => {
    googleLoadingRef.current = googleLoading;
  }, [googleLoading]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active' && googleLoadingRef.current) {
        // Give the Linking handler in _layout.tsx time to process and navigate first
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // If still mounted and no session, user cancelled
        if (googleLoadingRef.current) {
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            setGoogleLoading(false);
          }
        }
      }
    });
    return () => subscription.remove();
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: 'mealmitra',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        showToast(error?.message ?? 'Could not start Google sign-in', 'error', 'Error');
        setGoogleLoading(false);
        return;
      }

      if (Platform.OS === 'android') {
        // On Android, Chrome Custom Tabs (used by openAuthSessionAsync) don't reliably
        // close when redirecting to a custom scheme on Android 12+ / Chrome 107+.
        // Instead, open the URL in the system browser and let the Linking listener
        // in _layout.tsx complete the flow when the deep link fires.
        await Linking.openURL(data.url);
        // The AppState listener above handles resetting loading if user cancels.
      } else {
        // iOS: ASWebAuthenticationSession handles custom scheme redirects correctly.
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          await handleOAuthCallback(result.url);
        } else {
          setGoogleLoading(false);
        }
      }
    } catch (err: any) {
      showToast(err?.message ?? 'Google sign-in failed', 'error', 'Error');
      setGoogleLoading(false);
    }
  };

  const handleOAuthCallback = async (url: string) => {
    try {
      // Supabase can return either a code (PKCE) or access_token (implicit) in the URL
      const fragment = url.includes('#') ? url.split('#')[1] : '';
      const queryString = url.includes('?') ? url.split('?')[1]?.split('#')[0] : '';
      const parseParams = (str: string) => {
        const params: Record<string, string> = {};
        str.split('&').forEach((part) => {
          const [key, value] = part.split('=');
          if (key && value) params[key] = decodeURIComponent(value);
        });
        return params;
      };
      const fragmentParams = parseParams(fragment);
      const queryParams = parseParams(queryString ?? '');

      const code = queryParams['code'] || fragmentParams['code'];
      const accessToken = fragmentParams['access_token'] || queryParams['access_token'];
      const refreshToken = fragmentParams['refresh_token'] || queryParams['refresh_token'];

      let user = null;
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);
        if (error) throw error;
        user = data.user;
      } else if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
        user = data.user;
      }

      if (user) {
        setProfile({
          id: user.id,
          name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User',
          email: user.email ?? '',
          avatar: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? undefined,
          favoriteCuisines: [],
          cookingLevel: 'Intermediate',
        });
        setHasOnboarded(true);
        router.replace('/(tabs)' as any);
      } else {
        setGoogleLoading(false);
      }
    } catch (err: any) {
      showToast(err?.message ?? 'Authentication failed', 'error', 'Error');
      setGoogleLoading(false);
    }
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
        <Image source={require('../../assets/logo/logo.png')} style={styles.logo} resizeMode="contain" />
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
            disabled={googleLoading}
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
  logo: { width: 90, height: 90, marginBottom: Spacing.sm, alignSelf: 'center' },
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
