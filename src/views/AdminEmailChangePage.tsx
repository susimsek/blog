'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import { defaultLocale } from '@/i18n/settings';
import { confirmAdminEmailChange, resolveAdminEmailChangeError } from '@/lib/adminEmailChangeApi';
import { ADMIN_ROUTES, withAdminLocalePath } from '@/lib/adminRoutes';

type EmailChangeStatus = 'loading' | 'success' | 'invalid-link' | 'expired' | 'failed' | 'service-unavailable';

const resolveEmailChangeStatus = (status: string): Exclude<EmailChangeStatus, 'loading' | 'service-unavailable'> => {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === 'success') {
    return 'success';
  }

  if (normalizedStatus === 'expired') {
    return 'expired';
  }

  if (normalizedStatus === 'invalid-link') {
    return 'invalid-link';
  }

  return 'failed';
};

const resolveStatusVariant = (status: EmailChangeStatus) => {
  switch (status) {
    case 'success':
      return 'success' as const;
    case 'expired':
      return 'warning' as const;
    case 'loading':
      return 'info' as const;
    default:
      return 'danger' as const;
  }
};

export default function AdminEmailChangePage() {
  const { t } = useTranslation('admin-email-change');
  const params = useParams<{ locale?: string | string[] }>();
  const searchParams = useSearchParams();
  const routeLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const locale = routeLocale ?? defaultLocale;
  const token = (searchParams?.get('token') ?? '').trim();
  const loginHref = withAdminLocalePath(locale, ADMIN_ROUTES.login);

  const [status, setStatus] = React.useState<EmailChangeStatus>('loading');
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    let isMounted = true;

    if (token === '') {
      setStatus('invalid-link');
      return () => {
        isMounted = false;
      };
    }

    void confirmAdminEmailChange(token, locale)
      .then(result => {
        if (!isMounted) {
          return;
        }

        setStatus(resolveEmailChangeStatus(result.status));
      })
      .catch(error => {
        if (!isMounted) {
          return;
        }

        const resolved = resolveAdminEmailChangeError(error);
        setErrorMessage(
          resolved.kind === 'network'
            ? t('adminEmailChange.errors.network')
            : resolved.message || t('adminEmailChange.status.service-unavailable.message'),
        );
        setStatus('service-unavailable');
      });

    return () => {
      isMounted = false;
    };
  }, [locale, t, token]);

  React.useEffect(() => {
    if (status === 'loading' || token === '' || globalThis.window === undefined) {
      return;
    }

    const currentURL = new URL(globalThis.window.location.href);
    if (!currentURL.searchParams.has('token')) {
      return;
    }

    currentURL.searchParams.delete('token');
    const nextQuery = currentURL.searchParams.toString();
    const querySuffix = nextQuery ? `?${nextQuery}` : '';
    const nextURL = `${currentURL.pathname}${querySuffix}${currentURL.hash}`;

    globalThis.window.history.replaceState(globalThis.window.history.state, '', nextURL);
  }, [status, token]);

  return (
    <section className="py-5 admin-login-section">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 col-xl-7 mx-auto">
          <div className="post-card d-flex align-items-center post-summary-card admin-login-card">
            <div className="post-card-content flex-grow-1">
              <div className="admin-login-eyebrow d-flex align-items-center gap-2 text-uppercase small fw-semibold text-muted mb-3">
                <FontAwesomeIcon icon="envelope" />
                <span>{t('adminEmailChange.eyebrow')}</span>
              </div>
              <div className="post-summary-title-row">
                <h1 className="fw-bold post-summary-title mb-0">{t('adminEmailChange.title')}</h1>
              </div>
              <p className="post-summary-text admin-login-subtitle mb-4">{t('adminEmailChange.subtitle')}</p>

              {status === 'loading' ? (
                <AdminLoadingState className="admin-loading-stack py-4" ariaLabel={t('adminEmailChange.loading')} />
              ) : (
                <Alert variant={resolveStatusVariant(status)} className="mb-4 px-4 py-3 lh-base">
                  <div className="fw-semibold mb-2">{t(`adminEmailChange.status.${status}.title`)}</div>
                  <div>{errorMessage || t(`adminEmailChange.status.${status}.message`)}</div>
                </Alert>
              )}

              <div className="d-flex flex-column flex-sm-row gap-3">
                <a href={loginHref} className="btn btn-secondary">
                  <span className="d-inline-flex align-items-center gap-2">
                    <FontAwesomeIcon icon="right-to-bracket" />
                    <span>{t('adminEmailChange.actions.backToLogin')}</span>
                  </span>
                </a>
                {status === 'loading' ? (
                  <Button type="button" variant="primary" disabled>
                    <span className="d-inline-flex align-items-center gap-2">
                      <Spinner as="span" animation="border" size="sm" aria-hidden="true" />
                      <span>{t('adminEmailChange.loading')}</span>
                    </span>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
