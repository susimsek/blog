import { setCache, getCache, createCacheStore, CacheEntry } from '@/lib/cacheUtils';

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

  it('returns null on cache miss', () => {
    const cache: Record<string, CacheEntry<string>> = {};
    expect(getCache('unknown', cache, 'metrics')).toBeNull();
  });

  it('supports createCacheStore helpers', () => {
    const store = createCacheStore<string>('sample');

    expect(store.get('a')).toBeNull();

    store.set('a', '1', 1000);
    expect(store.get('a')).toBe('1');

    store.delete('a');
    expect(store.get('a')).toBeNull();

    store.set('a', '1', 1000);
    store.set('b', '2', 1000);
    store.clear();
    expect(store.get('a')).toBeNull();
    expect(store.get('b')).toBeNull();
  });
});
