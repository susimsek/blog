'use client';

import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { AdminContentPostRevisionItem } from '@/lib/adminApi';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;

type AdminContentPostRevisionRestoreModalProps = {
  t: AdminAccountTranslate;
  pendingPostRevisionRestore: AdminContentPostRevisionItem | null;
  isPostRevisionRestoring: boolean;
  formatDateTime: (value: string) => string;
  onHide: () => void;
  onConfirmRestore: () => void;
};

export default function AdminContentPostRevisionRestoreModal({
  t,
  pendingPostRevisionRestore,
  isPostRevisionRestoring,
  formatDateTime,
  onHide,
  onConfirmRestore,
}: Readonly<AdminContentPostRevisionRestoreModalProps>) {
  return (
    <Modal show={pendingPostRevisionRestore !== null} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {t('adminAccount.content.modals.post.revisions.restoreTitle', { ns: 'admin-account' })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-muted mb-3">
          {t('adminAccount.content.modals.post.revisions.restoreCopy', {
            ns: 'admin-account',
            revision: pendingPostRevisionRestore?.revisionNumber ?? 0,
          })}
        </p>
        {pendingPostRevisionRestore ? (
          <dl className="row gy-2 mb-0 small">
            <dt className="col-sm-4 text-muted">
              {t('adminAccount.content.modals.post.revisions.restoreLabels.title', { ns: 'admin-account' })}
            </dt>
            <dd className="col-sm-8 mb-0">{pendingPostRevisionRestore.title}</dd>
            <dt className="col-sm-4 text-muted">
              {t('adminAccount.content.modals.post.revisions.restoreLabels.createdAt', { ns: 'admin-account' })}
            </dt>
            <dd className="col-sm-8 mb-0">{formatDateTime(pendingPostRevisionRestore.createdAt)}</dd>
            <dt className="col-sm-4 text-muted">
              {t('adminAccount.content.modals.post.revisions.restoreLabels.status', { ns: 'admin-account' })}
            </dt>
            <dd className="col-sm-8 mb-0">
              {t(
                `adminAccount.content.modals.post.lifecycle.statuses.${pendingPostRevisionRestore.status.toLowerCase()}`,
                {
                  ns: 'admin-account',
                },
              )}
            </dd>
          </dl>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" disabled={isPostRevisionRestoring} onClick={onHide}>
          {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
        </Button>
        <Button type="button" variant="primary" disabled={isPostRevisionRestoring} onClick={onConfirmRestore}>
          {isPostRevisionRestoring ? (
            <span className="d-inline-flex align-items-center gap-2">
              <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
              <span>{t('adminAccount.content.modals.post.revisions.restoring', { ns: 'admin-account' })}</span>
            </span>
          ) : (
            <>
              <FontAwesomeIcon icon="rotate-left" className="me-2" />
              {t('adminAccount.content.modals.post.revisions.restore', { ns: 'admin-account' })}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
