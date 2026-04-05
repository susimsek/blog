'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { TFunction } from 'i18next';
import type { AdminIdentity, DashboardPayload } from '@/views/admin-dashboard/types';

type AdminDashboardOverviewSectionProps = {
  adminUser: Exclude<AdminIdentity, null>;
  dashboard: DashboardPayload | null;
  t: TFunction;
};

export default function AdminDashboardOverviewSection({
  adminUser,
  dashboard,
  t,
}: Readonly<AdminDashboardOverviewSectionProps>) {
  return (
    <section id="overview" className="admin-dashboard-grid">
      <div className="admin-dashboard-hero post-card">
        <div className="post-card-content">
          <div className="admin-dashboard-hero-row">
            <div className="admin-dashboard-hero-copy">
              <h1 className="admin-dashboard-title">{t('adminDashboard.title', { ns: 'admin-dashboard' })}</h1>
              <p className="admin-dashboard-subtitle mb-0">{t('adminDashboard.subtitle', { ns: 'admin-dashboard' })}</p>
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
  );
}
