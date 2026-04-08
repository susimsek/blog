'use client';

import React from 'react';
import {
  fetchAdminNewsletterCampaignFailures,
  fetchAdminNewsletterCampaigns,
  fetchAdminNewsletterSubscribers,
  sendAdminNewsletterTestEmail,
  triggerAdminNewsletterDispatch,
  type AdminNewsletterCampaignItem,
  type AdminNewsletterDeliveryFailureItem,
  type AdminNewsletterDispatchLocaleResult,
} from '@/lib/adminApi';
import { handleAdminNewsletterError, type NewsletterSharedParams } from './adminAccountNewsletterShared';

type UseAdminAccountNewsletterOverviewParams = NewsletterSharedParams & {
  adminEmail?: string;
  isActive: boolean;
  newsletterFilterLocale: 'all' | 'en' | 'tr';
  newsletterFilterQuery: string;
};

export default function useAdminAccountNewsletterOverview({
  adminEmail,
  hasAdminUser,
  isActive,
  newsletterFilterLocale,
  newsletterFilterQuery,
  t,
  onSessionExpired,
  setNewsletterErrorMessage,
  setNewsletterSuccessMessage,
}: UseAdminAccountNewsletterOverviewParams) {
  const [newsletterSubscriberSummary, setNewsletterSubscriberSummary] = React.useState({
    total: 0,
    active: 0,
    pending: 0,
    unsubscribed: 0,
  });
  const [isNewsletterSummaryLoading, setIsNewsletterSummaryLoading] = React.useState(isActive);
  const [newsletterCampaigns, setNewsletterCampaigns] = React.useState<AdminNewsletterCampaignItem[]>([]);
  const [newsletterCampaignThumbnails, setNewsletterCampaignThumbnails] = React.useState<Record<string, string>>({});
  const [isNewsletterCampaignsLoading, setIsNewsletterCampaignsLoading] = React.useState(isActive);
  const [isNewsletterDispatchRunning, setIsNewsletterDispatchRunning] = React.useState(false);
  const [newsletterDispatchResults, setNewsletterDispatchResults] = React.useState<
    AdminNewsletterDispatchLocaleResult[]
  >([]);
  const [newsletterDispatchTimestamp, setNewsletterDispatchTimestamp] = React.useState('');
  const [selectedNewsletterCampaign, setSelectedNewsletterCampaign] =
    React.useState<AdminNewsletterCampaignItem | null>(null);
  const [newsletterCampaignFailures, setNewsletterCampaignFailures] = React.useState<
    AdminNewsletterDeliveryFailureItem[]
  >([]);
  const [isNewsletterFailuresLoading, setIsNewsletterFailuresLoading] = React.useState(false);
  const [newsletterFailuresTotal, setNewsletterFailuresTotal] = React.useState(0);
  const [pendingNewsletterTestCampaign, setPendingNewsletterTestCampaign] =
    React.useState<AdminNewsletterCampaignItem | null>(null);
  const [newsletterTestEmail, setNewsletterTestEmail] = React.useState('');
  const [isNewsletterTestSending, setIsNewsletterTestSending] = React.useState(false);

  const loadAdminNewsletterSummary = React.useCallback(async () => {
    if (!isActive || !hasAdminUser) {
      return;
    }

    setIsNewsletterSummaryLoading(true);

    try {
      const [allPayload, activePayload, pendingPayload, unsubscribedPayload] = await Promise.all([
        fetchAdminNewsletterSubscribers({ page: 1, size: 1 }),
        fetchAdminNewsletterSubscribers({ status: 'active', page: 1, size: 1 }),
        fetchAdminNewsletterSubscribers({ status: 'pending', page: 1, size: 1 }),
        fetchAdminNewsletterSubscribers({ status: 'unsubscribed', page: 1, size: 1 }),
      ]);

      setNewsletterSubscriberSummary({
        total: allPayload.total ?? 0,
        active: activePayload.total ?? 0,
        pending: pendingPayload.total ?? 0,
        unsubscribed: unsubscribedPayload.total ?? 0,
      });
    } catch (error) {
      handleAdminNewsletterError(error, {
        t,
        onSessionExpired,
        setNewsletterErrorMessage,
        fallbackKey: 'adminAccount.newsletter.errors.summary',
      });
    } finally {
      setIsNewsletterSummaryLoading(false);
    }
  }, [hasAdminUser, isActive, onSessionExpired, setNewsletterErrorMessage, t]);

  const loadAdminNewsletterCampaigns = React.useCallback(async (): Promise<AdminNewsletterCampaignItem[]> => {
    if (!isActive || !hasAdminUser) {
      return [];
    }

    setIsNewsletterCampaignsLoading(true);

    try {
      const payload = await fetchAdminNewsletterCampaigns({
        locale: newsletterFilterLocale === 'all' ? undefined : newsletterFilterLocale,
        query: newsletterFilterQuery.trim(),
        page: 1,
        size: 6,
      });

      const items = payload.items ?? [];
      setNewsletterCampaigns(items);
      return items;
    } catch (error) {
      handleAdminNewsletterError(error, {
        t,
        onSessionExpired,
        setNewsletterErrorMessage,
        fallbackKey: 'adminAccount.newsletter.errors.campaigns',
      });
      return [];
    } finally {
      setIsNewsletterCampaignsLoading(false);
    }
  }, [
    hasAdminUser,
    isActive,
    newsletterFilterLocale,
    newsletterFilterQuery,
    onSessionExpired,
    setNewsletterErrorMessage,
    t,
  ]);

  React.useEffect(() => {
    if (!isActive || !hasAdminUser) {
      return;
    }

    void Promise.all([loadAdminNewsletterSummary(), loadAdminNewsletterCampaigns()]);
  }, [hasAdminUser, isActive, loadAdminNewsletterCampaigns, loadAdminNewsletterSummary]);

  React.useEffect(() => {
    if (!isActive || newsletterCampaigns.length === 0) {
      setNewsletterCampaignThumbnails({});
      return;
    }

    const localeSet = Array.from(
      new Set(
        newsletterCampaigns
          .map(item => item.locale.trim().toLowerCase())
          .filter((value): value is 'en' | 'tr' => value === 'en' || value === 'tr'),
      ),
    );
    if (localeSet.length === 0) {
      setNewsletterCampaignThumbnails({});
      return;
    }

    let cancelled = false;

    void Promise.all(
      localeSet.map(async currentLocale => {
        const response = await fetch(`/data/posts.${currentLocale}.json`);
        if (!response.ok) {
          throw new Error(`posts-${currentLocale}-load-failed`);
        }

        const payload = (await response.json()) as Array<{ id?: string; thumbnail?: string | null }>;
        return [currentLocale, payload] as const;
      }),
    )
      .then(entries => {
        if (cancelled) {
          return;
        }

        const thumbnailsByLocale = new Map<string, Map<string, string>>();
        for (const [currentLocale, posts] of entries) {
          const thumbnailMap = new Map<string, string>();
          for (const post of posts) {
            const postID = post.id?.trim();
            const thumbnail = post.thumbnail?.trim();
            if (!postID || !thumbnail) {
              continue;
            }
            thumbnailMap.set(postID, thumbnail);
          }
          thumbnailsByLocale.set(currentLocale, thumbnailMap);
        }

        const nextThumbnails: Record<string, string> = {};
        for (const item of newsletterCampaigns) {
          const campaignKey = `${item.locale}:${item.itemKey}`;
          const postID = item.link?.trim().split('/posts/')[1]?.split('/')[0]?.trim();
          if (!postID) {
            continue;
          }

          const normalizedLocale = item.locale.trim().toLowerCase();
          const thumbnail = thumbnailsByLocale.get(normalizedLocale)?.get(postID);
          if (thumbnail) {
            nextThumbnails[campaignKey] = thumbnail;
          }
        }

        setNewsletterCampaignThumbnails(nextThumbnails);
      })
      .catch(() => {
        if (!cancelled) {
          setNewsletterCampaignThumbnails({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isActive, newsletterCampaigns]);

  const handleTriggerNewsletterDispatch = React.useCallback(async () => {
    if (isNewsletterDispatchRunning) {
      return;
    }

    setIsNewsletterDispatchRunning(true);
    setNewsletterErrorMessage('');
    setNewsletterSuccessMessage('');

    try {
      const payload = await triggerAdminNewsletterDispatch();
      setNewsletterDispatchResults(payload.results ?? []);
      setNewsletterDispatchTimestamp(payload.timestamp ?? '');
      setNewsletterSuccessMessage(
        payload.message || t('adminAccount.newsletter.success.dispatchTriggered', { ns: 'admin-account' }),
      );
      await Promise.all([loadAdminNewsletterCampaigns(), loadAdminNewsletterSummary()]);
    } catch (error) {
      handleAdminNewsletterError(error, {
        t,
        onSessionExpired,
        setNewsletterErrorMessage,
        fallbackKey: 'adminAccount.newsletter.errors.dispatch',
      });
    } finally {
      setIsNewsletterDispatchRunning(false);
    }
  }, [
    isNewsletterDispatchRunning,
    loadAdminNewsletterCampaigns,
    loadAdminNewsletterSummary,
    onSessionExpired,
    setNewsletterErrorMessage,
    setNewsletterSuccessMessage,
    t,
  ]);

  const handleViewNewsletterFailures = React.useCallback(
    async (campaign: AdminNewsletterCampaignItem) => {
      setSelectedNewsletterCampaign(campaign);
      setIsNewsletterFailuresLoading(true);
      setNewsletterCampaignFailures([]);
      setNewsletterFailuresTotal(0);
      setNewsletterErrorMessage('');

      try {
        const payload = await fetchAdminNewsletterCampaignFailures({
          locale: campaign.locale,
          itemKey: campaign.itemKey,
          page: 1,
          size: 25,
        });
        setNewsletterCampaignFailures(payload.items ?? []);
        setNewsletterFailuresTotal(payload.total ?? 0);
      } catch (error) {
        if (
          !handleAdminNewsletterError(error, {
            t,
            onSessionExpired,
            setNewsletterErrorMessage,
            fallbackKey: 'adminAccount.newsletter.errors.failures',
          })
        ) {
          setSelectedNewsletterCampaign(null);
        }
      } finally {
        setIsNewsletterFailuresLoading(false);
      }
    },
    [onSessionExpired, setNewsletterErrorMessage, t],
  );

  const handleOpenNewsletterTest = React.useCallback(
    (item: AdminNewsletterCampaignItem) => {
      setNewsletterTestEmail(adminEmail ?? '');
      setPendingNewsletterTestCampaign(item);
    },
    [adminEmail],
  );

  const handleCloseNewsletterFailures = React.useCallback(() => {
    if (isNewsletterFailuresLoading) {
      return;
    }
    setSelectedNewsletterCampaign(null);
  }, [isNewsletterFailuresLoading]);

  const handleCloseNewsletterTest = React.useCallback(() => {
    if (isNewsletterTestSending) {
      return;
    }
    setPendingNewsletterTestCampaign(null);
  }, [isNewsletterTestSending]);

  const handleSendNewsletterTestEmail = React.useCallback(async () => {
    const campaign = pendingNewsletterTestCampaign;
    const resolvedEmail = newsletterTestEmail.trim().toLowerCase();
    if (!campaign || !resolvedEmail || isNewsletterTestSending) {
      return;
    }

    setIsNewsletterTestSending(true);
    setNewsletterErrorMessage('');
    setNewsletterSuccessMessage('');

    try {
      const payload = await sendAdminNewsletterTestEmail({
        email: resolvedEmail,
        locale: campaign.locale,
        itemKey: campaign.itemKey,
      });
      setPendingNewsletterTestCampaign(null);
      setNewsletterTestEmail(adminEmail ?? resolvedEmail);
      setNewsletterSuccessMessage(
        payload.message ||
          t('adminAccount.newsletter.testSend.success', {
            ns: 'admin-account',
            email: payload.email,
          }),
      );
    } catch (error) {
      handleAdminNewsletterError(error, {
        t,
        onSessionExpired,
        setNewsletterErrorMessage,
        fallbackKey: 'adminAccount.newsletter.errors.testSend',
      });
    } finally {
      setIsNewsletterTestSending(false);
    }
  }, [
    adminEmail,
    isNewsletterTestSending,
    newsletterTestEmail,
    onSessionExpired,
    pendingNewsletterTestCampaign,
    setNewsletterErrorMessage,
    setNewsletterSuccessMessage,
    t,
  ]);

  return {
    newsletterSubscriberSummary,
    isNewsletterSummaryLoading,
    newsletterCampaigns,
    newsletterCampaignThumbnails,
    isNewsletterCampaignsLoading,
    isNewsletterDispatchRunning,
    newsletterDispatchTimestamp,
    newsletterDispatchResults,
    handleTriggerNewsletterDispatch,
    handleOpenNewsletterTest,
    handleViewNewsletterFailures,
    selectedNewsletterCampaign,
    handleCloseNewsletterFailures,
    isNewsletterFailuresLoading,
    newsletterCampaignFailures,
    newsletterFailuresTotal,
    pendingNewsletterTestCampaign,
    handleCloseNewsletterTest,
    isNewsletterTestSending,
    newsletterTestEmail,
    setNewsletterTestEmail,
    handleSendNewsletterTestEmail,
  };
}
