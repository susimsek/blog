import { act, renderHook, waitFor } from '@testing-library/react';
import { fetchAdminComments, fetchAdminDashboard, fetchAdminMe, updateAdminCommentStatus } from '@/lib/adminApi';
import { clearAdminSessionProfileCache, writeAdminSessionProfileCache } from '@/lib/adminSessionProfileCache';
import { useAdminDashboardPageData } from '@/views/admin-dashboard/useAdminDashboardPageData';
import type { DashboardPayload } from '@/views/admin-dashboard/types';

jest.mock('@/lib/adminApi', () => ({
  fetchAdminComments: jest.fn(),
  fetchAdminDashboard: jest.fn(),
  fetchAdminMe: jest.fn(),
  updateAdminCommentStatus: jest.fn(),
}));

const profile = {
  id: 'admin-1',
  name: 'Admin',
  username: 'admin',
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
const dashboard: DashboardPayload = {
  totalPosts: 12,
  totalSubscribers: 34,
  contentHealth: {
    localePairCoverage: 80,
    missingTranslations: 2,
    missingThumbnails: 3,
    latestUpdatedPosts: [{ id: 'post-1', title: 'Title', date: '2026-10-01', category: 'Tech' }],
    dominantCategory: { id: 'tech', name: 'Tech', count: 8 },
  },
  topViewedPosts: [],
  topLikedPosts: [],
};
const comment = { id: 'comment-1', status: 'PENDING' } as never;
const makeRouter = () => ({ replace: jest.fn(), push: jest.fn() });

describe('useAdminDashboardPageData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.mocked(fetchAdminMe).mockResolvedValue({ authenticated: true, user: profile } as never);
    jest.mocked(fetchAdminDashboard).mockResolvedValue(dashboard as never);
    jest.mocked(fetchAdminComments).mockResolvedValue({ items: [comment], total: 1 } as never);
    jest.mocked(updateAdminCommentStatus).mockResolvedValue(true as never);
  });

  afterEach(() => clearAdminSessionProfileCache());

  it('loads cached dashboard data and removes comments after moderation', async () => {
    writeAdminSessionProfileCache(profile);
    const router = makeRouter();
    const { result } = renderHook(() =>
      useAdminDashboardPageData({ locale: 'en', router: router as never, isMobile: false }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchAdminMe).not.toHaveBeenCalled();
    expect(fetchAdminDashboard).toHaveBeenCalledTimes(1);
    expect(fetchAdminComments).toHaveBeenCalledWith({ status: 'PENDING', page: 1, size: 8 });
    expect(result.current.adminUser?.id).toBe('admin-1');
    expect(result.current.dashboard).toEqual(dashboard);
    expect(result.current.contentSummary).toEqual({
      missingTranslations: 2,
      missingThumbnails: 3,
      localePairCoverage: 80,
      latestUpdatedPosts: dashboard.contentHealth.latestUpdatedPosts,
      topCategory: dashboard.contentHealth.dominantCategory,
    });
    expect(result.current.pendingComments).toEqual([comment]);
    expect(result.current.isDesktopSidebarVisible).toBe(true);

    await act(async () => result.current.handleCommentStatusUpdate('comment-1', 'APPROVED'));
    expect(updateAdminCommentStatus).toHaveBeenCalledWith({ commentId: 'comment-1', status: 'APPROVED' });
    expect(result.current.pendingComments).toEqual([]);
  });

  it('loads a remote profile and redirects unauthenticated and failed sessions', async () => {
    const profileRouter = makeRouter();
    const profileHook = renderHook(() =>
      useAdminDashboardPageData({ locale: 'tr', router: profileRouter as never, isMobile: false }),
    );
    await waitFor(() => expect(profileHook.result.current.isLoading).toBe(false));
    expect(fetchAdminMe).toHaveBeenCalledTimes(1);
    expect(profileRouter.replace).not.toHaveBeenCalled();
    profileHook.unmount();

    clearAdminSessionProfileCache();
    jest.clearAllMocks();
    jest.mocked(fetchAdminMe).mockResolvedValueOnce({ authenticated: false, user: null } as never);
    const unauthRouter = makeRouter();
    const unauthHook = renderHook(() =>
      useAdminDashboardPageData({ locale: 'en', router: unauthRouter as never, isMobile: false }),
    );
    await waitFor(() => expect(unauthHook.result.current.isLoading).toBe(false));
    expect(unauthRouter.replace).toHaveBeenCalledWith('/admin/login');
    expect(fetchAdminDashboard).not.toHaveBeenCalled();
    unauthHook.unmount();

    clearAdminSessionProfileCache();
    jest.clearAllMocks();
    jest.mocked(fetchAdminMe).mockRejectedValueOnce(new Error('network down'));
    const failedRouter = makeRouter();
    const failedHook = renderHook(() =>
      useAdminDashboardPageData({ locale: 'en', router: failedRouter as never, isMobile: false }),
    );
    await waitFor(() => expect(failedHook.result.current.isLoading).toBe(false));
    expect(failedRouter.replace).toHaveBeenCalledWith('/admin/login');
    expect(failedHook.result.current.adminUser).toBeNull();
  });

  it('toggles desktop and mobile sidebars and clears the comment action after API errors', async () => {
    writeAdminSessionProfileCache(profile);
    const router = makeRouter();
    const { result, rerender } = renderHook(
      ({ isMobile }) => useAdminDashboardPageData({ locale: 'en', router: router as never, isMobile }),
      { initialProps: { isMobile: false } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => globalThis.dispatchEvent(new Event('admin:sidebar-toggle')));
    expect(result.current.isDesktopSidebarVisible).toBe(false);
    rerender({ isMobile: true });
    act(() => globalThis.dispatchEvent(new Event('admin:sidebar-toggle')));
    expect(result.current.isMobileSidebarVisible).toBe(true);
    rerender({ isMobile: false });
    expect(result.current.isMobileSidebarVisible).toBe(false);
    expect(result.current.isDesktopSidebarVisible).toBe(false);

    jest.mocked(updateAdminCommentStatus).mockRejectedValueOnce(new Error('update failed'));
    await expect(act(async () => result.current.handleCommentStatusUpdate('comment-1', 'SPAM'))).rejects.toThrow(
      'update failed',
    );
    expect(result.current.commentActionID).toBe('');
  });
});
