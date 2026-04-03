'use client';

import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from '@/components/common/Link';
import PaginationBar from '@/components/pagination/PaginationBar';
import { buildAdminContentPostDetailRoute } from '@/lib/adminRoutes';
import type { AdminCommentItem } from '@/lib/adminApi';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;
type AsyncSectionContentProps = {
  isLoading: boolean;
  loadingLabel: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
};

type AdminAccountCommentsSectionProps = {
  t: AdminAccountTranslate;
  locale: string;
  formatSessionDate: (value: string) => string;
  commentsErrorMessage: string;
  commentsSuccessMessage: string;
  commentsListTopRef: React.RefObject<HTMLDivElement | null>;
  commentFilterStatus: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
  onCommentFilterStatusChange: (value: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM') => void;
  commentFilterQuery: string;
  onCommentFilterQueryChange: (value: string) => void;
  onClearCommentFilterQuery: () => void;
  comments: AdminCommentItem[];
  isCommentsLoading: boolean;
  totalComments: number;
  renderAsyncSectionContent: (props: AsyncSectionContentProps) => React.ReactNode;
  allVisibleCommentsSelected: boolean;
  hasSelectedComments: boolean;
  selectedCommentCount: number;
  isBulkCommentActionPending: boolean;
  bulkCommentActionStatus: AdminCommentItem['status'] | null;
  isBulkCommentDeleting: boolean;
  onToggleVisibleCommentsSelection: () => void;
  onClearSelectedComments: () => void;
  onBulkCommentStatusUpdate: (status: 'APPROVED' | 'REJECTED' | 'SPAM') => void | Promise<void>;
  onOpenBulkCommentDelete: () => void;
  selectedCommentIDs: string[];
  onToggleCommentSelection: (itemID: string, checked: boolean) => void;
  resolveCommentStatusVariant: (status: AdminCommentItem['status']) => string;
  commentActionID: string;
  commentActionStatus: AdminCommentItem['status'] | null;
  deletingCommentID: string;
  onCommentStatusUpdate: (itemID: string, status: 'APPROVED' | 'REJECTED' | 'SPAM') => void | Promise<void>;
  onOpenCommentDelete: (item: AdminCommentItem) => void;
  commentsPage: number;
  totalCommentPages: number;
  commentsPageSize: number;
  onCommentsPageChange: (page: number) => void;
  onCommentsPageSizeChange: (size: number) => void;
  pendingBulkCommentDeleteCount: number;
  onCloseBulkCommentDelete: () => void;
  onConfirmBulkCommentDelete: () => void | Promise<void>;
  pendingCommentDelete: AdminCommentItem | null;
  onCloseCommentDelete: () => void;
  onConfirmCommentDelete: () => void | Promise<void>;
};

export default function AdminAccountCommentsSection({
  t,
  locale,
  formatSessionDate,
  commentsErrorMessage,
  commentsSuccessMessage,
  commentsListTopRef,
  commentFilterStatus,
  onCommentFilterStatusChange,
  commentFilterQuery,
  onCommentFilterQueryChange,
  onClearCommentFilterQuery,
  comments,
  isCommentsLoading,
  totalComments,
  renderAsyncSectionContent,
  allVisibleCommentsSelected,
  hasSelectedComments,
  selectedCommentCount,
  isBulkCommentActionPending,
  bulkCommentActionStatus,
  isBulkCommentDeleting,
  onToggleVisibleCommentsSelection,
  onClearSelectedComments,
  onBulkCommentStatusUpdate,
  onOpenBulkCommentDelete,
  selectedCommentIDs,
  onToggleCommentSelection,
  resolveCommentStatusVariant,
  commentActionID,
  commentActionStatus,
  deletingCommentID,
  onCommentStatusUpdate,
  onOpenCommentDelete,
  commentsPage,
  totalCommentPages,
  commentsPageSize,
  onCommentsPageChange,
  onCommentsPageSizeChange,
  pendingBulkCommentDeleteCount,
  onCloseBulkCommentDelete,
  onConfirmBulkCommentDelete,
  pendingCommentDelete,
  onCloseCommentDelete,
  onConfirmCommentDelete,
}: Readonly<AdminAccountCommentsSectionProps>) {
  return (
    <>
      <h3 className="admin-dashboard-panel-title mb-3">{t('adminAccount.comments.title', { ns: 'admin-account' })}</h3>
      <hr className="admin-section-divider mb-3" />
      <p className="admin-dashboard-panel-copy mb-3">{t('adminAccount.comments.copy', { ns: 'admin-account' })}</p>

      {commentsErrorMessage ? (
        <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
          {commentsErrorMessage}
        </Alert>
      ) : null}
      {commentsSuccessMessage ? (
        <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
          {commentsSuccessMessage}
        </Alert>
      ) : null}

      <div className="d-grid gap-3">
        <div ref={commentsListTopRef} />

        <div className="card shadow-sm d-block">
          <div className="card-body p-3 w-100">
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <Form.Group controlId="admin-comments-filter-status">
                  <Form.Label className="small fw-semibold mb-1">
                    {t('adminAccount.comments.filters.status', { ns: 'admin-account' })}
                  </Form.Label>
                  <Form.Select
                    value={commentFilterStatus}
                    onChange={event => {
                      onCommentFilterStatusChange(
                        event.currentTarget.value as 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM',
                      );
                    }}
                  >
                    <option value="all">
                      {t('adminAccount.comments.filters.statuses.all', { ns: 'admin-account' })}
                    </option>
                    <option value="PENDING">
                      {t('adminAccount.comments.filters.statuses.pending', { ns: 'admin-account' })}
                    </option>
                    <option value="APPROVED">
                      {t('adminAccount.comments.filters.statuses.approved', { ns: 'admin-account' })}
                    </option>
                    <option value="REJECTED">
                      {t('adminAccount.comments.filters.statuses.rejected', { ns: 'admin-account' })}
                    </option>
                    <option value="SPAM">
                      {t('adminAccount.comments.filters.statuses.spam', { ns: 'admin-account' })}
                    </option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-12 col-md-8">
                <Form.Group controlId="admin-comments-filter-query">
                  <Form.Label className="small fw-semibold mb-1">
                    {t('adminAccount.comments.filters.query', { ns: 'admin-account' })}
                  </Form.Label>
                  <div className="search-bar w-100 d-flex align-items-center">
                    <div className="search-icon">
                      <FontAwesomeIcon icon="search" />
                    </div>
                    <Form.Control
                      type="text"
                      className="search-input form-control"
                      value={commentFilterQuery}
                      onChange={event => {
                        onCommentFilterQueryChange(event.currentTarget.value);
                      }}
                      placeholder={t('adminAccount.comments.filters.queryPlaceholder', {
                        ns: 'admin-account',
                      })}
                    />
                    {commentFilterQuery ? (
                      <button
                        type="button"
                        className="search-clear-btn border-0 bg-transparent"
                        onClick={onClearCommentFilterQuery}
                        aria-label={t('adminAccount.comments.filters.query', { ns: 'admin-account' })}
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

        <div className="card shadow-sm d-block">
          <div className="card-body p-3 w-100">
            {comments.length > 0 ? (
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    variant={allVisibleCommentsSelected ? 'secondary' : 'outline-secondary'}
                    disabled={isCommentsLoading || isBulkCommentActionPending}
                    onClick={onToggleVisibleCommentsSelection}
                  >
                    <FontAwesomeIcon icon={allVisibleCommentsSelected ? 'check-circle' : 'circle'} className="me-2" />
                    {t('adminAccount.comments.bulk.selectAll', { ns: 'admin-account' })}
                  </Button>
                  {hasSelectedComments ? (
                    <>
                      <Badge bg="light" text="dark" pill>
                        {t('adminAccount.comments.bulk.selected', {
                          ns: 'admin-account',
                          count: selectedCommentCount,
                        })}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={isBulkCommentActionPending}
                        onClick={onClearSelectedComments}
                      >
                        <FontAwesomeIcon icon="trash" className="me-2" />
                        {t('adminAccount.comments.bulk.clearSelection', { ns: 'admin-account' })}
                      </Button>
                    </>
                  ) : null}
                </div>
                {hasSelectedComments ? (
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="success"
                      disabled={isBulkCommentActionPending}
                      onClick={() => {
                        void onBulkCommentStatusUpdate('APPROVED');
                      }}
                    >
                      {bulkCommentActionStatus === 'APPROVED' ? (
                        <span className="d-inline-flex align-items-center gap-2">
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            className="me-2 flex-shrink-0 admin-action-spinner"
                            aria-hidden="true"
                          />
                          <span>{t('adminAccount.comments.actions.updating', { ns: 'admin-account' })}</span>
                        </span>
                      ) : (
                        <>
                          <FontAwesomeIcon icon="check" className="me-2" />
                          {t('adminAccount.comments.actions.approve', { ns: 'admin-account' })}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="admin-newsletter-action admin-newsletter-action--secondary"
                      disabled={isBulkCommentActionPending}
                      onClick={() => {
                        void onBulkCommentStatusUpdate('REJECTED');
                      }}
                    >
                      {bulkCommentActionStatus === 'REJECTED' ? (
                        <span className="d-inline-flex align-items-center gap-2">
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            className="me-2 flex-shrink-0 admin-action-spinner"
                            aria-hidden="true"
                          />
                          <span>{t('adminAccount.comments.actions.updating', { ns: 'admin-account' })}</span>
                        </span>
                      ) : (
                        <>
                          <FontAwesomeIcon icon="times-circle" className="me-2" />
                          {t('adminAccount.comments.actions.reject', { ns: 'admin-account' })}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      className="admin-newsletter-action admin-newsletter-action--danger"
                      disabled={isBulkCommentActionPending}
                      onClick={() => {
                        void onBulkCommentStatusUpdate('SPAM');
                      }}
                    >
                      {bulkCommentActionStatus === 'SPAM' ? (
                        <span className="d-inline-flex align-items-center gap-2">
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            className="me-2 flex-shrink-0 admin-action-spinner"
                            aria-hidden="true"
                          />
                          <span>{t('adminAccount.comments.actions.updating', { ns: 'admin-account' })}</span>
                        </span>
                      ) : (
                        <>
                          <FontAwesomeIcon icon="shield-halved" className="me-2" />
                          {t('adminAccount.comments.actions.spam', { ns: 'admin-account' })}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={isBulkCommentActionPending}
                      onClick={onOpenBulkCommentDelete}
                    >
                      {isBulkCommentDeleting ? (
                        <span className="d-inline-flex align-items-center gap-2">
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            className="me-2 flex-shrink-0 admin-action-spinner"
                            aria-hidden="true"
                          />
                          <span>{t('adminAccount.comments.actions.deleting', { ns: 'admin-account' })}</span>
                        </span>
                      ) : (
                        <>
                          <FontAwesomeIcon icon="trash" className="me-2" />
                          {t('adminAccount.comments.actions.delete', { ns: 'admin-account' })}
                        </>
                      )}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
            {renderAsyncSectionContent({
              isLoading: isCommentsLoading,
              loadingLabel: t('adminAccount.comments.loading', { ns: 'admin-account' }),
              isEmpty: totalComments === 0,
              emptyMessage: t('adminAccount.comments.empty', { ns: 'admin-account' }),
              children: (
                <div className="d-grid gap-3">
                  {comments.map(item => {
                    const isActionPending = commentActionID === item.id;
                    const isDeletePending = deletingCommentID === item.id;
                    const isApprovePending = isActionPending && commentActionStatus === 'APPROVED';
                    const isRejectPending = isActionPending && commentActionStatus === 'REJECTED';
                    const isSpamPending = isActionPending && commentActionStatus === 'SPAM';
                    const statusLabel = t(`adminAccount.comments.filters.statuses.${item.status.toLowerCase()}`, {
                      ns: 'admin-account',
                    });
                    const postHref = buildAdminContentPostDetailRoute(locale, item.postId);

                    return (
                      <div
                        key={item.id}
                        className={`admin-newsletter-campaign-card admin-comments-card admin-comments-card--${item.status.toLowerCase()}`}
                      >
                        <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                          <div className="d-flex align-items-start gap-3 flex-grow-1">
                            <Form.Check
                              type="checkbox"
                              className="mt-1"
                              aria-label={item.authorName}
                              checked={selectedCommentIDs.includes(item.id)}
                              disabled={isActionPending || isDeletePending || isBulkCommentActionPending}
                              onChange={event => {
                                onToggleCommentSelection(item.id, event.currentTarget.checked);
                              }}
                            />
                            <div className="d-grid gap-2">
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <strong className="text-break">{item.authorName}</strong>
                                <span className={`badge text-bg-${resolveCommentStatusVariant(item.status)}`}>
                                  {statusLabel}
                                </span>
                                <span className="badge text-bg-light">
                                  {item.parentId
                                    ? t('adminAccount.comments.list.replyLabel', { ns: 'admin-account' })
                                    : t('adminAccount.comments.list.rootLabel', { ns: 'admin-account' })}
                                </span>
                              </div>
                              <div className="small text-muted d-flex align-items-center gap-2 flex-wrap">
                                <span className="d-inline-flex align-items-center gap-2">
                                  <FontAwesomeIcon icon="envelope" className="text-muted" />
                                  <span>{item.authorEmail}</span>
                                </span>
                                <span className="d-inline-flex align-items-center gap-2">
                                  <FontAwesomeIcon icon="calendar-alt" className="text-muted" />
                                  <span>
                                    {t('adminAccount.comments.list.submittedAt', {
                                      ns: 'admin-account',
                                      value: formatSessionDate(item.createdAt),
                                    })}
                                  </span>
                                </span>
                                {item.updatedAt && item.updatedAt !== item.createdAt ? (
                                  <span className="d-inline-flex align-items-center gap-2">
                                    <FontAwesomeIcon icon="clock" className="text-muted" />
                                    <span>
                                      {t('adminAccount.comments.list.updatedAt', {
                                        ns: 'admin-account',
                                        value: formatSessionDate(item.updatedAt),
                                      })}
                                    </span>
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <Link
                            href={postHref}
                            className="btn btn-success btn-sm d-inline-flex align-items-center admin-newsletter-action admin-newsletter-action--external"
                          >
                            <FontAwesomeIcon icon="up-right-from-square" className="me-2" />
                            {t('adminAccount.comments.actions.openPost', { ns: 'admin-account' })}
                          </Link>
                        </div>

                        <div className="small text-muted mt-3 d-inline-flex align-items-center gap-2 flex-wrap">
                          <FontAwesomeIcon icon="book" className="text-muted" />
                          <span>
                            {t('adminAccount.comments.list.post', {
                              ns: 'admin-account',
                              title: item.postTitle || item.postId,
                            })}
                          </span>
                        </div>
                        <p className="mb-0 mt-2 text-break">{item.content}</p>

                        <div className="row g-2 mt-3">
                          <div className="col-12 col-md-auto">
                            <Button
                              type="button"
                              size="sm"
                              variant="success"
                              className="w-100"
                              disabled={
                                isActionPending ||
                                isDeletePending ||
                                isBulkCommentActionPending ||
                                item.status === 'APPROVED'
                              }
                              onClick={() => {
                                void onCommentStatusUpdate(item.id, 'APPROVED');
                              }}
                            >
                              {isApprovePending ? (
                                <span className="d-inline-flex align-items-center gap-2">
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    className="me-2 flex-shrink-0 admin-action-spinner"
                                    aria-hidden="true"
                                  />
                                  <span>{t('adminAccount.comments.actions.updating', { ns: 'admin-account' })}</span>
                                </span>
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
                              disabled={
                                isActionPending ||
                                isDeletePending ||
                                isBulkCommentActionPending ||
                                item.status === 'REJECTED'
                              }
                              onClick={() => {
                                void onCommentStatusUpdate(item.id, 'REJECTED');
                              }}
                            >
                              {isRejectPending ? (
                                <span className="d-inline-flex align-items-center gap-2">
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    className="me-2 flex-shrink-0 admin-action-spinner"
                                    aria-hidden="true"
                                  />
                                  <span>{t('adminAccount.comments.actions.updating', { ns: 'admin-account' })}</span>
                                </span>
                              ) : (
                                <>
                                  <FontAwesomeIcon icon="times-circle" className="me-2" />
                                  {t('adminAccount.comments.actions.reject', { ns: 'admin-account' })}
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="col-12 col-md-auto">
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              className="w-100 admin-newsletter-action admin-newsletter-action--danger"
                              disabled={
                                isActionPending ||
                                isDeletePending ||
                                isBulkCommentActionPending ||
                                item.status === 'SPAM'
                              }
                              onClick={() => {
                                void onCommentStatusUpdate(item.id, 'SPAM');
                              }}
                            >
                              {isSpamPending ? (
                                <span className="d-inline-flex align-items-center gap-2">
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    className="me-2 flex-shrink-0 admin-action-spinner"
                                    aria-hidden="true"
                                  />
                                  <span>{t('adminAccount.comments.actions.updating', { ns: 'admin-account' })}</span>
                                </span>
                              ) : (
                                <>
                                  <FontAwesomeIcon icon="shield-halved" className="me-2" />
                                  {t('adminAccount.comments.actions.spam', { ns: 'admin-account' })}
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="col-12 col-md-auto">
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              className="w-100"
                              disabled={isActionPending || isDeletePending || isBulkCommentActionPending}
                              onClick={() => {
                                onOpenCommentDelete(item);
                              }}
                            >
                              {isDeletePending ? (
                                <span className="d-inline-flex align-items-center gap-2">
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    className="me-2 flex-shrink-0 admin-action-spinner"
                                    aria-hidden="true"
                                  />
                                  <span>{t('adminAccount.comments.actions.deleting', { ns: 'admin-account' })}</span>
                                </span>
                              ) : (
                                <>
                                  <FontAwesomeIcon icon="trash" className="me-2" />
                                  {t('adminAccount.comments.actions.delete', { ns: 'admin-account' })}
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
          {!isCommentsLoading && totalComments > 0 ? (
            <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
              <PaginationBar
                currentPage={commentsPage}
                totalPages={totalCommentPages}
                totalResults={totalComments}
                size={commentsPageSize}
                onPageChange={onCommentsPageChange}
                onSizeChange={onCommentsPageSizeChange}
              />
            </div>
          ) : null}
        </div>
      </div>

      <Modal show={pendingBulkCommentDeleteCount > 0} onHide={onCloseBulkCommentDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('adminAccount.comments.bulk.deleteConfirmTitle', { ns: 'admin-account' })}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-0">
            {t('adminAccount.comments.bulk.deleteConfirmCopy', {
              ns: 'admin-account',
              count: pendingBulkCommentDeleteCount,
            })}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" disabled={isBulkCommentDeleting} onClick={onCloseBulkCommentDelete}>
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pendingBulkCommentDeleteCount === 0 || isBulkCommentDeleting}
            onClick={() => {
              void onConfirmBulkCommentDelete();
            }}
          >
            {isBulkCommentDeleting ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-2 flex-shrink-0 admin-action-spinner"
                  aria-hidden="true"
                />
                <span>{t('adminAccount.comments.actions.deleting', { ns: 'admin-account' })}</span>
              </span>
            ) : (
              <>
                <FontAwesomeIcon icon="trash" className="me-2" />
                {t('adminAccount.comments.actions.delete', { ns: 'admin-account' })}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={pendingCommentDelete !== null} onHide={onCloseCommentDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('adminAccount.comments.deleteConfirm.title', { ns: 'admin-account' })}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-3">
            {t('adminAccount.comments.deleteConfirm.copy', {
              ns: 'admin-account',
              author: pendingCommentDelete?.authorName ?? '',
            })}
          </p>
          <dl className="row mb-0 small">
            <dt className="col-4 text-uppercase text-muted">
              {t('adminAccount.comments.deleteConfirm.labels.author', { ns: 'admin-account' })}
            </dt>
            <dd className="col-8 mb-2">{pendingCommentDelete?.authorName ?? '-'}</dd>
            <dt className="col-4 text-uppercase text-muted">
              {t('adminAccount.comments.deleteConfirm.labels.email', { ns: 'admin-account' })}
            </dt>
            <dd className="col-8 mb-2 text-break">{pendingCommentDelete?.authorEmail ?? '-'}</dd>
            <dt className="col-4 text-uppercase text-muted">
              {t('adminAccount.comments.deleteConfirm.labels.post', { ns: 'admin-account' })}
            </dt>
            <dd className="col-8 mb-0 text-break">
              {pendingCommentDelete?.postTitle || pendingCommentDelete?.postId || '-'}
            </dd>
          </dl>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" disabled={deletingCommentID !== ''} onClick={onCloseCommentDelete}>
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pendingCommentDelete === null || deletingCommentID !== ''}
            onClick={() => {
              void onConfirmCommentDelete();
            }}
          >
            {deletingCommentID ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-2 flex-shrink-0 admin-action-spinner"
                  aria-hidden="true"
                />
                <span>{t('adminAccount.comments.actions.deleting', { ns: 'admin-account' })}</span>
              </span>
            ) : (
              <>
                <FontAwesomeIcon icon="trash" className="me-2" />
                {t('adminAccount.comments.actions.delete', { ns: 'admin-account' })}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
