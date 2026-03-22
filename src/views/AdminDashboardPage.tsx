'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { defaultLocale } from '@/i18n/settings';
import {
  fetchAdminComments,
  fetchAdminDashboard,
  fetchAdminMe,
  updateAdminCommentStatus,
  type AdminCommentItem,
} from '@/lib/adminApi';
import { ADMIN_ROUTES } from '@/lib/adminRoutes';
import useMediaQuery from '@/hooks/useMediaQuery';
import Link from '@/components/common/Link';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import Image from 'next/image';
import { SITE_LOGO } from '@/config/constants';
import {
  clearAdminSessionProfileCache,
  readAdminSessionProfileCache,
  writeAdminSessionProfileCache,
  type AdminSessionProfile,
} from '@/lib/adminSessionProfileCache';

type AdminIdentity = AdminSessionProfile | null;

type DashboardPayload = {
  totalPosts: number;
  totalSubscribers: number;
  contentHealth: {
    localePairCoverage: number;
    missingTranslations: number;
    missingThumbnails: number;
    latestUpdatedPosts: Array<{
      id: string;
      title: string;
      date: string;
      category: string;
    }>;
    dominantCategory: {
      id: string;
      name: string;
      count: number;
    } | null;
  };
  topViewedPosts: Array<{
    postId: string;
    title: string;
    locale: string;
    publishedDate: string;
    hits: number;
    likes: number;
  }>;
  topLikedPosts: Array<{
    postId: string;
    title: string;
    locale: string;
    publishedDate: string;
    hits: number;
    likes: number;
  }>;
};

type ContentSummary = {
  missingTranslations: number;
  missingThumbnails: number;
  localePairCoverage: number;
  latestUpdatedPosts: Array<{
    id: string;
    title: string;
    date: string;
    category: string;
  }>;
  topCategory: {
    id: string;
    name: string;
    count: number;
  } | null;
};

type AdminSidebarItem = {
  id: string;
  icon: IconProp;
  labelKey: string;
  isRoute?: boolean;
};

const SIDEBAR_ITEMS: AdminSidebarItem[] = [
  { id: 'analytics', icon: 'chart-line', labelKey: 'adminDashboard.sidebar.analytics' },
  { id: 'content-health', icon: 'circle-check', labelKey: 'adminDashboard.sidebar.contentHealth' },
  { id: 'curation', icon: 'layer-group', labelKey: 'adminDashboard.sidebar.curation' },
];

type AdminSidebarProps = {
  isMobile: boolean;
  isVisible: boolean;
  onClose: () => void;
};

const AdminSidebar = ({ isMobile, isVisible, onClose }: Readonly<AdminSidebarProps>) => {
  const { t } = useTranslation(['admin-dashboard', 'admin-common']);

  const sidebarContent = (
    <div className="admin-dashboard-sidebar-content">
      <div className="admin-dashboard-sidebar-head">
        <h2 className="admin-dashboard-sidebar-title">{t('adminDashboard.title', { ns: 'admin-dashboard' })}</h2>
        <p className="admin-dashboard-sidebar-copy">{t('adminDashboard.sidebar.copy', { ns: 'admin-dashboard' })}</p>
      </div>

      <nav
        className="admin-dashboard-sidebar-nav"
        aria-label={t('adminDashboard.sidebar.label', { ns: 'admin-dashboard' })}
      >
        {SIDEBAR_ITEMS.map(item =>
          item.isRoute ? (
            <Link
              key={item.id}
              href={item.id}
              className="admin-dashboard-sidebar-link"
              onClick={isMobile ? onClose : undefined}
            >
              <span className="admin-dashboard-sidebar-link-icon">
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <span>{t(item.labelKey, { ns: 'admin-common' })}</span>
            </Link>
          ) : (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="admin-dashboard-sidebar-link"
              onClick={isMobile ? onClose : undefined}
            >
              <span className="admin-dashboard-sidebar-link-icon">
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <span>{t(item.labelKey, { ns: 'admin-dashboard' })}</span>
            </a>
          ),
        )}
      </nav>
    </div>
  );

  if (isMobile) {
    return (
      <Offcanvas show={isVisible} onHide={onClose} placement="start" className="admin-dashboard-offcanvas">
        <Offcanvas.Header closeButton={false}>
          <Link href="/admin" onClick={onClose} className="d-flex align-items-center brand text-decoration-none">
            <span className="d-inline-flex align-items-center">
              <Image
                src={SITE_LOGO}
                alt={t('adminCommon.brand', { ns: 'admin-common' })}
                width={40}
                height={40}
                className="rounded-circle me-2"
              />
            </span>
            <h5 className="fw-bold m-0 d-flex align-items-center">{t('adminCommon.brand', { ns: 'admin-common' })}</h5>
          </Link>
          <button
            type="button"
            className="btn-close-custom position-absolute top-0 end-0 m-3"
            aria-label="Close"
            onClick={onClose}
          >
            <FontAwesomeIcon icon="times" className="sidebar-close-icon" />
          </button>
        </Offcanvas.Header>
        <Offcanvas.Body className="admin-dashboard-sidebar-offcanvas">{sidebarContent}</Offcanvas.Body>
      </Offcanvas>
    );
  }

  return (
    <aside className="admin-dashboard-sidebar post-card">
      <div className="post-card-content">{sidebarContent}</div>
    </aside>
  );
};

const parseDateValue = (value?: string) => {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const buildContentSummary = (dashboard: DashboardPayload | null): ContentSummary | null => {
  if (!dashboard) {
    return null;
  }

  return {
    missingTranslations: dashboard.contentHealth.missingTranslations,
    missingThumbnails: dashboard.contentHealth.missingThumbnails,
    localePairCoverage: dashboard.contentHealth.localePairCoverage,
    latestUpdatedPosts: dashboard.contentHealth.latestUpdatedPosts,
    topCategory: dashboard.contentHealth.dominantCategory,
  };
};

export default function AdminDashboardPage() {
  const { t } = useTranslation(['admin-dashboard', 'admin-common']);
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 991px)');
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const locale = routeLocale ?? defaultLocale;
  const [adminUser, setAdminUser] = React.useState<AdminIdentity>(null);
  const [dashboard, setDashboard] = React.useState<DashboardPayload | null>(null);
  const [contentSummary, setContentSummary] = React.useState<ContentSummary | null>(null);
  const [pendingComments, setPendingComments] = React.useState<AdminCommentItem[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = React.useState(true);
  const [commentActionID, setCommentActionID] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = React.useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const metricFormatter = React.useMemo(
    () =>
      new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
        maximumFractionDigits: 0,
      }),
    [locale],
  );
  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [locale],
  );

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

  if (isLoading) {
    return (
      <section className="admin-dashboard-shell">
        <div className="admin-dashboard-layout admin-dashboard-layout--loading">
          {isDesktopSidebarVisible ? (
            <aside className="admin-dashboard-sidebar admin-dashboard-loading post-card">
              <div className="post-card-content admin-dashboard-loading-sidebar">
                <div className="admin-loading-line admin-loading-line-md" />
                <div className="admin-loading-line admin-loading-line-lg" />
                <div className="admin-loading-line admin-loading-line-md" />
                <div className="admin-dashboard-loading-nav">
                  <div className="admin-dashboard-loading-chip" />
                  <div className="admin-dashboard-loading-chip" />
                  <div className="admin-dashboard-loading-chip" />
                  <div className="admin-dashboard-loading-chip" />
                </div>
              </div>
            </aside>
          ) : null}
          <div className="admin-dashboard-main">
            <div className="admin-dashboard-grid admin-dashboard-grid--loading">
              <div className="admin-dashboard-hero admin-dashboard-loading post-card">
                <div className="post-card-content admin-dashboard-loading-panel">
                  <AdminLoadingState
                    className="admin-loading-stack"
                    ariaLabel={t('adminCommon.status.loading', { ns: 'admin-common' })}
                  />
                  <div className="admin-loading-line admin-loading-line-lg" />
                  <div className="admin-loading-line admin-loading-line-md" />
                  <div className="admin-dashboard-loading-kpis">
                    <div className="admin-dashboard-loading-stat" />
                    <div className="admin-dashboard-loading-stat" />
                  </div>
                </div>
              </div>
              <div className="admin-dashboard-account admin-dashboard-loading post-card">
                <div className="post-card-content admin-dashboard-loading-panel admin-dashboard-loading-panel--compact">
                  <div className="admin-loading-line admin-loading-line-md" />
                  <div className="admin-loading-line admin-loading-line-lg" />
                  <div className="admin-loading-line admin-loading-line-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!adminUser) {
    return null;
  }

  const topViewedChart = (dashboard?.topViewedPosts ?? []).slice(0, 5);
  const maxHits = Math.max(...topViewedChart.map(post => post.hits), 1);
  const topLikedPosts = (dashboard?.topLikedPosts ?? []).slice(0, 5);
  const topViewedLead = dashboard?.topViewedPosts[0] ?? null;
  const topLikedLead = dashboard?.topLikedPosts[0] ?? null;
  const formatMetric = (value: number) => metricFormatter.format(value);
  const formatDate = (value: string) => {
    const parsed = parseDateValue(value);
    if (parsed === 0) {
      return value;
    }
    return dateFormatter.format(new Date(parsed));
  };

  return (
    <section className="admin-dashboard-shell">
      <div className={`admin-dashboard-layout${isDesktopSidebarVisible ? '' : ' admin-dashboard-layout--collapsed'}`}>
        {isDesktopSidebarVisible ? (
          <AdminSidebar isMobile={false} isVisible={true} onClose={() => setIsDesktopSidebarOpen(false)} />
        ) : null}
        <div className="admin-dashboard-main">
          <section id="overview" className="admin-dashboard-grid">
            <div className="admin-dashboard-hero post-card">
              <div className="post-card-content">
                <div className="admin-dashboard-hero-row">
                  <div className="admin-dashboard-hero-copy">
                    <h1 className="admin-dashboard-title">{t('adminDashboard.title', { ns: 'admin-dashboard' })}</h1>
                    <p className="admin-dashboard-subtitle mb-0">
                      {t('adminDashboard.subtitle', { ns: 'admin-dashboard' })}
                    </p>
                  </div>
                </div>

                <div className="admin-dashboard-kpis">
                  <div className="admin-dashboard-kpi">
                    <div className="admin-dashboard-kpi-icon">
                      <FontAwesomeIcon icon="clipboard-list" />
                    </div>
                    <div>
                      <div className="admin-dashboard-kpi-label">
                        {t('adminDashboard.cards.posts.title', { ns: 'admin-dashboard' })}
                      </div>
                      <div className="admin-dashboard-kpi-value">{dashboard?.totalPosts ?? 0}</div>
                    </div>
                  </div>

                  <div className="admin-dashboard-kpi">
                    <div className="admin-dashboard-kpi-icon">
                      <FontAwesomeIcon icon="address-book" />
                    </div>
                    <div>
                      <div className="admin-dashboard-kpi-label">
                        {t('adminDashboard.cards.subscribers.title', { ns: 'admin-dashboard' })}
                      </div>
                      <div className="admin-dashboard-kpi-value">{dashboard?.totalSubscribers ?? 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-dashboard-account post-card">
              <div className="post-card-content">
                <div className="admin-dashboard-panel-head">
                  <h2 className="admin-dashboard-panel-title">
                    {t('adminDashboard.cards.identity.title', { ns: 'admin-dashboard' })}
                  </h2>
                </div>
                <p className="admin-dashboard-panel-copy">
                  {t('adminDashboard.cards.identity.body', { ns: 'admin-dashboard', email: adminUser.email })}
                </p>
                <dl className="admin-dashboard-meta-list mb-0">
                  <div>
                    <dt>{t('adminDashboard.details.email', { ns: 'admin-dashboard' })}</dt>
                    <dd>{adminUser.email}</dd>
                  </div>
                  <div>
                    <dt>{t('adminDashboard.details.role', { ns: 'admin-dashboard' })}</dt>
                    <dd>{adminUser.roles.join(', ')}</dd>
                  </div>
                  <div>
                    <dt>{t('adminDashboard.details.session', { ns: 'admin-dashboard' })}</dt>
                    <dd>{t('adminDashboard.cards.session.body', { ns: 'admin-dashboard' })}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="admin-dashboard-stats">
              <div className="admin-dashboard-stat-card post-card">
                <div className="post-card-content">
                  <div className="admin-dashboard-stat-head">
                    <span>{t('adminDashboard.cards.session.title', { ns: 'admin-dashboard' })}</span>
                    <FontAwesomeIcon icon="user" />
                  </div>
                  <div className="admin-dashboard-stat-body">{adminUser.roles.join(', ')}</div>
                </div>
              </div>

              <div className="admin-dashboard-stat-card post-card">
                <div className="post-card-content">
                  <div className="admin-dashboard-stat-head">
                    <span>{t('adminDashboard.cards.posts.title', { ns: 'admin-dashboard' })}</span>
                    <FontAwesomeIcon icon="book" />
                  </div>
                  <div className="admin-dashboard-stat-body">{dashboard?.totalPosts ?? 0}</div>
                </div>
              </div>

              <div className="admin-dashboard-stat-card post-card">
                <div className="post-card-content">
                  <div className="admin-dashboard-stat-head">
                    <span>{t('adminDashboard.cards.subscribers.title', { ns: 'admin-dashboard' })}</span>
                    <FontAwesomeIcon icon="envelope" />
                  </div>
                  <div className="admin-dashboard-stat-body">{dashboard?.totalSubscribers ?? 0}</div>
                </div>
              </div>
            </div>
          </section>

          <section id="analytics" className="admin-dashboard-grid admin-dashboard-grid-secondary">
            <div className="admin-dashboard-analytics-card post-card">
              <div className="post-card-content">
                <div className="admin-dashboard-panel-head">
                  <div>
                    <h2 className="admin-dashboard-panel-title">
                      {t('adminDashboard.analytics.title', { ns: 'admin-dashboard' })}
                    </h2>
                    <p className="admin-dashboard-panel-copy mb-0">
                      {t('adminDashboard.analytics.subtitle', { ns: 'admin-dashboard' })}
                    </p>
                  </div>
                  <div className="admin-dashboard-panel-icon">
                    <FontAwesomeIcon icon="chart-line" />
                  </div>
                </div>

                <div className="admin-dashboard-bar-chart">
                  {topViewedChart.map(post => {
                    const width = `${Math.max(18, Math.round((post.hits / maxHits) * 100))}%`;
                    return (
                      <div key={`chart:${post.postId}`} className="admin-dashboard-bar-row">
                        <div className="admin-dashboard-bar-copy">
                          <div className="admin-dashboard-post-title">{post.title || post.postId}</div>
                          <div className="admin-dashboard-bar-meta">
                            <span>{post.locale || '-'}</span>
                            <span>
                              {formatMetric(post.hits)}{' '}
                              {t('adminDashboard.table.metricHits', { ns: 'admin-dashboard' })}
                            </span>
                          </div>
                        </div>
                        <div className="admin-dashboard-bar-track" aria-hidden="true">
                          <div className="admin-dashboard-bar-fill" style={{ width }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="admin-dashboard-list-card post-card">
              <div className="post-card-content">
                <div className="admin-dashboard-panel-head">
                  <div>
                    <h2 className="admin-dashboard-panel-title">
                      {t('adminDashboard.lists.topLiked', { ns: 'admin-dashboard' })}
                    </h2>
                    <p className="admin-dashboard-panel-copy mb-0">
                      {t('adminDashboard.lists.topLikedHint', { ns: 'admin-dashboard' })}
                    </p>
                  </div>
                  <div className="admin-dashboard-panel-icon">
                    <FontAwesomeIcon icon="heart" />
                  </div>
                </div>
                <div className="table-responsive admin-dashboard-table-wrap">
                  <table className="table align-middle mb-0 admin-dashboard-table">
                    <thead>
                      <tr>
                        <th>{t('adminDashboard.table.post', { ns: 'admin-dashboard' })}</th>
                        <th>{t('adminDashboard.table.locale', { ns: 'admin-dashboard' })}</th>
                        <th>{t('adminDashboard.table.metricLikes', { ns: 'admin-dashboard' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topLikedPosts.map(post => (
                        <tr key={`likes:${post.postId}`}>
                          <td className="admin-dashboard-post-cell">
                            <div className="admin-dashboard-post-title">{post.title || post.postId}</div>
                          </td>
                          <td>{post.locale || '-'}</td>
                          <td className="admin-dashboard-metric-cell">{formatMetric(post.likes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section id="content-health" className="admin-dashboard-grid admin-dashboard-grid-secondary">
            <div className="admin-dashboard-signal-card post-card">
              <div className="post-card-content">
                <div className="admin-dashboard-panel-head">
                  <div>
                    <h2 className="admin-dashboard-panel-title">
                      {t('adminDashboard.contentHealth.title', { ns: 'admin-dashboard' })}
                    </h2>
                    <p className="admin-dashboard-panel-copy mb-0">
                      {t('adminDashboard.contentHealth.subtitle', { ns: 'admin-dashboard' })}
                    </p>
                  </div>
                  <div className="admin-dashboard-panel-icon">
                    <FontAwesomeIcon icon="circle-check" />
                  </div>
                </div>

                <div className="admin-dashboard-signal-grid">
                  <div className="admin-dashboard-signal-tile">
                    <span>{t('adminDashboard.contentHealth.localePairs', { ns: 'admin-dashboard' })}</span>
                    <strong>{contentSummary?.localePairCoverage ?? 0}%</strong>
                  </div>
                  <div className="admin-dashboard-signal-tile">
                    <span>{t('adminDashboard.contentHealth.missingTranslations', { ns: 'admin-dashboard' })}</span>
                    <strong>{contentSummary?.missingTranslations ?? 0}</strong>
                  </div>
                  <div className="admin-dashboard-signal-tile">
                    <span>{t('adminDashboard.contentHealth.missingThumbnails', { ns: 'admin-dashboard' })}</span>
                    <strong>{contentSummary?.missingThumbnails ?? 0}</strong>
                  </div>
                </div>

                <div className="admin-dashboard-mini-list">
                  {(contentSummary?.latestUpdatedPosts ?? []).map(post => (
                    <div key={`health:${post.id}`} className="admin-dashboard-mini-item">
                      <div>
                        <div className="admin-dashboard-post-title">{post.title}</div>
                        <div className="admin-dashboard-bar-meta">
                          <span>{post.category}</span>
                          <span>{formatDate(post.date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="curation" className="admin-dashboard-signal-card post-card">
              <div className="post-card-content">
                <div className="admin-dashboard-panel-head">
                  <div>
                    <h2 className="admin-dashboard-panel-title">
                      {t('adminDashboard.curation.title', { ns: 'admin-dashboard' })}
                    </h2>
                    <p className="admin-dashboard-panel-copy mb-0">
                      {t('adminDashboard.curation.subtitle', { ns: 'admin-dashboard' })}
                    </p>
                  </div>
                  <div className="admin-dashboard-panel-icon">
                    <FontAwesomeIcon icon="layer-group" />
                  </div>
                </div>

                <div className="admin-dashboard-curation-stack">
                  <div className="admin-dashboard-curation-item">
                    <span className="admin-dashboard-curation-label">
                      {t('adminDashboard.curation.leadStory', { ns: 'admin-dashboard' })}
                    </span>
                    <strong>{topViewedLead?.title ?? '-'}</strong>
                    <div className="admin-dashboard-bar-meta">
                      <span>{topViewedLead?.locale ?? '-'}</span>
                      <span>
                        {formatMetric(topViewedLead?.hits ?? 0)}{' '}
                        {t('adminDashboard.table.metricHits', { ns: 'admin-dashboard' })}
                      </span>
                    </div>
                  </div>

                  <div className="admin-dashboard-curation-item">
                    <span className="admin-dashboard-curation-label">
                      {t('adminDashboard.curation.bestFeedback', { ns: 'admin-dashboard' })}
                    </span>
                    <strong>{topLikedLead?.title ?? '-'}</strong>
                    <div className="admin-dashboard-bar-meta">
                      <span>{topLikedLead?.locale ?? '-'}</span>
                      <span>
                        {formatMetric(topLikedLead?.likes ?? 0)}{' '}
                        {t('adminDashboard.table.metricLikes', { ns: 'admin-dashboard' })}
                      </span>
                    </div>
                  </div>

                  <div className="admin-dashboard-curation-item">
                    <span className="admin-dashboard-curation-label">
                      {t('adminDashboard.curation.dominantCategory', { ns: 'admin-dashboard' })}
                    </span>
                    <strong>{contentSummary?.topCategory?.name ?? '-'}</strong>
                    <div className="admin-dashboard-bar-meta">
                      <span>
                        {formatMetric(contentSummary?.topCategory?.count ?? 0)}{' '}
                        {t('adminDashboard.cards.posts.title', { ns: 'admin-dashboard' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-dashboard-signal-card post-card">
              <div className="post-card-content">
                <div className="admin-dashboard-panel-head">
                  <div>
                    <h2 className="admin-dashboard-panel-title">
                      {t('adminDashboard.comments.title', { ns: 'admin-dashboard' })}
                    </h2>
                    <p className="admin-dashboard-panel-copy mb-0">
                      {t('adminDashboard.comments.subtitle', { ns: 'admin-dashboard' })}
                    </p>
                  </div>
                  <div className="admin-dashboard-panel-icon">
                    <FontAwesomeIcon icon="comments" />
                  </div>
                </div>

                <div className="d-flex justify-content-end mb-3">
                  <Link href={ADMIN_ROUTES.settings.comments} className="text-decoration-none">
                    <Button type="button" variant="outline-secondary" size="sm">
                      <FontAwesomeIcon icon="up-right-from-square" className="me-2" />
                      {t('adminDashboard.comments.manage', { ns: 'admin-dashboard' })}
                    </Button>
                  </Link>
                </div>

                {isCommentsLoading ? (
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <FontAwesomeIcon icon="spinner" spin />
                    <span>{t('adminDashboard.comments.loading', { ns: 'admin-dashboard' })}</span>
                  </div>
                ) : null}

                {!isCommentsLoading && pendingComments.length === 0 ? (
                  <p className="admin-dashboard-panel-copy mb-0">
                    {t('adminDashboard.comments.empty', { ns: 'admin-dashboard' })}
                  </p>
                ) : null}

                {isCommentsLoading ? null : (
                  <div className="admin-dashboard-curation-stack">
                    {pendingComments.map(comment => (
                      <div key={comment.id} className="admin-dashboard-curation-item">
                        <span className="admin-dashboard-curation-label">{comment.postTitle || comment.postId}</span>
                        <strong>{comment.authorName}</strong>
                        <div className="admin-dashboard-bar-meta">
                          <span>{comment.authorEmail}</span>
                          <span>{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="mb-0">{comment.content}</p>
                        <div className="d-flex flex-wrap gap-2 mt-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            disabled={commentActionID === comment.id}
                            onClick={() => void handleCommentStatusUpdate(comment.id, 'APPROVED')}
                          >
                            {t('adminDashboard.comments.actions.approve', { ns: 'admin-dashboard' })}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            disabled={commentActionID === comment.id}
                            onClick={() => void handleCommentStatusUpdate(comment.id, 'REJECTED')}
                          >
                            {t('adminDashboard.comments.actions.reject', { ns: 'admin-dashboard' })}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={commentActionID === comment.id}
                            onClick={() => void handleCommentStatusUpdate(comment.id, 'SPAM')}
                          >
                            {t('adminDashboard.comments.actions.spam', { ns: 'admin-dashboard' })}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
      {isMobileSidebarVisible ? (
        <AdminSidebar
          isMobile={true}
          isVisible={isMobileSidebarVisible}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      ) : null}
    </section>
  );
}
