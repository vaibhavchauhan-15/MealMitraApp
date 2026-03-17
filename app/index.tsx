import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useUserStore } from '../src/store/userStore';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../src/theme/useTheme';
import { supabase } from '../src/services/supabase';
import { shouldForceProfileSetup } from '../src/utils/profileCompletion';

export default function Index() {
  const router = useRouter();
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  const profile = useUserStore((s) => s.profile);
  const hydrateFromAuthUser = useUserStore((s) => s.hydrateFromAuthUser);
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await hydrateFromAuthUser(session.user);
        const hydratedProfile = useUserStore.getState().profile;
        if (shouldForceProfileSetup(hydratedProfile)) {
          router.replace('/(onboarding)/profile-setup' as any);
          return;
        }
        router.replace('/(tabs)' as any);
      } else if (hasOnboarded && profile?.id === 'guest') {
        router.replace('/(tabs)' as any);
      } else {
        router.replace('/(onboarding)' as any);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [hasOnboarded, hydrateFromAuthUser, profile?.id, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}
