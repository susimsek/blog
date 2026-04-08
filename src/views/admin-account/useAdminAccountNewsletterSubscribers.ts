'use client';

import React from 'react';
import useDebounce from '@/hooks/useDebounce';
import {
  deleteAdminNewsletterSubscriber,
  fetchAdminNewsletterSubscribers,
  updateAdminNewsletterSubscriberStatus,
  type AdminNewsletterSubscriberItem,
} from '@/lib/adminApi';
import {
  handleAdminNewsletterError,
  type NewsletterFilterStatus,
  type NewsletterSharedParams,
} from './adminAccountNewsletterShared';

type UseAdminAccountNewsletterSubscribersParams = NewsletterSharedParams & {
  isActive: boolean;
};

export default function useAdminAccountNewsletterSubscribers({
  hasAdminUser,
  isActive,
  t,
  onSessionExpired,
  setNewsletterErrorMessage,
  setNewsletterSuccessMessage,
}: UseAdminAccountNewsletterSubscribersParams) {
  const [newsletterSubscribers, setNewsletterSubscribers] = React.useState<AdminNewsletterSubscriberItem[]>([]);
  const [isNewsletterLoading, setIsNewsletterLoading] = React.useState(isActive);
  const [newsletterFilterLocale, setNewsletterFilterLocale] = React.useState<'all' | 'en' | 'tr'>('all');
  const [newsletterFilterStatus, setNewsletterFilterStatus] = React.useState<NewsletterFilterStatus>('all');
  const [newsletterFilterQuery, setNewsletterFilterQuery] = React.useState('');
  const [newsletterPage, setNewsletterPage] = React.useState(1);
  const [newsletterPageSize, setNewsletterPageSize] = React.useState(10);
  const [totalNewsletterSubscribers, setTotalNewsletterSubscribers] = React.useState(0);
  const [updatingNewsletterEmail, setUpdatingNewsletterEmail] = React.useState('');
  const [deletingNewsletterEmail, setDeletingNewsletterEmail] = React.useState('');
  const [pendingNewsletterDelete, setPendingNewsletterDelete] = React.useState<AdminNewsletterSubscriberItem | null>(
    null,
  );

  const newsletterListTopRef = React.useRef<HTMLDivElement | null>(null);
  const newsletterRequestIDRef = React.useRef(0);
  const newsletterFilterQueryDebounced = useDebounce(newsletterFilterQuery.trim(), 220);

  const totalNewsletterPages = Math.max(1, Math.ceil(totalNewsletterSubscribers / newsletterPageSize));

  React.useEffect(() => {
    setNewsletterPage(1);
  }, [newsletterFilterLocale, newsletterFilterQueryDebounced, newsletterFilterStatus]);

  const loadAdminNewsletterSubscribers = React.useCallback(
    async (options?: { page?: number }): Promise<AdminNewsletterSubscriberItem[]> => {
      if (!isActive || !hasAdminUser) {
        return [];
      }

      const requestedPage = options?.page && options.page > 0 ? options.page : newsletterPage;
      const requestID = newsletterRequestIDRef.current + 1;
      newsletterRequestIDRef.current = requestID;
      setIsNewsletterLoading(true);
      setNewsletterErrorMessage('');

      try {
        const payload = await fetchAdminNewsletterSubscribers({
          locale: newsletterFilterLocale === 'all' ? undefined : newsletterFilterLocale,
          status: newsletterFilterStatus === 'all' ? undefined : newsletterFilterStatus,
          query: newsletterFilterQueryDebounced,
          page: requestedPage,
          size: newsletterPageSize,
        });

        if (requestID !== newsletterRequestIDRef.current) {
          return [];
        }

        const items = payload.items ?? [];
        setNewsletterSubscribers(items);
        setTotalNewsletterSubscribers(payload.total ?? 0);

        const resolvedPage = payload.page > 0 ? payload.page : requestedPage;
        if (resolvedPage != newsletterPage) {
          setNewsletterPage(resolvedPage);
        }
        if (payload.size > 0 && payload.size !== newsletterPageSize) {
          setNewsletterPageSize(payload.size);
        }

        return items;
      } catch (error) {
        if (requestID !== newsletterRequestIDRef.current) {
          return [];
        }
        handleAdminNewsletterError(error, {
          t,
          onSessionExpired,
          setNewsletterErrorMessage,
          fallbackKey: 'adminAccount.newsletter.errors.load',
        });
        return [];
      } finally {
        if (requestID === newsletterRequestIDRef.current) {
          setIsNewsletterLoading(false);
        }
      }
    },
    [
      hasAdminUser,
      isActive,
      newsletterFilterLocale,
      newsletterFilterQueryDebounced,
      newsletterFilterStatus,
      newsletterPage,
      newsletterPageSize,
      onSessionExpired,
      setNewsletterErrorMessage,
      t,
    ],
  );

  React.useEffect(() => {
    if (!isActive || !hasAdminUser) {
      return;
    }

    void loadAdminNewsletterSubscribers();
  }, [hasAdminUser, isActive, loadAdminNewsletterSubscribers, newsletterPage, newsletterPageSize]);

  const scrollToNewsletterListStart = React.useCallback(() => {
    const target = newsletterListTopRef.current;
    if (!target) {
      return;
    }

    const currentWindow = globalThis.window;
    const prefersReducedMotion = currentWindow?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  const handleNewsletterStatusUpdate = React.useCallback(
    async (item: AdminNewsletterSubscriberItem, status: 'active' | 'unsubscribed') => {
      if (updatingNewsletterEmail || deletingNewsletterEmail) {
        return;
      }

      setUpdatingNewsletterEmail(item.email);
      setNewsletterErrorMessage('');
      setNewsletterSuccessMessage('');

      try {
        const updated = await updateAdminNewsletterSubscriberStatus({
          email: item.email,
          status,
        });

        setNewsletterSubscribers(previous =>
          previous.map(current => (current.email === updated.email ? updated : current)),
        );
        setNewsletterSuccessMessage(
          t('adminAccount.newsletter.success.statusUpdated', {
            ns: 'admin-account',
            email: updated.email,
          }),
        );
      } catch (error) {
        handleAdminNewsletterError(error, {
          t,
          onSessionExpired,
          setNewsletterErrorMessage,
          fallbackKey: 'adminAccount.newsletter.errors.statusUpdate',
        });
      } finally {
        setUpdatingNewsletterEmail('');
      }
    },
    [
      deletingNewsletterEmail,
      onSessionExpired,
      setNewsletterErrorMessage,
      setNewsletterSuccessMessage,
      t,
      updatingNewsletterEmail,
    ],
  );

  const handleDeleteNewsletterSubscriber = React.useCallback(async () => {
    const item = pendingNewsletterDelete;
    if (!item || deletingNewsletterEmail || updatingNewsletterEmail) {
      return;
    }

    setDeletingNewsletterEmail(item.email);
    setNewsletterErrorMessage('');
    setNewsletterSuccessMessage('');

    try {
      const deleted = await deleteAdminNewsletterSubscriber({ email: item.email });
      if (!deleted) {
        throw new Error(t('adminAccount.newsletter.errors.delete', { ns: 'admin-account' }));
      }

      const nextTotal = Math.max(0, totalNewsletterSubscribers - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / newsletterPageSize));
      const nextPage = Math.min(newsletterPage, nextTotalPages);

      if (nextPage === newsletterPage) {
        setNewsletterSubscribers(previous => previous.filter(current => current.email !== item.email));
      } else {
        setNewsletterPage(nextPage);
      }

      setTotalNewsletterSubscribers(nextTotal);
      setPendingNewsletterDelete(null);
      setNewsletterSuccessMessage(
        t('adminAccount.newsletter.success.deleted', {
          ns: 'admin-account',
          email: item.email,
        }),
      );

      if (nextTotal > 0) {
        await loadAdminNewsletterSubscribers({ page: nextPage });
      }
    } catch (error) {
      handleAdminNewsletterError(error, {
        t,
        onSessionExpired,
        setNewsletterErrorMessage,
        fallbackKey: 'adminAccount.newsletter.errors.delete',
      });
    } finally {
      setDeletingNewsletterEmail('');
    }
  }, [
    deletingNewsletterEmail,
    loadAdminNewsletterSubscribers,
    newsletterPage,
    newsletterPageSize,
    onSessionExpired,
    pendingNewsletterDelete,
    setNewsletterErrorMessage,
    setNewsletterSuccessMessage,
    t,
    totalNewsletterSubscribers,
    updatingNewsletterEmail,
  ]);

  const handleNewsletterFilterLocaleChange = React.useCallback((value: 'all' | 'en' | 'tr') => {
    setNewsletterFilterLocale(value);
    setNewsletterPage(1);
  }, []);

  const handleNewsletterFilterStatusChange = React.useCallback((value: NewsletterFilterStatus) => {
    setNewsletterFilterStatus(value);
    setNewsletterPage(1);
  }, []);

  const handleNewsletterFilterQueryChange = React.useCallback((value: string) => {
    setNewsletterFilterQuery(value);
    setNewsletterPage(1);
  }, []);

  const handleNewsletterPageChange = React.useCallback(
    (page: number) => {
      setNewsletterPage(page);
      scrollToNewsletterListStart();
    },
    [scrollToNewsletterListStart],
  );

  const handleNewsletterPageSizeChange = React.useCallback(
    (size: number) => {
      setNewsletterPageSize(size);
      setNewsletterPage(1);
      scrollToNewsletterListStart();
    },
    [scrollToNewsletterListStart],
  );

  const handleOpenNewsletterDelete = React.useCallback((item: AdminNewsletterSubscriberItem) => {
    setPendingNewsletterDelete(item);
  }, []);

  const handleCloseNewsletterDelete = React.useCallback(() => {
    if (deletingNewsletterEmail) {
      return;
    }
    setPendingNewsletterDelete(null);
  }, [deletingNewsletterEmail]);

  return {
    newsletterFilterLocale,
    newsletterFilterStatus,
    newsletterFilterQuery,
    newsletterListTopRef,
    isNewsletterLoading,
    totalNewsletterSubscribers,
    newsletterSubscribers,
    updatingNewsletterEmail,
    deletingNewsletterEmail,
    newsletterPage,
    totalNewsletterPages,
    newsletterPageSize,
    pendingNewsletterDelete,
    handleNewsletterStatusUpdate,
    handleOpenNewsletterDelete,
    handleDeleteNewsletterSubscriber,
    handleNewsletterFilterLocaleChange,
    handleNewsletterFilterStatusChange,
    handleNewsletterFilterQueryChange,
    handleNewsletterPageChange,
    handleNewsletterPageSizeChange,
    handleCloseNewsletterDelete,
  };
}
