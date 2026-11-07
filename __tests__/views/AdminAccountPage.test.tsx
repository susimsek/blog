import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import AdminAccountPage from '@/views/AdminAccountPage';

const mockChangeAdminName = jest.fn();
const mockIsAdminSessionError = jest.fn();
const mockResolveAdminError = jest.fn();
const mockRouterPush = jest.fn();
const mockUseBootstrap = jest.fn();
const mockUseAvatar = jest.fn();
const mockUseAccount = jest.fn();
const mockUseEmail = jest.fn();
const mockUseSecurity = jest.fn();
const mockUseNewsletter = jest.fn();
const mockUseComments = jest.fn();
const mockUseErrors = jest.fn();
const mockTranslate = (key: string) => key;

jest.mock('@/lib/adminApi', () => ({
  ...jest.requireActual('@/lib/adminApi'),
  changeAdminName: (...args: unknown[]) => mockChangeAdminName(...args),
  isAdminSessionError: (...args: unknown[]) => mockIsAdminSessionError(...args),
  resolveAdminError: (...args: unknown[]) => mockResolveAdminError(...args),
}));
jest.mock('next/navigation', () => ({
  usePathname: () => '/en/admin/settings/newsletter',
  useParams: () => ({ locale: 'en' }),
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: mockTranslate, i18n: { changeLanguage: jest.fn() } }),
}));
jest.mock('@/views/admin-account/useAdminAccountBootstrap', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseBootstrap(...args),
}));
jest.mock('@/views/admin-account/useAdminAccountAvatarSection', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseAvatar(...args),
}));
jest.mock('@/views/admin-account/useAdminAccountAccountSection', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseAccount(...args),
}));
jest.mock('@/views/admin-account/useAdminAccountEmailSection', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseEmail(...args),
}));
jest.mock('@/views/admin-account/useAdminAccountSecuritySection', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseSecurity(...args),
}));
jest.mock('@/views/admin-account/useAdminAccountNewsletterSection', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseNewsletter(...args),
}));
jest.mock('@/views/admin-account/useAdminCommentsSection', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseComments(...args),
}));
jest.mock('@/views/admin-account/useAdminErrorsSection', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseErrors(...args),
}));

jest.mock('@/components/admin/account/AdminAccountAccountSection', () => ({
  __esModule: true,
  default: () => 'account-section-placeholder',
}));
jest.mock('@/components/admin/account/AdminAccountEmailSection', () => ({
  __esModule: true,
  default: () => 'email-section-placeholder',
}));
jest.mock('@/components/admin/account/AdminAccountSessionsSection', () => ({
  __esModule: true,
  default: () => 'sessions-section-placeholder',
}));
jest.mock('@/components/admin/account/AdminAccountNewsletterSection', () => ({
  __esModule: true,
  default: ({
    onNewsletterTabSelect,
    renderAsyncSectionContent,
    isNewsletterSummaryLoading,
    newsletterSubscriberSummary,
    isNewsletterLoading,
    newsletterSubscribers,
  }: {
    onNewsletterTabSelect: (key: string | null) => void;
    renderAsyncSectionContent: (options: {
      isLoading: boolean;
      loadingLabel: string;
      isEmpty: boolean;
      emptyMessage: string;
      children: React.ReactNode;
    }) => React.ReactNode;
    isNewsletterSummaryLoading: boolean;
    newsletterSubscriberSummary: unknown;
    isNewsletterLoading: boolean;
    newsletterSubscribers?: unknown[];
  }) => (
    <div>
      <span>newsletter-section-placeholder</span>
      <button onClick={() => onNewsletterTabSelect('subscribers')}>Choose subscribers</button>
      <button onClick={() => onNewsletterTabSelect(null)}>Choose newsletter</button>
      {renderAsyncSectionContent({
        isLoading: isNewsletterSummaryLoading,
        loadingLabel: 'summary loading',
        isEmpty: !newsletterSubscriberSummary,
        emptyMessage: 'summary empty',
        children: <span>summary loaded</span>,
      })}
      {renderAsyncSectionContent({
        isLoading: isNewsletterLoading,
        loadingLabel: 'subscriber loading',
        isEmpty: (newsletterSubscribers ?? []).length === 0,
        emptyMessage: 'subscribers empty',
        children: <span>subscribers loaded</span>,
      })}
    </div>
  ),
}));
jest.mock('@/components/admin/account/AdminAccountCommentsSection', () => ({
  __esModule: true,
  default: () => 'comments-section-placeholder',
}));
jest.mock('@/components/admin/account/AdminAccountErrorsSection', () => ({
  __esModule: true,
  default: () => 'errors-section-placeholder',
}));
jest.mock('@/components/admin/account/AdminAccountSecuritySection', () => ({
  __esModule: true,
  default: () => 'security-section-placeholder',
}));
jest.mock('@/components/admin/AdminContentManagementPanel', () => ({
  __esModule: true,
  default: ({
    formatDate,
    onSessionExpired,
  }: {
    formatDate: (value: string) => string;
    onSessionExpired: () => void;
  }) => {
    formatDate('invalid date');
    formatDate('2026-01-01T12:00:00Z');
    onSessionExpired();
    return 'content-section-placeholder';
  },
}));

const mockAdminUser = {
  id: 'admin-1',
  name: 'Initial Admin',
  username: 'initial-admin',
  avatarUrl: null,
  email: 'admin@example.com',
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

const mockBootstrapState = {
  adminUser: mockAdminUser,
  isLoading: false,
  activeSessions: [],
  setActiveSessions: jest.fn(),
  isSessionsLoading: false,
  sessionErrorMessage: '',
  setSessionErrorMessage: jest.fn(),
  googleAuthStatus: { enabled: false, loginAvailable: false },
  setGoogleAuthStatus: jest.fn(),
  githubAuthStatus: { enabled: false, loginAvailable: false },
  setGithubAuthStatus: jest.fn(),
  isGoogleAuthStatusLoading: false,
  isGithubAuthStatusLoading: false,
  googleConnectMessage: '',
  setGoogleConnectMessage: jest.fn(),
  githubConnectMessage: '',
  setGithubConnectMessage: jest.fn(),
  googleConnectMessageVariant: 'info',
  setGoogleConnectMessageVariant: jest.fn(),
  githubConnectMessageVariant: 'info',
  setGithubConnectMessageVariant: jest.fn(),
  redirectToAdminLoginRef: { current: jest.fn() },
  handleAdminSessionExpired: jest.fn(),
  syncAdminUser: jest.fn(),
  patchAdminUser: jest.fn(),
};

const mockAvatarState = {
  avatarErrorMessage: '',
  avatarSuccessMessage: '',
  maxAvatarFileSizeMb: 5,
  isAvatarSubmitting: false,
  avatarPendingAction: null,
  avatarFileInputRef: { current: null },
  openAvatarPicker: jest.fn(),
  handleRemoveAvatar: jest.fn(),
  handleAvatarFileChange: jest.fn(),
  isAvatarCropModalOpen: false,
  closeAvatarCropModal: jest.fn(),
  isAvatarCropDragging: false,
  isAvatarCropResizing: false,
  avatarCropStageRef: { current: null },
  avatarCropStageStyle: {},
  avatarCropSource: '',
  avatarCropImageSize: null,
  avatarCropImageStyle: {},
  avatarCropBoxStyle: {},
  handleAvatarCropPointerDown: jest.fn(),
  handleAvatarCropPointerMove: jest.fn(),
  endAvatarCropDrag: jest.fn(),
  handleAvatarCropResizeStart: jest.fn(),
  isAvatarCropSaving: false,
  handleAvatarCropSave: jest.fn(),
};

describe('AdminAccountPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBootstrap.mockReturnValue(mockBootstrapState);
    mockUseAvatar.mockReturnValue(mockAvatarState);
    mockUseAccount.mockReturnValue({});
    mockUseEmail.mockReturnValue({});
    mockUseSecurity.mockReturnValue({});
    mockUseNewsletter.mockReturnValue({});
    mockUseComments.mockReturnValue({});
    mockUseErrors.mockReturnValue({});
    mockIsAdminSessionError.mockReturnValue(false);
    mockResolveAdminError.mockReturnValue({ kind: 'unknown', message: 'Profile update failed' });
    mockRouterPush.mockReset();
  });

  it('renders loading and unauthenticated states', () => {
    mockUseBootstrap.mockReturnValue({ ...mockBootstrapState, isLoading: true, adminUser: null });
    const loadingView = renderWithProviders(<AdminAccountPage section="profile" />);
    expect(loadingView.container.querySelector('.admin-account-loading-card')).toBeInTheDocument();

    loadingView.rerender(<AdminAccountPage section="profile" />);
    expect(loadingView.container.querySelector('.admin-account-loading-card')).toBeInTheDocument();

    mockUseBootstrap.mockReturnValue({ ...mockBootstrapState, adminUser: null });
    const unauthenticatedView = renderWithProviders(<AdminAccountPage section="profile" />);
    expect(unauthenticatedView.container.firstChild).toBeNull();
  });

  it('validates and updates the profile name', async () => {
    mockChangeAdminName.mockResolvedValue({
      success: true,
      user: { name: 'Updated Admin' },
    });

    renderWithProviders(<AdminAccountPage section="profile" />);

    const nameInput = screen.getByLabelText('adminAccount.profile.name.label');
    fireEvent.submit(nameInput.closest('form')!);
    expect(await screen.findByText('adminAccount.validation.nameRequired')).toBeInTheDocument();
    expect(mockChangeAdminName).not.toHaveBeenCalled();

    fireEvent.change(nameInput, { target: { value: 'Updated Admin' } });
    fireEvent.submit(nameInput.closest('form')!);

    await waitFor(() => {
      expect(mockChangeAdminName).toHaveBeenCalledWith({ name: 'Updated Admin' });
      expect(screen.getByText('adminAccount.profile.success.nameUpdated')).toBeInTheDocument();
    });
  });

  it('surfaces profile update errors and redirects when the session expires', async () => {
    mockChangeAdminName.mockResolvedValue({ success: false });
    const failed = renderWithProviders(<AdminAccountPage section="profile" />);
    const nameInput = screen.getByLabelText('adminAccount.profile.name.label');
    fireEvent.change(nameInput, { target: { value: 'Changed Name' } });
    fireEvent.submit(nameInput.closest('form')!);
    expect(await screen.findByText('Profile update failed')).toBeInTheDocument();
    failed.unmount();

    mockIsAdminSessionError.mockReturnValue(true);
    mockChangeAdminName.mockRejectedValue(new Error('expired'));
    const expired = renderWithProviders(<AdminAccountPage section="profile" />);
    const expiredNameInput = screen.getByLabelText('adminAccount.profile.name.label');
    fireEvent.change(expiredNameInput, { target: { value: 'Changed Name' } });
    fireEvent.submit(expiredNameInput.closest('form')!);
    await waitFor(() => expect(mockBootstrapState.redirectToAdminLoginRef.current).toHaveBeenCalled());
    expired.unmount();
  });

  it('uses the submitted name when the API omits a user and handles an empty cached user', async () => {
    mockChangeAdminName.mockResolvedValue({ success: true });
    const view = renderWithProviders(<AdminAccountPage section="profile" />);
    const nameInput = screen.getByLabelText('adminAccount.profile.name.label');
    fireEvent.change(nameInput, { target: { value: 'Fallback Admin' } });
    fireEvent.submit(nameInput.closest('form')!);

    await waitFor(() => expect(screen.getByText('adminAccount.profile.success.nameUpdated')).toBeInTheDocument());

    const updateUser = mockBootstrapState.patchAdminUser.mock.calls[0][0] as (
      previous: typeof mockAdminUser | null,
    ) => typeof mockAdminUser | null;
    expect(updateUser(null)).toBeNull();
    expect(updateUser(mockAdminUser)).toEqual({ ...mockAdminUser, name: 'Fallback Admin' });
    view.unmount();
  });

  it('renders appearance options and changes the selected theme', () => {
    renderWithProviders(<AdminAccountPage section="appearance" />);

    const systemOption = screen.getByRole('radio', { name: /adminAccount.account.appearance.options.system/i });
    fireEvent.click(systemOption);
    expect(systemOption).toHaveAttribute('aria-checked', 'true');

    const lightOption = screen.getByRole('radio', { name: /adminAccount.account.appearance.options.light/i });
    fireEvent.click(lightOption);

    expect(lightOption).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /adminAccount.account.appearance.options.system/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('renders newsletter loading and empty states and navigates to subscribers', () => {
    mockUseNewsletter.mockReturnValue({
      isNewsletterSummaryLoading: true,
      newsletterSubscriberSummary: null,
      isNewsletterLoading: false,
      newsletterSubscribers: [],
    });
    renderWithProviders(<AdminAccountPage section="newsletter" />);

    expect(screen.getByLabelText('summary loading')).toBeInTheDocument();
    expect(screen.getByText('subscribers empty')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Choose subscribers' }));
    expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining('subscribers'));

    fireEvent.click(screen.getByRole('button', { name: 'Choose newsletter' }));
    expect(mockRouterPush).toHaveBeenLastCalledWith(expect.stringContaining('newsletter'));
    expect(mockRouterPush).not.toHaveBeenLastCalledWith(expect.stringContaining('subscribers'));

    mockUseNewsletter.mockReturnValue({
      isNewsletterSummaryLoading: false,
      newsletterSubscriberSummary: { total: 1 },
      isNewsletterLoading: false,
      newsletterSubscribers: [{ id: 'subscriber-1' }],
    });
    const loaded = renderWithProviders(<AdminAccountPage section="newsletter" />);
    expect(screen.getByText('summary loaded')).toBeInTheDocument();
    expect(screen.getByText('subscribers loaded')).toBeInTheDocument();
    loaded.unmount();
  });

  it.each([
    ['account', 'account-section-placeholder'],
    ['email', 'email-section-placeholder'],
    ['sessions', 'sessions-section-placeholder'],
    ['newsletter', 'newsletter-section-placeholder'],
    ['newsletterSubscribers', 'newsletter-section-placeholder'],
    ['comments', 'comments-section-placeholder'],
    ['errors', 'errors-section-placeholder'],
    ['security', 'security-section-placeholder'],
    ['content', 'content-section-placeholder'],
  ] as const)('renders the %s route section', (section, placeholder) => {
    renderWithProviders(<AdminAccountPage section={section} />);
    expect(screen.getByText(placeholder)).toBeInTheDocument();
  });
});
