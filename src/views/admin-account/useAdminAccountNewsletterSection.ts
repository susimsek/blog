'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import useAdminAccountNewsletterOverview from './useAdminAccountNewsletterOverview';
import useAdminAccountNewsletterSubscribers from './useAdminAccountNewsletterSubscribers';

type UseAdminAccountNewsletterSectionParams = {
  adminEmail?: string;
  hasAdminUser: boolean;
  isNewsletterOverviewSection: boolean;
  isNewsletterSubscribersSection: boolean;
  successMessageAutoHideMs: number;
  t: TFunction;
  onSessionExpired: () => void;
};

export default function useAdminAccountNewsletterSection({
  adminEmail,
  hasAdminUser,
  isNewsletterOverviewSection,
  isNewsletterSubscribersSection,
  successMessageAutoHideMs,
  t,
  onSessionExpired,
}: UseAdminAccountNewsletterSectionParams) {
  const [newsletterErrorMessage, setNewsletterErrorMessage] = React.useState('');
  const [newsletterSuccessMessage, setNewsletterSuccessMessage] = React.useState('');

  useAutoClearValue(newsletterSuccessMessage, setNewsletterSuccessMessage, successMessageAutoHideMs);
  const subscribers = useAdminAccountNewsletterSubscribers({
    hasAdminUser,
    isActive: isNewsletterSubscribersSection,
    t,
    onSessionExpired,
    setNewsletterErrorMessage,
    setNewsletterSuccessMessage,
  });

  const overview = useAdminAccountNewsletterOverview({
    adminEmail,
    hasAdminUser,
    isActive: isNewsletterOverviewSection,
    newsletterFilterLocale: subscribers.newsletterFilterLocale,
    newsletterFilterQuery: subscribers.newsletterFilterQuery,
    t,
    onSessionExpired,
    setNewsletterErrorMessage,
    setNewsletterSuccessMessage,
  });

  return {
    newsletterErrorMessage,
    newsletterSuccessMessage,
    ...overview,
    ...subscribers,
  };
}
