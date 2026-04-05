'use client';

import React from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import {
  fetchAdminComments,
  fetchAdminDashboard,
  fetchAdminMe,
  updateAdminCommentStatus,
  type AdminCommentItem,
} from '@/lib/adminApi';
import {
  clearAdminSessionProfileCache,
  readAdminSessionProfileCache,
  writeAdminSessionProfileCache,
} from '@/lib/adminSessionProfileCache';
import { buildContentSummary } from './helpers';
import type { AdminIdentity, ContentSummary, DashboardPayload } from './types';

type UseAdminDashboardPageDataParams = {
  locale: string;
  router: AppRouterInstance;
  isMobile: boolean;
};

export function useAdminDashboardPageData({ locale, router, isMobile }: UseAdminDashboardPageDataParams) {
  const [adminUser, setAdminUser] = React.useState<AdminIdentity>(null);
  const [dashboard, setDashboard] = React.useState<DashboardPayload | null>(null);
  const [contentSummary, setContentSummary] = React.useState<ContentSummary | null>(null);
  const [pendingComments, setPendingComments] = React.useState<AdminCommentItem[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = React.useState(true);
  const [commentActionID, setCommentActionID] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = React.useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const cachedUser = readAdminSessionProfileCache();
        if (cachedUser) {
          setAdminUser(cachedUser);
        } else {
          const me = await fetchAdminMe();
          if (!isMounted) {
            return;
          }

          if (!me.authenticated || !me.user) {
            clearAdminSessionProfileCache();
            router.replace(`/${locale}/admin/login`);
            return;
          }

          setAdminUser(me.user);
          writeAdminSessionProfileCache(me.user);
        }

        const dashboardPayload = await fetchAdminDashboard();

        if (!isMounted) {
          return;
        }

        setDashboard(dashboardPayload);
        setContentSummary(buildContentSummary(dashboardPayload));

        const commentsPayload = await fetchAdminComments({
          status: 'PENDING',
          page: 1,
          size: 8,
        });
        if (!isMounted) {
          return;
        }
        setPendingComments(commentsPayload.items ?? []);
      } catch {
        if (!isMounted) {
          return;
        }
        clearAdminSessionProfileCache();
        router.replace(`/${locale}/admin/login`);
      } finally {
        if (isMounted) {
          setIsCommentsLoading(false);
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [locale, router]);

  const isDesktopSidebarVisible = !isMobile && isDesktopSidebarOpen;
  const isMobileSidebarVisible = isMobile && isMobileSidebarOpen;

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(previous => !previous);
      return;
    }

    setIsDesktopSidebarOpen(previous => !previous);
  }, [isMobile]);

  React.useEffect(() => {
    const handleSidebarToggle = () => {
      toggleSidebar();
    };

    globalThis.addEventListener('admin:sidebar-toggle', handleSidebarToggle);
    return () => {
      globalThis.removeEventListener('admin:sidebar-toggle', handleSidebarToggle);
    };
  }, [toggleSidebar]);

  React.useEffect(() => {
    if (!isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobile]);

  const handleCommentStatusUpdate = React.useCallback(
    async (commentId: string, status: 'APPROVED' | 'REJECTED' | 'SPAM') => {
      setCommentActionID(commentId);
      try {
        await updateAdminCommentStatus({ commentId, status });
        setPendingComments(current => current.filter(item => item.id !== commentId));
      } finally {
        setCommentActionID('');
      }
    },
    [],
  );

  return {
    adminUser,
    dashboard,
    contentSummary,
    pendingComments,
    isCommentsLoading,
    commentActionID,
    isLoading,
    isDesktopSidebarVisible,
    isMobileSidebarVisible,
    setIsDesktopSidebarOpen,
    setIsMobileSidebarOpen,
    handleCommentStatusUpdate,
  };
}
