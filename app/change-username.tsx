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
  AuthInputContainer,
  AuthModeSwitch,
} from '../src/components/auth/AuthUI';
import {
  checkUsernameAvailability,
  isUsernameFormatValid,
  normalizeUsernameInput,
  suggestUniqueUsername,
} from '../src/utils/username';
import { isValidOtpCode, sendEmailOtpCode, verifyEmailOtpCode } from '../src/services/emailOtpService';

type Mode = 'with-password' | 'forgot-password';

export default function ChangeUsernameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { toast, showToast } = useToast();

  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [mode, setMode] = useState<Mode>('with-password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [confirmUsername, setConfirmUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [availabilityState, setAvailabilityState] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [autoSuggestion, setAutoSuggestion] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [hideCurrentPassword, setHideCurrentPassword] = useState(true);
  const availabilityRequestId = useRef(0);
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
  const currentUsername = profile?.username?.trim() ?? '';

  const normalizedNew = normalizeUsernameInput(newUsername);
  const normalizedConfirm = normalizeUsernameInput(confirmUsername);
  const usernamesMatch =
    confirmUsername.length > 0 && normalizedNew.length > 0 && normalizedNew === normalizedConfirm;
  const usernamesMismatch =
    confirmUsername.length > 0 && normalizedNew.length > 0 && normalizedNew !== normalizedConfirm;

  useEffect(() => {
    if (!normalizedNew) {
      setAvailabilityState('idle');
      setAutoSuggestion('');
      return;
    }

    if (!isUsernameFormatValid(normalizedNew)) {
      setAvailabilityState('invalid');
      setAutoSuggestion('');
      return;
    }

    if (normalizedNew === currentUsername.toLowerCase()) {
      setAvailabilityState('invalid');
      setAutoSuggestion('');
      return;
    }

    const reqId = ++availabilityRequestId.current;
    setAvailabilityState('checking');
    const timer = setTimeout(async () => {
      const available = await checkUsernameAvailability(supabase, normalizedNew, { userId: profile?.id });
      if (reqId !== availabilityRequestId.current) return;

      if (available) {
        setAvailabilityState('available');
        setAutoSuggestion('');
        return;
      }

      setAvailabilityState('taken');
      const suggestion = await suggestUniqueUsername(supabase, normalizedNew, {
        userId: profile?.id,
        name: profile?.name,
        email,
      });
      if (reqId !== availabilityRequestId.current) return;
      setAutoSuggestion(suggestion !== normalizedNew ? suggestion : '');
    }, 350);

    return () => clearTimeout(timer);
  }, [normalizedNew, currentUsername, profile?.id, profile?.name, email]);

  const validateUsername = () => {
    if (!profile?.id) {
      showToast('Please login again to update username.', 'error', 'Not Logged In');
      return false;
    }

    if (!normalizedNew || !normalizedConfirm) {
      showToast('Please fill both username fields.', 'error', 'Validation');
      return false;
    }

    if (normalizedNew !== normalizedConfirm) {
      showToast('Both username fields must match.', 'error', 'Validation');
      return false;
    }

    if (!isUsernameFormatValid(normalizedNew)) {
      showToast('Username must be 3-20 chars, start with a letter, and use letters/numbers/_ only.', 'error', 'Invalid Username');
      return false;
    }

    if (normalizedNew === currentUsername.toLowerCase()) {
      showToast('New username must be different from current username.', 'error', 'Validation');
      return false;
    }

    return true;
  };

  const handleSuggest = async () => {
    setSuggesting(true);
    const suggestion = await suggestUniqueUsername(supabase, normalizedNew || currentUsername || 'foodie', {
      userId: profile?.id,
      name: profile?.name,
      email,
    });
    setSuggesting(false);
    setNewUsername(suggestion);
    setConfirmUsername(suggestion);
  };

  const persistUsername = async (username: string) => {
    if (!profile?.id) return { ok: false, message: 'Missing user profile.' };

    const { data: available, error: availabilityError } = await supabase.rpc('is_username_available', {
      p_username: username,
      p_user_id: profile.id,
    });

    if (availabilityError || available !== true) {
      const suggestion = await suggestUniqueUsername(supabase, username, {
        userId: profile.id,
        name: profile.name,
        email,
      });
      setNewUsername(suggestion);
      setConfirmUsername(suggestion);
      return { ok: false, message: `Username not available. Suggested: ${suggestion}` };
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ username })
      .eq('id', profile.id);

    if (updateError) {
      return { ok: false, message: updateError.message };
    }

    // Best-effort metadata sync for OAuth display names.
    await supabase.auth.updateUser({ data: { username } });

    updateProfile({ username });
    return { ok: true, message: 'Username updated successfully.' };
  };

  const completeAndRedirect = (message: string) => {
    if (successRedirectTimerRef.current) {
      clearTimeout(successRedirectTimerRef.current);
    }

    showToast(`${message} Redirecting...`, 'success', 'Done');
    successRedirectTimerRef.current = setTimeout(() => {
      router.replace('/settings' as any);
    }, 1400);
  };

  const changeWithCurrentPassword = async () => {
    if (!validateUsername()) return;
    if (!currentPassword.trim()) {
      showToast('Please enter your current password.', 'error', 'Validation');
      return;
    }
    if (!email) {
      showToast('No registered email found for this account.', 'error', 'Email Missing');
      return;
    }

    setUpdating(true);
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (verifyErr) {
      setUpdating(false);
      showToast('Current password is incorrect.', 'error', 'Authentication Failed');
      return;
    }

    const result = await persistUsername(normalizedNew);
    setUpdating(false);

    if (!result.ok) {
      showToast(result.message, 'error', 'Username Update Failed');
      return;
    }

    setCurrentPassword('');
    setNewUsername('');
    setConfirmUsername('');
    completeAndRedirect(result.message);
  };

  const sendForgotPasswordCode = async () => {
    if (!email) {
      showToast('No registered email found for this account.', 'error', 'Email Missing');
      return;
    }

    setSendingCode(true);
    const { error } = await sendEmailOtpCode(email);
    setSendingCode(false);

    if (error) {
      showToast(error.message, 'error', 'Could Not Send Code');
      return;
    }

    setCodeSent(true);
    showToast('Verification code sent. Enter the 6-digit code from your email.', 'success', 'Code Sent');
  };

  const verifyCodeAndChangeUsername = async () => {
    if (!validateUsername()) return;
    if (!otpCode.trim()) {
      showToast('Please enter the verification code.', 'error', 'Validation');
      return;
    }
    if (!isValidOtpCode(otpCode)) {
      showToast('Enter a valid 6-digit verification code.', 'error', 'Validation');
      return;
    }
    if (!email) {
      showToast('No registered email found for this account.', 'error', 'Email Missing');
      return;
    }

    setUpdating(true);
    const { error: verifyOtpErr } = await verifyEmailOtpCode(email, otpCode);

    if (verifyOtpErr) {
      setUpdating(false);
      showToast(verifyOtpErr.message, 'error', 'Invalid Code');
      return;
    }

    const result = await persistUsername(normalizedNew);
    setUpdating(false);

    if (!result.ok) {
      showToast(result.message, 'error', 'Username Update Failed');
      return;
    }

    setOtpCode('');
    setNewUsername('');
    setConfirmUsername('');
    setCodeSent(false);
    completeAndRedirect(result.message);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AuthHeader
        title="Change Username"
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
          <Text style={[styles.cardTitle, { color: colors.text }]}>Update your username</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Current username: {currentUsername || 'Not set'}</Text>

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

              <UsernameFields
                colors={colors}
                newUsername={newUsername}
                setNewUsername={setNewUsername}
                confirmUsername={confirmUsername}
                setConfirmUsername={setConfirmUsername}
                usernamesMatch={usernamesMatch}
                usernamesMismatch={usernamesMismatch}
                availabilityState={availabilityState}
                autoSuggestion={autoSuggestion}
                onUseAutoSuggestion={(value) => {
                  setNewUsername(value);
                  setConfirmUsername(value);
                }}
                onSuggest={handleSuggest}
                suggesting={suggesting}
              />

              <AuthActionButton
                label="Update Username"
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
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>Use a verification code from your registered email to securely update your username.</Text>

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

                  <UsernameFields
                    colors={colors}
                    newUsername={newUsername}
                    setNewUsername={setNewUsername}
                    confirmUsername={confirmUsername}
                    setConfirmUsername={setConfirmUsername}
                    usernamesMatch={usernamesMatch}
                    usernamesMismatch={usernamesMismatch}
                    availabilityState={availabilityState}
                    autoSuggestion={autoSuggestion}
                    onUseAutoSuggestion={(value) => {
                      setNewUsername(value);
                      setConfirmUsername(value);
                    }}
                    onSuggest={handleSuggest}
                    suggesting={suggesting}
                  />

                  <AuthActionButton
                    label="Verify & Update Username"
                    onPress={verifyCodeAndChangeUsername}
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

function UsernameFields({
  colors,
  newUsername,
  setNewUsername,
  confirmUsername,
  setConfirmUsername,
  usernamesMatch,
  usernamesMismatch,
  availabilityState,
  autoSuggestion,
  onUseAutoSuggestion,
  onSuggest,
  suggesting,
}: {
  colors: any;
  newUsername: string;
  setNewUsername: (v: string) => void;
  confirmUsername: string;
  setConfirmUsername: (v: string) => void;
  usernamesMatch: boolean;
  usernamesMismatch: boolean;
  availabilityState: 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
  autoSuggestion: string;
  onUseAutoSuggestion: (value: string) => void;
  onSuggest: () => void;
  suggesting: boolean;
}) {
  return (
    <>
      <View style={styles.fieldWrap}>
        <AuthFieldLabel text="New username" color={colors.textSecondary} />
        <AuthInputContainer backgroundColor={colors.inputBackground} borderColor={colors.border}>
          <TextInput
            value={newUsername}
            onChangeText={(v) => setNewUsername(normalizeUsernameInput(v))}
            placeholder="e.g. foodie_raj"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
        </AuthInputContainer>
      </View>

      <View style={styles.fieldWrap}>
        <AuthFieldLabel text="Confirm new username" color={colors.textSecondary} />
        <AuthInputContainer backgroundColor={colors.inputBackground} borderColor={colors.border}>
          <TextInput
            value={confirmUsername}
            onChangeText={(v) => setConfirmUsername(normalizeUsernameInput(v))}
            placeholder="Re-enter username"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
        </AuthInputContainer>
      </View>

      {availabilityState !== 'idle' && (
        <View style={styles.availabilityWrap}>
          {availabilityState === 'checking' && (
            <Text style={[styles.availabilityText, { color: colors.textSecondary }]}>Checking availability...</Text>
          )}
          {availabilityState === 'available' && (
            <Text style={[styles.availabilityText, { color: '#16A34A' }]}>Username available</Text>
          )}
          {availabilityState === 'invalid' && (
            <Text style={[styles.availabilityText, { color: colors.error }]}>Username format invalid or same as current</Text>
          )}
          {availabilityState === 'taken' && (
            <Text style={[styles.availabilityText, { color: colors.error }]}>Username already taken</Text>
          )}
          {!!autoSuggestion && (
            <TouchableOpacity
              style={[styles.inlineSuggestionBtn, { borderColor: colors.accent }]}
              onPress={() => onUseAutoSuggestion(autoSuggestion)}
            >
              <Text style={[styles.suggestionInlineText, { color: colors.accent }]}>Use suggestion: {autoSuggestion}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.suggestButton, { backgroundColor: colors.accentLight }]}
        onPress={onSuggest}
        disabled={suggesting}
      >
        {suggesting ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text style={[styles.suggestButtonText, { color: colors.accent }]}>Generate username</Text>
        )}
      </TouchableOpacity>

      {usernamesMatch ? (
        <View style={styles.hintRow}>
          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
          <Text style={[styles.hintText, { color: '#16A34A' }]}>Usernames match</Text>
        </View>
      ) : null}

      {usernamesMismatch ? (
        <View style={styles.hintRow}>
          <Ionicons name="close-circle" size={16} color={colors.error} />
          <Text style={[styles.hintText, { color: colors.error }]}>Usernames do not match</Text>
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
  suggestButton: {
    height: 38,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.base,
  },
  suggestButtonText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  availabilityWrap: {
    marginTop: -2,
    gap: 2,
  },
  availabilityText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  inlineSuggestionBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  suggestionInlineText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: Typography.fontSize.sm,
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
