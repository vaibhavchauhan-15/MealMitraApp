import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useLocalRecentSearches(storageKey: string, maxItems = 8) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (cancelled) return;
        if (!raw) {
          setRecentSearches([]);
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setRecentSearches(
              parsed
                .map((item) => String(item).trim())
                .filter(Boolean)
                .slice(0, maxItems)
            );
          } else {
            setRecentSearches([]);
          }
        } catch {
          setRecentSearches([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRecent(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storageKey, maxItems]);

  const persist = useCallback(
    async (next: string[]) => {
      setRecentSearches(next);
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    },
    [storageKey]
  );

  const addRecentSearch = useCallback(
    async (rawValue: string) => {
      const value = rawValue.trim();
      if (!value) return;
      const lowered = value.toLowerCase();
      const next = [
        value,
        ...recentSearches.filter((item) => item.toLowerCase() !== lowered),
      ].slice(0, maxItems);
      await persist(next);
    },
    [recentSearches, maxItems, persist]
  );

  const clearRecentSearches = useCallback(async () => {
    await persist([]);
  }, [persist]);

  return {
    recentSearches,
    loadingRecent,
    addRecentSearch,
    clearRecentSearches,
  };
}
