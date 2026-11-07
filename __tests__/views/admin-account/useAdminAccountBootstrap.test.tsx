import { act, renderHook, waitFor } from '@testing-library/react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { TFunction } from 'i18next';
import {
  fetchAdminActiveSessions,
  fetchAdminGithubAuthStatus,
  fetchAdminGoogleAuthStatus,
  fetchAdminMe,
  isAdminSessionError,
  resolveAdminError,
} from '@/lib/adminApi';
import {
  clearAdminSessionProfileCache,
  readAdminSessionProfileCache,
  writeAdminSessionProfileCache,
} from '@/lib/adminSessionProfileCache';
import useAdminAccountBootstrap from '@/views/admin-account/useAdminAccountBootstrap';

jest.mock('@/lib/adminApi', () => ({
  fetchAdminActiveSessions: jest.fn(),
  fetchAdminGithubAuthStatus: jest.fn(),
  fetchAdminGoogleAuthStatus: jest.fn(),
  fetchAdminMe: jest.fn(),
  isAdminSessionError: jest.fn(),
  resolveAdminError: jest.fn(),
}));

const profile = {
  id: 'admin-1',
  name: 'Admin User',
  username: 'admin-user',
  avatarUrl: null,
  email: 'admin@example.com',
  pendingEmail: null,
  pendingEmailExpiresAt: null,
  googleLinked: false,
  googleEmail: null,
  googleLinkedAt: null,
  githubLinked: false,
  githubEmail: null,
  githubLinkedAt: null,
  roles: ['admin'],
};

const t = ((key: string) => key) as unknown as TFunction;
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

describe('useAdminAccountBootstrap', () => {
  let router: AppRouterInstance;
  let setNameInput: jest.Mock;
  let setUsernameInput: jest.Mock;

  const renderBootstrap = (overrides: Partial<Parameters<typeof useAdminAccountBootstrap>[0]> = {}) =>
    renderHook(() =>
      useAdminAccountBootstrap({
        isSecuritySection: false,
        isSessionsSection: false,
        locale: 'en',
        pathname: '/en/admin/settings/profile',
        router,
        searchParams: null,
        setNameInput,
        setUsernameInput,
        t,
        ...overrides,
      }),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    router = { replace: jest.fn() } as unknown as AppRouterInstance;
    setNameInput = jest.fn();
    setUsernameInput = jest.fn();
    jest.mocked(fetchAdminMe).mockResolvedValue({ authenticated: true, user: profile });
    jest.mocked(fetchAdminActiveSessions).mockResolvedValue([]);
    jest.mocked(fetchAdminGoogleAuthStatus).mockResolvedValue({ enabled: true, loginAvailable: true });
    jest.mocked(fetchAdminGithubAuthStatus).mockResolvedValue({ enabled: false, loginAvailable: true });
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: 'Request failed' });
  });

  afterEach(() => clearAdminSessionProfileCache());

  it('loads the current user and caches their profile', async () => {
    const { result } = renderBootstrap();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchAdminMe).toHaveBeenCalledTimes(1);
    expect(result.current.adminUser).toEqual(profile);
    expect(setNameInput).toHaveBeenCalledWith('Admin User');
    expect(setUsernameInput).toHaveBeenCalledWith('admin-user');
    expect(readAdminSessionProfileCache()).toEqual(profile);
  });

  it('uses the cached profile instead of requesting the session', async () => {
    writeAdminSessionProfileCache(profile);

    const { result } = renderBootstrap();
    await waitFor(() => expect(result.current.adminUser).toEqual(profile));

    expect(fetchAdminMe).not.toHaveBeenCalled();
    expect(setNameInput).toHaveBeenCalledWith('Admin User');
  });

  it('synchronizes and patches the cached admin identity', async () => {
    const { result } = renderBootstrap();
    await waitFor(() => expect(result.current.adminUser).toEqual(profile));

    act(() => result.current.syncAdminUser({ ...profile, name: 'Synced Admin' }));
    expect(readAdminSessionProfileCache()?.name).toBe('Synced Admin');

    act(() =>
      result.current.patchAdminUser(previous => (previous ? { ...previous, username: 'patched-admin' } : null)),
    );
    expect(result.current.adminUser?.username).toBe('patched-admin');
    expect(readAdminSessionProfileCache()?.username).toBe('patched-admin');
  });

  it('loads active sessions and reports non-session failures', async () => {
    const sessions = [
      {
        id: 'session-1',
        device: 'Laptop',
        ipAddress: '127.0.0.1',
        countryCode: 'US',
        lastActivityAt: '2026-01-01T00:00:00Z',
        createdAt: '2025-12-31T00:00:00Z',
        expiresAt: '2026-01-02T00:00:00Z',
        persistent: false,
        current: true,
      },
    ];
    jest.mocked(fetchAdminActiveSessions).mockResolvedValue(sessions);
    const { result } = renderBootstrap({ isSessionsSection: true });

    await waitFor(() => expect(result.current.activeSessions).toEqual(sessions));
    expect(result.current.isSessionsLoading).toBe(false);

    jest.mocked(fetchAdminActiveSessions).mockRejectedValue(new Error('offline'));
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'network', message: '' });
    const failedSessionHook = renderBootstrap({ isSessionsSection: true });
    await waitFor(() =>
      expect(failedSessionHook.result.current.sessionErrorMessage).toBe('adminCommon.errors.network'),
    );

    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: '' });
    const genericFailureHook = renderBootstrap({ isSessionsSection: true });
    await waitFor(() =>
      expect(genericFailureHook.result.current.sessionErrorMessage).toBe('adminAccount.sessions.errors.load'),
    );
  });

  it('redirects unauthenticated users and expired session requests', async () => {
    jest.mocked(fetchAdminMe).mockResolvedValue({ authenticated: false, user: null });
    const { result } = renderBootstrap();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.handleAdminSessionExpired());
    expect(router.replace).toHaveBeenCalledWith('/admin/login');

    jest.mocked(fetchAdminMe).mockResolvedValue({ authenticated: true, user: profile });
    jest.mocked(fetchAdminActiveSessions).mockRejectedValue(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValue(true);
    const sessionHook = renderBootstrap({ isSessionsSection: true });
    await waitFor(() => expect(sessionHook.result.current.isSessionsLoading).toBe(false));
    expect(router.replace).toHaveBeenCalledWith('/admin/login');
  });

  it('loads connected account status and consumes provider callback query values', async () => {
    const searchParams = new URLSearchParams('google=connected&github=cancelled');
    const { result } = renderBootstrap({
      isSecuritySection: true,
      pathname: '/en/admin/settings/security',
      searchParams,
    });

    await waitFor(() => expect(result.current.isGoogleAuthStatusLoading).toBe(false));
    await waitFor(() => expect(result.current.isGithubAuthStatusLoading).toBe(false));
    expect(result.current.googleAuthStatus).toEqual({ enabled: true, loginAvailable: true });
    expect(result.current.githubAuthStatus).toEqual({ enabled: false, loginAvailable: true });
    expect(result.current.googleConnectMessageVariant).toBe('success');
    expect(result.current.githubConnectMessageVariant).toBe('info');
    expect(router.replace).toHaveBeenCalledWith('/en/admin/settings/security', { scroll: false });
  });

  it('uses disabled defaults when connected account status requests fail', async () => {
    jest.mocked(fetchAdminGoogleAuthStatus).mockRejectedValue(new Error('google unavailable'));
    jest.mocked(fetchAdminGithubAuthStatus).mockRejectedValue(new Error('github unavailable'));
    const { result } = renderBootstrap({ isSecuritySection: true, searchParams: new URLSearchParams() });

    await waitFor(() => {
      expect(result.current.isGoogleAuthStatusLoading).toBe(false);
      expect(result.current.isGithubAuthStatusLoading).toBe(false);
    });
    expect(result.current.googleAuthStatus).toEqual({ enabled: false, loginAvailable: false });
    expect(result.current.githubAuthStatus).toEqual({ enabled: false, loginAvailable: false });
  });

  it('redirects when the session profile request fails', async () => {
    jest.mocked(fetchAdminMe).mockRejectedValue(new Error('offline'));
    const { result } = renderBootstrap();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(router.replace).toHaveBeenCalledWith('/admin/login');
  });

  it('ignores pending profile and security responses after unmount', async () => {
    const meRequest = deferred<{ authenticated: boolean; user: typeof profile }>();
    jest.mocked(fetchAdminMe).mockReturnValue(meRequest.promise as never);
    const profileHook = renderBootstrap();
    profileHook.unmount();
    await act(async () => meRequest.resolve({ authenticated: true, user: profile }));

    clearAdminSessionProfileCache();
    writeAdminSessionProfileCache(profile);
    const googleRequest = deferred<{ enabled: boolean; loginAvailable: boolean }>();
    const githubRequest = deferred<{ enabled: boolean; loginAvailable: boolean }>();
    const sessionsRequest = deferred<Awaited<ReturnType<typeof fetchAdminActiveSessions>>>();
    jest.mocked(fetchAdminGoogleAuthStatus).mockReturnValue(googleRequest.promise as never);
    jest.mocked(fetchAdminGithubAuthStatus).mockReturnValue(githubRequest.promise as never);
    jest.mocked(fetchAdminActiveSessions).mockReturnValue(sessionsRequest.promise as never);
    const combinedHook = renderBootstrap({ isSecuritySection: true, isSessionsSection: true });
    await waitFor(() => expect(fetchAdminActiveSessions).toHaveBeenCalled());
    combinedHook.unmount();
    await act(async () => {
      sessionsRequest.reject(new Error('session request ended'));
      googleRequest.reject(new Error('google request ended'));
      githubRequest.resolve({ enabled: true, loginAvailable: true });
    });

    clearAdminSessionProfileCache();
    writeAdminSessionProfileCache(profile);
    const nextGoogleRequest = deferred<{ enabled: boolean; loginAvailable: boolean }>();
    const nextGithubRequest = deferred<{ enabled: boolean; loginAvailable: boolean }>();
    jest.mocked(fetchAdminGoogleAuthStatus).mockReturnValue(nextGoogleRequest.promise as never);
    jest.mocked(fetchAdminGithubAuthStatus).mockReturnValue(nextGithubRequest.promise as never);
    const securityHook = renderBootstrap({ isSecuritySection: true });
    securityHook.unmount();
    await act(async () => {
      nextGoogleRequest.resolve({ enabled: true, loginAvailable: true });
      nextGithubRequest.reject(new Error('github request ended'));
    });
  });
});
