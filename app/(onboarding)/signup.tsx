import React, { useEffect, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../../src/theme';
import { useUserStore } from '../../src/store/userStore';
import { supabase } from '../../src/services/supabase';
import { PROFILE_ICON_OPTIONS } from '../../src/constants/profileIcons';
import { shouldForceProfileSetup } from '../../src/utils/profileCompletion';
import {
  checkUsernameAvailability,
  isUsernameFormatValid,
  normalizeUsernameInput,
  suggestUniqueUsername,
} from '../../src/utils/username';
import {
  AuthActionButton,
  AuthAnimatedView,
  AuthCard,
  AuthFieldLabel,
  AuthInputContainer,
} from '../../src/components/auth/AuthUI';
import {
  completeSignupWithOtp,
  isValidSignupOtpCode,
  requestSignupOtp,
} from '../../src/services/signupOtpService';

export default function SignupScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { hydrateFromAuthUser } = useUserStore();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarIcon, setAvatarIcon] = useState(PROFILE_ICON_OPTIONS[0].id);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [suggestingUsername, setSuggestingUsername] = useState(false);
  const [availabilityState, setAvailabilityState] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [autoSuggestion, setAutoSuggestion] = useState('');
  const availabilityRequestId = useRef(0);
  const { toast, showToast } = useToast();
  const selectedIcon = PROFILE_ICON_OPTIONS.find((item) => item.id === avatarIcon);

  useEffect(() => {
    const normalized = normalizeUsernameInput(username);

    if (!normalized) {
      setAvailabilityState('idle');
      setAutoSuggestion('');
      return;
    }

    if (!isUsernameFormatValid(normalized)) {
      setAvailabilityState('invalid');
      setAutoSuggestion('');
      return;
    }

    const reqId = ++availabilityRequestId.current;
    setAvailabilityState('checking');
    const timer = setTimeout(async () => {
      const available = await checkUsernameAvailability(supabase, normalized);
      if (reqId !== availabilityRequestId.current) return;

      if (available) {
        setAvailabilityState('available');
        setAutoSuggestion('');
        return;
      }

      setAvailabilityState('taken');
      const suggestion = await suggestUniqueUsername(supabase, normalized, { name, email });
      if (reqId !== availabilityRequestId.current) return;
      setAutoSuggestion(suggestion !== normalized ? suggestion : '');
    }, 350);

    return () => clearTimeout(timer);
  }, [username, name, email]);

  const handleSuggestUsername = async () => {
    setSuggestingUsername(true);
    const suggestion = await suggestUniqueUsername(supabase, username, {
      name,
      email,
    });
    setSuggestingUsername(false);
    setUsername(suggestion);
  };

  const sendSignupCode = async () => {
    setSendingCode(true);
    const { error: otpErr } = await requestSignupOtp(email);
    setSendingCode(false);

    if (otpErr) {
      showToast(otpErr.message, 'error', 'Could Not Send Code');
      return false;
    }

    setCodeSent(true);
    showToast('Verification code sent. Enter the 6-digit code from your email.', 'success', 'Code Sent');
    return true;
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !username.trim()) {
      showToast('Please fill in all fields.', 'error', 'Error');
      return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters.', 'error', 'Error');
      return;
    }

    const normalizedUsername = normalizeUsernameInput(username);
    if (!isUsernameFormatValid(normalizedUsername)) {
      showToast('Username must be 3-20 chars, start with a letter, and use letters/numbers/_ only.', 'error', 'Invalid Username');
      return;
    }

    const uniqueUsername = await suggestUniqueUsername(supabase, normalizedUsername, {
      name,
      email,
    });

    if (uniqueUsername !== normalizedUsername) {
      setLoading(false);
      setUsername(uniqueUsername);
      showToast(`Username taken. Suggested: ${uniqueUsername}`, 'info', 'Try Suggested Username');
      return;
    }

    if (!codeSent) {
      await sendSignupCode();
      return;
    }

    if (!isValidSignupOtpCode(otpCode)) {
      showToast('Enter a valid 6-digit verification code.', 'error', 'Validation');
      return;
    }

    setLoading(true);
    const { error: completeErr } = await completeSignupWithOtp({
      email,
      code: otpCode,
      password,
      name,
      username: uniqueUsername,
      avatarIcon,
    });

    if (completeErr) {
      setLoading(false);
      showToast(completeErr.message, 'error', 'Sign Up Failed');
      return;
    }

    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });
    setLoading(false);

    if (signInErr || !signInData.user) {
      showToast(signInErr?.message ?? 'Account created. Please sign in.', 'info', 'Account Created');
      router.replace('/(onboarding)/login' as any);
      return;
    }

    await hydrateFromAuthUser(signInData.user);
    const hydratedProfile = useUserStore.getState().profile;
    if (shouldForceProfileSetup(hydratedProfile)) {
      router.replace('/(onboarding)/profile-setup' as any);
      return;
    }
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

        <AuthAnimatedView delay={20} style={styles.hero}>
          <Image source={require('../../assets/logo/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join thousands of home cooks
          </Text>
        </AuthAnimatedView>

        <AuthAnimatedView delay={80}>
        <AuthCard backgroundColor={colors.surface} borderColor={colors.border} style={styles.formCard}> 
          <AuthFieldLabel text="Full name" color={colors.textSecondary} />
          <AuthInputContainer backgroundColor={colors.inputBackground}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Full name"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </AuthInputContainer>

          <AuthFieldLabel text="Username" color={colors.textSecondary} />
          <AuthInputContainer backgroundColor={colors.inputBackground}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Username (e.g. foodie_raj)"
              placeholderTextColor={colors.textTertiary}
              value={username}
              onChangeText={(value) => setUsername(normalizeUsernameInput(value))}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
          </AuthInputContainer>
          {availabilityState !== 'idle' && (
            <View style={styles.availabilityWrap}>
              {availabilityState === 'checking' && (
                <Text style={[styles.availabilityText, { color: colors.textSecondary }]}>Checking availability...</Text>
              )}
              {availabilityState === 'available' && (
                <Text style={[styles.availabilityText, { color: '#16A34A' }]}>Username available</Text>
              )}
              {availabilityState === 'invalid' && (
                <Text style={[styles.availabilityText, { color: colors.error }]}>Use 3-20 chars, start with letter, only letters/numbers/_</Text>
              )}
              {availabilityState === 'taken' && (
                <Text style={[styles.availabilityText, { color: colors.error }]}>Username already taken</Text>
              )}
              {!!autoSuggestion && (
                <TouchableOpacity
                  style={[styles.inlineSuggestionBtn, { borderColor: colors.accent }]}
                  onPress={() => setUsername(autoSuggestion)}
                >
                  <Text style={[styles.suggestionInlineText, { color: colors.accent }]}>Use suggestion: {autoSuggestion}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.quickSuggestBtn, { backgroundColor: colors.accentLight }]}
            onPress={handleSuggestUsername}
            disabled={suggestingUsername}
          >
            {suggestingUsername ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[styles.quickSuggestText, { color: colors.accent }]}>Generate username</Text>
            )}
          </TouchableOpacity>

          <AuthFieldLabel text="Email" color={colors.textSecondary} />
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

          <AuthFieldLabel text="Password" color={colors.textSecondary} />
          <AuthInputContainer backgroundColor={colors.inputBackground}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password (min 8 characters)"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </AuthInputContainer>

          {codeSent && (
            <>
              <AuthFieldLabel text="Email verification code" color={colors.textSecondary} />
              <AuthInputContainer backgroundColor={colors.inputBackground}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="6-digit code"
                  placeholderTextColor={colors.textTertiary}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </AuthInputContainer>

              <TouchableOpacity
                style={[styles.quickSuggestBtn, { backgroundColor: colors.accentLight }]}
                onPress={sendSignupCode}
                disabled={sendingCode || loading}
              >
                {sendingCode ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Text style={[styles.quickSuggestText, { color: colors.accent }]}>Resend code</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <View style={styles.iconHeaderRow}>
            <Text style={[styles.iconPickerTitle, { color: colors.text }]}>Profile icon</Text>
            <View style={styles.selectedBadge}>
              <Ionicons name={selectedIcon?.icon ?? 'person-outline'} size={13} color={colors.accent} />
              <Text style={[styles.selectedBadgeText, { color: colors.accent }]}>{selectedIcon?.label ?? 'Selected'}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScroller}>
            <View style={styles.iconGrid}>
              {PROFILE_ICON_OPTIONS.map((option) => {
                const active = avatarIcon === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.iconChoice,
                      {
                        borderColor: active ? colors.accent : colors.border,
                        backgroundColor: active ? colors.accentLight : colors.inputBackground,
                      },
                    ]}
                    onPress={() => setAvatarIcon(option.id)}
                  >
                    <Ionicons name={option.icon} size={19} color={active ? colors.accent : option.color} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <AuthActionButton
            label={codeSent ? 'Verify & Create Account' : 'Send Verification Code'}
            onPress={handleSignup}
            loading={loading || sendingCode}
            disabled={loading || sendingCode}
            variant="primary"
            color={colors.accent}
            textColor="#FFF"
            style={styles.primaryBtn}
          />
        </AuthCard>
        </AuthAnimatedView>

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
  backBtn: { alignSelf: 'flex-start' },
  hero: {
    gap: 6,
    marginBottom: 2,
  },
  logo: { width: 64, height: 64, alignSelf: 'center', marginBottom: Spacing.xs },
  backText: { fontSize: Typography.fontSize.base, fontWeight: '600' },
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
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  quickSuggestBtn: {
    height: 38,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.base,
  },
  quickSuggestText: {
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
  iconHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  iconPickerTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  iconScroller: {
    paddingVertical: 6,
  },
  iconGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  iconChoice: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimer: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
});
