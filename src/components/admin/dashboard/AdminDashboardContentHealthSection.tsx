'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { TFunction } from 'i18next';
import type { ContentSummary } from '@/views/admin-dashboard/types';

type AdminDashboardContentHealthSectionProps = {
  contentSummary: ContentSummary | null;
  formatDate: (value: string) => string;
  t: TFunction;
};

export default function AdminDashboardContentHealthSection({
  contentSummary,
  formatDate,
  t,
}: Readonly<AdminDashboardContentHealthSectionProps>) {
  return (
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
  );
}
