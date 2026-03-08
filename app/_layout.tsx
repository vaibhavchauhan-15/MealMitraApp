import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../src/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

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
