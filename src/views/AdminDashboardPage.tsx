'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { defaultLocale } from '@/i18n/settings';
import useMediaQuery from '@/hooks/useMediaQuery';
import Link from '@/components/common/Link';
import AdminDashboardAnalyticsSection from '@/components/admin/dashboard/AdminDashboardAnalyticsSection';
import AdminDashboardContentHealthSection from '@/components/admin/dashboard/AdminDashboardContentHealthSection';
import AdminDashboardCurationSection from '@/components/admin/dashboard/AdminDashboardCurationSection';
import AdminDashboardLoadingShell from '@/components/admin/dashboard/AdminDashboardLoadingShell';
import AdminDashboardOverviewSection from '@/components/admin/dashboard/AdminDashboardOverviewSection';
import AdminDashboardPendingCommentsCard from '@/components/admin/dashboard/AdminDashboardPendingCommentsCard';
import Image from 'next/image';
import { SITE_LOGO } from '@/config/constants';
import { parseDateValue } from '@/views/admin-dashboard/helpers';
import { useAdminDashboardPageData } from '@/views/admin-dashboard/useAdminDashboardPageData';

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

export default function AdminDashboardPage() {
  const { t } = useTranslation(['admin-dashboard', 'admin-common']);
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 991px)');
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const locale = routeLocale ?? defaultLocale;
  const {
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
  } = useAdminDashboardPageData({
    locale,
    router,
    isMobile,
  });
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

  if (isLoading) {
    return <AdminDashboardLoadingShell isDesktopSidebarVisible={isDesktopSidebarVisible} t={t} />;
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
          <AdminDashboardOverviewSection adminUser={adminUser} dashboard={dashboard} t={t} />
          <AdminDashboardAnalyticsSection
            formatMetric={formatMetric}
            maxHits={maxHits}
            t={t}
            topLikedPosts={topLikedPosts}
            topViewedChart={topViewedChart}
          />
          <section id="content-health" className="admin-dashboard-grid admin-dashboard-grid-secondary">
            <AdminDashboardContentHealthSection contentSummary={contentSummary} formatDate={formatDate} t={t} />
            <AdminDashboardCurationSection
              contentSummary={contentSummary}
              formatMetric={formatMetric}
              t={t}
              topLikedLead={topLikedLead}
              topViewedLead={topViewedLead}
            />
            <AdminDashboardPendingCommentsCard
              commentActionID={commentActionID}
              formatDate={formatDate}
              handleCommentStatusUpdate={handleCommentStatusUpdate}
              isCommentsLoading={isCommentsLoading}
              pendingComments={pendingComments}
              t={t}
            />
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
