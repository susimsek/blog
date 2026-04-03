'use client';

import React from 'react';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;

type AdminAccountAccountSectionProps = {
  t: AdminAccountTranslate;
  usernameErrorMessage: string;
  usernameSuccessMessage: string;
  handleUsernameSubmit: React.FormEventHandler<HTMLFormElement>;
  usernameInput: string;
  onUsernameInputChange: (value: string) => void;
  clearUsernameFeedback: () => void;
  showUsernameValidationError: boolean;
  usernameValidationError: string;
  minUsernameLength: number;
  maxUsernameLength: number;
  isUsernameSubmitting: boolean;
  deleteErrorMessage: string;
  deleteSuccessMessage: string;
  handleDeleteSubmit: React.FormEventHandler<HTMLFormElement>;
  deleteCurrentPassword: string;
  onDeleteCurrentPasswordChange: (value: string) => void;
  deleteConfirmation: string;
  onDeleteConfirmationChange: (value: string) => void;
  clearDeleteFeedback: () => void;
  showDeletePassword: boolean;
  onToggleDeletePassword: () => void;
  showDeletePasswordError: boolean;
  deletePasswordError: string;
  showDeleteConfirmError: boolean;
  deleteConfirmError: string;
  deleteConfirmationValue: string;
  isDeleteSubmitting: boolean;
};

export default function AdminAccountAccountSection({
  t,
  usernameErrorMessage,
  usernameSuccessMessage,
  handleUsernameSubmit,
  usernameInput,
  onUsernameInputChange,
  clearUsernameFeedback,
  showUsernameValidationError,
  usernameValidationError,
  minUsernameLength,
  maxUsernameLength,
  isUsernameSubmitting,
  deleteErrorMessage,
  deleteSuccessMessage,
  handleDeleteSubmit,
  deleteCurrentPassword,
  onDeleteCurrentPasswordChange,
  deleteConfirmation,
  onDeleteConfirmationChange,
  clearDeleteFeedback,
  showDeletePassword,
  onToggleDeletePassword,
  showDeletePasswordError,
  deletePasswordError,
  showDeleteConfirmError,
  deleteConfirmError,
  deleteConfirmationValue,
  isDeleteSubmitting,
}: Readonly<AdminAccountAccountSectionProps>) {
  return (
    <div className="admin-account-section-stack">
      <section>
        <h3 className="admin-dashboard-panel-title mb-2">
          {t('adminAccount.account.username.title', { ns: 'admin-account' })}
        </h3>
        <p className="admin-dashboard-panel-copy">{t('adminAccount.account.username.copy', { ns: 'admin-account' })}</p>

        {usernameErrorMessage ? (
          <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
            {usernameErrorMessage}
          </Alert>
        ) : null}
        {usernameSuccessMessage ? (
          <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
            {usernameSuccessMessage}
          </Alert>
        ) : null}

        <Form noValidate onSubmit={handleUsernameSubmit}>
          <Form.Group className="mb-3" controlId="admin-account-username">
            <Form.Label>{t('adminAccount.account.username.label', { ns: 'admin-account' })}</Form.Label>
            <Form.Control
              type="text"
              value={usernameInput}
              onChange={event => {
                onUsernameInputChange(event.currentTarget.value);
                clearUsernameFeedback();
              }}
              placeholder={t('adminAccount.account.username.placeholder', { ns: 'admin-account' })}
              autoComplete="username"
              isInvalid={showUsernameValidationError}
              required
              minLength={minUsernameLength}
              maxLength={maxUsernameLength}
            />
            <Form.Control.Feedback type="invalid" className={showUsernameValidationError ? 'd-block' : ''}>
              {usernameValidationError}
            </Form.Control.Feedback>
          </Form.Group>

          <div className="post-summary-cta mb-0">
            <Button type="submit" className="post-summary-read-more" disabled={isUsernameSubmitting}>
              {isUsernameSubmitting ? (
                <span className="d-inline-flex align-items-center gap-2">
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-2 flex-shrink-0 admin-action-spinner"
                    aria-hidden="true"
                  />
                  <span className="read-more-label">
                    {t('adminAccount.account.username.submitting', { ns: 'admin-account' })}
                  </span>
                </span>
              ) : (
                <span className="read-more-label">
                  {t('adminAccount.account.username.submit', { ns: 'admin-account' })}
                </span>
              )}
            </Button>
          </div>
        </Form>
      </section>

      <section className="admin-account-delete-section">
        <h3 className="admin-dashboard-panel-title mb-2">
          {t('adminAccount.account.delete.title', { ns: 'admin-account' })}
        </h3>
        <hr className="admin-section-divider mb-3" />
        <p className="admin-dashboard-panel-copy">{t('adminAccount.account.delete.copy', { ns: 'admin-account' })}</p>

        {deleteErrorMessage ? (
          <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
            {deleteErrorMessage}
          </Alert>
        ) : null}
        {deleteSuccessMessage ? (
          <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
            {deleteSuccessMessage}
          </Alert>
        ) : null}

        <Form noValidate onSubmit={handleDeleteSubmit}>
          <Form.Group className="mb-3" controlId="admin-account-delete-password">
            <Form.Label>{t('adminAccount.account.delete.currentPassword', { ns: 'admin-account' })}</Form.Label>
            <InputGroup>
              <Form.Control
                type={showDeletePassword ? 'text' : 'password'}
                value={deleteCurrentPassword}
                onChange={event => {
                  onDeleteCurrentPasswordChange(event.currentTarget.value);
                  clearDeleteFeedback();
                }}
                placeholder={t('adminAccount.account.delete.currentPasswordPlaceholder', {
                  ns: 'admin-account',
                })}
                autoComplete="current-password"
                isInvalid={showDeletePasswordError}
                required
              />
              <Button
                variant="outline-secondary"
                type="button"
                onClick={onToggleDeletePassword}
                aria-label={
                  showDeletePassword
                    ? t('adminAccount.form.hidePassword', { ns: 'admin-account' })
                    : t('adminAccount.form.showPassword', { ns: 'admin-account' })
                }
              >
                <FontAwesomeIcon icon={showDeletePassword ? 'eye-slash' : 'eye'} />
              </Button>
            </InputGroup>
            <Form.Control.Feedback type="invalid" className={showDeletePasswordError ? 'd-block' : ''}>
              {deletePasswordError}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-4" controlId="admin-account-delete-confirm">
            <Form.Label>{t('adminAccount.account.delete.confirmLabel', { ns: 'admin-account' })}</Form.Label>
            <Form.Control
              type="text"
              value={deleteConfirmation}
              onChange={event => {
                onDeleteConfirmationChange(event.currentTarget.value);
                clearDeleteFeedback();
              }}
              placeholder={t('adminAccount.account.delete.confirmPlaceholder', {
                ns: 'admin-account',
                value: deleteConfirmationValue,
              })}
              isInvalid={showDeleteConfirmError}
              required
            />
            <Form.Control.Feedback type="invalid" className={showDeleteConfirmError ? 'd-block' : ''}>
              {deleteConfirmError}
            </Form.Control.Feedback>
          </Form.Group>

          <div className="post-summary-cta mb-0">
            <Button
              type="submit"
              variant="danger"
              className="post-summary-read-more admin-account-danger-action"
              disabled={isDeleteSubmitting}
            >
              {isDeleteSubmitting ? (
                <span className="d-inline-flex align-items-center gap-2">
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-2 flex-shrink-0 admin-action-spinner"
                    aria-hidden="true"
                  />
                  <span className="read-more-label">
                    {t('adminAccount.account.delete.submitting', { ns: 'admin-account' })}
                  </span>
                </span>
              ) : (
                <span className="read-more-label">
                  {t('adminAccount.account.delete.submit', { ns: 'admin-account' })}
                </span>
              )}
            </Button>
          </div>
        </Form>
      </section>
    </div>
  );
}
