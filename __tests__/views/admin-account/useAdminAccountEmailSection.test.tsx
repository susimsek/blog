import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { isAdminSessionError, requestAdminEmailChange, resolveAdminError } from '@/lib/adminApi';
import useAdminAccountEmailSection from '@/views/admin-account/useAdminAccountEmailSection';
import type { AdminIdentity } from '@/views/admin-account/adminAccountShared';
import type { TFunction } from 'i18next';

jest.mock('@/lib/adminApi', () => ({
  isAdminSessionError: jest.fn(() => false),
  requestAdminEmailChange: jest.fn(),
  resolveAdminError: jest.fn((error: unknown) => ({
    kind: 'unknown',
    message: error instanceof Error ? error.message : '',
    code: '',
  })),
}));

const makeParams = (overrides: Partial<Parameters<typeof useAdminAccountEmailSection>[0]> = {}) => ({
  adminUser: { username: 'admin', email: 'admin@example.com' } as AdminIdentity,
  locale: 'en',
  patchAdminUser: jest.fn(),
  onSessionExpired: jest.fn(),
  successMessageAutoHideMs: 5000,
  t: ((key: string) => key) as TFunction,
  ...overrides,
});

const submitEvent = () => ({ preventDefault: jest.fn() }) as unknown as React.SyntheticEvent<HTMLFormElement>;

describe('useAdminAccountEmailSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockImplementation((error: unknown) => ({
      kind: 'unknown',
      message: error instanceof Error ? error.message : '',
      code: '',
    }));
  });

  it('validates, reveals touched errors and accepts a distinct email', async () => {
    const { result } = renderHook(() => useAdminAccountEmailSection(makeParams()));
    expect(result.current.pendingEmail).toBe('');
    expect(result.current.showEmailValidationError).toBe(false);
    act(() => result.current.handleEmailInputBlur());
    expect(result.current.showEmailValidationError).toBe(true);
    expect(result.current.emailValidationError).toBe('adminAccount.validation.emailRequired');

    act(() => result.current.handleEmailInputChange('not-an-email'));
    expect(result.current.emailValidationError).toBe('adminAccount.validation.emailInvalid');
    act(() => result.current.handleEmailInputChange('ADMIN@example.com'));
    expect(result.current.emailValidationError).toBe('adminAccount.validation.emailDifferent');
    act(() => result.current.handleEmailInputChange(' New@Example.com '));
    expect(result.current.emailValidationError).toBe('');
    act(() => result.current.handleEmailCurrentPasswordBlur());
    expect(result.current.showEmailCurrentPasswordError).toBe(true);
    expect(result.current.emailCurrentPasswordError).toBe('adminAccount.validation.currentPasswordRequired');
  });

  it('requests email change and patches pending email without mutating the prior profile', async () => {
    const params = makeParams({ locale: 'tr' });
    const { result } = renderHook(() => useAdminAccountEmailSection(params));
    act(() => {
      result.current.handleEmailInputChange(' Next@Example.com ');
      result.current.handleEmailCurrentPasswordChange('secret');
    });
    jest.mocked(requestAdminEmailChange).mockResolvedValueOnce({
      success: true,
      pendingEmail: 'next@example.com',
      expiresAt: '2026-12-01T12:00:00Z',
    } as never);

    await act(async () => result.current.handleEmailSubmit(submitEvent()));

    expect(requestAdminEmailChange).toHaveBeenCalledWith({
      newEmail: 'next@example.com',
      currentPassword: 'secret',
      locale: 'tr',
    });
    const updater = jest.mocked(params.patchAdminUser).mock.calls[0][0];
    expect(updater({ username: 'admin', email: 'admin@example.com' } as AdminIdentity)).toEqual({
      username: 'admin',
      email: 'admin@example.com',
      pendingEmail: 'next@example.com',
      pendingEmailExpiresAt: '2026-12-01T12:00:00Z',
    });
    expect(updater(null)).toBeNull();
    expect(result.current.pendingEmail).toBe('');
    expect(result.current.emailSuccessMessage).toContain('adminAccount.account.success.emailChangeRequested');
    expect(result.current.emailInput).toBe('');
  });

  it('reports server validation errors by field and clears matching feedback', async () => {
    const { result } = renderHook(() => useAdminAccountEmailSection(makeParams()));
    act(() => {
      result.current.handleEmailInputChange('new@example.com');
      result.current.handleEmailCurrentPasswordChange('secret');
    });

    jest.mocked(requestAdminEmailChange).mockRejectedValueOnce(new Error('password incorrect'));
    jest.mocked(resolveAdminError).mockReturnValueOnce({
      kind: 'unknown',
      message: 'password incorrect',
      code: 'ADMIN_CURRENT_PASSWORD_INCORRECT',
    } as never);
    await act(async () => result.current.handleEmailSubmit(submitEvent()));
    expect(result.current.emailErrorMessage).toBe('password incorrect');
    act(() => result.current.handleEmailInputChange('updated@example.com'));
    expect(result.current.emailErrorMessage).toBe('password incorrect');
    act(() => result.current.handleEmailCurrentPasswordChange('new-secret'));
    expect(result.current.emailErrorMessage).toBe('');

    jest.mocked(requestAdminEmailChange).mockRejectedValueOnce(new Error('address taken'));
    jest
      .mocked(resolveAdminError)
      .mockReturnValueOnce({ kind: 'unknown', message: 'address taken', code: 'ADMIN_EMAIL_TAKEN' } as never);
    await act(async () => result.current.handleEmailSubmit(submitEvent()));
    expect(result.current.emailErrorMessage).toBe('address taken');
    act(() => result.current.handleEmailInputChange('another@example.com'));
    expect(result.current.emailErrorMessage).toBe('');
  });

  it('uses fallback messages, clears generic feedback and handles expired sessions', async () => {
    const params = makeParams();
    const { result } = renderHook(() => useAdminAccountEmailSection(params));
    act(() => {
      result.current.handleEmailInputChange('new@example.com');
      result.current.handleEmailCurrentPasswordChange('secret');
    });

    jest.mocked(requestAdminEmailChange).mockResolvedValueOnce({ success: false } as never);
    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'unknown', message: '', code: 'OTHER' } as never);
    await act(async () => result.current.handleEmailSubmit(submitEvent()));
    expect(result.current.emailErrorMessage).toBe('adminAccount.account.errors.emailUpdate');
    act(() => result.current.clearEmailFeedback());
    expect(result.current.emailErrorMessage).toBe('');

    jest.mocked(requestAdminEmailChange).mockRejectedValueOnce(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValueOnce(true);
    await act(async () => result.current.handleEmailSubmit(submitEvent()));
    expect(params.onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
