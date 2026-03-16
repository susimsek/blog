export {};

const withBasePathMock = jest.fn((value: string) => `/base${value}`);
const normalizeApiBaseUrlMock = jest.fn((value: string | undefined) => value?.trim().replace(/\/+$/g, '') ?? '');
const isLocalHttpOriginMock = jest.fn((value: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value));

jest.mock('@/lib/basePath', () => ({
  withBasePath: (value: string) => withBasePathMock(value),
}));

jest.mock('@/lib/graphql/apolloClient', () => ({
  normalizeApiBaseUrl: (value: string | undefined) => normalizeApiBaseUrlMock(value),
  isLocalHttpOrigin: (value: string) => isLocalHttpOriginMock(value),
}));

describe('commentAuthApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_DEV_API_ORIGIN;
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('uses the local dev api origin and normalizes session payloads', async () => {
    process.env.NEXT_PUBLIC_DEV_API_ORIGIN = 'http://localhost:9090/';
    isLocalHttpOriginMock.mockReturnValue(true);

    const { fetchCommentAuthSession } = await import('@/lib/commentAuthApi');
    const fetchMock = jest.mocked(global.fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: 1,
        providers: {
          google: 'yes',
          github: 0,
        },
        viewer: {
          id: 'viewer-1',
          name: 'Alice',
          email: 'alice@example.com',
          avatarUrl: 'https://example.com/alice.png',
        },
      }),
    } as Response);

    await expect(fetchCommentAuthSession()).resolves.toEqual({
      authenticated: true,
      providers: {
        google: true,
        github: false,
      },
      viewer: {
        id: 'viewer-1',
        name: 'Alice',
        email: 'alice@example.com',
        avatarUrl: 'https://example.com/alice.png',
      },
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:9090/api/reader-auth/session', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept-Language': 'en',
      },
    });
  });

  it('falls back to the configured base url or base path and handles non-ok responses', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com///';
    isLocalHttpOriginMock.mockReturnValue(false);

    const { fetchCommentAuthSession, logoutCommentViewer } = await import('@/lib/commentAuthApi');
    const fetchMock = jest.mocked(global.fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
      } as Response);

    await expect(fetchCommentAuthSession()).resolves.toBeNull();
    await expect(logoutCommentViewer()).resolves.toBe(true);

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://api.example.com/api/reader-auth/session', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept-Language': 'en',
      },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://api.example.com/api/reader-auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    fetchMock.mockResolvedValueOnce({
      ok: false,
    } as Response);

    await expect(logoutCommentViewer()).resolves.toBe(false);
    expect(fetchMock).toHaveBeenLastCalledWith('/base/api/reader-auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    expect(withBasePathMock).toHaveBeenCalledWith('/api/reader-auth/logout');
  });

  it('builds the oauth redirect URL with normalized locale and rememberMe flag', async () => {
    const { beginCommentOAuthLogin } = await import('@/lib/commentAuthApi');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => beginCommentOAuthLogin('github', ' TR ', '/tr/posts/test?draft=true', false)).not.toThrow();

    expect(withBasePathMock).toHaveBeenCalledWith('/api/reader-github/connect');
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
