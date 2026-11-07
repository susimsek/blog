import {
  changeAdminAvatar,
  changeAdminName,
  changeAdminPassword,
  changeAdminUsername,
  deleteAdminAccount,
  disconnectAdminGithub,
  disconnectAdminGoogle,
  fetchAdminActiveSessions,
  fetchAdminDashboard,
  fetchAdminGithubAuthStatus,
  fetchAdminGoogleAuthStatus,
  fetchAdminMe,
  loginAdmin,
  logoutAdmin,
  requestAdminEmailChange,
  revokeAdminSession,
  revokeAllAdminSessions,
  startAdminGithubConnect,
  startAdminGoogleConnect,
} from '@/lib/admin-api/account';
import { executeAdminGraphQL, refreshAdminSessionOnce } from '@/lib/admin-api/core';

jest.mock('@/lib/admin-api/core', () => ({
  executeAdminGraphQL: jest.fn(),
  refreshAdminSessionOnce: jest.fn(),
}));

const mockPayload = (payload: unknown) => jest.mocked(executeAdminGraphQL).mockResolvedValueOnce(payload as never);

describe('admin account API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the current user and refreshes an unauthenticated session once', async () => {
    const unauthenticated = { authenticated: false, user: null };
    const authenticated = { authenticated: true, user: { id: 'admin-1' } };
    mockPayload({ me: unauthenticated });
    mockPayload({ me: authenticated });
    jest.mocked(refreshAdminSessionOnce).mockResolvedValueOnce(undefined);

    await expect(fetchAdminMe()).resolves.toEqual(authenticated);
    expect(refreshAdminSessionOnce).toHaveBeenCalledTimes(1);
    expect(executeAdminGraphQL).toHaveBeenCalledTimes(2);

    jest.clearAllMocks();
    mockPayload({ me: unauthenticated });
    jest.mocked(refreshAdminSessionOnce).mockRejectedValueOnce(new Error('expired'));
    await expect(fetchAdminMe()).resolves.toEqual(unauthenticated);
  });

  it('covers account queries and mutations with normalized inputs', async () => {
    const userResult = { success: true, user: { id: 'admin-1' } };

    mockPayload({ googleAuthStatus: { enabled: true, loginAvailable: true } });
    await expect(fetchAdminGoogleAuthStatus()).resolves.toEqual({ enabled: true, loginAvailable: true });
    mockPayload({ githubAuthStatus: { enabled: false, loginAvailable: false } });
    await expect(fetchAdminGithubAuthStatus()).resolves.toEqual({ enabled: false, loginAvailable: false });

    mockPayload({ login: userResult });
    await expect(loginAdmin('admin@example.com', 'secret')).resolves.toEqual(userResult);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { email: 'admin@example.com', password: 'secret', rememberMe: false } },
      expect.objectContaining({ operationName: 'AdminLogin' }),
    );
    mockPayload({ login: userResult });
    await loginAdmin('admin@example.com', 'secret', true);

    mockPayload({ logout: { success: true } });
    await expect(logoutAdmin()).resolves.toEqual({ success: true });
    mockPayload({ dashboard: { totalPosts: 2, totalSubscribers: 3 } });
    await expect(fetchAdminDashboard()).resolves.toEqual({ totalPosts: 2, totalSubscribers: 3 });
    mockPayload({ changePassword: { success: true } });
    await expect(
      changeAdminPassword({ currentPassword: 'old', newPassword: 'new', confirmPassword: 'new' }),
    ).resolves.toEqual({ success: true });

    mockPayload({ startGoogleConnect: { url: '/google' } });
    await expect(startAdminGoogleConnect({ locale: ' TR ' })).resolves.toEqual({ url: '/google' });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { locale: 'tr' } },
      expect.objectContaining({ operationName: 'AdminStartGoogleConnect' }),
    );
    mockPayload({ startGithubConnect: { url: '/github' } });
    await expect(startAdminGithubConnect({ locale: ' ' })).resolves.toEqual({ url: '/github' });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { locale: undefined } },
      expect.objectContaining({ operationName: 'AdminStartGithubConnect' }),
    );
    mockPayload({ disconnectGoogle: userResult });
    await expect(disconnectAdminGoogle()).resolves.toEqual(userResult);
    mockPayload({ disconnectGithub: userResult });
    await expect(disconnectAdminGithub()).resolves.toEqual(userResult);

    mockPayload({ changeUsername: userResult });
    await expect(changeAdminUsername({ newUsername: 'new-admin' })).resolves.toEqual(userResult);
    mockPayload({ requestEmailChange: { success: true, pendingEmail: 'new@example.com', expiresAt: 'later' } });
    await expect(
      requestAdminEmailChange({ newEmail: ' New@Example.com ', currentPassword: 'secret', locale: ' EN ' }),
    ).resolves.toEqual({
      success: true,
      pendingEmail: 'new@example.com',
      expiresAt: 'later',
    });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { newEmail: 'new@example.com', currentPassword: 'secret', locale: 'en' } },
      expect.objectContaining({ operationName: 'AdminRequestEmailChange' }),
    );
    mockPayload({ changeName: userResult });
    await expect(changeAdminName({ name: 'Admin' })).resolves.toEqual(userResult);
    mockPayload({ changeAvatar: userResult });
    await expect(changeAdminAvatar({ avatarUrl: null })).resolves.toEqual(userResult);
    mockPayload({ deleteAccount: { success: true } });
    await expect(deleteAdminAccount({ currentPassword: 'secret' })).resolves.toEqual({ success: true });
  });

  it('loads sessions and handles optional revoke responses', async () => {
    const sessions = [{ id: 'session-1', current: true }];
    mockPayload({ activeSessions: sessions });
    await expect(fetchAdminActiveSessions()).resolves.toEqual(sessions);

    mockPayload({});
    await expect(revokeAdminSession('session-1')).resolves.toBe(false);
    mockPayload({ revokeSession: { success: true } });
    await expect(revokeAdminSession('session-1')).resolves.toBe(true);

    mockPayload({});
    await expect(revokeAllAdminSessions()).resolves.toBe(false);
    mockPayload({ revokeAllSessions: { success: true } });
    await expect(revokeAllAdminSessions()).resolves.toBe(true);
  });
});
