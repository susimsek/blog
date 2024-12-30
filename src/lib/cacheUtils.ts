import { cacheTTL, isDev } from '@/config/constants';

export interface CacheEntry<T> {
  value: T;
  expiry: number;
  timer?: NodeJS.Timeout;
}

export function setCache<T>(
  key: string,
  value: T,
  cache: { [key: string]: CacheEntry<T> },
  cacheName: string,
  ttl: number = cacheTTL,
): void {
  const now = Date.now();

  if (cache[key]?.timer) {
    clearTimeout(cache[key].timer!);
  }

  const timer = setTimeout(() => {
    delete cache[key];
    if (isDev) {
      console.log(`[Cache Expired] ${cacheName} - Key: ${key}`);
    }
  }, ttl);

  cache[key] = {
    value,
    expiry: now + ttl,
    timer,
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
