import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from './index';
import { useUserStore } from '../store/userStore';

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const scheme = useColorScheme();
  const themePreference = useUserStore((s) => s.themePreference);
  const isDark =
    themePreference === 'dark' ? true :
    themePreference === 'light' ? false :
    scheme === 'dark';
  return {
    colors: isDark ? Colors.dark : Colors.light,
    isDark,
  };
}
