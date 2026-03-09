import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../src/theme';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '../src/services/supabase';
import { useUserStore } from '../src/store/userStore';

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const { setProfile, setHasOnboarded } = useUserStore();

  useEffect(() => {
    // Handle deep link when the app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle deep link that launched the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  const handleDeepLink = async (url: string) => {
    // Accept both custom scheme (standalone) and exp:// (Expo Go)
    // URLs look like: mealmitra://auth/confirm#... or exp://IP:PORT/--/auth/confirm#...
    const isAuthUrl = url.includes('/auth/confirm') || url.includes('/auth/callback');
    if (!isAuthUrl) return;

    // Supabase appends tokens as a fragment: mealmitra://auth/confirm#access_token=...&refresh_token=...
    // expo-linking parses the fragment into queryParams on some platforms, so handle both
    const parsed = Linking.parse(url);

    // Try fragment parsing manually
    const fragment = url.includes('#') ? url.split('#')[1] : '';
    const params: Record<string, string> = {};
    fragment.split('&').forEach((part) => {
      const [key, value] = part.split('=');
      if (key && value) params[key] = decodeURIComponent(value);
    });

    const accessToken = params['access_token'] || (parsed.queryParams?.access_token as string);
    const refreshToken = params['refresh_token'] || (parsed.queryParams?.refresh_token as string);

    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!error && data.user) {
        const user = data.user;
        setProfile({
          id: user.id,
          name: user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User',
          email: user.email ?? '',
          avatar: user.user_metadata?.avatar_url ?? undefined,
          favoriteCuisines: [],
          cookingLevel: 'Beginner',
        });
        setHasOnboarded(true);
        router.replace('/(tabs)' as any);
      }
    }
  };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="recipe/[id]" />
      <Stack.Screen
        name="recipe/cooking/[id]"
        options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
      />
      <Stack.Screen name="category/[name]" />
      <Stack.Screen name="recently-viewed" />
      <Stack.Screen name="my-recipes" />
      <Stack.Screen name="upload-recipe" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
      <Stack.Screen name="privacy" />
    </Stack>
  );
}
