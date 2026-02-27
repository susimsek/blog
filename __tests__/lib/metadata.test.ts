describe('metadata helpers', () => {
  const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH;
  const RealURL = URL;

  const loadMetadataModule = (basePath = '') => {
    process.env.NEXT_PUBLIC_BASE_PATH = basePath;
    jest.resetModules();
    let loaded: any;
    jest.isolateModules(() => {
      loaded = require('@/lib/metadata');
    });
    return loaded as typeof import('@/lib/metadata');
  };

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath;
    jest.resetModules();
    global.URL = RealURL;
  });

  it('builds site and absolute urls for empty and absolute inputs', () => {
    const metadata = loadMetadataModule('');

    expect(metadata.toAbsoluteSiteUrl('')).toMatch(/^https?:\/\//);
    expect(metadata.toAbsoluteSiteUrl('https://example.org/path')).toBe('https://example.org/path');
    expect(metadata.buildSitePath('about')).toBe('/about');
  });

  it('preserves already-prefixed paths when base path is configured', () => {
    const metadata = loadMetadataModule('/blog/');

    expect(metadata.buildSitePath('about')).toBe('/blog/about');
    expect(metadata.toAbsoluteSiteUrl('/blog/posts/test')).toMatch(/\/blog\/posts\/test$/);
  });

  it('falls back to string concatenation when URL construction fails in toAbsoluteSiteUrl', () => {
    const metadata = loadMetadataModule('');
    const urlMock = jest.fn((value: string, base?: string) => {
      if (!base) {
        throw new Error('invalid');
      }
      throw new Error('bad base/path');
    }) as unknown as typeof URL;
    // Force both isAbsoluteUrl() and final URL() path to fail.
    global.URL = urlMock;

    expect(metadata.toAbsoluteSiteUrl('/docs')).toMatch(/\/docs$/);
  });

  it('falls back to example.com when metadata base URL is invalid at runtime', () => {
    const metadata = loadMetadataModule('');
    const urlSpy = jest.fn((value: string) => {
      if (value === 'https://example.com') {
        return new RealURL(value);
      }
      throw new Error('invalid site url');
    }) as unknown as typeof URL;
    global.URL = urlSpy;

    expect(metadata.getMetadataBase().toString()).toBe('https://example.com/');
  });
});
