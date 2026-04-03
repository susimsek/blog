'use client';

import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;

type AdminContentBulkPostCommentDeleteModalProps = {
  t: AdminAccountTranslate;
  pendingBulkPostCommentDeleteIDs: string[];
  isBulkPostCommentDeleting: boolean;
  onHide: () => void;
  onConfirmDelete: () => void;
};

export default function AdminContentBulkPostCommentDeleteModal({
  t,
  pendingBulkPostCommentDeleteIDs,
  isBulkPostCommentDeleting,
  onHide,
  onConfirmDelete,
}: Readonly<AdminContentBulkPostCommentDeleteModalProps>) {
  return (
    <Modal show={pendingBulkPostCommentDeleteIDs.length > 0} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('adminAccount.comments.bulk.deleteConfirmTitle', { ns: 'admin-account' })}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-muted mb-0">
          {t('adminAccount.comments.bulk.deleteConfirmCopy', {
            ns: 'admin-account',
            count: pendingBulkPostCommentDeleteIDs.length,
          })}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" disabled={isBulkPostCommentDeleting} onClick={onHide}>
          {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={pendingBulkPostCommentDeleteIDs.length === 0 || isBulkPostCommentDeleting}
          onClick={onConfirmDelete}
        >
          {isBulkPostCommentDeleting ? (
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
