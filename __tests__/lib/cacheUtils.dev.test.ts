describe('cacheUtils (dev logging branches)', () => {
  it('covers dev-only logging paths', () => {
    jest.resetModules();
    jest.doMock('@/config/constants', () => ({
      cacheTTL: 100,
      isDev: true,
    }));

    jest.isolateModules(() => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const { setCache, getCache } = require('@/lib/cacheUtils');

      const cache = {
        stale: {
          value: 'old',
          expiry: Date.now() - 1,
        },
      } as Record<string, { value: string; expiry: number }>;

      setCache('fresh', 'value', cache, 'metrics', 500);
      expect(getCache('fresh', cache, 'metrics')).toBe('value');
      expect(getCache('missing', cache, 'metrics')).toBeNull();

      cache.fresh.expiry = Date.now() - 1;
      expect(getCache('fresh', cache, 'metrics')).toBeNull();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
