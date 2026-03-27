import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import AdminEmailChangePage from '@/views/AdminEmailChangePage';

const useParamsMock = jest.fn();
const useSearchParamsMock = jest.fn();
const confirmAdminEmailChangeMock = jest.fn();
const resolveAdminEmailChangeErrorMock = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
  useSearchParams: () => useSearchParamsMock(),
}));

jest.mock('@/lib/adminEmailChangeApi', () => ({
  confirmAdminEmailChange: (...args: unknown[]) => confirmAdminEmailChangeMock(...args),
  resolveAdminEmailChangeError: (error: unknown) => resolveAdminEmailChangeErrorMock(error),
}));

jest.mock('@/components/admin/AdminLoadingState', () => ({
  __esModule: true,
  default: ({ ariaLabel }: { ariaLabel: string }) => <div data-testid="admin-loading-state">{ariaLabel}</div>,
}));

describe('AdminEmailChangePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParamsMock.mockReturnValue({ locale: 'en' });
    useSearchParamsMock.mockReturnValue(new URLSearchParams('token=confirm-token'));
    confirmAdminEmailChangeMock.mockResolvedValue({ status: 'success', locale: 'en' });
    resolveAdminEmailChangeErrorMock.mockReturnValue({
      kind: 'api',
      code: 'SERVICE_UNAVAILABLE',
      message: 'service unavailable',
    });
  });

  it('confirms email change token and renders success state', async () => {
    await act(async () => {
      render(<AdminEmailChangePage />);
    });

    await waitFor(() => {
      expect(confirmAdminEmailChangeMock).toHaveBeenCalledWith('confirm-token', 'en');
    });

    await waitFor(() => {
      expect(screen.getByText('adminEmailChange.status.success.title')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /adminEmailChange.actions.backToLogin/i })).toHaveAttribute(
      'href',
      '/en/admin/login',
    );
  });

  it('renders invalid state when token is missing', async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams());

    await act(async () => {
      render(<AdminEmailChangePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('adminEmailChange.status.invalid-link.title')).toBeInTheDocument();
    });

    expect(confirmAdminEmailChangeMock).not.toHaveBeenCalled();
  });

  it('renders expired state from backend status', async () => {
    confirmAdminEmailChangeMock.mockResolvedValue({ status: 'expired', locale: 'en' });

    await act(async () => {
      render(<AdminEmailChangePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('adminEmailChange.status.expired.title')).toBeInTheDocument();
    });
  });

  it('renders service unavailable state on request failure', async () => {
    confirmAdminEmailChangeMock.mockRejectedValue(new Error('boom'));
    resolveAdminEmailChangeErrorMock.mockReturnValue({
      kind: 'network',
      code: 'NETWORK_ERROR',
      message: 'network failed',
    });

    await act(async () => {
      render(<AdminEmailChangePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('adminEmailChange.errors.network')).toBeInTheDocument();
    });
    expect(screen.getByText('adminEmailChange.status.service-unavailable.title')).toBeInTheDocument();
  });
});
