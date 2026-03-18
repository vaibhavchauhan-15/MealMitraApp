import { Stack, useRouter } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Colors } from '../src/theme';
import { useEffect, useMemo } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { supabase } from '../src/services/supabase';
import { useUserStore } from '../src/store/userStore';
import { usePlannerStore } from '../src/store/plannerStore';
import { useRecipeStore } from '../src/store/recipeStore';
import { useSavedStore } from '../src/store/savedStore';
import { shouldForceProfileSetup } from '../src/utils/profileCompletion';
import {
  startInteractionNotificationBridge,
  stopInteractionNotificationBridge,
} from '../src/services/interactionNotificationService';
import { GlobalNotificationBell } from '../src/components/notifications/GlobalNotificationBell';
import { Toast } from '../src/components/Toast';
import { useInteractionNotificationStore } from '../src/store/interactionNotificationStore';
import { useToast } from '../src/hooks/useToast';

// expo-notifications remote push is not available in Expo Go (SDK 53+).
// Load the module only when running in a real/dev build.
const isExpoGo = Constants.appOwnership === 'expo';
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const { hydrateFromAuthUser, syncFromSupabase: syncUser } = useUserStore();
  const syncPlanner = usePlannerStore((s) => s.syncFromSupabase);
  const loadRecipes = useRecipeStore((s) => s.loadInitialData);
  const syncRecipes = useRecipeStore((s) => s.syncAiRecipesFromSupabase);
  const syncRecentSearches = useRecipeStore((s) => s.syncRecentSearchesFromSupabase);
  const syncRecentlyViewed = useRecipeStore((s) => s.syncRecentlyViewedFromSupabase);
  const syncSaved = useSavedStore((s) => s.syncFromSupabase);
  const incomingSequence = useInteractionNotificationStore((s) => s.incomingSequence);
  const latestIncoming = useInteractionNotificationStore((s) => s.latestIncoming);
  const clearLatestIncoming = useInteractionNotificationStore((s) => s.clearLatestIncoming);
  const { toast, showToast } = useToast();

  const latestIncomingMessage = useMemo(
    () => latestIncoming?.message?.trim() ?? '',
    [latestIncoming?.id, latestIncoming?.message]
  );

  // Sync all Supabase-backed stores once on mount (session may already exist)
  useEffect(() => {
    syncUser({ force: true });
    syncPlanner({ force: true });
    loadRecipes();
    syncRecipes();
    syncRecentSearches();
    syncRecentlyViewed();
    syncSaved({ force: true });
    void startInteractionNotificationBridge((url) => {
      void handleDeepLink(url);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-sync after session becomes available (handles app restarts where
  // the session loads asynchronously after the initial mount effect runs)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Safety guard: clear auth-coupled cached state as soon as session is gone.
        usePlannerStore.setState({ meals: [], syncStatus: 'idle', lastSyncedAt: null });
        useSavedStore.setState({ savedIds: [], savedBySource: {}, lastCloudSyncAt: null });
        useRecipeStore.setState({ aiRecipes: [], recentlyViewed: [], recentSearches: [] });
        useUserStore.setState({ profile: null, hasOnboarded: false, lastCloudSyncAt: null });
        stopInteractionNotificationBridge();
        router.replace('/(onboarding)' as any);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        syncPlanner({ force: true });
        syncSaved({ force: true });
        syncUser({ force: true });
        syncRecipes();
        syncRecentSearches();
        syncRecentlyViewed();
        void startInteractionNotificationBridge((url) => {
          void handleDeepLink(url);
        });
      }
    });
    return () => {
      subscription.unsubscribe();
      stopInteractionNotificationBridge();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isExpoGo) return; // Local notifications work in dev builds only
    // Dynamically load expo-notifications to avoid Expo Go side-effect warnings
    (async () => {
      const Notifs = require('expo-notifications') as typeof import('expo-notifications');

      // Foreground notification handler (banners with sound)
      Notifs.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      const { status } = await Notifs.requestPermissionsAsync();
      if (status !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifs.setNotificationChannelAsync('cooking-timer', {
          name: 'Cooking Timer',
          importance: Notifs.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 500, 200, 500],
          lightColor: '#FF6B35',
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (!incomingSequence || !latestIncomingMessage) return;
    showToast(latestIncomingMessage, 'info', 'New activity');
    clearLatestIncoming();
  }, [incomingSequence, latestIncomingMessage, showToast, clearLatestIncoming]);

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
    const parsed = Linking.parse(url);
    const host = (parsed.hostname ?? '').toLowerCase();
    const path = String(parsed.path ?? '').replace(/^\/+/, '');

    if (host === 'recipe') {
      const recipeId = path.split('/')[0];
      if (recipeId) {
        const sourceParam = parsed.queryParams?.source;
        const source = sourceParam === 'ai' ? 'ai' : 'master';
        router.push({
          pathname: '/recipe/[id]',
          params: { id: recipeId, source },
        } as any);
      }
      return;
    }

    // Handle auth callbacks: mealmitra://auth/callback or mealmitra://auth/confirm
    const isAuthUrl =
      url.includes('auth/confirm') ||
      url.includes('auth/callback');
    if (!isAuthUrl) return;

    try {
      const parseParams = (str: string) => {
        const params: Record<string, string> = {};
        str.split('&').forEach((part) => {
          const [key, value] = part.split('=');
          if (key && value) params[key] = decodeURIComponent(value);
        });
        return params;
      };

      const fragment = url.includes('#') ? url.split('#')[1] : '';
      const queryString = url.includes('?') ? url.split('?')[1]?.split('#')[0] : '';
      const fragmentParams = parseParams(fragment);
      const queryParams = parseParams(queryString ?? '');

      const code = queryParams['code'] || fragmentParams['code'];
      const accessToken = fragmentParams['access_token'] || queryParams['access_token'];
      const refreshToken = fragmentParams['refresh_token'] || queryParams['refresh_token'];

      let user = null;

      if (code) {
        // PKCE flow — exchange code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);
        if (error) throw error;
        user = data.user;
      } else if (accessToken && refreshToken) {
        // Implicit flow — set session directly
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
        user = data.user;
      }

      if (user) {
        await hydrateFromAuthUser(user);
        const hydratedProfile = useUserStore.getState().profile;
        if (shouldForceProfileSetup(hydratedProfile)) {
          router.replace('/(onboarding)/profile-setup' as any);
          return;
        }
        router.replace('/(tabs)' as any);
      }
    } catch {
      // Silently ignore deep link errors — the login screen will show its own errors
    }
  };

  return (
    <>
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
        <Stack.Screen name="browse-ai-recipes" />
        <Stack.Screen name="browse-users" />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="public-ai-plan/[id]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="change-username" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="change-email" />
        <Stack.Screen name="help" />
        <Stack.Screen name="privacy" />
      </Stack>

      <GlobalNotificationBell />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} title={toast.title} />
    </>
  );
}
