import { setCache, getCache, CacheEntry } from '@/lib/cacheUtils';

jest.mock('@/config/constants', () => ({
  cacheTTL: 100,
  isDev: false,
}));

describe('cacheUtils', () => {
  let setTimeoutSpy: jest.SpyInstance;
  let clearTimeoutSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
  });

  afterEach(() => {
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
    jest.useRealTimers();
  });

  it('stores and retrieves cached values', () => {
    const cache: Record<string, CacheEntry<number>> = {};

    setCache('stats', 42, cache, 'metrics', 500);

    expect(getCache('stats', cache, 'metrics')).toBe(42);
  });

  it('clears previous timers when setting the same key again', () => {
    const cache: Record<string, CacheEntry<string>> = {};

    setCache('user', 'first', cache, 'metrics', 500);
    const firstTimer = cache.user.timer;

    setCache('user', 'second', cache, 'metrics', 500);

    expect(clearTimeoutSpy).toHaveBeenCalledWith(firstTimer);
    expect(getCache('user', cache, 'metrics')).toBe('second');
  });

  it('expires cache entries after ttl and removes them', () => {
    const cache: Record<string, CacheEntry<string>> = {};

    setCache('session', 'value', cache, 'metrics', 100);

    jest.advanceTimersByTime(101);

    expect(cache.session).toBeUndefined();
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
