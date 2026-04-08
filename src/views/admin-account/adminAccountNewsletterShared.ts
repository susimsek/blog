'use client';

import type { TFunction } from 'i18next';
import { isAdminSessionError, resolveAdminError } from '@/lib/adminApi';

export type NewsletterFilterStatus = 'all' | 'pending' | 'active' | 'unsubscribed';

export type NewsletterSharedParams = {
  hasAdminUser: boolean;
  t: TFunction;
  onSessionExpired: () => void;
  setNewsletterErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  setNewsletterSuccessMessage: React.Dispatch<React.SetStateAction<string>>;
};

export const handleAdminNewsletterError = (
  error: unknown,
  options: {
    t: TFunction;
    onSessionExpired: () => void;
    setNewsletterErrorMessage: React.Dispatch<React.SetStateAction<string>>;
    fallbackKey: string;
  },
) => {
  if (isAdminSessionError(error)) {
    options.onSessionExpired();
    return true;
  }

  const resolvedError = resolveAdminError(error);
  options.setNewsletterErrorMessage(
    resolvedError.kind === 'network'
      ? options.t('adminCommon.errors.network', { ns: 'admin-common' })
      : resolvedError.message || options.t(options.fallbackKey, { ns: 'admin-account' }),
  );

  return false;
};
