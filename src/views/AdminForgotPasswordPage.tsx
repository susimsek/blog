'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import { defaultLocale } from '@/i18n/settings';
import { ADMIN_ROUTES, withAdminLocalePath } from '@/lib/adminRoutes';
import { requestAdminPasswordReset, resolveAdminPasswordResetError } from '@/lib/adminPasswordResetApi';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUCCESS_MESSAGE_AUTO_HIDE_MS = 3500;

const resolveEmailError = (email: string, t: ReturnType<typeof useTranslation>['t']) => {
  if (email === '') {
    return t('adminPasswordReset.request.validation.emailRequired');
  }

  if (EMAIL_PATTERN.test(email) === false) {
    return t('adminPasswordReset.request.validation.emailInvalid');
  }

  return '';
};

export default function AdminForgotPasswordPage() {
  const { t } = useTranslation('admin-password-reset');
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const locale = routeLocale ?? defaultLocale;
  const loginHref = withAdminLocalePath(locale, ADMIN_ROUTES.login);

  const [email, setEmail] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [hasTouchedEmail, setHasTouchedEmail] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  useAutoClearValue(showSuccessMessage, setShowSuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS, {
    nextValue: false,
    isEmpty: value => value === false,
  });

  const trimmedEmail = email.trim();
  const emailError = resolveEmailError(trimmedEmail, t);
  const showEmailError = (hasSubmitted || hasTouchedEmail) && emailError !== '';
  const resolveDisplayError = React.useCallback(
    (code: string, fallbackMessage: string) => {
      const translationKey = `adminPasswordReset.errors.codes.${code}`;
      const translated = t(translationKey);
      if (translated === translationKey) {
        return fallbackMessage;
      }

      return translated;
    },
    [t],
  );

  const handleSubmit = React.useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) {
        return;
      }

      setHasSubmitted(true);
      if (emailError !== '') {
        return;
      }

      setIsSubmitting(true);
      setErrorMessage('');

      try {
        await requestAdminPasswordReset(trimmedEmail, locale);
        setIsSuccess(true);
        setShowSuccessMessage(true);
      } catch (error) {
        const resolved = resolveAdminPasswordResetError(error);
        setErrorMessage(
          resolved.kind === 'network'
            ? t('adminPasswordReset.errors.network')
            : resolveDisplayError(resolved.code, resolved.message),
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [emailError, isSubmitting, locale, resolveDisplayError, t, trimmedEmail],
  );

  return (
    <section className="py-5 admin-login-section">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 col-xl-7 mx-auto">
          <div className="post-card d-flex align-items-center post-summary-card admin-login-card">
            <div className="post-card-content flex-grow-1">
              <div className="admin-login-eyebrow d-flex align-items-center gap-2 text-uppercase small fw-semibold text-muted mb-3">
                <FontAwesomeIcon icon="lock" />
                <span>{t('adminPasswordReset.request.eyebrow')}</span>
              </div>
              <div className="post-summary-title-row">
                <h1 className="fw-bold post-summary-title mb-0">{t('adminPasswordReset.request.title')}</h1>
              </div>
              <p className="post-summary-text admin-login-subtitle mb-4">{t('adminPasswordReset.request.subtitle')}</p>

              {showSuccessMessage ? (
                <Alert variant="success" className="mb-4 px-4 py-3 lh-base">
                  {t('adminPasswordReset.request.success')}
                </Alert>
              ) : null}

              {errorMessage ? (
                <Alert variant="danger" className="mb-4 px-4 py-3 lh-base">
                  {errorMessage}
                </Alert>
              ) : null}

              <Form noValidate onSubmit={handleSubmit}>
                <Form.Group className="mb-4" controlId="admin-forgot-password-email">
                  <Form.Label>{t('adminPasswordReset.request.email')}</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={event => {
                      setEmail(event.currentTarget.value);
                      if (!hasTouchedEmail) {
                        setHasTouchedEmail(true);
                      }
                      if (errorMessage) {
                        setErrorMessage('');
                      }
                    }}
                    onBlur={() => {
                      setHasTouchedEmail(true);
                    }}
                    placeholder={t('adminPasswordReset.request.emailPlaceholder')}
                    autoComplete="email"
                    autoFocus
                    isInvalid={showEmailError}
                    required
                    disabled={isSubmitting || isSuccess}
                  />
                  <Form.Control.Feedback type="invalid">{emailError}</Form.Control.Feedback>
                </Form.Group>

                <div className="d-flex flex-column flex-sm-row gap-3">
                  <Button
                    type="submit"
                    className="post-summary-read-more justify-content-center"
                    disabled={isSubmitting || isSuccess}
                  >
                    {isSubmitting ? (
                      <span className="d-inline-flex align-items-center">
                        <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />
                        <span className="read-more-label">{t('adminPasswordReset.request.submitting')}</span>
                      </span>
                    ) : (
                      <span className="read-more-label d-inline-flex align-items-center justify-content-center gap-2">
                        <FontAwesomeIcon icon="paper-plane" />
                        <span>{t('adminPasswordReset.request.submit')}</span>
                      </span>
                    )}
                  </Button>
                  <a href={loginHref} className="btn btn-secondary">
                    <span className="d-inline-flex align-items-center gap-2">
                      <FontAwesomeIcon icon="right-to-bracket" />
                      <span>{t('adminPasswordReset.request.backToLogin')}</span>
                    </span>
                  </a>
                </div>

                <p className="small text-muted mb-0 mt-4">{t('adminPasswordReset.request.help')}</p>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
