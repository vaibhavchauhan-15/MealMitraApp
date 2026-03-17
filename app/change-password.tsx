import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { BorderRadius, Spacing, Typography } from '../src/theme';
import { useUserStore } from '../src/store/userStore';
import { supabase } from '../src/services/supabase';
import { Toast } from '../src/components/Toast';
import { useToast } from '../src/hooks/useToast';
import {
  AuthActionButton,
  AuthAnimatedView,
  AuthCard,
  AuthFieldLabel,
  AuthHeader,
  AuthInputContainer,
  AuthModeSwitch,
} from '../src/components/auth/AuthUI';

type Mode = 'with-old' | 'forgot';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { toast, showToast } = useToast();
  const profile = useUserStore((s) => s.profile);

  const [mode, setMode] = useState<Mode>('with-old');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const successRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successRedirectTimerRef.current) {
        clearTimeout(successRedirectTimerRef.current);
      }
    };
  }, []);

  const cardWidth = useMemo(() => {
    if (width >= 900) return 560;
    if (width >= 600) return 500;
    return Math.max(320, width - Spacing.base * 2);
  }, [width]);

  const email = profile?.email?.trim() ?? '';
  const hasMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const hasMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const validateNewPasswords = () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      showToast('Please fill both new password fields.', 'error', 'Validation');
      return false;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'error', 'Validation');
      return false;
    }
    if (newPassword !== confirmPassword) {
      showToast('Both new passwords must match.', 'error', 'Validation');
      return false;
    }
    return true;
  };

  const handlePasswordUpdated = (message: string) => {
    showToast(message, 'success', 'Done');

    if (successRedirectTimerRef.current) {
      clearTimeout(successRedirectTimerRef.current);
    }

    successRedirectTimerRef.current = setTimeout(() => {
      router.replace('/settings' as any);
    }, 1500);
  };

  const updateWithOldPassword = async () => {
    if (!email) {
      showToast('No registered email found for this account.', 'error', 'Email Missing');
      return;
    }
    if (!oldPassword.trim()) {
      showToast('Please enter your current password.', 'error', 'Validation');
      return;
    }
    if (!validateNewPasswords()) return;

    setUpdating(true);
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email,
      password: oldPassword,
    });

    if (verifyErr) {
      setUpdating(false);
      showToast('Current password is incorrect.', 'error', 'Authentication Failed');
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword.trim() });
    setUpdating(false);
    if (updateErr) {
      showToast(updateErr.message, 'error', 'Password Update Failed');
      return;
    }

    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    handlePasswordUpdated('Password changed successfully. Redirecting to settings...');
  };

  const sendForgotCode = async () => {
    if (!email) {
      showToast('No registered email found for this account.', 'error', 'Email Missing');
      return;
    }

    setSendingCode(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });
    setSendingCode(false);

    if (error) {
      showToast(error.message, 'error', 'Could Not Send Code');
      return;
    }

    setCodeSent(true);
    showToast('Verification code sent to your email.', 'success', 'Code Sent');
  };

  const verifyCodeAndUpdatePassword = async () => {
    if (!email) {
      showToast('No registered email found for this account.', 'error', 'Email Missing');
      return;
    }
    if (!otpCode.trim()) {
      showToast('Please enter the verification code.', 'error', 'Validation');
      return;
    }
    if (!validateNewPasswords()) return;

    setUpdating(true);
    const { error: verifyOtpErr } = await supabase.auth.verifyOtp({
      email,
      token: otpCode.trim(),
      type: 'email',
    });

    if (verifyOtpErr) {
      setUpdating(false);
      showToast(verifyOtpErr.message, 'error', 'Invalid Code');
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword.trim() });
    setUpdating(false);

    if (updateErr) {
      showToast(updateErr.message, 'error', 'Password Update Failed');
      return;
    }

    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setCodeSent(false);
    handlePasswordUpdated('Password reset successful. Redirecting to settings...');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AuthHeader
        title="Change Password"
        topInset={insets.top}
        borderColor={colors.border}
        textColor={colors.text}
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthAnimatedView delay={40} style={{ width: cardWidth }}>
        <AuthCard backgroundColor={colors.surface} borderColor={colors.border}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Secure your account</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Email: {email || 'Not available'}</Text>

          <AuthModeSwitch
            value={mode}
            options={[
              { value: 'with-old', label: 'Use current password' },
              { value: 'forgot', label: 'Forgot current password' },
            ]}
            onChange={(next) => setMode(next as Mode)}
            accentColor={colors.accent}
            textColor={colors.text}
            mutedTextColor={colors.textSecondary}
            backgroundColor={colors.inputBackground}
          />

          {mode === 'with-old' ? (
            <>
              <Field
                label="Current password"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                placeholder="Enter current password"
                colors={colors}
              />

              <Field
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="At least 8 characters"
                colors={colors}
              />

              <Field
                label="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Re-enter new password"
                colors={colors}
              />

              <PasswordMatchHint hasMatch={hasMatch} hasMismatch={hasMismatch} colors={colors} />

              <AuthActionButton
                label="Update Password"
                onPress={updateWithOldPassword}
                loading={updating}
                disabled={updating}
                variant="primary"
                color={colors.accent}
                textColor="#FFF"
                style={styles.primaryButton}
              />
            </>
          ) : (
            <>
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>Tap "Send Verification Code" to receive a code on your registered email, then enter it below to reset your password.</Text>

              <AuthActionButton
                label="Send Verification Code"
                onPress={sendForgotCode}
                loading={sendingCode}
                disabled={sendingCode}
                variant="outline"
                color={colors.accent}
                textColor={colors.accent}
                borderColor={colors.accent}
                style={styles.secondaryButton}
              />

              {codeSent && (
                <>
                  <Field
                    label="Verification code"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    placeholder="Enter code from email"
                    keyboardType="number-pad"
                    colors={colors}
                  />

                  <Field
                    label="New password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    placeholder="At least 8 characters"
                    colors={colors}
                  />

                  <Field
                    label="Confirm new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholder="Re-enter new password"
                    colors={colors}
                  />

                  <PasswordMatchHint hasMatch={hasMatch} hasMismatch={hasMismatch} colors={colors} />

                  <AuthActionButton
                    label="Verify & Update Password"
                    onPress={verifyCodeAndUpdatePassword}
                    loading={updating}
                    disabled={updating}
                    variant="primary"
                    color={colors.accent}
                    textColor="#FFF"
                    style={styles.primaryButton}
                  />
                </>
              )}
            </>
          )}
        </AuthCard>
        </AuthAnimatedView>
      </ScrollView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} title={toast.title} />
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  colors: any;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'number-pad';
}) {
  const [isHidden, setIsHidden] = useState(!!secureTextEntry);

  useEffect(() => {
    setIsHidden(!!secureTextEntry);
  }, [secureTextEntry]);

  return (
    <View style={styles.fieldWrap}>
      <AuthFieldLabel text={label} color={colors.textSecondary} />
      <AuthInputContainer backgroundColor={colors.inputBackground} borderColor={colors.border}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { color: colors.text }]}
          secureTextEntry={isHidden}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize="none"
        />
        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.eyeToggleBtn}
            onPress={() => setIsHidden((prev) => !prev)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={isHidden ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </AuthInputContainer>
    </View>
  );
}

function PasswordMatchHint({ hasMatch, hasMismatch, colors }: { hasMatch: boolean; hasMismatch: boolean; colors: any }) {
  if (!hasMatch && !hasMismatch) return null;

  if (hasMatch) {
    return (
      <View style={styles.hintRow}>
        <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
        <Text style={[styles.hintText, { color: '#16A34A' }]}>Passwords match</Text>
      </View>
    );
  }

  return (
    <View style={styles.hintRow}>
      <Ionicons name="close-circle" size={16} color={colors.error} />
      <Text style={[styles.hintText, { color: colors.error }]}>Passwords do not match</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    marginTop: -2,
  },
  fieldWrap: {
    gap: 6,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: Typography.fontSize.base,
  },
  eyeToggleBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  helpText: {
    fontSize: Typography.fontSize.xs,
    lineHeight: 20,
  },
  primaryButton: {
    height: 50,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  secondaryButton: {
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
