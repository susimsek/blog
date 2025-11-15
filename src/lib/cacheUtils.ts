import { cacheTTL, isDev } from '@/config/constants';

export interface CacheEntry<T> {
  value: T;
  expiry: number;
}

const purgeExpiredEntries = <T>(cache: { [key: string]: CacheEntry<T> }, cacheName: string, now: number) => {
  Object.entries(cache).forEach(([cacheKey, entry]) => {
    if (entry.expiry < now) {
      delete cache[cacheKey];
      if (isDev) {
        console.log(`[Cache Purged] ${cacheName} - Key: ${cacheKey}`);
      }
    }
  });
};

export function setCache<T>(
  key: string,
  value: T,
  cache: { [key: string]: CacheEntry<T> },
  cacheName: string,
  ttl: number = cacheTTL,
): void {
  const now = Date.now();

  purgeExpiredEntries(cache, cacheName, now);

  cache[key] = {
    value,
    expiry: now + ttl,
  };

  if (isDev) {
    console.log(`[Cache Set] ${cacheName} - Key: ${key} - Expires at ${new Date(now + ttl).toISOString()}`);
  }
}

export function getCache<T>(key: string, cache: { [key: string]: CacheEntry<T> }, cacheName: string): T | null {
  const entry = cache[key];

  if (!entry) {
    if (isDev) {
      console.log(`[Cache Miss] ${cacheName} - Key: ${key}`);
    }
    return null;
  }

  const now = Date.now();
  if (entry.expiry < now) {
    delete cache[key];
    if (isDev) {
      console.log(`[Cache Expired] ${cacheName} - Key: ${key}`);
    }
    return null;
  }

  if (isDev) {
    console.log(`[Cache Hit] ${cacheName} - Key: ${key}`);
  }
  return entry.value;
}

export type CacheStore<T> = {
  name: string;
  store: { [key: string]: CacheEntry<T> };
  get: (key: string) => T | null;
  set: (key: string, value: T, ttl?: number) => void;
  delete: (key: string) => void;
  clear: () => void;
};

export const createCacheStore = <T>(name: string): CacheStore<T> => {
  const store: { [key: string]: CacheEntry<T> } = {};

  const deleteEntry = (key: string) => {
    delete store[key];
  };

  return {
    name,
    store,
    get: key => getCache(key, store, name),
    set: (key, value, ttl = cacheTTL) => setCache(key, value, store, name, ttl),
    delete: deleteEntry,
    clear: () => {
      Object.keys(store).forEach(deleteEntry);
    },
  };
};
