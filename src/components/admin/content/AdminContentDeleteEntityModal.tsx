'use client';

import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type AdminContentDeleteEntityModalProps = {
  show: boolean;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  deletingLabel: string;
  isDeleting: boolean;
  onHide: () => void;
  onConfirm: () => void;
};

export default function AdminContentDeleteEntityModal({
  show,
  title,
  body,
  cancelLabel,
  confirmLabel,
  deletingLabel,
  isDeleting,
  onHide,
  onConfirm,
}: Readonly<AdminContentDeleteEntityModalProps>) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-muted mb-0">{body}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" disabled={isDeleting} onClick={onHide}>
          {cancelLabel}
        </Button>
        <Button type="button" variant="danger" disabled={isDeleting} onClick={onConfirm}>
          {isDeleting ? (
            <span className="d-inline-flex align-items-center gap-2">
              <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
              <span>{deletingLabel}</span>
            </span>
          ) : (
            <>
              <FontAwesomeIcon icon="trash" className="me-2" />
              {confirmLabel}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
