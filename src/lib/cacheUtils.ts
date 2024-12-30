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
  ttl: number = cacheTTL,
): void {
  const now = Date.now();

  // Mevcut timer varsa temizle
  if (cache[key]?.timer) {
    clearTimeout(cache[key].timer!);
  }

  // Cache süresi dolduğunda otomatik olarak silinmesi için timer
  const timer = setTimeout(() => {
    delete cache[key];
    if (isDev) {
      console.log(`[Cache Expired] ${key}`);
    }
  }, ttl);

  // Cache'e kaydet
  cache[key] = {
    value,
    expiry: now + ttl,
    timer,
  };

  if (isDev) {
    console.log(`[Cache Set] ${key} - Expires at ${new Date(now + ttl).toISOString()}`);
  }
}

export function getCache<T>(key: string, cache: { [key: string]: CacheEntry<T> }): T | null {
  const entry = cache[key];

  if (!entry) {
    if (isDev) {
      console.log(`[Cache Miss] ${key}`);
    }
    return null;
  }

  const now = Date.now();
  if (entry.expiry < now) {
    delete cache[key];
    if (isDev) {
      console.log(`[Cache Expired] ${key}`);
    }
    return null;
  }

  if (isDev) {
    console.log(`[Cache Hit] ${key}`);
  }
  return entry.value;
}
