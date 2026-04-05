'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { TFunction } from 'i18next';
import type { ContentSummary, DashboardPayload } from '@/views/admin-dashboard/types';

type AdminDashboardCurationSectionProps = {
  contentSummary: ContentSummary | null;
  formatMetric: (value: number) => string;
  t: TFunction;
  topLikedLead: DashboardPayload['topLikedPosts'][number] | null;
  topViewedLead: DashboardPayload['topViewedPosts'][number] | null;
};

export default function AdminDashboardCurationSection({
  contentSummary,
  formatMetric,
  t,
  topLikedLead,
  topViewedLead,
}: Readonly<AdminDashboardCurationSectionProps>) {
  return (
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
  );
}
