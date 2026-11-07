import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminAccountSecuritySection from '@/components/admin/account/AdminAccountSecuritySection';
import type { AdminPasswordStrength } from '@/lib/adminPassword';
import type { AdminSessionProfile } from '@/lib/adminSessionProfileCache';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span aria-hidden="true" />,
}));

type Props = React.ComponentProps<typeof AdminAccountSecuritySection>;

const adminUser: AdminSessionProfile = {
  id: 'admin-1',
  name: 'Admin',
  username: 'admin',
  avatarUrl: null,
  email: 'admin@example.test',
  pendingEmail: null,
  pendingEmailExpiresAt: null,
  googleLinked: false,
  googleEmail: null,
  googleLinkedAt: null,
  githubLinked: false,
  githubEmail: null,
  githubLinkedAt: null,
  roles: ['admin'],
};

const passwordStrength: AdminPasswordStrength = { score: 3, tone: 'good' };

const makeProps = (overrides: Partial<Props> = {}): Props => ({
  adminUser,
  t: (key, options) => {
    const values = Object.entries(options ?? {})
      .filter(([option]) => option !== 'ns')
      .map(([, value]) => String(value));
    return values.length > 0 ? `${key}: ${values.join(', ')}` : key;
  },
  formatSessionDate: value => `date:${value}`,
  securityErrorMessage: '',
  securitySuccessMessage: '',
  googleConnectMessage: '',
  googleConnectMessageVariant: 'success',
  githubConnectMessage: '',
  githubConnectMessageVariant: 'success',
  googleActionErrorMessage: '',
  githubActionErrorMessage: '',
  isSecurityPasswordExpanded: false,
  onToggleSecurityPassword: jest.fn(),
  onManageEmail: jest.fn(),
  handleSecuritySubmit: jest.fn(event => event.preventDefault()),
  currentPassword: 'current-secret',
  newPassword: 'new-secret',
  confirmPassword: 'new-secret',
  handleCurrentPasswordChange: jest.fn(),
  handleNewPasswordChange: jest.fn(),
  handleConfirmPasswordChange: jest.fn(),
  showCurrentPassword: false,
  showNewPassword: false,
  showConfirmPassword: false,
  onToggleCurrentPassword: jest.fn(),
  onToggleNewPassword: jest.fn(),
  onToggleConfirmPassword: jest.fn(),
  showCurrentPasswordError: false,
  showNewPasswordError: false,
  showConfirmPasswordError: false,
  securityCurrentPasswordError: '',
  securityNewPasswordError: '',
  securityConfirmPasswordError: '',
  passwordStrength,
  isSecuritySubmitting: false,
  googleAuthStatus: { enabled: true, loginAvailable: false },
  githubAuthStatus: { enabled: true, loginAvailable: false },
  isGoogleAuthStatusLoading: false,
  isGithubAuthStatusLoading: false,
  isGoogleConnectSubmitting: false,
  isGoogleDisconnectSubmitting: false,
  isGithubConnectSubmitting: false,
  isGithubDisconnectSubmitting: false,
  onGoogleConnect: jest.fn(),
  onOpenGoogleDisconnectModal: jest.fn(),
  onCloseGoogleDisconnectModal: jest.fn(),
  onGoogleDisconnect: jest.fn(),
  onGithubConnect: jest.fn(),
  onOpenGithubDisconnectModal: jest.fn(),
  onCloseGithubDisconnectModal: jest.fn(),
  onGithubDisconnect: jest.fn(),
  isGoogleDisconnectModalOpen: false,
  isGithubDisconnectModalOpen: false,
  ...overrides,
});

describe('AdminAccountSecuritySection', () => {
  it('shows email and password controls and validates password form interactions', () => {
    const props = makeProps();
    const { rerender } = render(<AdminAccountSecuritySection {...props} />);

    expect(screen.getByText('admin@example.test')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.connectedAccounts.actions.manage' }));
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.connectedAccounts.password.action' }));
    expect(props.onManageEmail).toHaveBeenCalledTimes(1);
    expect(props.onToggleSecurityPassword).toHaveBeenCalledTimes(1);

    rerender(
      <AdminAccountSecuritySection
        {...props}
        isSecurityPasswordExpanded
        showCurrentPasswordError
        showNewPasswordError
        showConfirmPasswordError
        securityCurrentPasswordError="Current password is incorrect"
        securityNewPasswordError="New password is too short"
        securityConfirmPasswordError="Passwords do not match"
      />,
    );

    const currentPassword = screen.getByLabelText('adminAccount.form.currentPassword');
    const newPassword = screen.getByLabelText('adminAccount.form.newPassword');
    const confirmPassword = screen.getByLabelText('adminAccount.form.confirmPassword');
    expect(currentPassword).toHaveAttribute('type', 'password');
    expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
    expect(screen.getByText('New password is too short')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    fireEvent.change(currentPassword, { target: { value: 'current-updated' } });
    fireEvent.change(newPassword, { target: { value: 'new-updated' } });
    fireEvent.change(confirmPassword, { target: { value: 'confirm-updated' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.form.showPassword' })[0]);
    expect(props.handleCurrentPasswordChange).toHaveBeenCalled();
    expect(props.handleNewPasswordChange).toHaveBeenCalled();
    expect(props.handleConfirmPasswordChange).toHaveBeenCalled();
    expect(props.onToggleCurrentPassword).toHaveBeenCalledTimes(1);

    const form = currentPassword.closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    expect(props.handleSecuritySubmit).toHaveBeenCalled();

    rerender(
      <AdminAccountSecuritySection
        {...props}
        isSecurityPasswordExpanded
        isSecuritySubmitting
        showCurrentPassword
        showNewPassword
        showConfirmPassword
        showCurrentPasswordError={false}
        showNewPasswordError={false}
        showConfirmPasswordError={false}
      />,
    );

    expect(screen.getByLabelText('adminAccount.form.currentPassword')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('adminAccount.form.newPassword')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('adminAccount.form.confirmPassword')).toHaveAttribute('type', 'text');
    expect(screen.getAllByRole('button', { name: 'adminAccount.form.hidePassword' })).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'adminAccount.form.submitting' })).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.form.hidePassword' })[1]);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.form.hidePassword' })[2]);
    expect(props.onToggleNewPassword).toHaveBeenCalledTimes(1);
    expect(props.onToggleConfirmPassword).toHaveBeenCalledTimes(1);
  });

  it('renders connected, loading, unavailable, alert, and disconnect confirmation states', () => {
    const connectedUser: AdminSessionProfile = {
      ...adminUser,
      pendingEmail: 'pending@example.test',
      googleLinked: true,
      googleEmail: null,
      googleLinkedAt: '2026-10-01T09:00:00Z',
      githubLinked: true,
      githubEmail: 'github@example.test',
      githubLinkedAt: '2026-10-02T09:00:00Z',
    };
    const props = makeProps({
      adminUser: connectedUser,
      securityErrorMessage: 'Security failed',
      securitySuccessMessage: 'Security updated',
      googleConnectMessage: 'Google connected',
      googleConnectMessageVariant: 'info',
      githubConnectMessage: 'GitHub connected',
      googleActionErrorMessage: 'Google disconnect failed',
      githubActionErrorMessage: 'GitHub disconnect failed',
      googleAuthStatus: { enabled: true, loginAvailable: true },
      githubAuthStatus: { enabled: false, loginAvailable: false },
      isGithubAuthStatusLoading: false,
      isGoogleDisconnectModalOpen: true,
      isGithubDisconnectModalOpen: true,
      isGoogleDisconnectSubmitting: true,
      isGithubDisconnectSubmitting: true,
    });
    const { rerender } = render(<AdminAccountSecuritySection {...props} />);

    expect(screen.getByText('pending@example.test')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.account.email.pending.copy: pending@example.test')).toBeInTheDocument();
    expect(screen.getByText('Security failed')).toBeInTheDocument();
    expect(screen.getByText('Security updated')).toBeInTheDocument();
    expect(screen.getByText('Google connected')).toBeInTheDocument();
    expect(screen.getByText('GitHub connected')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.connectedAccounts.google.connectedBadge')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.connectedAccounts.google.loginEnabled')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.connectedAccounts.github.connectedBadge')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.connectedAccounts.github.unavailableBadge')).toBeInTheDocument();
    expect(
      screen.getByText('adminAccount.connectedAccounts.google.linkedAt: date:2026-10-01T09:00:00Z'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('adminAccount.connectedAccounts.github.linkedAt: date:2026-10-02T09:00:00Z'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Google disconnect failed')).toHaveLength(2);
    expect(screen.getAllByText('GitHub disconnect failed')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'adminAccount.connectedAccounts.google.disconnecting' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.connectedAccounts.google.disconnecting' }));
    expect(props.onGoogleDisconnect).not.toHaveBeenCalled();

    rerender(
      <AdminAccountSecuritySection
        {...props}
        isGoogleDisconnectSubmitting={false}
        isGithubDisconnectSubmitting={false}
      />,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.connectedAccounts.google.disconnect' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.connectedAccounts.github.disconnect' })[0]);
    expect(props.onOpenGoogleDisconnectModal).toHaveBeenCalledTimes(1);
    expect(props.onOpenGithubDisconnectModal).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminCommon.actions.cancel' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminCommon.actions.cancel' })[1]);
    expect(props.onCloseGoogleDisconnectModal).toHaveBeenCalledTimes(1);
    expect(props.onCloseGithubDisconnectModal).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.connectedAccounts.google.disconnect' })[1]);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.connectedAccounts.github.disconnect' })[1]);
    expect(props.onGoogleDisconnect).toHaveBeenCalledTimes(1);
    expect(props.onGithubDisconnect).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('button', { name: 'adminCommon.actions.cancel' })).toHaveLength(2);
  });

  it('offers connect actions for enabled accounts and hides unavailable providers', () => {
    const props = makeProps({
      googleAuthStatus: { enabled: true, loginAvailable: false },
      githubAuthStatus: { enabled: false, loginAvailable: false },
      isGoogleAuthStatusLoading: true,
      isGithubAuthStatusLoading: false,
    });
    const { rerender } = render(<AdminAccountSecuritySection {...props} />);

    expect(screen.getByText('adminCommon.status.loading')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.connectedAccounts.github.unavailableBadge')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'adminAccount.connectedAccounts.google.connect' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'adminAccount.connectedAccounts.github.connect' }),
    ).not.toBeInTheDocument();

    rerender(
      <AdminAccountSecuritySection
        {...props}
        isGoogleAuthStatusLoading={false}
        isGithubAuthStatusLoading={false}
        isGoogleConnectSubmitting
        isGithubConnectSubmitting
      />,
    );
    expect(screen.getByRole('button', { name: 'adminAccount.connectedAccounts.google.connect' })).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'adminAccount.connectedAccounts.github.connect' }),
    ).not.toBeInTheDocument();

    rerender(
      <AdminAccountSecuritySection
        {...props}
        isGoogleAuthStatusLoading={false}
        isGoogleConnectSubmitting={false}
        googleAuthStatus={{ enabled: true, loginAvailable: true }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.connectedAccounts.google.connect' }));
    expect(props.onGoogleConnect).toHaveBeenCalledTimes(1);
  });
});
