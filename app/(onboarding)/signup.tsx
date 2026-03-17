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
import * as Linking from 'expo-linking';
import { PROFILE_ICON_OPTIONS } from '../../src/constants/profileIcons';
import { shouldForceProfileSetup } from '../../src/utils/profileCompletion';
import {
  checkUsernameAvailability,
  isUsernameFormatValid,
  normalizeUsernameInput,
  suggestUniqueUsername,
} from '../../src/utils/username';

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
  const [suggestingUsername, setSuggestingUsername] = useState(false);
  const [availabilityState, setAvailabilityState] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [autoSuggestion, setAutoSuggestion] = useState('');
  const availabilityRequestId = useRef(0);
  const { toast, showToast } = useToast();

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

    setLoading(true);

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

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          name: name.trim(),
          username: uniqueUsername,
          avatar_icon: avatarIcon,
        },
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
    await hydrateFromAuthUser(user);
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
              placeholder="Username (e.g. foodie_raj)"
              placeholderTextColor={colors.textTertiary}
              value={username}
              onChangeText={(value) => setUsername(normalizeUsernameInput(value))}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
          </View>
          {availabilityState !== 'idle' && (
            <View style={styles.availabilityWrap}>
              {availabilityState === 'checking' && (
                <Text style={[styles.availabilityText, { color: colors.textSecondary }]}>Checking username...</Text>
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
                <TouchableOpacity onPress={() => setUsername(autoSuggestion)}>
                  <Text style={[styles.suggestionInlineText, { color: colors.accent }]}>Try: {autoSuggestion}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <TouchableOpacity
            style={[styles.suggestBtn, { borderColor: colors.border }]}
            onPress={handleSuggestUsername}
            disabled={suggestingUsername}
          >
            {suggestingUsername ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[styles.suggestBtnText, { color: colors.accent }]}>Suggest unique username</Text>
            )}
          </TouchableOpacity>
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

          <View>
            <Text style={[styles.iconPickerTitle, { color: colors.text }]}>Choose profile icon</Text>
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
                    <Ionicons name={option.icon} size={18} color={active ? colors.accent : option.color} />
                    <Text style={[styles.iconChoiceLabel, { color: colors.textSecondary }]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  suggestBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  availabilityWrap: {
    marginTop: -6,
    gap: 2,
  },
  availabilityText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  suggestionInlineText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  iconPickerTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconChoice: {
    width: '22%',
    minWidth: 64,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconChoiceLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
});
