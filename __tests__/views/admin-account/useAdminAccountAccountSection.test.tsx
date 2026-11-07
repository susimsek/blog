import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { changeAdminUsername, deleteAdminAccount, isAdminSessionError, resolveAdminError } from '@/lib/adminApi';
import useAdminAccountAccountSection from '@/views/admin-account/useAdminAccountAccountSection';
import type { AdminIdentity } from '@/views/admin-account/adminAccountShared';
import type { TFunction } from 'i18next';

jest.mock('@/lib/adminApi', () => ({
  changeAdminUsername: jest.fn(),
  deleteAdminAccount: jest.fn(),
  isAdminSessionError: jest.fn(() => false),
  resolveAdminError: jest.fn((error: unknown) => ({
    kind: 'unknown',
    message: error instanceof Error ? error.message : '',
  })),
}));

const makeParams = (overrides: Partial<Parameters<typeof useAdminAccountAccountSection>[0]> = {}) => ({
  adminUser: { username: 'admin', email: 'admin@example.com' } as AdminIdentity,
  usernameInput: 'admin',
  setUsernameInput: jest.fn(),
  syncAdminUser: jest.fn(),
  onSessionExpired: jest.fn(),
  successMessageAutoHideMs: 5000,
  t: ((key: string) => key) as TFunction,
  ...overrides,
});

const submitEvent = () => ({ preventDefault: jest.fn() }) as unknown as React.SyntheticEvent<HTMLFormElement>;

describe('useAdminAccountAccountSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockImplementation((error: unknown) => ({
      kind: 'unknown',
      message: error instanceof Error ? error.message : '',
    }));
  });

  it('validates username boundaries, pattern, unchanged and valid values', () => {
    const { result, rerender } = renderHook(({ params }) => useAdminAccountAccountSection(params), {
      initialProps: { params: makeParams({ usernameInput: '' }) },
    });

    expect(result.current.showUsernameValidationError).toBe(true);
    expect(result.current.usernameValidationError).toBe('adminAccount.validation.usernameRequired');

    rerender({ params: makeParams({ usernameInput: 'x' }) });
    expect(result.current.usernameValidationError).toBe('adminAccount.validation.usernameLength');

    rerender({ params: makeParams({ usernameInput: 'bad name' }) });
    expect(result.current.usernameValidationError).toBe('adminAccount.validation.usernamePattern');

    rerender({ params: makeParams({ usernameInput: ' ADMIN ' }) });
    expect(result.current.usernameValidationError).toBe('adminAccount.validation.usernameDifferent');

    rerender({ params: makeParams({ usernameInput: 'new-admin' }) });
    expect(result.current.usernameValidationError).toBe('');
    expect(result.current.showUsernameValidationError).toBe(false);
  });

  it('updates username, syncs user and emits the update event', async () => {
    const params = makeParams({ usernameInput: 'new-admin' });
    const dispatch = jest.spyOn(globalThis, 'dispatchEvent');
    const nextUser = { username: 'new-admin', email: 'updated@example.com' } as AdminIdentity;
    jest.mocked(changeAdminUsername).mockResolvedValue({ success: true, user: nextUser } as never);
    const { result } = renderHook(() => useAdminAccountAccountSection(params));

    await act(async () => result.current.handleUsernameSubmit(submitEvent()));

    expect(changeAdminUsername).toHaveBeenCalledWith({ newUsername: 'new-admin' });
    expect(params.setUsernameInput).toHaveBeenCalledWith('new-admin');
    expect(params.syncAdminUser).toHaveBeenCalledWith(nextUser);
    expect(result.current.usernameSuccessMessage).toBe('adminAccount.account.success.usernameUpdated');
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'admin:user-updated' }));
    dispatch.mockRestore();
  });

  it('does not call APIs for invalid forms and reports username failures', async () => {
    const invalidParams = makeParams({ usernameInput: 'admin' });
    const { result, rerender } = renderHook(({ params }) => useAdminAccountAccountSection(params), {
      initialProps: { params: invalidParams },
    });
    await act(async () => result.current.handleUsernameSubmit(submitEvent()));
    expect(changeAdminUsername).not.toHaveBeenCalled();
    expect(result.current.showUsernameValidationError).toBe(true);

    const activeParams = makeParams({ usernameInput: 'new-admin' });
    rerender({ params: activeParams });
    jest.mocked(changeAdminUsername).mockRejectedValueOnce(new Error('username unavailable'));
    await act(async () => result.current.handleUsernameSubmit(submitEvent()));
    expect(result.current.usernameErrorMessage).toBe('username unavailable');

    jest.mocked(changeAdminUsername).mockRejectedValueOnce(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValueOnce(true);
    await act(async () => result.current.handleUsernameSubmit(submitEvent()));
    expect(activeParams.onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('uses fallback messages and clears username feedback', async () => {
    const params = makeParams({ usernameInput: 'new-admin' });
    jest.mocked(changeAdminUsername).mockResolvedValueOnce({ success: false } as never);
    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'unknown', message: '' } as never);
    const { result } = renderHook(() => useAdminAccountAccountSection(params));

    await act(async () => result.current.handleUsernameSubmit(submitEvent()));
    expect(result.current.usernameErrorMessage).toBe('adminAccount.account.errors.usernameUpdate');
    act(() => result.current.clearUsernameFeedback());
    expect(result.current.usernameErrorMessage).toBe('');

    jest.mocked(changeAdminUsername).mockResolvedValueOnce({ success: true } as never);
    await act(async () => result.current.handleUsernameSubmit(submitEvent()));
    expect(params.syncAdminUser).toHaveBeenCalledWith({ username: 'new-admin', email: 'admin@example.com' });
    act(() => result.current.clearUsernameFeedback());
    expect(result.current.usernameSuccessMessage).toBe('');
  });

  it('handles username updates without a profile and ignores duplicate submissions', async () => {
    let resolveUpdate!: (value: unknown) => void;
    jest.mocked(changeAdminUsername).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveUpdate = resolve;
        }) as never,
    );
    const params = makeParams({ adminUser: null, usernameInput: 'new-admin' });
    const { result } = renderHook(() => useAdminAccountAccountSection(params));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.handleUsernameSubmit(submitEvent());
    });
    expect(result.current.isUsernameSubmitting).toBe(true);
    await act(async () => result.current.handleUsernameSubmit(submitEvent()));
    expect(changeAdminUsername).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveUpdate({ success: true });
      await pending;
    });
    expect(params.syncAdminUser).toHaveBeenCalledWith(null);
  });

  it('validates account deletion, toggles password visibility and handles delete outcomes', async () => {
    jest.useFakeTimers();
    const params = makeParams({ usernameInput: 'new-admin' });
    const { result } = renderHook(() => useAdminAccountAccountSection(params));

    expect(result.current.showDeletePasswordError).toBe(false);
    act(() => result.current.toggleDeletePassword());
    expect(result.current.showDeletePassword).toBe(true);
    await act(async () => result.current.handleDeleteSubmit(submitEvent()));
    expect(result.current.showDeletePasswordError).toBe(true);
    expect(result.current.showDeleteConfirmError).toBe(true);
    expect(deleteAdminAccount).not.toHaveBeenCalled();

    act(() => {
      result.current.setDeleteCurrentPassword('secret');
      result.current.setDeleteConfirmation(result.current.deleteConfirmationValue.toLowerCase());
    });
    jest.mocked(deleteAdminAccount).mockResolvedValueOnce({ success: true } as never);
    await act(async () => result.current.handleDeleteSubmit(submitEvent()));
    expect(deleteAdminAccount).toHaveBeenCalledWith({ currentPassword: 'secret' });
    expect(result.current.deleteSuccessMessage).toBe('adminAccount.account.success.deleted');
    act(() => result.current.clearDeleteFeedback());
    expect(result.current.deleteSuccessMessage).toBe('');
    act(() => jest.advanceTimersByTime(900));
    expect(params.onSessionExpired).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('reports delete failures and expires the session when required', async () => {
    const params = makeParams();
    const { result } = renderHook(() => useAdminAccountAccountSection(params));
    act(() => {
      result.current.setDeleteCurrentPassword('secret');
      result.current.setDeleteConfirmation(result.current.deleteConfirmationValue);
    });

    jest.mocked(deleteAdminAccount).mockRejectedValueOnce(new Error('delete denied'));
    await act(async () => result.current.handleDeleteSubmit(submitEvent()));
    expect(result.current.deleteErrorMessage).toBe('delete denied');
    act(() => result.current.clearDeleteFeedback());
    expect(result.current.deleteErrorMessage).toBe('');

    jest.mocked(deleteAdminAccount).mockResolvedValueOnce({ success: false } as never);
    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'unknown', message: '' } as never);
    await act(async () => result.current.handleDeleteSubmit(submitEvent()));
    expect(result.current.deleteErrorMessage).toBe('adminAccount.account.errors.deleteAccount');

    jest.mocked(deleteAdminAccount).mockRejectedValueOnce(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValueOnce(true);
    await act(async () => result.current.handleDeleteSubmit(submitEvent()));
    expect(params.onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
