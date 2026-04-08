'use client';

import React from 'react';
import Image from 'next/image';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;

type AdminAccountAvatarCropModalProps = {
  t: AdminAccountTranslate;
  isOpen: boolean;
  onClose: () => void;
  isDragging: boolean;
  isResizing: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
  stageStyle: React.CSSProperties;
  cropSource: string;
  imageSize: {
    width: number;
    height: number;
  };
  imageStyle: React.CSSProperties;
  cropBoxStyle: React.CSSProperties;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerEnd: (event: React.PointerEvent<HTMLDivElement>) => void;
  onResizeStart: (event: React.PointerEvent<HTMLButtonElement>) => void;
  isSaving: boolean;
  isSubmitting: boolean;
  avatarPendingAction: 'upload' | 'remove' | null;
  onSave: () => void | Promise<void>;
};

export default function AdminAccountAvatarCropModal({
  t,
  isOpen,
  onClose,
  isDragging,
  isResizing,
  stageRef,
  stageStyle,
  cropSource,
  imageSize,
  imageStyle,
  cropBoxStyle,
  onPointerDown,
  onPointerMove,
  onPointerEnd,
  onResizeStart,
  isSaving,
  isSubmitting,
  avatarPendingAction,
  onSave,
}: Readonly<AdminAccountAvatarCropModalProps>) {
  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      centered
      backdrop="static"
      backdropClassName="admin-avatar-crop-backdrop"
      dialogClassName="admin-avatar-crop-dialog"
    >
      <Modal.Header closeButton>
        <Modal.Title>{t('adminAccount.profile.avatar.crop.title', { ns: 'admin-account' })}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-body-secondary mb-3">
          {t('adminAccount.profile.avatar.crop.copy', { ns: 'admin-account' })}
        </p>
        <div
          className={`admin-avatar-crop-stage crop-container position-relative mx-auto overflow-hidden${
            isDragging ? ' is-dragging' : isResizing ? ' is-resizing' : ''
          }`}
          ref={stageRef}
          style={stageStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onLostPointerCapture={onPointerEnd}
          role="presentation"
        >
          {cropSource ? (
            <Image
              src={cropSource}
              alt={t('adminAccount.profile.avatar.title', { ns: 'admin-account' })}
              width={Math.max(1, imageSize.width)}
              height={Math.max(1, imageSize.height)}
              unoptimized
              draggable={false}
              className="position-absolute top-50 start-50 user-select-none pe-none"
              style={imageStyle}
            />
          ) : null}
          <div data-crop-box="" className="crop-box" style={cropBoxStyle}>
            <div className="crop-outline" />
            {(['nw', 'ne', 'sw', 'se'] as const).map(direction => (
              <button
                key={`avatar-crop-handle:${direction}`}
                type="button"
                data-direction={direction}
                className={`handle ${direction}`}
                onPointerDown={onResizeStart}
                disabled={isSaving || isSubmitting}
                aria-label={t('adminAccount.profile.avatar.crop.zoom', { ns: 'admin-account' })}
              />
            ))}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="admin-avatar-crop-footer">
        <Button
          variant="success"
          className="admin-avatar-crop-submit"
          onClick={() => {
            void onSave();
          }}
          disabled={isSaving || isSubmitting}
        >
          {isSaving || (isSubmitting && avatarPendingAction === 'upload') ? (
            <span className="d-inline-flex align-items-center gap-2">
              <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
              <span>{t('adminAccount.profile.avatar.crop.saving', { ns: 'admin-account' })}</span>
            </span>
          ) : (
            t('adminAccount.profile.avatar.crop.save', { ns: 'admin-account' })
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
