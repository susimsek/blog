'use client';

import React from 'react';
import Image from 'next/image';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FlagIcon from '@/components/common/FlagIcon';
import Link from '@/components/common/Link';
import PaginationBar from '@/components/pagination/PaginationBar';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import { LOCALES } from '@/config/constants';
import type {
  AdminNewsletterCampaignItem,
  AdminNewsletterDeliveryFailureItem,
  AdminNewsletterDispatchLocaleResult,
  AdminNewsletterSubscriberItem,
} from '@/lib/adminApi';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;
type NewsletterTabKey = 'overview' | 'subscribers';
type NewsletterFilterStatus = 'all' | 'pending' | 'active' | 'unsubscribed';
type AsyncSectionContentProps = {
  isLoading: boolean;
  loadingLabel: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
};
type NewsletterSummary = {
  total: number;
  active: number;
  pending: number;
  unsubscribed: number;
};

type AdminAccountNewsletterSectionProps = {
  t: AdminAccountTranslate;
  formatSessionDate: (value: string) => string;
  newsletterErrorMessage: string;
  newsletterSuccessMessage: string;
  newsletterTab: NewsletterTabKey;
  onNewsletterTabSelect: (key: string | null) => void;
  isNewsletterDispatchRunning: boolean;
  onTriggerNewsletterDispatch: () => void | Promise<void>;
  newsletterDispatchTimestamp: string;
  newsletterDispatchResults: AdminNewsletterDispatchLocaleResult[];
  isNewsletterSummaryLoading: boolean;
  newsletterSubscriberSummary: NewsletterSummary;
  isNewsletterCampaignsLoading: boolean;
  newsletterCampaigns: AdminNewsletterCampaignItem[];
  newsletterCampaignThumbnails: Record<string, string>;
  renderAsyncSectionContent: (props: AsyncSectionContentProps) => React.ReactNode;
  onOpenNewsletterTest: (item: AdminNewsletterCampaignItem) => void;
  onViewNewsletterFailures: (item: AdminNewsletterCampaignItem) => void | Promise<void>;
  newsletterFilterLocale: 'all' | 'en' | 'tr';
  onNewsletterFilterLocaleChange: (value: 'all' | 'en' | 'tr') => void;
  newsletterFilterStatus: NewsletterFilterStatus;
  onNewsletterFilterStatusChange: (value: NewsletterFilterStatus) => void;
  newsletterFilterQuery: string;
  onNewsletterFilterQueryChange: (value: string) => void;
  newsletterListTopRef: React.RefObject<HTMLDivElement | null>;
  isNewsletterLoading: boolean;
  totalNewsletterSubscribers: number;
  newsletterSubscribers: AdminNewsletterSubscriberItem[];
  updatingNewsletterEmail: string;
  deletingNewsletterEmail: string;
  onNewsletterStatusUpdate: (
    item: AdminNewsletterSubscriberItem,
    status: 'active' | 'unsubscribed',
  ) => void | Promise<void>;
  onOpenNewsletterDelete: (item: AdminNewsletterSubscriberItem) => void;
  newsletterPage: number;
  totalNewsletterPages: number;
  newsletterPageSize: number;
  onNewsletterPageChange: (page: number) => void;
  onNewsletterPageSizeChange: (size: number) => void;
  pendingNewsletterDelete: AdminNewsletterSubscriberItem | null;
  onCloseNewsletterDelete: () => void;
  onDeleteNewsletterSubscriber: () => void | Promise<void>;
  selectedNewsletterCampaign: AdminNewsletterCampaignItem | null;
  onCloseNewsletterFailures: () => void;
  isNewsletterFailuresLoading: boolean;
  newsletterCampaignFailures: AdminNewsletterDeliveryFailureItem[];
  newsletterFailuresTotal: number;
  pendingNewsletterTestCampaign: AdminNewsletterCampaignItem | null;
  onCloseNewsletterTest: () => void;
  isNewsletterTestSending: boolean;
  newsletterTestEmail: string;
  onNewsletterTestEmailChange: (value: string) => void;
  onSendNewsletterTestEmail: () => void | Promise<void>;
};

const resolveNewsletterCampaignStatus = (sentCount: number, failedCount: number, translate: AdminAccountTranslate) => {
  if (failedCount === 0) {
    return {
      variant: 'secondary' as const,
      label: translate('adminAccount.newsletter.campaigns.statuses.sent', { ns: 'admin-account' }),
    };
  }
  if (sentCount > 0) {
    return {
      variant: 'warning' as const,
      label: translate('adminAccount.newsletter.campaigns.statuses.partial', { ns: 'admin-account' }),
    };
  }

  return {
    variant: 'secondary' as const,
    label: translate('adminAccount.newsletter.campaigns.statuses.processing', { ns: 'admin-account' }),
  };
};

const resolveNewsletterLocaleLabel = (localeCode: string, locale: string) => {
  if (localeCode === 'en') {
    return LOCALES.en.name;
  }
  if (localeCode === 'tr') {
    return LOCALES.tr.name;
  }

  return locale.toUpperCase();
};

export default function AdminAccountNewsletterSection({
  t,
  formatSessionDate,
  newsletterErrorMessage,
  newsletterSuccessMessage,
  newsletterTab,
  onNewsletterTabSelect,
  isNewsletterDispatchRunning,
  onTriggerNewsletterDispatch,
  newsletterDispatchTimestamp,
  newsletterDispatchResults,
  isNewsletterSummaryLoading,
  newsletterSubscriberSummary,
  isNewsletterCampaignsLoading,
  newsletterCampaigns,
  newsletterCampaignThumbnails,
  renderAsyncSectionContent,
  onOpenNewsletterTest,
  onViewNewsletterFailures,
  newsletterFilterLocale,
  onNewsletterFilterLocaleChange,
  newsletterFilterStatus,
  onNewsletterFilterStatusChange,
  newsletterFilterQuery,
  onNewsletterFilterQueryChange,
  newsletterListTopRef,
  isNewsletterLoading,
  totalNewsletterSubscribers,
  newsletterSubscribers,
  updatingNewsletterEmail,
  deletingNewsletterEmail,
  onNewsletterStatusUpdate,
  onOpenNewsletterDelete,
  newsletterPage,
  totalNewsletterPages,
  newsletterPageSize,
  onNewsletterPageChange,
  onNewsletterPageSizeChange,
  pendingNewsletterDelete,
  onCloseNewsletterDelete,
  onDeleteNewsletterSubscriber,
  selectedNewsletterCampaign,
  onCloseNewsletterFailures,
  isNewsletterFailuresLoading,
  newsletterCampaignFailures,
  newsletterFailuresTotal,
  pendingNewsletterTestCampaign,
  onCloseNewsletterTest,
  isNewsletterTestSending,
  newsletterTestEmail,
  onNewsletterTestEmailChange,
  onSendNewsletterTestEmail,
}: Readonly<AdminAccountNewsletterSectionProps>) {
  const newsletterFeedback = (
    <>
      {newsletterErrorMessage ? (
        <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
          {newsletterErrorMessage}
        </Alert>
      ) : null}
      {newsletterSuccessMessage ? (
        <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
          {newsletterSuccessMessage}
        </Alert>
      ) : null}
    </>
  );

  return (
    <>
      <h3 className="admin-dashboard-panel-title mb-3">
        {t('adminAccount.newsletter.title', { ns: 'admin-account' })}
      </h3>
      <hr className="admin-section-divider mb-3" />
      <p className="admin-dashboard-panel-copy mb-4">{t('adminAccount.newsletter.copy', { ns: 'admin-account' })}</p>
      <Tabs
        id="admin-newsletter-tabs"
        activeKey={newsletterTab}
        onSelect={onNewsletterTabSelect}
        className="mb-3 admin-content-tabs"
        mountOnEnter
      >
        <Tab
          eventKey="overview"
          title={
            <span className="d-inline-flex align-items-center">
              <FontAwesomeIcon icon="chart-line" className="me-2" />
              {t('adminAccount.newsletter.tabs.overview', { ns: 'admin-account' })}
            </span>
          }
        >
          <div className="pt-3">
            {newsletterFeedback}
            <div className="admin-account-section-stack">
              <section className="card border shadow-sm admin-newsletter-panel">
                <div className="card-body p-4">
                  <div className="admin-newsletter-operations-layout">
                    <div className="admin-newsletter-operations-copy">
                      <h4 className="admin-dashboard-panel-title mb-2">
                        {t('adminAccount.newsletter.operations.title', { ns: 'admin-account' })}
                      </h4>
                      <p className="admin-dashboard-panel-copy mb-0">
                        {t('adminAccount.newsletter.operations.copy', { ns: 'admin-account' })}
                      </p>
                    </div>
                    <div className="admin-newsletter-operations-action">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        className="d-inline-flex align-items-center"
                        disabled={isNewsletterDispatchRunning}
                        onClick={() => {
                          void onTriggerNewsletterDispatch();
                        }}
                      >
                        {isNewsletterDispatchRunning ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              className="me-2 flex-shrink-0 admin-action-spinner"
                              aria-hidden="true"
                            />
                            <span>{t('adminAccount.newsletter.operations.running', { ns: 'admin-account' })}</span>
                          </span>
                        ) : (
                          <>
                            <FontAwesomeIcon icon="paper-plane" className="me-2" />
                            {t('adminAccount.newsletter.operations.trigger', { ns: 'admin-account' })}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {newsletterDispatchTimestamp ? (
                    <div className="small text-muted mt-3">
                      {t('adminAccount.newsletter.operations.lastRun', {
                        ns: 'admin-account',
                        value: formatSessionDate(newsletterDispatchTimestamp),
                      })}
                    </div>
                  ) : null}

                  {newsletterDispatchResults.length > 0 ? (
                    <div className="d-grid gap-2 mt-3">
                      {newsletterDispatchResults.map(result => (
                        <div key={result.locale} className="border rounded-3 p-3">
                          <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                            <span className="fw-semibold text-uppercase">{result.locale}</span>
                            <span className={result.skipped ? 'badge text-bg-secondary' : 'badge text-bg-success'}>
                              {result.skipped
                                ? t('adminAccount.newsletter.operations.result.skipped', { ns: 'admin-account' })
                                : t('adminAccount.newsletter.operations.result.completed', { ns: 'admin-account' })}
                            </span>
                          </div>
                          <div className="small text-muted mt-2">
                            {t('adminAccount.newsletter.operations.result.meta', {
                              ns: 'admin-account',
                              locale: result.locale.toUpperCase(),
                              sent: result.sentCount,
                              failed: result.failedCount,
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="card border shadow-sm admin-newsletter-panel">
                <div className="card-body p-4">
                  <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-3">
                    <div>
                      <h4 className="admin-dashboard-panel-title mb-2">
                        {t('adminAccount.newsletter.summary.title', { ns: 'admin-account' })}
                      </h4>
                      <p className="small text-muted mb-0">
                        {t('adminAccount.newsletter.summary.copy', { ns: 'admin-account' })}
                      </p>
                    </div>
                  </div>

                  {isNewsletterSummaryLoading ? (
                    <div className="admin-account-sessions-loading">
                      <AdminLoadingState
                        className="admin-loading-stack"
                        ariaLabel={t('adminAccount.newsletter.summary.loading', { ns: 'admin-account' })}
                      />
                    </div>
                  ) : (
                    <div className="row g-3">
                      {[
                        {
                          key: 'total',
                          label: t('adminAccount.newsletter.summary.metrics.total', { ns: 'admin-account' }),
                          value: newsletterSubscriberSummary.total,
                        },
                        {
                          key: 'active',
                          label: t('adminAccount.newsletter.summary.metrics.active', { ns: 'admin-account' }),
                          value: newsletterSubscriberSummary.active,
                        },
                        {
                          key: 'pending',
                          label: t('adminAccount.newsletter.summary.metrics.pending', { ns: 'admin-account' }),
                          value: newsletterSubscriberSummary.pending,
                        },
                        {
                          key: 'unsubscribed',
                          label: t('adminAccount.newsletter.summary.metrics.unsubscribed', { ns: 'admin-account' }),
                          value: newsletterSubscriberSummary.unsubscribed,
                        },
                      ].map(item => (
                        <div key={item.key} className="col-12 col-sm-6 col-xl-3">
                          <div
                            className={`admin-newsletter-summary-metric admin-newsletter-summary-metric--${item.key} h-100`}
                          >
                            <div className="admin-newsletter-summary-label">{item.label}</div>
                            <div className="admin-newsletter-summary-value">{item.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="card border shadow-sm admin-newsletter-panel">
                <div className="card-body p-4">
                  <h4 className="admin-dashboard-panel-title mb-2">
                    {t('adminAccount.newsletter.campaigns.title', { ns: 'admin-account' })}
                  </h4>
                  <p className="small text-muted mb-3">
                    {t('adminAccount.newsletter.campaigns.copy', { ns: 'admin-account' })}
                  </p>

                  {renderAsyncSectionContent({
                    isLoading: isNewsletterCampaignsLoading,
                    loadingLabel: t('adminAccount.newsletter.campaigns.loading', { ns: 'admin-account' }),
                    isEmpty: newsletterCampaigns.length === 0,
                    emptyMessage: t('adminAccount.newsletter.campaigns.empty', { ns: 'admin-account' }),
                    children: (
                      <div className="d-grid gap-3">
                        {newsletterCampaigns.map(item => {
                          const campaignKey = `${item.locale}:${item.itemKey}`;
                          const campaignThumbnail = newsletterCampaignThumbnails[campaignKey];
                          const campaignStatus = resolveNewsletterCampaignStatus(item.sentCount, item.failedCount, t);

                          return (
                            <div key={`${item.locale}-${item.itemKey}`} className="admin-newsletter-campaign-card">
                              <div className="fw-bold fs-4 text-break">
                                {item.link ? (
                                  <Link href={item.link} className="link">
                                    {item.title}
                                  </Link>
                                ) : (
                                  item.title
                                )}
                              </div>
                              <div className="mt-3 d-flex align-items-center flex-wrap gap-2">
                                {item.locale === 'en' || item.locale === 'tr' ? (
                                  <span className="d-inline-flex align-items-center gap-2">
                                    <FlagIcon
                                      className="flex-shrink-0"
                                      code={item.locale}
                                      alt={`${item.locale.toUpperCase()} flag`}
                                      width={22}
                                      height={22}
                                    />
                                    <span className="fs-4">
                                      {resolveNewsletterLocaleLabel(item.locale, item.locale)}
                                    </span>
                                  </span>
                                ) : null}
                                <span className={`badge text-bg-${campaignStatus.variant}`}>
                                  {campaignStatus.label}
                                </span>
                              </div>
                              <div className="d-flex flex-column gap-2 mt-3">
                                <div className="d-flex align-items-center flex-wrap gap-4">
                                  <span className="d-inline-flex align-items-center gap-2 fs-5">
                                    <FontAwesomeIcon icon="paper-plane" className="text-muted" />
                                    <span>
                                      {t('adminAccount.newsletter.campaigns.metrics.sent', {
                                        ns: 'admin-account',
                                        count: item.sentCount,
                                      })}
                                    </span>
                                  </span>
                                  <span className="d-inline-flex align-items-center gap-2 fs-5">
                                    <FontAwesomeIcon icon="exclamation-triangle" className="text-muted" />
                                    <span>
                                      {t('adminAccount.newsletter.campaigns.metrics.failed', {
                                        ns: 'admin-account',
                                        count: item.failedCount,
                                      })}
                                    </span>
                                  </span>
                                </div>
                                {item.lastRunAt ? (
                                  <span className="d-inline-flex align-items-center gap-2 fs-5">
                                    <FontAwesomeIcon icon="calendar-alt" className="text-muted" />
                                    {t('adminAccount.newsletter.campaigns.metrics.lastRunAt', {
                                      ns: 'admin-account',
                                      value: formatSessionDate(item.lastRunAt),
                                    })}
                                  </span>
                                ) : null}
                              </div>
                              {campaignThumbnail ? (
                                <div className="admin-newsletter-campaign-thumbnail mt-3 overflow-hidden">
                                  <Image
                                    src={campaignThumbnail}
                                    alt={item.title}
                                    width={640}
                                    height={360}
                                    unoptimized
                                    className="w-100 h-100 object-fit-cover"
                                  />
                                </div>
                              ) : null}
                              {item.summary ? (
                                <p className="post-summary-text mt-3 mb-0 text-muted">{item.summary}</p>
                              ) : null}
                              <div className="d-flex flex-wrap gap-2 mt-3">
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  className="d-inline-flex align-items-center justify-content-center"
                                  onClick={() => {
                                    onOpenNewsletterTest(item);
                                  }}
                                >
                                  <FontAwesomeIcon icon="envelope" className="me-2" />
                                  {t('adminAccount.newsletter.campaigns.actions.sendTest', { ns: 'admin-account' })}
                                </Button>
                                {item.failedCount > 0 ? (
                                  <Button
                                    type="button"
                                    variant="outline-secondary"
                                    size="sm"
                                    className="d-inline-flex align-items-center justify-content-center"
                                    onClick={() => {
                                      void onViewNewsletterFailures(item);
                                    }}
                                  >
                                    <FontAwesomeIcon icon="exclamation-triangle" className="me-2" />
                                    {t('adminAccount.newsletter.campaigns.actions.viewFailures', {
                                      ns: 'admin-account',
                                    })}
                                  </Button>
                                ) : null}
                                {item.link ? (
                                  <Link
                                    href={item.link}
                                    className="btn btn-success btn-sm d-inline-flex align-items-center"
                                  >
                                    <FontAwesomeIcon icon="up-right-from-square" className="me-2" />
                                    {t('adminAccount.newsletter.campaigns.actions.openPost', { ns: 'admin-account' })}
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ),
                  })}
                </div>
              </section>
            </div>
          </div>
        </Tab>
        <Tab
          eventKey="subscribers"
          title={
            <span className="d-inline-flex align-items-center">
              <FontAwesomeIcon icon="address-book" className="me-2" />
              {t('adminAccount.newsletter.tabs.subscribers', { ns: 'admin-account' })}
            </span>
          }
        >
          <div className="pt-3">
            {newsletterFeedback}
            <div className="d-grid gap-3">
              <div className="card shadow-sm d-block">
                <div className="card-body p-3 w-100">
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <Form.Group controlId="admin-newsletter-filter-locale">
                        <Form.Label className="small fw-semibold mb-1">
                          {t('adminAccount.newsletter.filters.locale', { ns: 'admin-account' })}
                        </Form.Label>
                        <Form.Select
                          value={newsletterFilterLocale}
                          onChange={event => {
                            onNewsletterFilterLocaleChange(event.currentTarget.value as 'all' | 'en' | 'tr');
                          }}
                        >
                          <option value="all">
                            {t('adminAccount.newsletter.filters.locales.all', { ns: 'admin-account' })}
                          </option>
                          <option value="en">
                            {t('adminAccount.newsletter.filters.locales.en', { ns: 'admin-account' })}
                          </option>
                          <option value="tr">
                            {t('adminAccount.newsletter.filters.locales.tr', { ns: 'admin-account' })}
                          </option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                    <div className="col-12 col-md-4">
                      <Form.Group controlId="admin-newsletter-filter-status">
                        <Form.Label className="small fw-semibold mb-1">
                          {t('adminAccount.newsletter.filters.status', { ns: 'admin-account' })}
                        </Form.Label>
                        <Form.Select
                          value={newsletterFilterStatus}
                          onChange={event => {
                            onNewsletterFilterStatusChange(event.currentTarget.value as NewsletterFilterStatus);
                          }}
                        >
                          <option value="all">
                            {t('adminAccount.newsletter.filters.statuses.all', { ns: 'admin-account' })}
                          </option>
                          <option value="pending">
                            {t('adminAccount.newsletter.filters.statuses.pending', { ns: 'admin-account' })}
                          </option>
                          <option value="active">
                            {t('adminAccount.newsletter.filters.statuses.active', { ns: 'admin-account' })}
                          </option>
                          <option value="unsubscribed">
                            {t('adminAccount.newsletter.filters.statuses.unsubscribed', { ns: 'admin-account' })}
                          </option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                    <div className="col-12 col-md-4">
                      <Form.Group controlId="admin-newsletter-filter-query">
                        <Form.Label className="small fw-semibold mb-1">
                          {t('adminAccount.newsletter.filters.query', { ns: 'admin-account' })}
                        </Form.Label>
                        <div className="search-bar w-100 d-flex align-items-center">
                          <div className="search-icon">
                            <FontAwesomeIcon icon="search" />
                          </div>
                          <Form.Control
                            type="text"
                            className="search-input form-control"
                            value={newsletterFilterQuery}
                            placeholder={t('adminAccount.newsletter.filters.queryPlaceholder', { ns: 'admin-account' })}
                            onChange={event => {
                              onNewsletterFilterQueryChange(event.currentTarget.value);
                            }}
                          />
                          {newsletterFilterQuery ? (
                            <button
                              type="button"
                              className="search-clear-btn border-0 bg-transparent"
                              onClick={() => {
                                onNewsletterFilterQueryChange('');
                              }}
                              aria-label={t('adminAccount.newsletter.filters.query', { ns: 'admin-account' })}
                            >
                              <FontAwesomeIcon icon="times-circle" className="clear-icon" />
                            </button>
                          ) : null}
                        </div>
                      </Form.Group>
                    </div>
                  </div>
                </div>
              </div>

              <div ref={newsletterListTopRef} className="card shadow-sm d-block">
                <div className="card-body p-3 w-100">
                  <div className="mb-3">
                    <div>
                      <h4 className="admin-dashboard-panel-title mb-2">
                        {t('adminAccount.newsletter.subscribers.title', { ns: 'admin-account' })}
                      </h4>
                      <p className="small text-muted mb-0">
                        {t('adminAccount.newsletter.subscribers.copy', { ns: 'admin-account' })}
                      </p>
                    </div>
                  </div>

                  {renderAsyncSectionContent({
                    isLoading: isNewsletterLoading,
                    loadingLabel: t('adminAccount.newsletter.loading', { ns: 'admin-account' }),
                    isEmpty: totalNewsletterSubscribers === 0,
                    emptyMessage: t('adminAccount.newsletter.empty', { ns: 'admin-account' }),
                    children: (
                      <div className="d-grid gap-2">
                        {newsletterSubscribers.map(item => {
                          const isUpdatingCurrentItem = updatingNewsletterEmail === item.email;
                          const isDeletingCurrentItem = deletingNewsletterEmail === item.email;
                          const normalizedStatus = item.status.toLowerCase();
                          const canActivate = normalizedStatus !== 'active';
                          const canUnsubscribe = normalizedStatus !== 'unsubscribed';
                          const localeCode = item.locale.toLowerCase();
                          const localeLabel = resolveNewsletterLocaleLabel(localeCode, item.locale);

                          return (
                            <div key={item.email} className="border rounded-3 p-3 w-100">
                              <div className="fw-bold fs-5 text-break">{item.email}</div>
                              <div className="mt-2 d-flex align-items-center flex-wrap gap-2">
                                <span className="d-inline-flex align-items-center gap-2 text-muted">
                                  {localeCode === 'en' || localeCode === 'tr' ? (
                                    <FlagIcon
                                      className="flex-shrink-0"
                                      code={localeCode}
                                      alt={`${localeLabel} flag`}
                                      width={18}
                                      height={18}
                                    />
                                  ) : (
                                    <FontAwesomeIcon icon="globe" className="text-muted" />
                                  )}
                                  <span>{localeLabel}</span>
                                </span>
                                <span className="badge text-bg-secondary">
                                  {t(`adminAccount.newsletter.filters.statuses.${normalizedStatus}`, {
                                    ns: 'admin-account',
                                  })}
                                </span>
                              </div>
                              {item.updatedAt ? (
                                <div className="small mt-2 text-muted d-flex align-items-center flex-wrap">
                                  <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                                  {t('adminAccount.newsletter.list.updatedAt', {
                                    ns: 'admin-account',
                                    value: formatSessionDate(item.updatedAt),
                                  })}
                                </div>
                              ) : null}
                              <div className="row g-2 mt-3">
                                {canActivate ? (
                                  <div className="col-12 col-md-auto">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="success"
                                      className="w-100"
                                      disabled={isUpdatingCurrentItem || isDeletingCurrentItem}
                                      onClick={() => {
                                        void onNewsletterStatusUpdate(item, 'active');
                                      }}
                                    >
                                      {isUpdatingCurrentItem ? (
                                        <span className="d-inline-flex align-items-center gap-2">
                                          <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            className="me-2 flex-shrink-0 admin-action-spinner"
                                            aria-hidden="true"
                                          />
                                          <span>
                                            {t('adminAccount.newsletter.actions.updating', { ns: 'admin-account' })}
                                          </span>
                                        </span>
                                      ) : (
                                        <>
                                          <FontAwesomeIcon icon="check" className="me-2" />
                                          {t('adminAccount.newsletter.actions.setActive', { ns: 'admin-account' })}
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                ) : null}

                                {canUnsubscribe ? (
                                  <div className="col-12 col-md-auto">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      className="w-100"
                                      disabled={isUpdatingCurrentItem || isDeletingCurrentItem}
                                      onClick={() => {
                                        void onNewsletterStatusUpdate(item, 'unsubscribed');
                                      }}
                                    >
                                      {isUpdatingCurrentItem ? (
                                        <span className="d-inline-flex align-items-center gap-2">
                                          <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            className="me-2 flex-shrink-0 admin-action-spinner"
                                            aria-hidden="true"
                                          />
                                          <span>
                                            {t('adminAccount.newsletter.actions.updating', { ns: 'admin-account' })}
                                          </span>
                                        </span>
                                      ) : (
                                        <>
                                          <FontAwesomeIcon icon="times-circle" className="me-2" />
                                          {t('adminAccount.newsletter.actions.unsubscribe', { ns: 'admin-account' })}
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                ) : null}

                                <div className="col-12 col-md-auto">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="danger"
                                    className="w-100"
                                    disabled={isUpdatingCurrentItem || isDeletingCurrentItem}
                                    onClick={() => {
                                      onOpenNewsletterDelete(item);
                                    }}
                                  >
                                    {isDeletingCurrentItem ? (
                                      <span className="d-inline-flex align-items-center gap-2">
                                        <Spinner
                                          as="span"
                                          animation="border"
                                          size="sm"
                                          className="me-2 flex-shrink-0 admin-action-spinner"
                                          aria-hidden="true"
                                        />
                                        <span>
                                          {t('adminAccount.newsletter.actions.deleting', { ns: 'admin-account' })}
                                        </span>
                                      </span>
                                    ) : (
                                      <>
                                        <FontAwesomeIcon icon="trash" className="me-2" />
                                        {t('adminAccount.newsletter.actions.delete', { ns: 'admin-account' })}
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ),
                  })}
                </div>
                {!isNewsletterLoading && totalNewsletterSubscribers > 0 ? (
                  <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
                    <PaginationBar
                      currentPage={newsletterPage}
                      totalPages={totalNewsletterPages}
                      totalResults={totalNewsletterSubscribers}
                      size={newsletterPageSize}
                      onPageChange={onNewsletterPageChange}
                      onSizeChange={onNewsletterPageSizeChange}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Tab>
      </Tabs>

      <Modal show={pendingNewsletterDelete !== null} onHide={onCloseNewsletterDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('adminAccount.newsletter.deleteConfirm.title', { ns: 'admin-account' })}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-0">
            {t('adminAccount.newsletter.deleteConfirm.copy', {
              ns: 'admin-account',
              email: pendingNewsletterDelete?.email ?? '',
            })}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={deletingNewsletterEmail !== ''}
            onClick={onCloseNewsletterDelete}
          >
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pendingNewsletterDelete === null || deletingNewsletterEmail !== ''}
            onClick={() => {
              void onDeleteNewsletterSubscriber();
            }}
          >
            {deletingNewsletterEmail ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-2 flex-shrink-0 admin-action-spinner"
                  aria-hidden="true"
                />
                <span>{t('adminAccount.newsletter.actions.deleting', { ns: 'admin-account' })}</span>
              </span>
            ) : (
              <>
                <FontAwesomeIcon icon="trash" className="me-2" />
                {t('adminAccount.newsletter.actions.delete', { ns: 'admin-account' })}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={selectedNewsletterCampaign !== null} onHide={onCloseNewsletterFailures} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{t('adminAccount.newsletter.failures.title', { ns: 'admin-account' })}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="small text-muted mb-3">
            {t('adminAccount.newsletter.failures.copy', {
              ns: 'admin-account',
              title: selectedNewsletterCampaign?.title ?? '',
            })}
          </div>

          {renderAsyncSectionContent({
            isLoading: isNewsletterFailuresLoading,
            loadingLabel: t('adminAccount.newsletter.failures.loading', { ns: 'admin-account' }),
            isEmpty: newsletterCampaignFailures.length === 0,
            emptyMessage: t('adminAccount.newsletter.failures.empty', { ns: 'admin-account' }),
            children: (
              <div className="d-grid gap-2">
                <div className="small text-muted">
                  {t('adminAccount.newsletter.failures.total', { ns: 'admin-account', count: newsletterFailuresTotal })}
                </div>
                {newsletterCampaignFailures.map(item => (
                  <div key={`${item.itemKey}-${item.email}`} className="border rounded-3 p-3">
                    <div className="fw-semibold text-break">{item.email}</div>
                    {item.lastAttemptAt ? (
                      <div className="small text-muted mt-2">
                        {t('adminAccount.newsletter.failures.lastAttemptAt', {
                          ns: 'admin-account',
                          value: formatSessionDate(item.lastAttemptAt),
                        })}
                      </div>
                    ) : null}
                    {item.lastError ? <div className="small text-muted mt-2">{item.lastError}</div> : null}
                  </div>
                ))}
              </div>
            ),
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={isNewsletterFailuresLoading}
            onClick={onCloseNewsletterFailures}
          >
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={pendingNewsletterTestCampaign !== null} onHide={onCloseNewsletterTest} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('adminAccount.newsletter.testSend.title', { ns: 'admin-account' })}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-3">
            {t('adminAccount.newsletter.testSend.copy', {
              ns: 'admin-account',
              title: pendingNewsletterTestCampaign?.title ?? '',
            })}
          </p>
          <Form.Group controlId="admin-newsletter-test-email">
            <Form.Label className="small fw-semibold mb-1">
              {t('adminAccount.newsletter.testSend.emailLabel', { ns: 'admin-account' })}
            </Form.Label>
            <Form.Control
              type="email"
              value={newsletterTestEmail}
              placeholder={t('adminAccount.newsletter.testSend.emailPlaceholder', { ns: 'admin-account' })}
              disabled={isNewsletterTestSending}
              onChange={event => {
                onNewsletterTestEmailChange(event.currentTarget.value);
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" disabled={isNewsletterTestSending} onClick={onCloseNewsletterTest}>
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={isNewsletterTestSending || newsletterTestEmail.trim() === ''}
            onClick={() => {
              void onSendNewsletterTestEmail();
            }}
          >
            {isNewsletterTestSending ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-2 flex-shrink-0 admin-action-spinner"
                  aria-hidden="true"
                />
                <span>{t('adminAccount.newsletter.testSend.sending', { ns: 'admin-account' })}</span>
              </span>
            ) : (
              <>
                <FontAwesomeIcon icon="paper-plane" className="me-2" />
                {t('adminAccount.newsletter.testSend.submit', { ns: 'admin-account' })}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
