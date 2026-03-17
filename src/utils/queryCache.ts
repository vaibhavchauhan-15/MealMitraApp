import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'query-cache:';

interface CacheEnvelope<T> {
  value: T;
  expiresAt: number;
  storedAt: number;
}

const memoryCache = new Map<string, CacheEnvelope<unknown>>();

function toStorageKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

function now(): number {
  return Date.now();
}

function isFresh(expiresAt: number): boolean {
  return expiresAt > now();
}

export async function getCachedOrFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  options?: { forceRefresh?: boolean }
): Promise<T> {
  const forceRefresh = options?.forceRefresh ?? false;
  const normalizedKey = key.trim();

  if (!normalizedKey) {
    return fetcher();
  }

  if (!forceRefresh) {
    const inMemory = memoryCache.get(normalizedKey) as CacheEnvelope<T> | undefined;
    if (inMemory && isFresh(inMemory.expiresAt)) {
      return inMemory.value;
    }

    try {
      const raw = await AsyncStorage.getItem(toStorageKey(normalizedKey));
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEnvelope<T>;
        if (parsed && isFresh(parsed.expiresAt)) {
          memoryCache.set(normalizedKey, parsed as CacheEnvelope<unknown>);
          return parsed.value;
        }
      }
    } catch {
      // Ignore cache parse/storage errors and continue with network fetch.
    }
  }

  const freshValue = await fetcher();
  const envelope: CacheEnvelope<T> = {
    value: freshValue,
    expiresAt: now() + Math.max(0, ttlMs),
    storedAt: now(),
  };

  memoryCache.set(normalizedKey, envelope as CacheEnvelope<unknown>);
  try {
    await AsyncStorage.setItem(toStorageKey(normalizedKey), JSON.stringify(envelope));
  } catch {
    // Ignore storage write errors; caller still gets fresh data.
  }

  return freshValue;
}

export async function invalidateCache(keyOrPrefix: string): Promise<void> {
  const normalized = keyOrPrefix.trim();
  if (!normalized) return;

  const fullKey = toStorageKey(normalized);
  const prefixKey = toStorageKey(normalized);

  if (memoryCache.has(normalized)) {
    memoryCache.delete(normalized);
  }

  try {
    await AsyncStorage.removeItem(fullKey);
  } catch {
    // Ignore and continue with prefix invalidation.
  }

  try {
    const keys = await AsyncStorage.getAllKeys();
    const matches = keys.filter((k) => k.startsWith(prefixKey));
    if (matches.length > 0) {
      await AsyncStorage.multiRemove(matches);
      matches.forEach((k) => {
        const normalizedKey = k.replace(CACHE_PREFIX, '');
        memoryCache.delete(normalizedKey);
      });
    }
  } catch {
    // Ignore cache cleanup errors.
  }
}
