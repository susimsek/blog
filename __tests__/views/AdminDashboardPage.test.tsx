import { fireEvent, render, screen, within } from '@testing-library/react';
import type { useAdminDashboardPageData } from '@/views/admin-dashboard/useAdminDashboardPageData';
import AdminDashboardPage from '@/views/AdminDashboardPage';

const mockUseDashboardPageData = jest.fn();
const mockIsMobile = jest.fn();
const mockSetDesktopSidebarOpen = jest.fn();
const mockSetMobileSidebarOpen = jest.fn();
const mockHandleCommentStatusUpdate = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/i18n/useLocale', () => ({ useLocale: () => 'en' }));
jest.mock('@/hooks/useMediaQuery', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockIsMobile(...args),
}));
jest.mock('@/views/admin-dashboard/useAdminDashboardPageData', () => ({
  useAdminDashboardPageData: (...args: unknown[]) => mockUseDashboardPageData(...args),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt={alt} {...props} />,
}));
jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
jest.mock('react-bootstrap/Offcanvas', () => {
  const Offcanvas = ({ show, children }: { show: boolean; children: React.ReactNode }) =>
    show ? <div data-testid="mobile-sidebar">{children}</div> : null;
  Offcanvas.Header = ({ children }: { children: React.ReactNode }) => <header>{children}</header>;
  Offcanvas.Body = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return { __esModule: true, default: Offcanvas };
});
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span>{icon}</span>,
}));
jest.mock('@/components/admin/dashboard/AdminDashboardLoadingShell', () => ({
  __esModule: true,
  default: ({ isDesktopSidebarVisible }: { isDesktopSidebarVisible: boolean }) => (
    <div data-testid="loading-shell" data-sidebar-visible={String(isDesktopSidebarVisible)} />
  ),
}));
jest.mock('@/components/admin/dashboard/AdminDashboardOverviewSection', () => ({
  __esModule: true,
  default: () => <div data-testid="overview-section" />,
}));
jest.mock('@/components/admin/dashboard/AdminDashboardAnalyticsSection', () => ({
  __esModule: true,
  default: ({ formatMetric, maxHits }: { formatMetric: (value: number) => string; maxHits: number }) => (
    <div data-testid="analytics-section">{formatMetric(maxHits)}</div>
  ),
}));
jest.mock('@/components/admin/dashboard/AdminDashboardContentHealthSection', () => ({
  __esModule: true,
  default: ({ formatDate }: { formatDate: (value: string) => string }) => (
    <div data-testid="content-health-section">
      {formatDate('invalid')}/{formatDate('2026-11-07')}
    </div>
  ),
}));
jest.mock('@/components/admin/dashboard/AdminDashboardCurationSection', () => ({
  __esModule: true,
  default: ({ formatMetric }: { formatMetric: (value: number) => string }) => (
    <div data-testid="curation-section">{formatMetric(1200)}</div>
  ),
}));
jest.mock('@/components/admin/dashboard/AdminDashboardPendingCommentsCard', () => ({
  __esModule: true,
  default: ({ handleCommentStatusUpdate }: { handleCommentStatusUpdate: (id: string, status: string) => void }) => (
    <button onClick={() => handleCommentStatusUpdate('comment-1', 'APPROVED')}>Moderate</button>
  ),
}));

const createPageState = (overrides: Record<string, unknown> = {}) =>
  ({
    adminUser: { name: 'Admin' },
    dashboard: {
      topViewedPosts: [{ id: 'viewed', title: 'Most viewed', hits: 42 }],
      topLikedPosts: [{ id: 'liked', title: 'Most liked', likes: 12 }],
    },
    contentSummary: {},
    pendingComments: [],
    isCommentsLoading: false,
    commentActionID: '',
    isLoading: false,
    isDesktopSidebarVisible: true,
    isMobileSidebarVisible: false,
    setIsDesktopSidebarOpen: mockSetDesktopSidebarOpen,
    setIsMobileSidebarOpen: mockSetMobileSidebarOpen,
    handleCommentStatusUpdate: mockHandleCommentStatusUpdate,
    ...overrides,
  }) as unknown as ReturnType<typeof useAdminDashboardPageData>;

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsMobile.mockReturnValue(false);
    mockUseDashboardPageData.mockReturnValue(createPageState());
  });

  it('renders the loading shell and skips the dashboard for a missing user', () => {
    mockUseDashboardPageData.mockReturnValue(createPageState({ isLoading: true, isDesktopSidebarVisible: false }));
    const { rerender } = render(<AdminDashboardPage />);
    expect(screen.getByTestId('loading-shell')).toHaveAttribute('data-sidebar-visible', 'false');

    mockUseDashboardPageData.mockReturnValue(createPageState({ adminUser: null }));
    rerender(<AdminDashboardPage />);
    expect(screen.queryByTestId('loading-shell')).not.toBeInTheDocument();
    expect(screen.queryByTestId('overview-section')).not.toBeInTheDocument();
  });

  it('formats dashboard metrics and dates and wires moderation actions', () => {
    render(<AdminDashboardPage />);

    expect(screen.getByTestId('analytics-section')).toHaveTextContent('42');
    expect(screen.getByTestId('curation-section')).toHaveTextContent('1,200');
    expect(screen.getByTestId('content-health-section')).toHaveTextContent('invalid/Nov 7, 2026');
    expect(screen.getByRole('navigation', { name: 'adminDashboard.sidebar.label' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Moderate' }));
    expect(mockHandleCommentStatusUpdate).toHaveBeenCalledWith('comment-1', 'APPROVED');
  });

  it('renders a mobile sidebar and closes it from its controls and navigation', () => {
    mockIsMobile.mockReturnValue(true);
    mockUseDashboardPageData.mockReturnValue(createPageState({ isMobileSidebarVisible: true }));
    render(<AdminDashboardPage />);

    expect(screen.getByTestId('mobile-sidebar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(mockSetMobileSidebarOpen).toHaveBeenCalledWith(false);
    fireEvent.click(within(screen.getByTestId('mobile-sidebar')).getByRole('link', { name: /analytics/ }));
    expect(mockSetMobileSidebarOpen).toHaveBeenCalledTimes(2);
  });
});
