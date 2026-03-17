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
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import {
  AuthActionButton,
  AuthAnimatedView,
  AuthCard,
  AuthFieldLabel,
  AuthHeader,
  AuthInputContainer,
} from '../../src/components/auth/AuthUI';
import {
  confirmPasswordResetOtp,
  isValidPasswordResetOtpCode,
  requestPasswordResetOtp,
} from '../../src/services/passwordResetOtpService';

export default function ForgotPasswordScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);

  const sendCode = async () => {
    if (!email.trim()) {
      showToast('Please enter your registered email.', 'error', 'Validation');
      return;
    }

    setSending(true);
    const { error } = await requestPasswordResetOtp(email);
    setSending(false);

    if (error) {
      showToast(error.message, 'error', 'Could Not Send Code');
      return;
    }

    setCodeSent(true);
    showToast('Verification code sent. Check your inbox.', 'success', 'Code Sent');
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      showToast('Please enter your registered email.', 'error', 'Validation');
      return;
    }
    if (!code.trim() || !isValidPasswordResetOtpCode(code)) {
      showToast('Enter a valid 6-digit verification code.', 'error', 'Validation');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error', 'Validation');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error', 'Validation');
      return;
    }

    setResetting(true);
    const { error } = await confirmPasswordResetOtp(email, code, newPassword);
    setResetting(false);

    if (error) {
      showToast(error.message, 'error', 'Reset Failed');
      return;
    }

    showToast('Password reset successful. Please sign in.', 'success', 'Success');
    setTimeout(() => {
      router.replace('/(onboarding)/login' as any);
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <AuthHeader
        title="Forgot Password"
        topInset={insets.top}
        borderColor={colors.border}
        textColor={colors.text}
        onBack={() => router.back()}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
      >
        <AuthAnimatedView delay={40}>
          <AuthCard backgroundColor={colors.surface} borderColor={colors.border} style={styles.formCard}>
            <Text style={[styles.title, { color: colors.text }]}>Reset your password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We will email a 6-digit verification code.
            </Text>

            <AuthFieldLabel text="Registered email" color={colors.textSecondary} />
            <AuthInputContainer backgroundColor={colors.inputBackground}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email address"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </AuthInputContainer>

            {!codeSent ? (
              <AuthActionButton
                label="Send Verification Code"
                onPress={sendCode}
                loading={sending}
                disabled={sending}
                variant="primary"
                color={colors.accent}
                textColor="#FFF"
                style={styles.primaryBtn}
              />
            ) : (
              <>
                <AuthFieldLabel text="Verification code" color={colors.textSecondary} />
                <AuthInputContainer backgroundColor={colors.inputBackground}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="6-digit code"
                    placeholderTextColor={colors.textTertiary}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </AuthInputContainer>

                <AuthFieldLabel text="New password" color={colors.textSecondary} />
                <AuthInputContainer backgroundColor={colors.inputBackground}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="New password"
                    placeholderTextColor={colors.textTertiary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </AuthInputContainer>

                <AuthFieldLabel text="Confirm new password" color={colors.textSecondary} />
                <AuthInputContainer backgroundColor={colors.inputBackground}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </AuthInputContainer>

                <AuthActionButton
                  label="Reset Password"
                  onPress={resetPassword}
                  loading={resetting}
                  disabled={resetting}
                  variant="primary"
                  color={colors.accent}
                  textColor="#FFF"
                  style={styles.primaryBtn}
                />

                <TouchableOpacity onPress={sendCode} disabled={sending}>
                  <Text style={[styles.resendLink, { color: colors.accent }]}>Resend code</Text>
                </TouchableOpacity>
              </>
            )}
          </AuthCard>
        </AuthAnimatedView>
      </ScrollView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} title={toast.title} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    justifyContent: 'center',
  },
  formCard: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '900',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing.xs,
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
  resendLink: {
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
});
