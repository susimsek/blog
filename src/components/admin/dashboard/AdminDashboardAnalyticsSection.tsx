'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { TFunction } from 'i18next';
import type { DashboardPayload } from '@/views/admin-dashboard/types';

type AdminDashboardAnalyticsSectionProps = {
  formatMetric: (value: number) => string;
  maxHits: number;
  t: TFunction;
  topLikedPosts: DashboardPayload['topLikedPosts'];
  topViewedChart: DashboardPayload['topViewedPosts'];
};

export default function AdminDashboardAnalyticsSection({
  formatMetric,
  maxHits,
  t,
  topLikedPosts,
  topViewedChart,
}: Readonly<AdminDashboardAnalyticsSectionProps>) {
  return (
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
                        {formatMetric(post.hits)} {t('adminDashboard.table.metricHits', { ns: 'admin-dashboard' })}
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
  );
}
