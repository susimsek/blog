'use client';

import React from 'react';
import Image from 'next/image';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { AdminSessionProfile } from '@/lib/adminSessionProfileCache';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;

type AdminAccountProfileSectionProps = {
  adminUser: AdminSessionProfile;
  t: AdminAccountTranslate;
  profileAvatarURL: string;
  profileName: string;
  profileUsername: string;
  profileRoles: string;
  nameErrorMessage: string;
  avatarErrorMessage: string;
  nameSuccessMessage: string;
  avatarSuccessMessage: string;
  maxAvatarFileSizeMb: number;
  isAvatarSubmitting: boolean;
  avatarPendingAction: 'upload' | 'remove' | null;
  avatarFileInputRef: React.RefObject<HTMLInputElement | null>;
  onOpenAvatarPicker: () => void;
  onRemoveAvatar: () => void | Promise<void>;
  onAvatarFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  handleNameSubmit: React.FormEventHandler<HTMLFormElement>;
  nameInput: string;
  onNameInputChange: (value: string) => void;
  clearNameFeedback: () => void;
  showNameValidationError: boolean;
  nameValidationError: string;
  minNameLength: number;
  maxNameLength: number;
  isNameSubmitting: boolean;
};

export default function AdminAccountProfileSection({
  adminUser,
  t,
  profileAvatarURL,
  profileName,
  profileUsername,
  profileRoles,
  nameErrorMessage,
  avatarErrorMessage,
  nameSuccessMessage,
  avatarSuccessMessage,
  maxAvatarFileSizeMb,
  isAvatarSubmitting,
  avatarPendingAction,
  avatarFileInputRef,
  onOpenAvatarPicker,
  onRemoveAvatar,
  onAvatarFileChange,
  handleNameSubmit,
  nameInput,
  onNameInputChange,
  clearNameFeedback,
  showNameValidationError,
  nameValidationError,
  minNameLength,
  maxNameLength,
  isNameSubmitting,
}: Readonly<AdminAccountProfileSectionProps>) {
  return (
    <>
      <h3 className="admin-dashboard-panel-title mb-3">{t('adminAccount.profile.title', { ns: 'admin-account' })}</h3>
      <hr className="admin-section-divider mb-3" />
      <p className="admin-dashboard-panel-copy mb-3">{t('adminAccount.profile.copy', { ns: 'admin-account' })}</p>
      {nameErrorMessage ? (
        <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
          {nameErrorMessage}
        </Alert>
      ) : null}
      {avatarErrorMessage ? (
        <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
          {avatarErrorMessage}
        </Alert>
      ) : null}
      {nameSuccessMessage ? (
        <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
          {nameSuccessMessage}
        </Alert>
      ) : null}
      {avatarSuccessMessage ? (
        <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
          {avatarSuccessMessage}
        </Alert>
      ) : null}

      <div className="row g-3 align-items-start mb-4">
        <aside className="col-12 col-lg-4 col-xl-3 order-1 order-lg-2">
          <div className="admin-account-avatar-card rounded-4 p-3 h-100">
            <h4 className="admin-dashboard-panel-title mb-2">
              {t('adminAccount.profile.avatar.title', { ns: 'admin-account' })}
            </h4>
            <p className="admin-dashboard-panel-copy mb-3">
              {t('adminAccount.profile.avatar.copy', {
                ns: 'admin-account',
                sizeMB: maxAvatarFileSizeMb,
              })}
            </p>
            <div
              className="admin-account-avatar-frame position-relative mx-auto rounded-circle overflow-hidden d-flex align-items-center justify-content-center"
              style={{ width: '200px', height: '200px', maxWidth: '100%' }}
            >
              {profileAvatarURL ? (
                <Image
                  src={profileAvatarURL}
                  alt={profileName || profileUsername || adminUser.email}
                  width={200}
                  height={200}
                  sizes="(max-width: 576px) 160px, 200px"
                  unoptimized
                  className="w-100 h-100 object-fit-cover"
                />
              ) : (
                <span className="admin-account-avatar-placeholder fs-1" aria-hidden="true">
                  <FontAwesomeIcon icon="user" />
                </span>
              )}
            </div>
            <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center">
              <Button variant="secondary" size="sm" disabled={isAvatarSubmitting} onClick={onOpenAvatarPicker}>
                {isAvatarSubmitting && avatarPendingAction === 'upload' ? (
                  <span className="d-inline-flex align-items-center gap-2">
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-2 flex-shrink-0 admin-action-spinner"
                      aria-hidden="true"
                    />
                    <span>{t('adminAccount.profile.avatar.uploading', { ns: 'admin-account' })}</span>
                  </span>
                ) : (
                  <span className="d-inline-flex align-items-center gap-2">
                    <FontAwesomeIcon icon="camera" />
                    <span>{t('adminAccount.profile.avatar.edit', { ns: 'admin-account' })}</span>
                  </span>
                )}
              </Button>
              {profileAvatarURL ? (
                <Button variant="danger" size="sm" disabled={isAvatarSubmitting} onClick={onRemoveAvatar}>
                  {isAvatarSubmitting && avatarPendingAction === 'remove' ? (
                    <span className="d-inline-flex align-items-center gap-2">
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        className="me-2 flex-shrink-0 admin-action-spinner"
                        aria-hidden="true"
                      />
                      <span>{t('adminAccount.profile.avatar.remove', { ns: 'admin-account' })}</span>
                    </span>
                  ) : (
                    <span className="d-inline-flex align-items-center gap-2">
                      <FontAwesomeIcon icon="trash" />
                      <span>{t('adminAccount.profile.avatar.remove', { ns: 'admin-account' })}</span>
                    </span>
                  )}
                </Button>
              ) : null}
            </div>
            <input
              ref={avatarFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={event => {
                void onAvatarFileChange(event);
              }}
              className="d-none"
            />
          </div>
        </aside>

        <div className="col-12 col-lg-8 col-xl-9 order-2 order-lg-1">
          <Form noValidate onSubmit={handleNameSubmit}>
            <Form.Group className="mb-3" controlId="admin-profile-name">
              <Form.Label>{t('adminAccount.profile.name.label', { ns: 'admin-account' })}</Form.Label>
              <Form.Control
                type="text"
                value={nameInput}
                onChange={event => {
                  onNameInputChange(event.currentTarget.value);
                  clearNameFeedback();
                }}
                placeholder={t('adminAccount.profile.name.placeholder', { ns: 'admin-account' })}
                autoComplete="name"
                isInvalid={showNameValidationError}
                required
                minLength={minNameLength}
                maxLength={maxNameLength}
              />
              <Form.Control.Feedback type="invalid" className={showNameValidationError ? 'd-block' : ''}>
                {nameValidationError}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="post-summary-cta mb-0">
              <Button type="submit" className="post-summary-read-more" disabled={isNameSubmitting}>
                {isNameSubmitting ? (
                  <span className="d-inline-flex align-items-center gap-2">
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-2 flex-shrink-0 admin-action-spinner"
                      aria-hidden="true"
                    />
                    <span className="read-more-label">
                      {t('adminAccount.profile.name.submitting', { ns: 'admin-account' })}
                    </span>
                  </span>
                ) : (
                  <span className="read-more-label">
                    {t('adminAccount.profile.name.submit', { ns: 'admin-account' })}
                  </span>
                )}
              </Button>
            </div>
          </Form>

          <dl className="admin-dashboard-meta-list admin-dashboard-meta-list-no-first-divider mb-0 mt-3">
            <div>
              <dt>{t('adminAccount.profile.labels.name', { ns: 'admin-account' })}</dt>
              <dd>{profileName || t('adminAccount.profile.notSet', { ns: 'admin-account' })}</dd>
            </div>
            <div>
              <dt>{t('adminAccount.profile.labels.username', { ns: 'admin-account' })}</dt>
              <dd>{profileUsername || t('adminAccount.profile.notSet', { ns: 'admin-account' })}</dd>
            </div>
            <div>
              <dt>{t('adminAccount.profile.labels.email', { ns: 'admin-account' })}</dt>
              <dd>{adminUser.email}</dd>
            </div>
            <div>
              <dt>{t('adminAccount.profile.labels.role', { ns: 'admin-account' })}</dt>
              <dd>{profileRoles || t('adminAccount.profile.notSet', { ns: 'admin-account' })}</dd>
            </div>
            <div>
              <dt>{t('adminAccount.profile.labels.id', { ns: 'admin-account' })}</dt>
              <dd>{adminUser.id}</dd>
            </div>
            <div>
              <dt>{t('adminAccount.profile.labels.picture', { ns: 'admin-account' })}</dt>
              <dd>
                {profileAvatarURL
                  ? t('adminAccount.profile.avatar.states.custom', { ns: 'admin-account' })
                  : t('adminAccount.profile.avatar.states.default', { ns: 'admin-account' })}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
