import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useUserStore } from '../src/store/userStore';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../src/theme/useTheme';

export default function Index() {
  const router = useRouter();
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasOnboarded) {
        router.replace('/(tabs)' as any);
      } else {
        router.replace('/(onboarding)' as any);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [hasOnboarded]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}
