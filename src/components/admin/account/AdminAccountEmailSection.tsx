'use client';

import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import type { AdminSessionProfile } from '@/lib/adminSessionProfileCache';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;

type AdminAccountEmailSectionProps = {
  adminUser: AdminSessionProfile;
  t: AdminAccountTranslate;
  formatSessionDate: (value: string) => string;
  pendingEmail: string;
  emailErrorMessage: string;
  emailSuccessMessage: string;
  handleEmailSubmit: React.FormEventHandler<HTMLFormElement>;
  emailInput: string;
  onEmailInputChange: (value: string) => void;
  onEmailInputBlur: () => void;
  showEmailValidationError: boolean;
  emailValidationError: string;
  emailCurrentPassword: string;
  onEmailCurrentPasswordChange: (value: string) => void;
  onEmailCurrentPasswordBlur: () => void;
  showEmailCurrentPasswordError: boolean;
  emailCurrentPasswordError: string;
  isEmailSubmitting: boolean;
};

export default function AdminAccountEmailSection({
  adminUser,
  t,
  formatSessionDate,
  pendingEmail,
  emailErrorMessage,
  emailSuccessMessage,
  handleEmailSubmit,
  emailInput,
  onEmailInputChange,
  onEmailInputBlur,
  showEmailValidationError,
  emailValidationError,
  emailCurrentPassword,
  onEmailCurrentPasswordChange,
  onEmailCurrentPasswordBlur,
  showEmailCurrentPasswordError,
  emailCurrentPasswordError,
  isEmailSubmitting,
}: Readonly<AdminAccountEmailSectionProps>) {
  return (
    <div className="admin-account-section-stack">
      <section>
        <h3 className="admin-dashboard-panel-title mb-2">
          {t('adminAccount.account.email.title', { ns: 'admin-account' })}
        </h3>
        <p className="admin-dashboard-panel-copy">{t('adminAccount.account.email.copy', { ns: 'admin-account' })}</p>

        {emailErrorMessage ? (
          <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
            {emailErrorMessage}
          </Alert>
        ) : null}
        {emailSuccessMessage ? (
          <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
            {emailSuccessMessage}
          </Alert>
        ) : null}
        {pendingEmail ? (
          <Alert variant="info" className="mb-3 px-4 py-3 lh-base">
            <div className="fw-semibold mb-1">
              {t('adminAccount.account.email.pending.title', { ns: 'admin-account' })}
            </div>
            <div>
              {t('adminAccount.account.email.pending.copy', {
                ns: 'admin-account',
                email: pendingEmail,
              })}
            </div>
            {adminUser.pendingEmailExpiresAt ? (
              <div className="small mt-2">
                {t('adminAccount.account.email.pending.expiresAt', {
                  ns: 'admin-account',
                  value: formatSessionDate(adminUser.pendingEmailExpiresAt),
                })}
              </div>
            ) : null}
          </Alert>
        ) : null}

        <Form noValidate onSubmit={handleEmailSubmit}>
          <Form.Group className="mb-3" controlId="admin-account-current-email">
            <Form.Label>{t('adminAccount.account.email.currentLabel', { ns: 'admin-account' })}</Form.Label>
            <Form.Control type="email" value={adminUser.email} readOnly plaintext={false} disabled />
          </Form.Group>

          <Form.Group className="mb-3" controlId="admin-account-email">
            <Form.Label>{t('adminAccount.account.email.label', { ns: 'admin-account' })}</Form.Label>
            <Form.Control
              type="email"
              value={emailInput}
              onChange={event => {
                onEmailInputChange(event.currentTarget.value);
              }}
              onBlur={onEmailInputBlur}
              placeholder={t('adminAccount.account.email.placeholder', { ns: 'admin-account' })}
              autoComplete="email"
              isInvalid={showEmailValidationError}
              required
            />
            <Form.Control.Feedback type="invalid" className={showEmailValidationError ? 'd-block' : ''}>
              {emailValidationError}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="admin-account-email-password">
            <Form.Label>{t('adminAccount.account.email.currentPassword', { ns: 'admin-account' })}</Form.Label>
            <Form.Control
              type="password"
              value={emailCurrentPassword}
              onChange={event => {
                onEmailCurrentPasswordChange(event.currentTarget.value);
              }}
              onBlur={onEmailCurrentPasswordBlur}
              placeholder={t('adminAccount.account.email.currentPasswordPlaceholder', {
                ns: 'admin-account',
              })}
              autoComplete="current-password"
              isInvalid={showEmailCurrentPasswordError}
              required
            />
            <Form.Control.Feedback type="invalid" className={showEmailCurrentPasswordError ? 'd-block' : ''}>
              {emailCurrentPasswordError}
            </Form.Control.Feedback>
          </Form.Group>

          <div className="post-summary-cta mb-0">
            <Button type="submit" className="post-summary-read-more" disabled={isEmailSubmitting}>
              {isEmailSubmitting ? (
                <span className="d-inline-flex align-items-center gap-2">
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-2 flex-shrink-0 admin-action-spinner"
                    aria-hidden="true"
                  />
                  <span className="read-more-label">
                    {t('adminAccount.account.email.submitting', { ns: 'admin-account' })}
                  </span>
                </span>
              ) : (
                <span className="read-more-label">
                  {t('adminAccount.account.email.submit', { ns: 'admin-account' })}
                </span>
              )}
            </Button>
          </div>
        </Form>
      </section>
    </div>
  );
}
