import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { changeAdminPassword, isAdminSessionError, resolveAdminError } from '@/lib/adminApi';
import useAdminAccountPasswordSecurity from '@/views/admin-account/useAdminAccountPasswordSecurity';
import type { TFunction } from 'i18next';

jest.mock('@/lib/adminApi', () => ({
  changeAdminPassword: jest.fn(),
  isAdminSessionError: jest.fn(() => false),
  resolveAdminError: jest.fn((error: unknown) => ({
    kind: 'unknown',
    message: error instanceof Error ? error.message : '',
  })),
}));

const makeParams = (onSessionExpired = jest.fn()) => ({
  onSessionExpired,
  successMessageAutoHideMs: 5000,
  t: ((key: string) => key) as TFunction,
});

const changeEvent = (value: string) => ({ currentTarget: { value } }) as React.ChangeEvent<HTMLInputElement>;
const submitEvent = () => ({ preventDefault: jest.fn() }) as unknown as React.SyntheticEvent<HTMLFormElement>;

describe('useAdminAccountPasswordSecurity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockImplementation((error: unknown) => ({
      kind: 'unknown',
      message: error instanceof Error ? error.message : '',
    }));
  });

  it('exposes validation only after touch or submit and toggles password controls', async () => {
    const { result } = renderHook(() => useAdminAccountPasswordSecurity(makeParams()));
    expect(result.current.showCurrentPasswordError).toBe(false);
    expect(result.current.securityCurrentPasswordError).toBe('adminAccount.validation.currentPasswordRequired');

    await act(async () => result.current.handleSecuritySubmit(submitEvent()));
    expect(result.current.showCurrentPasswordError).toBe(true);
    expect(result.current.showNewPasswordError).toBe(true);
    expect(result.current.showConfirmPasswordError).toBe(true);
    expect(changeAdminPassword).not.toHaveBeenCalled();

    act(() => {
      result.current.toggleSecurityPasswordExpanded();
      result.current.toggleCurrentPassword();
      result.current.toggleNewPassword();
      result.current.toggleConfirmPassword();
      result.current.handleCurrentPasswordChange(changeEvent('current-secret'));
      result.current.handleNewPasswordChange(changeEvent('short'));
      result.current.handleConfirmPasswordChange(changeEvent('mismatch'));
    });
    expect(result.current.isSecurityPasswordExpanded).toBe(true);
    expect(result.current.showCurrentPassword).toBe(true);
    expect(result.current.showNewPassword).toBe(true);
    expect(result.current.showConfirmPassword).toBe(true);
    expect(result.current.showNewPasswordError).toBe(true);
    expect(result.current.showConfirmPasswordError).toBe(true);

    act(() => {
      result.current.handleNewPasswordChange(changeEvent('current-secret'));
      result.current.handleConfirmPasswordChange(changeEvent('current-secret'));
    });
    expect(result.current.securityNewPasswordError).toBe('adminAccount.validation.newPasswordDifferent');
    expect(result.current.securityConfirmPasswordError).toBe('');
  });

  it('changes the password, resets form state and expires the session after success', async () => {
    jest.useFakeTimers();
    const onSessionExpired = jest.fn();
    const { result } = renderHook(() => useAdminAccountPasswordSecurity(makeParams(onSessionExpired)));
    act(() => {
      result.current.handleCurrentPasswordChange(changeEvent('current-secret'));
      result.current.handleNewPasswordChange(changeEvent('new-secret-123'));
      result.current.handleConfirmPasswordChange(changeEvent('new-secret-123'));
    });
    jest.mocked(changeAdminPassword).mockResolvedValueOnce({ success: true } as never);

    await act(async () => result.current.handleSecuritySubmit(submitEvent()));

    expect(changeAdminPassword).toHaveBeenCalledWith({
      currentPassword: 'current-secret',
      newPassword: 'new-secret-123',
      confirmPassword: 'new-secret-123',
    });
    expect(result.current.securitySuccessMessage).toBe('adminAccount.success');
    expect(result.current.currentPassword).toBe('');
    expect(result.current.newPassword).toBe('');
    expect(result.current.confirmPassword).toBe('');
    act(() => jest.advanceTimersByTime(900));
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('clears feedback on edits and resolves API errors and expired sessions', async () => {
    const onSessionExpired = jest.fn();
    const { result } = renderHook(() => useAdminAccountPasswordSecurity(makeParams(onSessionExpired)));
    act(() => {
      result.current.handleCurrentPasswordChange(changeEvent('current-secret'));
      result.current.handleNewPasswordChange(changeEvent('new-secret-123'));
      result.current.handleConfirmPasswordChange(changeEvent('new-secret-123'));
    });
    jest.mocked(changeAdminPassword).mockRejectedValueOnce(new Error('password rejected'));
    await act(async () => result.current.handleSecuritySubmit(submitEvent()));
    expect(result.current.securityErrorMessage).toBe('password rejected');

    act(() => result.current.handleNewPasswordChange(changeEvent('new-secret-456')));
    expect(result.current.securityErrorMessage).toBe('');
    act(() => {
      result.current.handleNewPasswordChange(changeEvent('new-secret-123'));
      result.current.handleConfirmPasswordChange(changeEvent('new-secret-123'));
    });
    jest.mocked(changeAdminPassword).mockResolvedValueOnce({ success: false } as never);
    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'unknown', message: '' } as never);
    await act(async () => result.current.handleSecuritySubmit(submitEvent()));
    expect(result.current.securityErrorMessage).toBe('adminAccount.errorFallback');

    jest.mocked(changeAdminPassword).mockRejectedValueOnce(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValueOnce(true);
    await act(async () => result.current.handleSecuritySubmit(submitEvent()));
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
