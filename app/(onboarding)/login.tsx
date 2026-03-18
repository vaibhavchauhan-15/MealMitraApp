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
import { shouldForceProfileSetup } from '../../src/utils/profileCompletion';
import {
  AuthActionButton,
  AuthAnimatedView,
  AuthCard,
  AuthFieldLabel,
  AuthInputContainer,
} from '../../src/components/auth/AuthUI';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setProfile, setHasOnboarded, hydrateFromAuthUser } = useUserStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { toast, showToast } = useToast();
  const googleLoadingRef = useRef(false);
  const expoOwnerFallback = 'vaibhavchauhan_15';
  const expoSlugFallback = 'mealmitra';

  const routeAfterHydration = (source: 'password' | 'oauth-session' | 'oauth-auth-state' | 'oauth-callback') => {
    const hydratedProfile = useUserStore.getState().profile;
    const shouldSetup = shouldForceProfileSetup(hydratedProfile);

    if (__DEV__) {
      const skipReason = (() => {
        if (!hydratedProfile || hydratedProfile.id === 'guest') return 'guest-or-missing-profile';
        if (hydratedProfile.profileCompletedAt) return 'profile_completed_at-present';

        const hasLegacyPreferences =
          (hydratedProfile.dietPreferences?.length ?? 0) > 0 ||
          (hydratedProfile.favoriteCuisines?.length ?? 0) > 0;
        if (hasLegacyPreferences) return 'legacy-preferences-present';

        return 'not-skipped';
      })();

      if (!shouldSetup) {
        console.info(`[LoginFlow][DEV] profile-setup skipped (${source}): ${skipReason}`);
      }
    }

    if (shouldSetup) {
      router.replace('/(onboarding)/profile-setup' as any);
      return;
    }

    router.replace('/(tabs)' as any);
  };

  const getOAuthRedirectUrl = () => {
    // Expo Go should use the Expo auth proxy redirect.
    if (Constants.appOwnership === 'expo') {
      const owner = Constants.expoConfig?.owner ?? expoOwnerFallback;
      const slug = Constants.expoConfig?.slug ?? expoSlugFallback;
      const projectNameForProxy = `@${owner}/${slug}`;
      const redirect = `https://auth.expo.io/${projectNameForProxy}`;
      return redirect;
    }

    return AuthSession.makeRedirectUri({
      scheme: 'mealmitra',
      path: 'auth/callback',
    });
  };

  const completeOAuthFromExistingSession = async () => {
    for (let i = 0; i < 7; i += 1) {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user) {
        await hydrateFromAuthUser(user);
        routeAfterHydration('oauth-session');
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    return false;
  };

  // Safety net: when the app comes back to the foreground while googleLoading is true,
  // check if auth succeeded. If not, the user cancelled — reset loading state.
  // This covers Android's case where openAuthSessionAsync never resolves.
  useEffect(() => {
    googleLoadingRef.current = googleLoading;
  }, [googleLoading]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!googleLoadingRef.current) return;
      if (event !== 'SIGNED_IN' && event !== 'TOKEN_REFRESHED') return;

      const user = session?.user;
      if (!user) return;

      await hydrateFromAuthUser(user);
      setGoogleLoading(false);
      routeAfterHydration('oauth-auth-state');
    });

    return () => subscription.unsubscribe();
  }, [hydrateFromAuthUser, router]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active' && googleLoadingRef.current) {
        // Give the Linking handler in _layout.tsx time to process and navigate first
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // Session may already be set even when AuthSession returns dismiss.
        if (googleLoadingRef.current) {
          const finished = await completeOAuthFromExistingSession();
          if (!finished) {
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
      const redirectTo = getOAuthRedirectUrl();

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

      const isExpoGo = Constants.appOwnership === 'expo';

      // In Expo Go, AuthSession can monitor the return URI and hand control back.
      if (isExpoGo || Platform.OS === 'ios') {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          await handleOAuthCallback(result.url);
        } else {
          const finished = await completeOAuthFromExistingSession();
          if (!finished) {
            setGoogleLoading(false);
          }
        }
      } else {
        // Native Android builds use external browser + deep-link fallback.
        await Linking.openURL(data.url);
        // The AppState listener above handles resetting loading if user cancels.
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
        await hydrateFromAuthUser(user);
        routeAfterHydration('oauth-callback');
      } else {
        setGoogleLoading(false);
      }
    } catch (err: any) {
      showToast(err?.message ?? 'Authentication failed', 'error', 'Error');
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      showToast('Please enter your username/email and password.', 'error', 'Error');
      return;
    }

    setLoading(true);
    const { data: resolvedEmail, error: resolveError } = await supabase.rpc('resolve_login_email', {
      p_identifier: identifier.trim(),
    });

    if (resolveError || !resolvedEmail) {
      setLoading(false);
      showToast('Invalid username/email or password.', 'error', 'Sign In Failed');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(resolvedEmail).trim().toLowerCase(),
      password: password.trim(),
    });
    setLoading(false);
    if (error) {
      showToast(error.message, 'error', 'Sign In Failed');
      return;
    }
    const user = data.user;
    await hydrateFromAuthUser(user);
    routeAfterHydration('password');
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
        <AuthAnimatedView delay={20} style={styles.hero}>
          <Image source={require('../../assets/logo/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to continue cooking</Text>
        </AuthAnimatedView>

        <AuthAnimatedView delay={70}>
        <AuthCard backgroundColor={colors.surface} borderColor={colors.border} style={styles.formCard}>
          <AuthFieldLabel text="Username or email" color={colors.textSecondary} />
          <AuthInputContainer backgroundColor={colors.inputBackground}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Username or email"
              placeholderTextColor={colors.textTertiary}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />
          </AuthInputContainer>

          <AuthFieldLabel text="Password" color={colors.textSecondary} />
          <AuthInputContainer backgroundColor={colors.inputBackground}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </AuthInputContainer>

          <TouchableOpacity onPress={() => router.push('/(onboarding)/forgot-password' as any)}>
            <Text style={[styles.forgotLink, { color: colors.accent }]}>Forgot password?</Text>
          </TouchableOpacity>

          <AuthActionButton
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            variant="primary"
            color={colors.accent}
            textColor="#FFF"
            style={styles.primaryBtn}
          />

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

          <AuthActionButton
            label="Continue as Guest"
            onPress={handleGuest}
            variant="outline"
            color={colors.text}
            textColor={colors.text}
            borderColor={colors.border}
            style={styles.secondaryBtn}
          />
        </AuthCard>
        </AuthAnimatedView>

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
    gap: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  hero: {
    gap: 6,
    marginBottom: 2,
  },
  logo: { width: 64, height: 64, marginBottom: Spacing.xs, alignSelf: 'center' },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: '900' },
  subtitle: { fontSize: Typography.fontSize.base },
  formCard: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  input: {
    height: 52,
    fontSize: Typography.fontSize.base,
  },
  primaryBtn: {
    height: 50,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: Typography.fontSize.sm },
  secondaryBtn: {
    height: 50,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  googleBtn: {
    height: 50,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  forgotLink: {
    textAlign: 'right',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    marginTop: -2,
    marginBottom: Spacing.xs,
  },
  signupRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  signupText: { fontSize: Typography.fontSize.base },
  signupLink: { fontSize: Typography.fontSize.base, fontWeight: '700' },
});
