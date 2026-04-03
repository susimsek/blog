'use client';

import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { AdminContentPostItem } from '@/lib/adminApi';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;

type AdminContentPostDeleteModalProps = {
  t: AdminAccountTranslate;
  pendingPostDelete: AdminContentPostItem | null;
  isPostDeleting: boolean;
  onHide: () => void;
  onConfirmDelete: () => void;
};

export default function AdminContentPostDeleteModal({
  t,
  pendingPostDelete,
  isPostDeleting,
  onHide,
  onConfirmDelete,
}: Readonly<AdminContentPostDeleteModalProps>) {
  return (
    <Modal show={pendingPostDelete !== null} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('adminAccount.content.modals.deletePost.title', { ns: 'admin-account' })}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-muted mb-0">
          {t('adminAccount.content.modals.deletePost.copy', {
            ns: 'admin-account',
            id: pendingPostDelete?.id ?? '',
          })}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" disabled={isPostDeleting} onClick={onHide}>
          {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={!pendingPostDelete || isPostDeleting}
          onClick={onConfirmDelete}
        >
          {isPostDeleting ? (
            <span className="d-inline-flex align-items-center gap-2">
              <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
              <span>{t('adminAccount.content.actions.deleting', { ns: 'admin-account' })}</span>
            </span>
          ) : (
            <>
              <FontAwesomeIcon icon="trash" className="me-2" />
              {t('adminAccount.content.actions.deletePost', { ns: 'admin-account' })}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
