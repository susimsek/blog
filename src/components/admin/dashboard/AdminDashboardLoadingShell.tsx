'use client';

import type { TFunction } from 'i18next';
import AdminLoadingState from '@/components/admin/AdminLoadingState';

type AdminDashboardLoadingShellProps = {
  isDesktopSidebarVisible: boolean;
  t: TFunction;
};

export default function AdminDashboardLoadingShell({
  isDesktopSidebarVisible,
  t,
}: Readonly<AdminDashboardLoadingShellProps>) {
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
