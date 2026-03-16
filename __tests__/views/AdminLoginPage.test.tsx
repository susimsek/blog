import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminLoginPage from '@/views/AdminLoginPage';

const replaceMock = jest.fn();
const useSearchParamsMock = jest.fn();
const useParamsMock = jest.fn();
const fetchAdminMeMock = jest.fn();
const fetchAdminGoogleAuthStatusMock = jest.fn();
const fetchAdminGithubAuthStatusMock = jest.fn();
const loginAdminMock = jest.fn();
const resolveAdminErrorMock = jest.fn();
const useAppSelectorMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn(), prefetch: jest.fn(), back: jest.fn() }),
  useSearchParams: () => useSearchParamsMock(),
  useParams: () => useParamsMock(),
}));

jest.mock('@/lib/adminApi', () => ({
  fetchAdminMe: () => fetchAdminMeMock(),
  fetchAdminGoogleAuthStatus: () => fetchAdminGoogleAuthStatusMock(),
  fetchAdminGithubAuthStatus: () => fetchAdminGithubAuthStatusMock(),
  loginAdmin: (...args: unknown[]) => loginAdminMock(...args),
  resolveAdminError: (error: unknown) => resolveAdminErrorMock(error),
}));

jest.mock('@/config/store', () => ({
  useAppSelector: (selector: (state: { voice: { isEnabled: boolean } }) => boolean) => useAppSelectorMock(selector),
}));

jest.mock('@/components/admin/AdminLoadingState', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <div data-testid="admin-loading-state">{label}</div>,
}));

describe('AdminLoginPage', () => {
  const originalAudio = global.Audio;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error> | undefined;

  beforeEach(async () => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const joined = args.map(value => (value instanceof Error ? value.message : String(value))).join(' ');

      if (joined.includes('Not implemented: navigation (except hash changes)')) {
        return;
      }

      if (joined.includes('not wrapped in act')) {
        return;
      }
    });
    useParamsMock.mockReturnValue({ locale: 'en' });
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
    fetchAdminMeMock.mockResolvedValue({ authenticated: false, user: null });
    fetchAdminGoogleAuthStatusMock.mockResolvedValue({ enabled: false, loginAvailable: false });
    fetchAdminGithubAuthStatusMock.mockResolvedValue({ enabled: false, loginAvailable: false });
    loginAdminMock.mockResolvedValue({ success: true, user: null });
    resolveAdminErrorMock.mockReturnValue({ kind: 'graphql', message: '' });
    useAppSelectorMock.mockImplementation((selector: (state: { voice: { isEnabled: boolean } }) => boolean) =>
      selector({ voice: { isEnabled: false } }),
    );
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    global.Audio = originalAudio;
  });

  it('renders GitHub login action when GitHub auth is available', async () => {
    fetchAdminGithubAuthStatusMock.mockResolvedValue({ enabled: true, loginAvailable: true });

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('adminLogin.github.submit')).toBeInTheDocument();
    });
  });

  it('shows GitHub callback error state from search params', async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams('github=not-linked'));
    fetchAdminGithubAuthStatusMock.mockResolvedValue({ enabled: true, loginAvailable: true });

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('adminLogin.github.notLinked')).toBeInTheDocument();
    });
  });

  it('shows the default provider failure message for unknown callback status', async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams('github=unexpected'));
    fetchAdminGithubAuthStatusMock.mockResolvedValue({ enabled: true, loginAvailable: true });

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    expect(screen.getByText('adminLogin.github.failed')).toBeInTheDocument();
  });

  it('redirects immediately when an authenticated admin session already exists', async () => {
    fetchAdminMeMock.mockResolvedValue({ authenticated: true, user: null });

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/en/admin');
    });
  });

  it('renders both social login buttons when Google and GitHub are available', async () => {
    fetchAdminGoogleAuthStatusMock.mockResolvedValue({ enabled: true, loginAvailable: true });
    fetchAdminGithubAuthStatusMock.mockResolvedValue({ enabled: true, loginAvailable: true });

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    expect(screen.getByText('adminLogin.google.submit')).toBeInTheDocument();
    expect(screen.getByText('adminLogin.github.submit')).toBeInTheDocument();
    expect(screen.getByText('adminLogin.google.or')).toBeInTheDocument();
  });

  it('allows clicking both social login buttons', async () => {
    fetchAdminGoogleAuthStatusMock.mockResolvedValue({ enabled: true, loginAvailable: true });
    fetchAdminGithubAuthStatusMock.mockResolvedValue({ enabled: true, loginAvailable: true });

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /adminLogin.google.submit/i }));
    fireEvent.click(screen.getByRole('button', { name: /adminLogin.github.submit/i }));
  });

  it('hides social login actions when auth status requests fail', async () => {
    fetchAdminGoogleAuthStatusMock.mockRejectedValue(new Error('google failed'));
    fetchAdminGithubAuthStatusMock.mockRejectedValue(new Error('github failed'));

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('adminLogin.google.submit')).not.toBeInTheDocument();
    expect(screen.queryByText('adminLogin.github.submit')).not.toBeInTheDocument();
    expect(screen.queryByText('adminLogin.google.or')).not.toBeInTheDocument();
  });

  it('shows validation errors and toggles password visibility', async () => {
    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /adminLogin.submit/i }));

    expect(screen.getByText('adminLogin.validation.emailRequired')).toBeInTheDocument();
    expect(screen.getByText('adminLogin.validation.passwordRequired')).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText('adminLogin.passwordPlaceholder');
    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: /adminLogin.showPassword/i }));
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /adminLogin.hidePassword/i })).toBeInTheDocument();
  });

  it('shows Google callback cancellation state from search params', async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams('google=cancelled'));
    fetchAdminGoogleAuthStatusMock.mockResolvedValue({ enabled: true, loginAvailable: true });

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    expect(screen.getByText('adminLogin.google.cancelled')).toBeInTheDocument();
  });

  it('shows network error message when login request fails with a network error', async () => {
    loginAdminMock.mockRejectedValue(new Error('network'));
    resolveAdminErrorMock.mockReturnValue({ kind: 'network', message: '' });

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('adminLogin.email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('adminLogin.password'), { target: { value: 'secret-password' } });
    fireEvent.click(screen.getByRole('button', { name: /adminLogin.submit/i }));

    await waitFor(() => {
      expect(screen.getByText('adminCommon.errors.network')).toBeInTheDocument();
    });
  });

  it('falls back to the default login error message when graphql error has no message', async () => {
    loginAdminMock.mockRejectedValue(new Error('graphql'));
    resolveAdminErrorMock.mockReturnValue({ kind: 'graphql', message: '   ' });

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('adminLogin.email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('adminLogin.password'), { target: { value: 'secret-password' } });
    fireEvent.click(screen.getByRole('button', { name: /adminLogin.submit/i }));

    await waitFor(() => {
      expect(screen.getByText('adminLogin.errorFallback')).toBeInTheDocument();
    });
  });

  it('shows fallback error when login response is unsuccessful', async () => {
    loginAdminMock.mockResolvedValue({ success: false, user: null });

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('adminLogin.email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('adminLogin.password'), { target: { value: 'secret-password' } });
    fireEvent.click(screen.getByRole('button', { name: /adminLogin.submit/i }));

    await waitFor(() => {
      expect(screen.getByText('adminLogin.errorFallback')).toBeInTheDocument();
    });
  });

  it('clears runtime error after editing the password field', async () => {
    loginAdminMock.mockRejectedValue(new Error('network'));
    resolveAdminErrorMock.mockReturnValue({ kind: 'network', message: '' });

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('adminLogin.email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('adminLogin.password'), { target: { value: 'secret-password' } });
    fireEvent.click(screen.getByRole('button', { name: /adminLogin.submit/i }));

    await waitFor(() => {
      expect(screen.getByText('adminCommon.errors.network')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('adminLogin.password'), { target: { value: 'updated-password' } });

    await waitFor(() => {
      expect(screen.queryByText('adminCommon.errors.network')).not.toBeInTheDocument();
    });
  });

  it('clears runtime error after editing the email field', async () => {
    loginAdminMock.mockRejectedValue(new Error('network'));
    resolveAdminErrorMock.mockReturnValue({ kind: 'network', message: '' });

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('adminLogin.email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('adminLogin.password'), { target: { value: 'secret-password' } });
    fireEvent.click(screen.getByRole('button', { name: /adminLogin.submit/i }));

    await waitFor(() => {
      expect(screen.getByText('adminCommon.errors.network')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('adminLogin.email'), { target: { value: 'updated-admin@example.com' } });

    await waitFor(() => {
      expect(screen.queryByText('adminCommon.errors.network')).not.toBeInTheDocument();
    });
  });

  it('submits remember me preference with credential login', async () => {
    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('adminLogin.rememberMe'));
    fireEvent.change(screen.getByLabelText('adminLogin.email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('adminLogin.password'), { target: { value: 'secret-password' } });
    fireEvent.click(screen.getByRole('button', { name: /adminLogin.submit/i }));

    await waitFor(() => {
      expect(loginAdminMock).toHaveBeenCalledWith('admin@example.com', 'secret-password', true);
    });
  });

  it('plays hover audio when voice is enabled and the submit button is hovered', async () => {
    const pauseMock = jest.fn();
    const playMock = jest.fn(() => Promise.resolve());
    const AudioMock = jest.fn(() => ({
      preload: '',
      volume: 0,
      playbackRate: 0,
      currentTime: 0,
      play: playMock,
      pause: pauseMock,
    }));
    useAppSelectorMock.mockImplementation((selector: (state: { voice: { isEnabled: boolean } }) => boolean) =>
      selector({ voice: { isEnabled: true } }),
    );
    // @ts-expect-error test override
    global.Audio = AudioMock;

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /adminLogin.submit/i });
    fireEvent.mouseEnter(submitButton);
    fireEvent.mouseLeave(submitButton);

    expect(AudioMock).toHaveBeenCalledWith('/sounds/rising-pops.mp3');
    expect(playMock).toHaveBeenCalled();
    expect(pauseMock).toHaveBeenCalled();
  });

  it('skips hover audio work when voice is disabled and no audio instance exists', async () => {
    const AudioMock = jest.fn();
    // @ts-expect-error test override
    global.Audio = AudioMock;

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /adminLogin.submit/i });
    fireEvent.mouseEnter(submitButton);
    fireEvent.mouseLeave(submitButton);

    expect(AudioMock).not.toHaveBeenCalled();
  });

  it('ignores duplicate submit attempts while login is pending', async () => {
    let resolveLogin: ((value: { success: boolean; user: null }) => void) | undefined;
    loginAdminMock.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveLogin = resolve;
        }),
    );

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('adminLogin.email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('adminLogin.password'), { target: { value: 'secret-password' } });

    const submitButton = screen.getByRole('button', { name: /adminLogin.submit/i });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(loginAdminMock).toHaveBeenCalledTimes(1);

    resolveLogin?.({ success: true, user: null });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/en/admin');
    });
  });

  it('does nothing when callback search params are unavailable', async () => {
    useSearchParamsMock.mockReturnValue(null);
    fetchAdminGoogleAuthStatusMock.mockResolvedValue({ enabled: true, loginAvailable: true });

    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('adminLogin.google.cancelled')).not.toBeInTheDocument();
    expect(screen.queryByText('adminLogin.google.failed')).not.toBeInTheDocument();
  });

  it('submits credentials and redirects to admin root', async () => {
    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('admin-loading-state')).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('adminLogin.email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('adminLogin.password'), { target: { value: 'secret-password' } });
    fireEvent.click(screen.getByRole('button', { name: /adminLogin.submit/i }));

    await waitFor(() => {
      expect(loginAdminMock).toHaveBeenCalledWith('admin@example.com', 'secret-password', false);
      expect(replaceMock).toHaveBeenCalledWith('/en/admin');
    });
  });
});
