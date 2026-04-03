'use client';

import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { AdminMediaLibraryItem } from '@/lib/adminApi';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;

type AdminContentMediaDeleteModalProps = {
  t: AdminAccountTranslate;
  pendingMediaAssetDelete: AdminMediaLibraryItem | null;
  isMediaAssetDeleting: boolean;
  onHide: () => void;
  onConfirmDelete: () => void;
};

export default function AdminContentMediaDeleteModal({
  t,
  pendingMediaAssetDelete,
  isMediaAssetDeleting,
  onHide,
  onConfirmDelete,
}: Readonly<AdminContentMediaDeleteModalProps>) {
  return (
    <Modal show={pendingMediaAssetDelete !== null} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('adminAccount.content.media.deleteConfirm.title', { ns: 'admin-account' })}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-muted mb-3">
          {t('adminAccount.content.media.deleteConfirm.copy', {
            ns: 'admin-account',
            name: pendingMediaAssetDelete?.name ?? '',
          })}
        </p>
        <dl className="row gy-2 mb-0 small">
          <dt className="col-sm-3 text-muted">
            {t('adminAccount.content.media.deleteConfirm.labels.path', { ns: 'admin-account' })}
          </dt>
          <dd className="col-sm-9 mb-0 text-break">{pendingMediaAssetDelete?.value ?? ''}</dd>
          <dt className="col-sm-3 text-muted">
            {t('adminAccount.content.media.deleteConfirm.labels.usage', { ns: 'admin-account' })}
          </dt>
          <dd className="col-sm-9 mb-0 text-break">
            {t('adminAccount.content.modals.post.media.usedIn', {
              ns: 'admin-account',
              count: pendingMediaAssetDelete?.usageCount ?? 0,
            })}
          </dd>
        </dl>
        {pendingMediaAssetDelete && pendingMediaAssetDelete.usageCount > 0 ? (
          <Alert variant="warning" className="mt-3 mb-0">
            {t('adminAccount.content.media.deleteConfirm.inUse', {
              ns: 'admin-account',
              count: pendingMediaAssetDelete.usageCount,
            })}
          </Alert>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" disabled={isMediaAssetDeleting} onClick={onHide}>
          {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={!pendingMediaAssetDelete || isMediaAssetDeleting || pendingMediaAssetDelete.usageCount > 0}
          onClick={onConfirmDelete}
        >
          {isMediaAssetDeleting ? (
            <span className="d-inline-flex align-items-center gap-2">
              <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
              <span>{t('adminAccount.content.actions.deleting', { ns: 'admin-account' })}</span>
            </span>
          ) : (
            <>
              <FontAwesomeIcon icon="trash" className="me-2" />
              {t('adminAccount.content.media.actions.delete', { ns: 'admin-account' })}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
