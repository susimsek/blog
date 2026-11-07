import { act, renderHook } from '@testing-library/react';
import { isAdminSessionError, resolveAdminError, revokeAdminSession, revokeAllAdminSessions } from '@/lib/adminApi';
import useAdminAccountSessionActions from '@/views/admin-account/useAdminAccountSessionActions';
import type { AdminSession } from '@/views/admin-account/adminAccountShared';
import type { TFunction } from 'i18next';

jest.mock('@/lib/adminApi', () => ({
  isAdminSessionError: jest.fn(() => false),
  resolveAdminError: jest.fn((error: unknown) => ({
    kind: 'unknown',
    message: error instanceof Error ? error.message : '',
  })),
  revokeAdminSession: jest.fn(),
  revokeAllAdminSessions: jest.fn(),
}));

const session = { id: 'session-1', current: false } as AdminSession;
const params = (overrides: Partial<Parameters<typeof useAdminAccountSessionActions>[0]> = {}) => ({
  setActiveSessions: jest.fn(),
  setSessionErrorMessage: jest.fn(),
  onSessionExpired: jest.fn(),
  successMessageAutoHideMs: 5000,
  t: ((key: string) => key) as TFunction,
  ...overrides,
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('useAdminAccountSessionActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockImplementation((error: unknown) => ({
      kind: 'unknown',
      message: error instanceof Error ? error.message : '',
    }));
  });

  it('revokes a non-current session and removes it from the active list', async () => {
    const options = params();
    jest.mocked(revokeAdminSession).mockResolvedValueOnce(true);
    const { result } = renderHook(() => useAdminAccountSessionActions(options));

    await act(async () => result.current.handleRevokeSession(session));

    expect(revokeAdminSession).toHaveBeenCalledWith('session-1');
    const update = jest.mocked(options.setActiveSessions).mock.calls[0][0] as (items: AdminSession[]) => AdminSession[];
    expect(update([session, { ...session, id: 'session-2' }])).toEqual([{ ...session, id: 'session-2' }]);
    expect(result.current.sessionSuccessMessage).toBe('adminAccount.sessions.success.revokeSingle');
    expect(result.current.revokingSessionID).toBe('');
  });

  it('expires the current session and resolves revoke failures', async () => {
    const options = params();
    const { result } = renderHook(() => useAdminAccountSessionActions(options));
    jest.mocked(revokeAdminSession).mockResolvedValueOnce(true);
    await act(async () => result.current.handleRevokeSession({ ...session, current: true }));
    expect(options.onSessionExpired).toHaveBeenCalledTimes(1);
    expect(options.setActiveSessions).not.toHaveBeenCalled();

    jest.mocked(revokeAdminSession).mockResolvedValueOnce(false);
    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'unknown', message: '' } as never);
    await act(async () => result.current.handleRevokeSession(session));
    expect(options.setSessionErrorMessage).toHaveBeenLastCalledWith('adminAccount.sessions.errors.revokeSingle');

    jest.mocked(revokeAdminSession).mockRejectedValueOnce(new Error('revoke failed'));
    await act(async () => result.current.handleRevokeSession(session));
    expect(options.setSessionErrorMessage).toHaveBeenLastCalledWith('revoke failed');

    jest.mocked(revokeAdminSession).mockRejectedValueOnce(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValueOnce(true);
    await act(async () => result.current.handleRevokeSession(session));
    expect(options.onSessionExpired).toHaveBeenCalledTimes(2);
  });

  it('blocks overlapping session revocations', async () => {
    const options = params();
    const pending = deferred<boolean>();
    jest.mocked(revokeAdminSession).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useAdminAccountSessionActions(options));

    let firstRequest!: Promise<void>;
    act(() => {
      firstRequest = result.current.handleRevokeSession(session);
    });
    expect(result.current.revokingSessionID).toBe('session-1');
    await act(async () => result.current.handleRevokeSession({ ...session, id: 'session-2' }));
    await act(async () => result.current.handleRevokeAllSessions());
    expect(revokeAdminSession).toHaveBeenCalledTimes(1);
    expect(revokeAllAdminSessions).not.toHaveBeenCalled();

    await act(async () => {
      pending.resolve(true);
      await firstRequest;
    });
    expect(result.current.revokingSessionID).toBe('');
  });

  it('revokes all sessions and handles API failures and expired sessions', async () => {
    const options = params();
    const { result } = renderHook(() => useAdminAccountSessionActions(options));
    const pending = deferred<boolean>();
    jest.mocked(revokeAllAdminSessions).mockReturnValueOnce(pending.promise);
    let firstRequest!: Promise<void>;
    act(() => {
      firstRequest = result.current.handleRevokeAllSessions();
    });
    await act(async () => result.current.handleRevokeAllSessions());
    expect(revokeAllAdminSessions).toHaveBeenCalledTimes(1);
    await act(async () => {
      pending.resolve(true);
      await firstRequest;
    });
    expect(options.onSessionExpired).toHaveBeenCalledTimes(1);

    jest.mocked(revokeAllAdminSessions).mockResolvedValueOnce(false);
    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'unknown', message: '' } as never);
    await act(async () => result.current.handleRevokeAllSessions());
    expect(options.setSessionErrorMessage).toHaveBeenLastCalledWith('adminAccount.sessions.errors.revokeAll');

    jest.mocked(revokeAllAdminSessions).mockRejectedValueOnce(new Error('server unavailable'));
    await act(async () => result.current.handleRevokeAllSessions());
    expect(options.setSessionErrorMessage).toHaveBeenLastCalledWith('server unavailable');

    jest.mocked(revokeAllAdminSessions).mockRejectedValueOnce(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValueOnce(true);
    await act(async () => result.current.handleRevokeAllSessions());
    expect(options.onSessionExpired).toHaveBeenCalledTimes(2);
  });
});
