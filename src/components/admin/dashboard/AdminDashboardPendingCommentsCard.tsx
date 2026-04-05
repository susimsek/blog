'use client';

import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { TFunction } from 'i18next';
import type { AdminCommentItem } from '@/lib/adminApi';
import { ADMIN_ROUTES } from '@/lib/adminRoutes';
import Link from '@/components/common/Link';

type AdminDashboardPendingCommentsCardProps = {
  commentActionID: string;
  formatDate: (value: string) => string;
  handleCommentStatusUpdate: (commentId: string, status: 'APPROVED' | 'REJECTED' | 'SPAM') => Promise<void>;
  isCommentsLoading: boolean;
  pendingComments: AdminCommentItem[];
  t: TFunction;
};

export default function AdminDashboardPendingCommentsCard({
  commentActionID,
  formatDate,
  handleCommentStatusUpdate,
  isCommentsLoading,
  pendingComments,
  t,
}: Readonly<AdminDashboardPendingCommentsCardProps>) {
  return (
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
  );
}
