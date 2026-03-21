import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminForgotPasswordPage from '@/views/AdminForgotPasswordPage';

const useParamsMock = jest.fn();
const requestAdminPasswordResetMock = jest.fn();
const resolveAdminPasswordResetErrorMock = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
}));

jest.mock('@/lib/adminPasswordResetApi', () => ({
  requestAdminPasswordReset: (...args: unknown[]) => requestAdminPasswordResetMock(...args),
  resolveAdminPasswordResetError: (error: unknown) => resolveAdminPasswordResetErrorMock(error),
}));

describe('AdminForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParamsMock.mockReturnValue({ locale: 'en' });
    requestAdminPasswordResetMock.mockResolvedValue(true);
    resolveAdminPasswordResetErrorMock.mockReturnValue({
      kind: 'api',
      code: 'ADMIN_PASSWORD_RESET_FAILED',
      message: 'reset failed',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('submits reset request and shows generic success state', async () => {
    jest.useFakeTimers();
    render(<AdminForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('adminPasswordReset.request.email'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /adminPasswordReset.request.submit/i }));

    await waitFor(() => {
      expect(requestAdminPasswordResetMock).toHaveBeenCalledWith('admin@example.com', 'en');
    });

    await waitFor(() => {
      expect(screen.getByText('adminPasswordReset.request.success')).toBeInTheDocument();
    });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(3500);
    });

    expect(screen.queryByText('adminPasswordReset.request.success')).not.toBeInTheDocument();
  });

  it('shows validation error before submitting empty email', async () => {
    render(<AdminForgotPasswordPage />);

    fireEvent.click(screen.getByRole('button', { name: /adminPasswordReset.request.submit/i }));

    expect(screen.getByText('adminPasswordReset.request.validation.emailRequired')).toBeInTheDocument();
    expect(requestAdminPasswordResetMock).not.toHaveBeenCalled();
  });

  it('shows validation error for malformed email addresses', async () => {
    render(<AdminForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('adminPasswordReset.request.email'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /adminPasswordReset.request.submit/i }));

    expect(screen.getByText('adminPasswordReset.request.validation.emailInvalid')).toBeInTheDocument();
    expect(requestAdminPasswordResetMock).not.toHaveBeenCalled();
  });

  it('shows touched validation on blur and clears it after entering a valid email', async () => {
    render(<AdminForgotPasswordPage />);

    const emailInput = screen.getByLabelText('adminPasswordReset.request.email');

    fireEvent.blur(emailInput);
    expect(screen.getByText('adminPasswordReset.request.validation.emailRequired')).toBeInTheDocument();

    fireEvent.change(emailInput, {
      target: { value: 'admin@example.com' },
    });

    await waitFor(() => {
      expect(screen.queryByText('adminPasswordReset.request.validation.emailRequired')).not.toBeInTheDocument();
    });
  });

  it('shows API error from the reset request call', async () => {
    requestAdminPasswordResetMock.mockRejectedValue(new Error('boom'));
    resolveAdminPasswordResetErrorMock.mockReturnValue({
      kind: 'api',
      code: 'ADMIN_PASSWORD_RESET_EMAIL_INVALID',
      message: 'email invalid',
    });

    render(<AdminForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('adminPasswordReset.request.email'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /adminPasswordReset.request.submit/i }));

    await waitFor(() => {
      expect(screen.getByText('email invalid')).toBeInTheDocument();
    });
  });

  it('shows translated network error when request fails before response', async () => {
    requestAdminPasswordResetMock.mockRejectedValue(new Error('network'));
    resolveAdminPasswordResetErrorMock.mockReturnValue({
      kind: 'network',
      code: 'NETWORK_ERROR',
      message: 'network error',
    });

    render(<AdminForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('adminPasswordReset.request.email'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /adminPasswordReset.request.submit/i }));

    await waitFor(() => {
      expect(screen.getByText('adminPasswordReset.errors.network')).toBeInTheDocument();
    });
  });
});
