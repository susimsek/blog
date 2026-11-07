import React from 'react';
import { act, renderHook } from '@testing-library/react';
import {
  disconnectAdminGithub,
  disconnectAdminGoogle,
  fetchAdminGithubAuthStatus,
  fetchAdminGoogleAuthStatus,
  isAdminSessionError,
  resolveAdminError,
  startAdminGithubConnect,
  startAdminGoogleConnect,
} from '@/lib/adminApi';
import useAdminAccountConnectedAccounts from '@/views/admin-account/useAdminAccountConnectedAccounts';
import type { ConnectedAccountStatus, ConnectedMessageVariant } from '@/views/admin-account/adminAccountSecurityShared';
import type { TFunction } from 'i18next';

jest.mock('@/lib/adminApi', () => ({
  disconnectAdminGithub: jest.fn(),
  disconnectAdminGoogle: jest.fn(),
  fetchAdminGithubAuthStatus: jest.fn(),
  fetchAdminGoogleAuthStatus: jest.fn(),
  isAdminSessionError: jest.fn(() => false),
  resolveAdminError: jest.fn((error: unknown) => ({
    kind: 'unknown',
    message: error instanceof Error ? error.message : '',
  })),
  startAdminGithubConnect: jest.fn(),
  startAdminGoogleConnect: jest.fn(),
}));

jest.mock('@/lib/basePath', () => ({
  withBasePath: (path: string) => `/base${path}`,
}));

const emptyStatus: ConnectedAccountStatus = { enabled: false, loginAvailable: false };
const enabledStatus: ConnectedAccountStatus = { enabled: true, loginAvailable: true };

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
};

const makeParams = (overrides: Partial<Parameters<typeof useAdminAccountConnectedAccounts>[0]> = {}) => ({
  locale: 'en',
  googleConnectMessage: '',
  setGoogleAuthStatus: jest.fn() as (value: React.SetStateAction<ConnectedAccountStatus>) => void,
  setGoogleConnectMessage: jest.fn() as (value: React.SetStateAction<string>) => void,
  setGoogleConnectMessageVariant: jest.fn() as (value: React.SetStateAction<ConnectedMessageVariant>) => void,
  githubConnectMessage: '',
  setGithubAuthStatus: jest.fn() as (value: React.SetStateAction<ConnectedAccountStatus>) => void,
  setGithubConnectMessage: jest.fn() as (value: React.SetStateAction<string>) => void,
  setGithubConnectMessageVariant: jest.fn() as (value: React.SetStateAction<ConnectedMessageVariant>) => void,
  clearSecuritySuccessMessage: jest.fn(),
  onSessionExpired: jest.fn(),
  t: ((key: string) => key) as TFunction,
  ...overrides,
});

describe('useAdminAccountConnectedAccounts', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockImplementation((error: unknown) => ({
      kind: 'unknown',
      message: error instanceof Error ? error.message : '',
    }));
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('starts Google and GitHub connect flows and clears prior messages', async () => {
    const params = makeParams({
      locale: 'tr',
      googleConnectMessage: 'Old Google message',
      githubConnectMessage: 'Old GitHub message',
    });
    jest.mocked(startAdminGoogleConnect).mockResolvedValue({ url: '/oauth/google' } as never);
    jest.mocked(startAdminGithubConnect).mockResolvedValue({ url: '/oauth/github' } as never);
    const { result } = renderHook(() => useAdminAccountConnectedAccounts(params));

    await act(async () => {
      await result.current.handleGoogleConnect();
      await result.current.handleGithubConnect();
    });

    expect(startAdminGoogleConnect).toHaveBeenCalledWith({ locale: 'tr' });
    expect(startAdminGithubConnect).toHaveBeenCalledWith({ locale: 'tr' });
    expect(consoleError).toHaveBeenCalled();
    expect(params.setGoogleConnectMessage).toHaveBeenCalledWith('');
    expect(params.setGoogleConnectMessageVariant).toHaveBeenCalledWith('info');
    expect(params.setGithubConnectMessage).toHaveBeenCalledWith('');
    expect(params.setGithubConnectMessageVariant).toHaveBeenCalledWith('info');
    expect(params.clearSecuritySuccessMessage).toHaveBeenCalledTimes(2);
    expect(result.current.isGoogleConnectSubmitting).toBe(false);
    expect(result.current.isGithubConnectSubmitting).toBe(false);
  });

  it('maps connect failures to network, server, fallback, and expired-session feedback', async () => {
    const params = makeParams();
    const { result } = renderHook(() => useAdminAccountConnectedAccounts(params));
    jest.mocked(startAdminGoogleConnect).mockRejectedValueOnce(new Error('network down'));
    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'network', message: '' } as never);
    await act(async () => result.current.handleGoogleConnect());
    expect(result.current.googleActionErrorMessage).toBe('adminCommon.errors.network');

    jest.mocked(startAdminGoogleConnect).mockRejectedValueOnce(new Error('provider denied access'));
    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'unknown', message: 'Provider denied access' } as never);
    await act(async () => result.current.handleGoogleConnect());
    expect(result.current.googleActionErrorMessage).toBe('Provider denied access');

    jest.mocked(startAdminGithubConnect).mockRejectedValueOnce(new Error('unexpected response'));
    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'unknown', message: '' } as never);
    await act(async () => result.current.handleGithubConnect());
    expect(result.current.githubActionErrorMessage).toBe('adminAccount.connectedAccounts.github.messages.failed');

    jest.mocked(startAdminGithubConnect).mockRejectedValueOnce(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValueOnce(true);
    await act(async () => result.current.handleGithubConnect());
    jest.mocked(startAdminGoogleConnect).mockRejectedValueOnce(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValueOnce(true);
    await act(async () => result.current.handleGoogleConnect());
    expect(params.onSessionExpired).toHaveBeenCalledTimes(2);
    expect(result.current.isGithubConnectSubmitting).toBe(false);
  });

  it('opens and closes both disconnect modals and clears action errors', async () => {
    const params = makeParams();
    const { result } = renderHook(() => useAdminAccountConnectedAccounts(params));
    jest.mocked(disconnectAdminGoogle).mockRejectedValueOnce(new Error('Google failed'));
    await act(async () => result.current.handleGoogleDisconnect());
    expect(result.current.googleActionErrorMessage).toBe('Google failed');

    act(() => {
      result.current.openGoogleDisconnectModal();
      result.current.openGithubDisconnectModal();
    });
    expect(result.current.isGoogleDisconnectModalOpen).toBe(true);
    expect(result.current.isGithubDisconnectModalOpen).toBe(true);
    expect(result.current.googleActionErrorMessage).toBe('');

    act(() => {
      result.current.closeGoogleDisconnectModal();
      result.current.closeGithubDisconnectModal();
    });
    expect(result.current.isGoogleDisconnectModalOpen).toBe(false);
    expect(result.current.isGithubDisconnectModalOpen).toBe(false);
  });

  it('disconnects Google, updates status, and falls back when status reload fails', async () => {
    const params = makeParams({ googleConnectMessage: 'Existing notice' });
    const { result } = renderHook(() => useAdminAccountConnectedAccounts(params));
    jest.mocked(disconnectAdminGoogle).mockResolvedValueOnce({ success: true } as never);
    jest.mocked(fetchAdminGoogleAuthStatus).mockResolvedValueOnce(enabledStatus as never);

    act(() => result.current.openGoogleDisconnectModal());
    await act(async () => result.current.handleGoogleDisconnect());

    expect(disconnectAdminGoogle).toHaveBeenCalledTimes(1);
    expect(params.setGoogleConnectMessage).toHaveBeenCalledWith(
      'adminAccount.connectedAccounts.google.messages.disconnected',
    );
    expect(params.setGoogleConnectMessageVariant).toHaveBeenCalledWith('success');
    expect(params.setGoogleAuthStatus).toHaveBeenCalledWith(enabledStatus);
    expect(result.current.isGoogleDisconnectModalOpen).toBe(false);
    expect(result.current.isGoogleDisconnectSubmitting).toBe(false);

    jest.mocked(disconnectAdminGoogle).mockResolvedValueOnce({ success: true } as never);
    jest.mocked(fetchAdminGoogleAuthStatus).mockRejectedValueOnce(new Error('status unavailable'));
    await act(async () => result.current.handleGoogleDisconnect());
    expect(params.setGoogleAuthStatus).toHaveBeenLastCalledWith(emptyStatus);
  });

  it('reports failed Google disconnects and handles expired sessions', async () => {
    const params = makeParams();
    const { result } = renderHook(() => useAdminAccountConnectedAccounts(params));
    jest.mocked(disconnectAdminGoogle).mockResolvedValueOnce({ success: false } as never);
    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'unknown', message: '' } as never);
    await act(async () => result.current.handleGoogleDisconnect());
    expect(result.current.googleActionErrorMessage).toBe('adminAccount.connectedAccounts.google.messages.failed');

    jest.mocked(disconnectAdminGoogle).mockRejectedValueOnce(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValueOnce(true);
    await act(async () => result.current.handleGoogleDisconnect());
    expect(params.onSessionExpired).toHaveBeenCalledTimes(1);
    expect(result.current.isGoogleDisconnectSubmitting).toBe(false);
  });

  it('disconnects GitHub and applies the unavailable fallback when status reload fails', async () => {
    const params = makeParams({ githubConnectMessage: 'Existing notice' });
    const { result } = renderHook(() => useAdminAccountConnectedAccounts(params));
    jest.mocked(disconnectAdminGithub).mockResolvedValueOnce({ success: true } as never);
    jest.mocked(fetchAdminGithubAuthStatus).mockResolvedValueOnce(enabledStatus as never);

    act(() => result.current.openGithubDisconnectModal());
    await act(async () => result.current.handleGithubDisconnect());

    expect(disconnectAdminGithub).toHaveBeenCalledTimes(1);
    expect(params.setGithubConnectMessage).toHaveBeenCalledWith(
      'adminAccount.connectedAccounts.github.messages.disconnected',
    );
    expect(params.setGithubConnectMessageVariant).toHaveBeenCalledWith('success');
    expect(params.setGithubAuthStatus).toHaveBeenCalledWith(enabledStatus);
    expect(result.current.isGithubDisconnectModalOpen).toBe(false);

    jest.mocked(disconnectAdminGithub).mockResolvedValueOnce({ success: true } as never);
    jest.mocked(fetchAdminGithubAuthStatus).mockRejectedValueOnce(new Error('status unavailable'));
    await act(async () => result.current.handleGithubDisconnect());
    expect(params.setGithubAuthStatus).toHaveBeenLastCalledWith(emptyStatus);
  });

  it('reports GitHub disconnect errors and session expiration', async () => {
    const params = makeParams();
    const { result } = renderHook(() => useAdminAccountConnectedAccounts(params));
    jest.mocked(disconnectAdminGithub).mockResolvedValueOnce({ success: false } as never);
    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'network', message: '' } as never);
    await act(async () => result.current.handleGithubDisconnect());
    expect(result.current.githubActionErrorMessage).toBe('adminCommon.errors.network');

    jest.mocked(disconnectAdminGithub).mockRejectedValueOnce(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValueOnce(true);
    await act(async () => result.current.handleGithubDisconnect());
    expect(params.onSessionExpired).toHaveBeenCalledTimes(1);
    expect(result.current.isGithubDisconnectSubmitting).toBe(false);
  });

  it('guards repeated connect and disconnect actions while requests are pending', async () => {
    const params = makeParams();
    const googleConnect = deferred<{ url: string }>();
    const githubConnect = deferred<{ url: string }>();
    const googleDisconnect = deferred<{ success: boolean }>();
    const githubDisconnect = deferred<{ success: boolean }>();
    jest.mocked(startAdminGoogleConnect).mockReturnValueOnce(googleConnect.promise as never);
    jest.mocked(startAdminGithubConnect).mockReturnValueOnce(githubConnect.promise as never);
    jest.mocked(disconnectAdminGoogle).mockReturnValueOnce(googleDisconnect.promise as never);
    jest.mocked(disconnectAdminGithub).mockReturnValueOnce(githubDisconnect.promise as never);
    jest.mocked(fetchAdminGoogleAuthStatus).mockResolvedValue(enabledStatus as never);
    jest.mocked(fetchAdminGithubAuthStatus).mockResolvedValue(enabledStatus as never);
    const { result } = renderHook(() => useAdminAccountConnectedAccounts(params));

    let googleConnectTask!: Promise<void>;
    act(() => {
      googleConnectTask = result.current.handleGoogleConnect();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.isGoogleConnectSubmitting).toBe(true);
    await act(async () => {
      await result.current.handleGoogleConnect();
      await result.current.handleGoogleDisconnect();
    });
    expect(startAdminGoogleConnect).toHaveBeenCalledTimes(1);
    expect(disconnectAdminGoogle).not.toHaveBeenCalled();
    await act(async () => {
      googleConnect.resolve({ url: '/oauth/google' });
      await googleConnectTask;
    });

    let githubConnectTask!: Promise<void>;
    act(() => {
      githubConnectTask = result.current.handleGithubConnect();
    });
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.handleGithubConnect();
      await result.current.handleGithubDisconnect();
    });
    expect(startAdminGithubConnect).toHaveBeenCalledTimes(1);
    expect(disconnectAdminGithub).not.toHaveBeenCalled();
    await act(async () => {
      githubConnect.resolve({ url: '/oauth/github' });
      await githubConnectTask;
    });

    act(() => {
      result.current.openGoogleDisconnectModal();
      result.current.openGithubDisconnectModal();
    });
    let googleDisconnectTask!: Promise<void>;
    act(() => {
      googleDisconnectTask = result.current.handleGoogleDisconnect();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.isGoogleDisconnectSubmitting).toBe(true);
    act(() => result.current.closeGoogleDisconnectModal());
    expect(result.current.isGoogleDisconnectModalOpen).toBe(true);
    await act(async () => {
      await result.current.handleGoogleDisconnect();
      await result.current.handleGoogleConnect();
    });
    expect(disconnectAdminGoogle).toHaveBeenCalledTimes(1);
    expect(startAdminGoogleConnect).toHaveBeenCalledTimes(1);
    await act(async () => {
      googleDisconnect.resolve({ success: true });
      await googleDisconnectTask;
    });

    let githubDisconnectTask!: Promise<void>;
    act(() => {
      githubDisconnectTask = result.current.handleGithubDisconnect();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.isGithubDisconnectSubmitting).toBe(true);
    act(() => result.current.closeGithubDisconnectModal());
    expect(result.current.isGithubDisconnectModalOpen).toBe(true);
    await act(async () => {
      await result.current.handleGithubDisconnect();
      await result.current.handleGithubConnect();
    });
    expect(disconnectAdminGithub).toHaveBeenCalledTimes(1);
    expect(startAdminGithubConnect).toHaveBeenCalledTimes(1);
    await act(async () => {
      githubDisconnect.resolve({ success: true });
      await githubDisconnectTask;
    });
  });
});
