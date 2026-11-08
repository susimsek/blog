'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import type { AdminCommentItem } from '@/lib/adminApi';

type AdminCommentTranslate = (key: string, options?: Record<string, unknown>) => string;

type AdminCommentDetailsProps = {
  t: AdminCommentTranslate;
  item: AdminCommentItem;
  statusLabel: string;
  statusVariant: string;
  formatDate: (value: string) => string;
};

export function AdminCommentDetails({
  t,
  item,
  statusLabel,
  statusVariant,
  formatDate,
}: Readonly<AdminCommentDetailsProps>) {
  return (
    <>
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <strong className="text-break">{item.authorName}</strong>
        <span className={`badge text-bg-${statusVariant}`}>{statusLabel}</span>
        <span className="badge text-bg-light">
          {item.parentId
            ? t('adminAccount.comments.list.replyLabel', { ns: 'admin-account' })
            : t('adminAccount.comments.list.rootLabel', { ns: 'admin-account' })}
        </span>
      </div>
      <div className="small theme-text-muted d-flex align-items-center gap-2 flex-wrap">
        <span className="d-inline-flex align-items-center gap-2">
          <FontAwesomeIcon icon="envelope" className="theme-text-muted" />
          <span>{item.authorEmail}</span>
        </span>
        <span className="d-inline-flex align-items-center gap-2">
          <FontAwesomeIcon icon="calendar-alt" className="theme-text-muted" />
          <span>
            {t('adminAccount.comments.list.submittedAt', {
              ns: 'admin-account',
              value: formatDate(item.createdAt),
            })}
          </span>
        </span>
        {item.updatedAt && item.updatedAt !== item.createdAt ? (
          <span className="d-inline-flex align-items-center gap-2">
            <FontAwesomeIcon icon="clock" className="theme-text-muted" />
            <span>
              {t('adminAccount.comments.list.updatedAt', {
                ns: 'admin-account',
                value: formatDate(item.updatedAt),
              })}
            </span>
          </span>
        ) : null}
      </div>
    </>
  );
}

type AdminCommentModerationActionsProps = {
  t: AdminCommentTranslate;
  status: AdminCommentItem['status'];
  actionStatus: AdminCommentItem['status'] | null;
  isActionPending: boolean;
  isDeletePending: boolean;
  isBulkActionPending: boolean;
  onStatusUpdate: (status: 'APPROVED' | 'REJECTED' | 'SPAM') => void | Promise<void>;
  onDelete: () => void;
};

export function AdminCommentModerationActions({
  t,
  status,
  actionStatus,
  isActionPending,
  isDeletePending,
  isBulkActionPending,
  onStatusUpdate,
  onDelete,
}: Readonly<AdminCommentModerationActionsProps>) {
  const isApprovePending = isActionPending && actionStatus === 'APPROVED';
  const isRejectPending = isActionPending && actionStatus === 'REJECTED';
  const isSpamPending = isActionPending && actionStatus === 'SPAM';

  const renderPendingAction = (label: 'updating' | 'deleting') => (
    <span className="d-inline-flex align-items-center gap-2">
      <Spinner
        as="span"
        animation="border"
        size="sm"
        className="me-2 flex-shrink-0 admin-action-spinner"
        aria-hidden="true"
      />
      <span>{t(`adminAccount.comments.actions.${label}`, { ns: 'admin-account' })}</span>
    </span>
  );

  return (
    <div className="row g-2 mt-3">
      <div className="col-12 col-md-auto">
        <Button
          type="button"
          size="sm"
          variant="success"
          className="w-100"
          disabled={isActionPending || isDeletePending || isBulkActionPending || status === 'APPROVED'}
          onClick={() => void onStatusUpdate('APPROVED')}
        >
          {isApprovePending ? (
            renderPendingAction('updating')
          ) : (
            <>
              <FontAwesomeIcon icon="check" className="me-2" />
              {t('adminAccount.comments.actions.approve', { ns: 'admin-account' })}
            </>
          )}
        </Button>
      </div>
      <div className="col-12 col-md-auto">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="w-100 admin-newsletter-action admin-newsletter-action--secondary"
          disabled={isActionPending || isDeletePending || isBulkActionPending || status === 'REJECTED'}
          onClick={() => void onStatusUpdate('REJECTED')}
        >
          {isRejectPending ? null : <FontAwesomeIcon icon="times-circle" className="me-2" />}
          {isRejectPending
            ? renderPendingAction('updating')
            : t('adminAccount.comments.actions.reject', { ns: 'admin-account' })}
        </Button>
      </div>
      <div className="col-12 col-md-auto">
        <Button
          type="button"
          size="sm"
          variant="danger"
          className="w-100 admin-newsletter-action admin-newsletter-action--danger"
          disabled={isActionPending || isDeletePending || isBulkActionPending || status === 'SPAM'}
          onClick={() => void onStatusUpdate('SPAM')}
        >
          {isSpamPending ? null : <FontAwesomeIcon icon="shield-halved" className="me-2" />}
          {isSpamPending
            ? renderPendingAction('updating')
            : t('adminAccount.comments.actions.spam', { ns: 'admin-account' })}
        </Button>
      </div>
      <div className="col-12 col-md-auto">
        <Button
          type="button"
          size="sm"
          variant="danger"
          className="w-100"
          disabled={isActionPending || isDeletePending || isBulkActionPending}
          onClick={onDelete}
        >
          {isDeletePending ? (
            renderPendingAction('deleting')
          ) : (
            <>
              <FontAwesomeIcon icon="trash" className="me-2" />
              {t('adminAccount.comments.actions.delete', { ns: 'admin-account' })}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
