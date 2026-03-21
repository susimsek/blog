import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminResetPasswordPage from '@/views/AdminResetPasswordPage';

const useParamsMock = jest.fn();
const useSearchParamsMock = jest.fn();
const validateAdminPasswordResetTokenMock = jest.fn();
const confirmAdminPasswordResetMock = jest.fn();
const resolveAdminPasswordResetErrorMock = jest.fn();
const originalConsoleError = console.error;

jest.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
  useSearchParams: () => useSearchParamsMock(),
}));

jest.mock('@/lib/adminPasswordResetApi', () => ({
  validateAdminPasswordResetToken: (...args: unknown[]) => validateAdminPasswordResetTokenMock(...args),
  confirmAdminPasswordReset: (...args: unknown[]) => confirmAdminPasswordResetMock(...args),
  resolveAdminPasswordResetError: (error: unknown) => resolveAdminPasswordResetErrorMock(error),
}));

jest.mock('@/components/admin/AdminLoadingState', () => ({
  __esModule: true,
  default: ({ ariaLabel }: { ariaLabel: string }) => <div data-testid="admin-loading-state">{ariaLabel}</div>,
}));

describe('AdminResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation((message?: unknown, ...args: unknown[]) => {
      if (typeof message === 'string' && message.includes('not wrapped in act')) {
        return;
      }

      originalConsoleError(message, ...args);
    });
    useParamsMock.mockReturnValue({ locale: 'en' });
    useSearchParamsMock.mockReturnValue(new URLSearchParams('token=reset-token'));
    validateAdminPasswordResetTokenMock.mockResolvedValue({ status: 'success', locale: 'en' });
    confirmAdminPasswordResetMock.mockResolvedValue(true);
    resolveAdminPasswordResetErrorMock.mockReturnValue({
      kind: 'api',
      code: 'ADMIN_PASSWORD_RESET_FAILED',
      message: 'reset failed',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  const waitForPasswordForm = async () => {
    await waitFor(() => {
      expect(validateAdminPasswordResetTokenMock).toHaveBeenCalledWith('reset-token', 'en');
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    return screen.findByLabelText('adminPasswordReset.reset.password');
  };

  const renderPage = async () => {
    await act(async () => {
      render(<AdminResetPasswordPage />);
    });
  };

  it('loads token state and submits new password', async () => {
    jest.useFakeTimers();
    await renderPage();

    await waitForPasswordForm();

    fireEvent.change(screen.getByLabelText('adminPasswordReset.reset.password'), {
      target: { value: 'new-password' },
    });
    fireEvent.change(screen.getByLabelText('adminPasswordReset.reset.confirmPassword'), {
      target: { value: 'new-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /adminPasswordReset.reset.submit/i }));

    await waitFor(() => {
      expect(confirmAdminPasswordResetMock).toHaveBeenCalledWith('reset-token', 'en', 'new-password', 'new-password');
    });

    await waitFor(() => {
      expect(screen.getByText('adminPasswordReset.reset.success')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /adminPasswordReset.reset.backToLogin/i })).toHaveAttribute(
      'href',
      '/en/admin/login',
    );

    await act(async () => {
      await jest.advanceTimersByTimeAsync(3500);
    });

    expect(screen.queryByText('adminPasswordReset.reset.success')).not.toBeInTheDocument();
  });

  it('renders expired state when token is expired', async () => {
    validateAdminPasswordResetTokenMock.mockResolvedValue({ status: 'expired', locale: 'en' });

    await renderPage();

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    expect(screen.getByText('adminPasswordReset.reset.expired')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /adminPasswordReset.reset.requestAnother/i })).toHaveAttribute(
      'href',
      '/en/admin/forgot-password',
    );
  });

  it('renders invalid state when token is missing', async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams());

    await renderPage();

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    expect(validateAdminPasswordResetTokenMock).not.toHaveBeenCalled();
    expect(screen.getByText('adminPasswordReset.reset.invalid')).toBeInTheDocument();
  });

  it('renders invalid state when token validation returns an unknown status', async () => {
    validateAdminPasswordResetTokenMock.mockResolvedValue({ status: 'failed', locale: 'en' });

    await renderPage();

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    expect(screen.getByText('adminPasswordReset.reset.invalid')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /adminPasswordReset.reset.requestAnother/i })).toHaveAttribute(
      'href',
      '/en/admin/forgot-password',
    );
  });

  it('shows validation feedback before submitting mismatched passwords', async () => {
    await renderPage();

    await waitForPasswordForm();

    fireEvent.change(screen.getByLabelText('adminPasswordReset.reset.password'), {
      target: { value: 'new-password' },
    });
    fireEvent.change(screen.getByLabelText('adminPasswordReset.reset.confirmPassword'), {
      target: { value: 'different-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /adminPasswordReset.reset.submit/i }));

    expect(screen.getByText('adminPasswordReset.reset.validation.confirmMismatch')).toBeInTheDocument();
    expect(confirmAdminPasswordResetMock).not.toHaveBeenCalled();
  });

  it('shows touched validation on blur for password and confirm password fields', async () => {
    await renderPage();

    await waitForPasswordForm();

    const passwordInput = screen.getByLabelText('adminPasswordReset.reset.password');
    const confirmPasswordInput = screen.getByLabelText('adminPasswordReset.reset.confirmPassword');

    fireEvent.blur(passwordInput);
    fireEvent.blur(confirmPasswordInput);

    expect(screen.getByText('adminPasswordReset.reset.validation.passwordRequired')).toBeInTheDocument();
    expect(screen.getByText('adminPasswordReset.reset.validation.confirmRequired')).toBeInTheDocument();
  });

  it('shows API error when password reset submission fails', async () => {
    confirmAdminPasswordResetMock.mockRejectedValue(new Error('boom'));
    resolveAdminPasswordResetErrorMock.mockReturnValue({
      kind: 'api',
      code: 'ADMIN_PASSWORD_RESET_TOKEN_INVALID',
      message: 'token invalid',
    });

    await renderPage();

    await waitForPasswordForm();

    fireEvent.click(screen.getByRole('button', { name: /adminPasswordReset.reset.showPassword/i }));
    fireEvent.click(screen.getByRole('button', { name: /adminPasswordReset.reset.showConfirmPassword/i }));

    expect(screen.getByLabelText('adminPasswordReset.reset.password')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('adminPasswordReset.reset.confirmPassword')).toHaveAttribute('type', 'text');

    fireEvent.change(screen.getByLabelText('adminPasswordReset.reset.password'), {
      target: { value: 'new-password' },
    });
    fireEvent.change(screen.getByLabelText('adminPasswordReset.reset.confirmPassword'), {
      target: { value: 'new-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /adminPasswordReset.reset.submit/i }));

    await waitFor(() => {
      expect(screen.getByText('token invalid')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('adminPasswordReset.reset.password'), {
      target: { value: 'new-password-2' },
    });

    await waitFor(() => {
      expect(screen.queryByText('token invalid')).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('adminPasswordReset.reset.confirmPassword'), {
      target: { value: 'new-password-2' },
    });

    expect(screen.queryByText('token invalid')).not.toBeInTheDocument();
  });

  it('shows network error when token validation fails', async () => {
    validateAdminPasswordResetTokenMock.mockRejectedValue(new Error('network'));
    resolveAdminPasswordResetErrorMock.mockReturnValue({
      kind: 'network',
      code: 'NETWORK_ERROR',
      message: 'network failed',
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    expect(screen.getByText('adminPasswordReset.errors.network')).toBeInTheDocument();
    expect(screen.getByText('adminPasswordReset.reset.invalid')).toBeInTheDocument();
  });

  it('shows only back-to-login action after a successful reset', async () => {
    await renderPage();

    await waitForPasswordForm();

    fireEvent.change(screen.getByLabelText('adminPasswordReset.reset.password'), {
      target: { value: 'new-password' },
    });
    fireEvent.change(screen.getByLabelText('adminPasswordReset.reset.confirmPassword'), {
      target: { value: 'new-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /adminPasswordReset.reset.submit/i }));

    await waitFor(() => {
      expect(screen.getByText('adminPasswordReset.reset.success')).toBeInTheDocument();
    });

    expect(screen.queryByRole('link', { name: /adminPasswordReset.reset.requestAnother/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /adminPasswordReset.reset.backToLogin/i })).toHaveAttribute(
      'href',
      '/en/admin/login',
    );
  });
});
