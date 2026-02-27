import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import AppErrorToasts from '@/components/common/AppErrorToasts';
import { AppError, publishAppError } from '@/lib/errors/appError';

jest.mock('react-bootstrap/ToastContainer', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="toast-container">{children}</div>,
}));

jest.mock('react-bootstrap/Toast', () => {
  const Toast = ({
    children,
    onClose,
    className,
  }: {
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
  }) => (
    <div data-testid="toast" className={className}>
      <button type="button" onClick={onClose}>
        close
      </button>
      {children}
    </div>
  );
  Toast.Header = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  Toast.Body = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return { __esModule: true, default: Toast };
});

describe('AppErrorToasts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a toast for app errors and deduplicates rapid repeats', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    render(<AppErrorToasts />);

    const error = new AppError('Network down', 'NETWORK_ERROR');

    act(() => {
      publishAppError(error, { source: 'client' });
      publishAppError(error, { source: 'client' });
    });

    expect(screen.getAllByTestId('toast')).toHaveLength(1);
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Network down')).toBeInTheDocument();
  });

  it('removes toast when closed', () => {
    render(<AppErrorToasts />);

    act(() => {
      publishAppError(new AppError('Oops', 'INTERNAL_ERROR'), { source: 'client' });
    });

    fireEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });
});
