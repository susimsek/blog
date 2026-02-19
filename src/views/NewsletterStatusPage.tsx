'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/common/Layout';
import Link from '@/components/common/Link';
import type { LayoutPostSummary, Topic } from '@/types/posts';

type NewsletterStatusPageProps = {
  locale: string;
  layoutPosts: LayoutPostSummary[];
  topics: Topic[];
  preFooterTopTopics: Topic[];
};

type Operation = 'confirm' | 'unsubscribe';
type StatusKey =
  | 'loading'
  | 'success'
  | 'expired'
  | 'invalid-link'
  | 'failed'
  | 'service-unavailable'
  | 'config-error'
  | 'method-not-allowed';
type ResolvedStatusKey = Exclude<StatusKey, 'loading'>;

const confirmAllowed: readonly ResolvedStatusKey[] = [
  'success',
  'expired',
  'invalid-link',
  'failed',
  'service-unavailable',
  'config-error',
  'method-not-allowed',
];

const unsubscribeAllowed: readonly ResolvedStatusKey[] = [
  'success',
  'invalid-link',
  'failed',
  'service-unavailable',
  'config-error',
  'method-not-allowed',
];

const resolveOperation = (value: string | null): Operation => {
  if (value === 'unsubscribe') {
    return 'unsubscribe';
  }
  return 'confirm';
};

const resolveStatusKey = (operation: Operation, status: string | null): StatusKey => {
  const value = (status ?? '').trim();
  const allowed = operation === 'unsubscribe' ? unsubscribeAllowed : confirmAllowed;

  if (allowed.includes(value as ResolvedStatusKey)) {
    return value as ResolvedStatusKey;
  }

  return 'failed';
};

export default function NewsletterStatusPage({
  locale,
  layoutPosts,
  topics,
  preFooterTopTopics,
}: Readonly<NewsletterStatusPageProps>) {
  const { t } = useTranslation('common');
  const searchParams = useSearchParams();
  const [statusKey, setStatusKey] = useState<StatusKey>('loading');

  const operation = resolveOperation(searchParams.get('operation'));
  const token = (searchParams.get('token') ?? '').trim();

  useEffect(() => {
    const controller = new AbortController();

    const execute = async () => {
      if (!token) {
        setStatusKey('invalid-link');
        return;
      }

      setStatusKey('loading');

      const endpoint = operation === 'unsubscribe' ? '/api/subscribe-unsubscribe' : '/api/subscribe-confirm';
      const query = new URLSearchParams({
        token,
      });

      try {
        const response = await fetch(`${endpoint}?${query.toString()}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
          signal: controller.signal,
        });

        const payload = (await response.json().catch(() => null)) as { status?: string } | null;
        const backendStatus =
          typeof payload?.status === 'string' && payload.status.trim() !== ''
            ? payload.status
            : response.status === 503
              ? 'service-unavailable'
              : response.status === 405
                ? 'method-not-allowed'
                : response.status === 500
                  ? 'config-error'
                  : response.status === 400 || response.status === 410
                    ? 'invalid-link'
                    : 'failed';

        setStatusKey(resolveStatusKey(operation, backendStatus));
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        setStatusKey('service-unavailable');
      }
    };

    void execute();

    return () => {
      controller.abort();
    };
  }, [locale, operation, token]);

  const statusTone = useMemo<'info' | 'success' | 'warning' | 'error'>(() => {
    if (statusKey === 'loading') {
      return 'info';
    }
    if (statusKey === 'success') {
      return 'success';
    }
    if (statusKey === 'service-unavailable' || statusKey === 'config-error') {
      return 'warning';
    }
    return 'error';
  }, [statusKey]);

  return (
    <Layout
      posts={layoutPosts}
      topics={topics}
      preFooterTopTopics={preFooterTopTopics}
      searchEnabled={false}
      sidebarEnabled={false}
    >
      <section className="newsletter-status-page">
        <div className="newsletter-status-shell stack stack-16">
          <header className="newsletter-status-header stack stack-8">
            <p className="newsletter-status-eyebrow">{t('common.newsletterStatus.eyebrow')}</p>
            <h1 className="newsletter-status-title fw-bold">{t(`common.newsletterStatus.${operation}.title`)}</h1>
          </header>
          <div className={`newsletter-status-result is-${statusTone}`} role="status" aria-live="polite">
            <h2 className="newsletter-status-result-title">
              {statusKey === 'loading'
                ? t('common.newsletterStatus.loading.title')
                : t(`common.newsletterStatus.${operation}.status.${statusKey}.title`)}
            </h2>
            <p className="newsletter-status-result-message">
              {statusKey === 'loading'
                ? t('common.newsletterStatus.loading.message')
                : t(`common.newsletterStatus.${operation}.status.${statusKey}.message`)}
            </p>
          </div>
          <div className="newsletter-status-actions">
            <Link href={`/${locale}`} skipLocaleHandling className="btn btn-primary">
              {t('common.newsletterStatus.actions.goHome')}
            </Link>
            <Link href={`/${locale}`} skipLocaleHandling className="btn btn-secondary">
              {t('common.newsletterStatus.actions.subscribeAgain')}
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
