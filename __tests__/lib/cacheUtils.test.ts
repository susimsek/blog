import { setCache, getCache, CacheEntry } from '@/lib/cacheUtils';

jest.mock('@/config/constants', () => ({
  cacheTTL: 100,
  isDev: false,
}));

describe('cacheUtils', () => {
  it('stores and retrieves cached values', () => {
    const cache: Record<string, CacheEntry<number>> = {};

    setCache('stats', 42, cache, 'metrics', 500);

    expect(getCache('stats', cache, 'metrics')).toBe(42);
  });

  it('purges expired entries when setting a new value', () => {
    const cache: Record<string, CacheEntry<string>> = {
      stale: {
        value: 'old',
        expiry: Date.now() - 1,
      },
    };

    setCache('fresh', 'value', cache, 'metrics', 500);

    expect(cache.stale).toBeUndefined();
    expect(getCache('fresh', cache, 'metrics')).toBe('value');
  });

  it('getCache removes expired entries immediately', () => {
    const cache: Record<string, CacheEntry<string>> = {
      stale: {
        value: 'old',
        expiry: Date.now() - 1,
      },
    };

    expect(getCache('stale', cache, 'metrics')).toBeNull();
    expect(cache.stale).toBeUndefined();
  });
});
