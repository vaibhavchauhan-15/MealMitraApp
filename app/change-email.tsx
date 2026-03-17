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
  ActivityIndicator,
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
  AuthInfoBox,
  AuthInputContainer,
  AuthModeSwitch,
} from '../src/components/auth/AuthUI';

type Mode = 'with-password' | 'forgot-password';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ChangeEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { toast, showToast } = useToast();
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [mode, setMode] = useState<Mode>('with-password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [hideCurrentPassword, setHideCurrentPassword] = useState(true);
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

  const currentEmail = profile?.email?.trim() ?? '';
  const emailsMatch = confirmEmail.length > 0 && newEmail.trim().toLowerCase() === confirmEmail.trim().toLowerCase();
  const emailsMismatch = confirmEmail.length > 0 && newEmail.trim().toLowerCase() !== confirmEmail.trim().toLowerCase();

  const validateNewEmail = () => {
    const target = newEmail.trim().toLowerCase();
    const confirm = confirmEmail.trim().toLowerCase();

    if (!target || !confirm) {
      showToast('Please fill both new email fields.', 'error', 'Validation');
      return false;
    }
    if (!isValidEmail(target)) {
      showToast('Please enter a valid new email address.', 'error', 'Validation');
      return false;
    }
    if (target !== confirm) {
      showToast('Both new email fields must match.', 'error', 'Validation');
      return false;
    }
    if (!currentEmail) {
      showToast('No current email found for this account.', 'error', 'Email Missing');
      return false;
    }
    if (target === currentEmail.toLowerCase()) {
      showToast('New email must be different from current email.', 'error', 'Validation');
      return false;
    }
    return true;
  };

  const handleEmailUpdated = (targetEmail: string) => {
    updateProfile({ email: targetEmail });

    if (successRedirectTimerRef.current) {
      clearTimeout(successRedirectTimerRef.current);
    }

    showToast('Email change requested. Check inbox to confirm before full switch. Redirecting...', 'success', 'Done');
    successRedirectTimerRef.current = setTimeout(() => {
      router.replace('/settings' as any);
    }, 1500);
  };

  const changeWithCurrentPassword = async () => {
    if (!validateNewEmail()) return;
    if (!currentPassword.trim()) {
      showToast('Please enter your current password.', 'error', 'Validation');
      return;
    }

    const targetEmail = newEmail.trim().toLowerCase();

    setUpdating(true);
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });

    if (verifyErr) {
      setUpdating(false);
      showToast('Current password is incorrect.', 'error', 'Authentication Failed');
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ email: targetEmail });
    setUpdating(false);

    if (updateErr) {
      showToast(updateErr.message, 'error', 'Email Update Failed');
      return;
    }

    setCurrentPassword('');
    setNewEmail('');
    setConfirmEmail('');
    handleEmailUpdated(targetEmail);
  };

  const sendForgotPasswordCode = async () => {
    if (!currentEmail) {
      showToast('No registered email found for this account.', 'error', 'Email Missing');
      return;
    }

    setSendingCode(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: currentEmail,
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
    showToast('Verification code sent to your current email.', 'success', 'Code Sent');
  };

  const verifyCodeAndChangeEmail = async () => {
    if (!validateNewEmail()) return;
    if (!otpCode.trim()) {
      showToast('Please enter the verification code.', 'error', 'Validation');
      return;
    }

    const targetEmail = newEmail.trim().toLowerCase();

    setUpdating(true);
    const { error: verifyOtpErr } = await supabase.auth.verifyOtp({
      email: currentEmail,
      token: otpCode.trim(),
      type: 'email',
    });

    if (verifyOtpErr) {
      setUpdating(false);
      showToast(verifyOtpErr.message, 'error', 'Invalid Code');
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ email: targetEmail });
    setUpdating(false);

    if (updateErr) {
      showToast(updateErr.message, 'error', 'Email Update Failed');
      return;
    }

    setOtpCode('');
    setNewEmail('');
    setConfirmEmail('');
    setCodeSent(false);
    handleEmailUpdated(targetEmail);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AuthHeader
        title="Change Email"
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
          <Text style={[styles.cardTitle, { color: colors.text }]}>Update your account email</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Current email: {currentEmail || 'Not available'}</Text>

          <AuthInfoBox
            iconColor={colors.accent}
            backgroundColor={colors.accentLight}
            borderColor={colors.accent + '40'}
            textColor={colors.textSecondary}
          >
              Pending verification: Supabase may require email confirmation from your inbox.
              Your new email is fully active only after you confirm that email link/code.
          </AuthInfoBox>

          <AuthModeSwitch
            value={mode}
            options={[
              { value: 'with-password', label: 'Use current password' },
              { value: 'forgot-password', label: 'Forgot current password' },
            ]}
            onChange={(next) => setMode(next as Mode)}
            accentColor={colors.accent}
            textColor={colors.text}
            mutedTextColor={colors.textSecondary}
            backgroundColor={colors.inputBackground}
          />

          {mode === 'with-password' ? (
            <>
              <View style={styles.fieldWrap}>
                <AuthFieldLabel text="Current password" color={colors.textSecondary} />
                <AuthInputContainer backgroundColor={colors.inputBackground} borderColor={colors.border}>
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor={colors.textTertiary}
                    style={[styles.input, { color: colors.text }]}
                    secureTextEntry={hideCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeToggleBtn}
                    onPress={() => setHideCurrentPassword((prev) => !prev)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={hideCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </AuthInputContainer>
              </View>

              <EmailFields
                colors={colors}
                newEmail={newEmail}
                setNewEmail={setNewEmail}
                confirmEmail={confirmEmail}
                setConfirmEmail={setConfirmEmail}
                emailsMatch={emailsMatch}
                emailsMismatch={emailsMismatch}
              />

              <AuthActionButton
                label="Update Email"
                onPress={changeWithCurrentPassword}
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
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>Use a verification code from your current email to securely update your email address.</Text>

              <AuthActionButton
                label="Send Verification Code"
                onPress={sendForgotPasswordCode}
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
                  <View style={styles.fieldWrap}>
                    <AuthFieldLabel text="Verification code" color={colors.textSecondary} />
                    <AuthInputContainer backgroundColor={colors.inputBackground} borderColor={colors.border}>
                      <TextInput
                        value={otpCode}
                        onChangeText={setOtpCode}
                        placeholder="Enter code from email"
                        placeholderTextColor={colors.textTertiary}
                        style={[styles.input, { color: colors.text }]}
                        keyboardType="number-pad"
                        autoCapitalize="none"
                      />
                    </AuthInputContainer>
                  </View>

                  <EmailFields
                    colors={colors}
                    newEmail={newEmail}
                    setNewEmail={setNewEmail}
                    confirmEmail={confirmEmail}
                    setConfirmEmail={setConfirmEmail}
                    emailsMatch={emailsMatch}
                    emailsMismatch={emailsMismatch}
                  />

                  <AuthActionButton
                    label="Verify & Update Email"
                    onPress={verifyCodeAndChangeEmail}
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

function EmailFields({
  colors,
  newEmail,
  setNewEmail,
  confirmEmail,
  setConfirmEmail,
  emailsMatch,
  emailsMismatch,
}: {
  colors: any;
  newEmail: string;
  setNewEmail: (v: string) => void;
  confirmEmail: string;
  setConfirmEmail: (v: string) => void;
  emailsMatch: boolean;
  emailsMismatch: boolean;
}) {
  return (
    <>
      <View style={styles.fieldWrap}>
        <AuthFieldLabel text="New email" color={colors.textSecondary} />
        <AuthInputContainer backgroundColor={colors.inputBackground} borderColor={colors.border}>
          <TextInput
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Enter new email"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text }]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </AuthInputContainer>
      </View>

      <View style={styles.fieldWrap}>
        <AuthFieldLabel text="Confirm new email" color={colors.textSecondary} />
        <AuthInputContainer backgroundColor={colors.inputBackground} borderColor={colors.border}>
          <TextInput
            value={confirmEmail}
            onChangeText={setConfirmEmail}
            placeholder="Re-enter new email"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text }]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </AuthInputContainer>
      </View>

      {emailsMatch ? (
        <View style={styles.hintRow}>
          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
          <Text style={[styles.hintText, { color: '#16A34A' }]}>Emails match</Text>
        </View>
      ) : null}

      {emailsMismatch ? (
        <View style={styles.hintRow}>
          <Ionicons name="close-circle" size={16} color={colors.error} />
          <Text style={[styles.hintText, { color: colors.error }]}>Emails do not match</Text>
        </View>
      ) : null}
    </>
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
