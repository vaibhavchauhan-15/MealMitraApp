import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/services/supabase';
import { useUserStore } from '../../src/store/userStore';
import * as Linking from 'expo-linking';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import { shouldForceProfileSetup } from '../../src/utils/profileCompletion';

export default function EmailSentScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { toast, showToast } = useToast();
  const [resending, setResending] = useState(false);
  const { hydrateFromAuthUser } = useUserStore();

  useEffect(() => {
    // Listen for session — fires when deep link sets the session after email confirmation
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === 'SIGNED_IN' || event === 'USER_UPDATED') &&
        session?.user
      ) {
        const user = session.user;
        hydrateFromAuthUser(user).then(() => {
          const hydratedProfile = useUserStore.getState().profile;
          if (shouldForceProfileSetup(hydratedProfile)) {
            router.replace('/(onboarding)/profile-setup' as any);
            return;
          }
          router.replace('/(tabs)' as any);
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: { emailRedirectTo: Linking.createURL('auth/confirm') },
    });
    setResending(false);
    if (error) {
      showToast(error.message, 'error', 'Error');
    } else {
      showToast('Confirmation email resent!', 'success', 'Email Sent');
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.accent + '20' }]}>
          <Ionicons name="mail-outline" size={56} color={colors.accent} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Check Your Inbox</Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We sent a confirmation link to
        </Text>
        {email ? (
          <Text style={[styles.emailText, { color: colors.accent }]}>{email}</Text>
        ) : null}

        <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Tap the confirmation link in the email. You'll be{' '}
            <Text style={{ fontWeight: '700' }}>automatically logged in</Text> — no need to sign in
            again.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.resendBtn, { borderColor: colors.accent }]}
          onPress={handleResend}
          disabled={resending}
        >
          {resending ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={[styles.resendText, { color: colors.accent }]}>Resend Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(onboarding)/login' as any)}>
          <Text style={[styles.loginLink, { color: colors.textSecondary }]}>
            Already confirmed?{' '}
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        title={toast.title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
  },
  emailText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  resendBtn: {
    height: 50,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  resendText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  loginLink: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.base,
  },
});
