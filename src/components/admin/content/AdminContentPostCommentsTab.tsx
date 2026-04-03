'use client';

import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import PaginationBar from '@/components/pagination/PaginationBar';
import type { AdminCommentItem } from '@/lib/adminApi';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;
type CommentStatusFilterValue = 'all' | AdminCommentItem['status'];

type AdminContentPostCommentsTabProps = {
  t: AdminAccountTranslate;
  formatDate: (value: string) => string;
  listTopRef: React.RefObject<HTMLDivElement | null>;
  postCommentsTotal: number;
  postCommentsStatusFilter: CommentStatusFilterValue;
  onPostCommentsStatusFilterChange: (value: CommentStatusFilterValue) => void;
  postCommentsFilterQuery: string;
  onPostCommentsFilterQueryChange: (value: string) => void;
  onClearPostCommentsFilterQuery: () => void;
  postCommentsErrorMessage: string;
  postCommentsSuccessMessage: string;
  postComments: AdminCommentItem[];
  allVisiblePostCommentsSelected: boolean;
  isPostCommentsLoading: boolean;
  isBulkPostCommentActionPending: boolean;
  hasSelectedPostComments: boolean;
  selectedPostCommentIDs: string[];
  onToggleVisiblePostCommentsSelection: () => void;
  onClearSelectedPostCommentIDs: () => void;
  bulkPostCommentActionStatus: AdminCommentItem['status'] | null;
  isBulkPostCommentDeleting: boolean;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onBulkSpam: () => void;
  onOpenBulkDelete: () => void;
  postCommentActionID: string;
  postCommentActionStatus: AdminCommentItem['status'] | null;
  deletingPostCommentID: string;
  onTogglePostCommentSelection: (commentID: string, checked: boolean) => void;
  resolveCommentStatusVariant: (status: AdminCommentItem['status']) => string;
  onUpdatePostCommentStatus: (commentID: string, status: AdminCommentItem['status']) => void;
  onOpenDeletePostComment: (item: AdminCommentItem) => void;
  postCommentsPage: number;
  totalPostCommentPages: number;
  postCommentsPageSize: number;
  onPostCommentsPageChange: (page: number) => void;
  onPostCommentsPageSizeChange: (size: number) => void;
};

export default function AdminContentPostCommentsTab({
  t,
  formatDate,
  listTopRef,
  postCommentsTotal,
  postCommentsStatusFilter,
  onPostCommentsStatusFilterChange,
  postCommentsFilterQuery,
  onPostCommentsFilterQueryChange,
  onClearPostCommentsFilterQuery,
  postCommentsErrorMessage,
  postCommentsSuccessMessage,
  postComments,
  allVisiblePostCommentsSelected,
  isPostCommentsLoading,
  isBulkPostCommentActionPending,
  hasSelectedPostComments,
  selectedPostCommentIDs,
  onToggleVisiblePostCommentsSelection,
  onClearSelectedPostCommentIDs,
  bulkPostCommentActionStatus,
  isBulkPostCommentDeleting,
  onBulkApprove,
  onBulkReject,
  onBulkSpam,
  onOpenBulkDelete,
  postCommentActionID,
  postCommentActionStatus,
  deletingPostCommentID,
  onTogglePostCommentSelection,
  resolveCommentStatusVariant,
  onUpdatePostCommentStatus,
  onOpenDeletePostComment,
  postCommentsPage,
  totalPostCommentPages,
  postCommentsPageSize,
  onPostCommentsPageChange,
  onPostCommentsPageSizeChange,
}: Readonly<AdminContentPostCommentsTabProps>) {
  return (
    <div className="admin-content-post-tab-pane pt-3">
      <div ref={listTopRef} />
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h5 className="mb-1">{t('adminAccount.content.modals.post.comments.title', { ns: 'admin-account' })}</h5>
          <p className="small text-muted mb-0">
            {t('adminAccount.content.modals.post.comments.copy', { ns: 'admin-account' })}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Badge bg="light" text="dark" pill>
            {t('adminAccount.content.modals.post.comments.total', {
              ns: 'admin-account',
              count: postCommentsTotal,
            })}
          </Badge>
          <Form.Group controlId="admin-content-post-comments-status" className="mb-0">
            <Form.Select
              size="sm"
              value={postCommentsStatusFilter}
              onChange={event => {
                onPostCommentsStatusFilterChange(event.currentTarget.value as CommentStatusFilterValue);
              }}
            >
              <option value="all">{t('adminAccount.comments.filters.statuses.all', { ns: 'admin-account' })}</option>
              <option value="PENDING">
                {t('adminAccount.comments.filters.statuses.pending', { ns: 'admin-account' })}
              </option>
              <option value="APPROVED">
                {t('adminAccount.comments.filters.statuses.approved', { ns: 'admin-account' })}
              </option>
              <option value="REJECTED">
                {t('adminAccount.comments.filters.statuses.rejected', { ns: 'admin-account' })}
              </option>
              <option value="SPAM">{t('adminAccount.comments.filters.statuses.spam', { ns: 'admin-account' })}</option>
            </Form.Select>
          </Form.Group>
        </div>
      </div>

      <Form.Group controlId="admin-content-post-comments-query" className="mb-3">
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
            value={postCommentsFilterQuery}
            onChange={event => {
              onPostCommentsFilterQueryChange(event.currentTarget.value);
            }}
            placeholder={t('adminAccount.content.modals.post.comments.queryPlaceholder', {
              ns: 'admin-account',
            })}
          />
          {postCommentsFilterQuery ? (
            <button
              type="button"
              className="search-clear-btn border-0 bg-transparent"
              onClick={onClearPostCommentsFilterQuery}
              aria-label={t('adminAccount.comments.filters.query', { ns: 'admin-account' })}
            >
              <FontAwesomeIcon icon="times-circle" className="clear-icon" />
            </button>
          ) : null}
        </div>
      </Form.Group>

      {postCommentsErrorMessage ? (
        <Alert variant="danger" className="mb-3 px-3 py-2 lh-base">
          {postCommentsErrorMessage}
        </Alert>
      ) : null}
      {postCommentsSuccessMessage ? (
        <Alert variant="success" className="mb-3 px-3 py-2 lh-base">
          {postCommentsSuccessMessage}
        </Alert>
      ) : null}

      <div className="card shadow-sm d-block">
        <div className="card-body p-3 w-100">
          {postComments.length > 0 ? (
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  variant={allVisiblePostCommentsSelected ? 'secondary' : 'outline-secondary'}
                  disabled={isPostCommentsLoading || isBulkPostCommentActionPending}
                  onClick={onToggleVisiblePostCommentsSelection}
                >
                  <FontAwesomeIcon icon={allVisiblePostCommentsSelected ? 'check-circle' : 'circle'} className="me-2" />
                  {t('adminAccount.comments.bulk.selectAll', { ns: 'admin-account' })}
                </Button>
                {hasSelectedPostComments ? (
                  <>
                    <Badge bg="light" text="dark" pill>
                      {t('adminAccount.comments.bulk.selected', {
                        ns: 'admin-account',
                        count: selectedPostCommentIDs.length,
                      })}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={isBulkPostCommentActionPending}
                      onClick={onClearSelectedPostCommentIDs}
                    >
                      <FontAwesomeIcon icon="trash" className="me-2" />
                      {t('adminAccount.comments.bulk.clearSelection', { ns: 'admin-account' })}
                    </Button>
                  </>
                ) : null}
              </div>
              {hasSelectedPostComments ? (
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    variant="success"
                    disabled={isBulkPostCommentActionPending}
                    onClick={onBulkApprove}
                  >
                    {bulkPostCommentActionStatus === 'APPROVED' ? (
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
                    disabled={isBulkPostCommentActionPending}
                    onClick={onBulkReject}
                  >
                    {bulkPostCommentActionStatus === 'REJECTED' ? (
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
                    disabled={isBulkPostCommentActionPending}
                    onClick={onBulkSpam}
                  >
                    {bulkPostCommentActionStatus === 'SPAM' ? (
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
                    disabled={isBulkPostCommentActionPending}
                    onClick={onOpenBulkDelete}
                  >
                    {isBulkPostCommentDeleting ? (
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

          {isPostCommentsLoading ? (
            <AdminLoadingState
              className="admin-loading-stack"
              ariaLabel={t('adminAccount.comments.loading', { ns: 'admin-account' })}
            />
          ) : postCommentsTotal === 0 ? (
            <p className="small text-muted mb-0">
              {t('adminAccount.content.modals.post.comments.empty', { ns: 'admin-account' })}
            </p>
          ) : (
            <div className="d-grid gap-3">
              {postComments.map(item => {
                const isActionPending = postCommentActionID === item.id;
                const isDeletePending = deletingPostCommentID === item.id;
                const isApprovePending = isActionPending && postCommentActionStatus === 'APPROVED';
                const isRejectPending = isActionPending && postCommentActionStatus === 'REJECTED';
                const isSpamPending = isActionPending && postCommentActionStatus === 'SPAM';
                const statusLabel = t(`adminAccount.comments.filters.statuses.${item.status.toLowerCase()}`, {
                  ns: 'admin-account',
                });

                return (
                  <div
                    key={item.id}
                    className={`admin-newsletter-campaign-card admin-comments-card admin-comments-card--${item.status.toLowerCase()}`}
                  >
                    <div className="d-flex align-items-start gap-3">
                      <Form.Check
                        type="checkbox"
                        className="mt-1"
                        aria-label={item.authorName}
                        checked={selectedPostCommentIDs.includes(item.id)}
                        disabled={isActionPending || isDeletePending || isBulkPostCommentActionPending}
                        onChange={event => {
                          onTogglePostCommentSelection(item.id, event.currentTarget.checked);
                        }}
                      />
                      <div className="d-grid gap-2 flex-grow-1">
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
                                value: formatDate(item.createdAt),
                              })}
                            </span>
                          </span>
                          {item.updatedAt && item.updatedAt !== item.createdAt ? (
                            <span className="d-inline-flex align-items-center gap-2">
                              <FontAwesomeIcon icon="clock" className="text-muted" />
                              <span>
                                {t('adminAccount.comments.list.updatedAt', {
                                  ns: 'admin-account',
                                  value: formatDate(item.updatedAt),
                                })}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <p className="mb-0 mt-3 text-break">{item.content}</p>

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
                            isBulkPostCommentActionPending ||
                            item.status === 'APPROVED'
                          }
                          onClick={() => {
                            onUpdatePostCommentStatus(item.id, 'APPROVED');
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
                            isBulkPostCommentActionPending ||
                            item.status === 'REJECTED'
                          }
                          onClick={() => {
                            onUpdatePostCommentStatus(item.id, 'REJECTED');
                          }}
                        >
                          {isRejectPending ? null : <FontAwesomeIcon icon="times-circle" className="me-2" />}
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
                            t('adminAccount.comments.actions.reject', { ns: 'admin-account' })
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
                            isBulkPostCommentActionPending ||
                            item.status === 'SPAM'
                          }
                          onClick={() => {
                            onUpdatePostCommentStatus(item.id, 'SPAM');
                          }}
                        >
                          {isSpamPending ? null : <FontAwesomeIcon icon="shield-halved" className="me-2" />}
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
                            t('adminAccount.comments.actions.spam', { ns: 'admin-account' })
                          )}
                        </Button>
                      </div>
                      <div className="col-12 col-md-auto">
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          className="w-100"
                          disabled={isActionPending || isDeletePending || isBulkPostCommentActionPending}
                          onClick={() => {
                            onOpenDeletePostComment(item);
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
          )}
        </div>
        {!isPostCommentsLoading && postCommentsTotal > 0 ? (
          <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
            <PaginationBar
              className="border-0 rounded-0 px-2 px-md-3 py-0 bg-transparent shadow-none"
              currentPage={postCommentsPage}
              totalPages={totalPostCommentPages}
              totalResults={postCommentsTotal}
              size={postCommentsPageSize}
              onPageChange={onPostCommentsPageChange}
              onSizeChange={onPostCommentsPageSizeChange}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
