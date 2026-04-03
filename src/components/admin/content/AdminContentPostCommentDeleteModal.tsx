'use client';

import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { AdminCommentItem } from '@/lib/adminApi';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;

type AdminContentPostCommentDeleteModalProps = {
  t: AdminAccountTranslate;
  pendingPostCommentDelete: AdminCommentItem | null;
  deletingPostCommentID: string;
  onHide: () => void;
  onConfirmDelete: () => void;
};

export default function AdminContentPostCommentDeleteModal({
  t,
  pendingPostCommentDelete,
  deletingPostCommentID,
  onHide,
  onConfirmDelete,
}: Readonly<AdminContentPostCommentDeleteModalProps>) {
  return (
    <Modal show={pendingPostCommentDelete !== null} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('adminAccount.comments.deleteConfirm.title', { ns: 'admin-account' })}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-muted mb-3">
          {t('adminAccount.comments.deleteConfirm.copy', {
            ns: 'admin-account',
            author: pendingPostCommentDelete?.authorName ?? '',
          })}
        </p>
        <dl className="row gy-2 mb-0 small">
          <dt className="col-sm-3 text-muted">
            {t('adminAccount.comments.deleteConfirm.labels.author', { ns: 'admin-account' })}
          </dt>
          <dd className="col-sm-9 mb-0 text-break">{pendingPostCommentDelete?.authorName ?? ''}</dd>
          <dt className="col-sm-3 text-muted">
            {t('adminAccount.comments.deleteConfirm.labels.email', { ns: 'admin-account' })}
          </dt>
          <dd className="col-sm-9 mb-0 text-break">{pendingPostCommentDelete?.authorEmail ?? ''}</dd>
          <dt className="col-sm-3 text-muted">
            {t('adminAccount.comments.deleteConfirm.labels.post', { ns: 'admin-account' })}
          </dt>
          <dd className="col-sm-9 mb-0 text-break">
            {pendingPostCommentDelete?.postTitle ?? pendingPostCommentDelete?.postId ?? ''}
          </dd>
        </dl>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" disabled={deletingPostCommentID !== ''} onClick={onHide}>
          {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={!pendingPostCommentDelete || deletingPostCommentID !== ''}
          onClick={onConfirmDelete}
        >
          {deletingPostCommentID ? (
            <span className="d-inline-flex align-items-center gap-2">
              <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
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
  );
}
