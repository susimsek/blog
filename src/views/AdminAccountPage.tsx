'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { changeAdminPassword, fetchAdminMe } from '@/lib/adminApi';
import { defaultLocale } from '@/i18n/settings';
import AdminLoadingState from '@/components/admin/AdminLoadingState';

type AdminIdentity = {
  id: string;
  username: string | null;
  email: string;
  roles: string[];
} | null;

const MIN_PASSWORD_LENGTH = 8;
const STRONG_PASSWORD_LENGTH = 12;

const getPasswordStrength = (password: string) => {
  const value = password;
  if (value === '') {
    return { score: 0, tone: 'idle' as const, labelKey: 'adminAccount.strength.idle' };
  }

  const characterGroups = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;

  let score = 1;
  if (value.length >= 6) score += 1;
  if (value.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (value.length >= STRONG_PASSWORD_LENGTH) score += 1;
  if (characterGroups >= 3) score += 1;

  if (score <= 1) {
    return { score, tone: 'weak' as const, labelKey: 'adminAccount.strength.weak' };
  }
  if (score === 2) {
    return { score, tone: 'fair' as const, labelKey: 'adminAccount.strength.fair' };
  }
  if (score === 3) {
    return { score, tone: 'good' as const, labelKey: 'adminAccount.strength.good' };
  }
  if (score === 4) {
    return { score, tone: 'strong' as const, labelKey: 'adminAccount.strength.strong' };
  }

  return { score, tone: 'excellent' as const, labelKey: 'adminAccount.strength.excellent' };
};

export default function AdminAccountPage() {
  const { t } = useTranslation(['admin-account', 'admin-common']);
  const router = useRouter();
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const locale = routeLocale ?? defaultLocale;
  const [adminUser, setAdminUser] = React.useState<AdminIdentity>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const me = await fetchAdminMe();
        if (!isMounted) {
          return;
        }

        if (!me.authenticated || !me.user) {
          router.replace(`/${locale}/admin/login`);
          return;
        }

        setAdminUser(me.user);
      } catch {
        if (isMounted) {
          router.replace(`/${locale}/admin/login`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [locale, router]);

  const currentPasswordError =
    currentPassword === '' ? t('adminAccount.validation.currentPasswordRequired', { ns: 'admin-account' }) : '';
  const currentPasswordIncorrectMessage = t('adminAccount.currentPasswordIncorrect', { ns: 'admin-account' });
  const newPasswordError =
    newPassword === ''
      ? t('adminAccount.validation.newPasswordRequired', { ns: 'admin-account' })
      : newPassword.length < MIN_PASSWORD_LENGTH
        ? t('adminAccount.validation.newPasswordMin', { ns: 'admin-account', count: MIN_PASSWORD_LENGTH })
        : currentPassword !== '' && currentPassword === newPassword
          ? t('adminAccount.validation.newPasswordDifferent', { ns: 'admin-account' })
          : '';
  const confirmPasswordError =
    confirmPassword === ''
      ? t('adminAccount.validation.confirmPasswordRequired', { ns: 'admin-account' })
      : confirmPassword !== newPassword
        ? t('adminAccount.validation.confirmPasswordMismatch', { ns: 'admin-account' })
        : '';
  const passwordStrength = getPasswordStrength(newPassword);
  const showCurrentPasswordError = (hasSubmitted || touchedFields.currentPassword) && currentPasswordError !== '';
  const showNewPasswordError = (hasSubmitted || touchedFields.newPassword) && newPasswordError !== '';
  const showConfirmPasswordError = (hasSubmitted || touchedFields.confirmPassword) && confirmPasswordError !== '';
  const clearSuccessMessage = React.useCallback(() => {
    if (successMessage) {
      setSuccessMessage('');
    }
  }, [successMessage]);
  const handleCurrentPasswordChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.currentTarget.value;
      setCurrentPassword(nextValue);
      setTouchedFields(previous => ({ ...previous, currentPassword: true }));
      if (errorMessage) {
        setErrorMessage('');
      }
      clearSuccessMessage();
    },
    [clearSuccessMessage, errorMessage],
  );
  const handleNewPasswordChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.currentTarget.value;
      setNewPassword(nextValue);
      setTouchedFields(previous => ({ ...previous, newPassword: true }));
      if (errorMessage && errorMessage !== currentPasswordIncorrectMessage) {
        setErrorMessage('');
      }
      clearSuccessMessage();
    },
    [clearSuccessMessage, currentPasswordIncorrectMessage, errorMessage],
  );
  const handleConfirmPasswordChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.currentTarget.value;
      setConfirmPassword(nextValue);
      setTouchedFields(previous => ({ ...previous, confirmPassword: true }));
      if (errorMessage && errorMessage !== currentPasswordIncorrectMessage) {
        setErrorMessage('');
      }
      clearSuccessMessage();
    },
    [clearSuccessMessage, currentPasswordIncorrectMessage, errorMessage],
  );

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) {
        return;
      }

      setHasSubmitted(true);
      setErrorMessage('');
      setSuccessMessage('');

      if (currentPasswordError || newPasswordError || confirmPasswordError) {
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = await changeAdminPassword({
          currentPassword,
          newPassword,
          confirmPassword,
        });

        if (!payload.success) {
          throw new Error(t('adminAccount.errorFallback', { ns: 'admin-account' }));
        }

        setSuccessMessage(t('adminAccount.success', { ns: 'admin-account' }));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setHasSubmitted(false);
        setTouchedFields({
          currentPassword: false,
          newPassword: false,
          confirmPassword: false,
        });
        globalThis.setTimeout(() => {
          router.replace(`/${locale}/admin/login`);
        }, 900);
      } catch (error) {
        const message = error instanceof Error ? error.message.trim() : '';
        const normalized = message.toLowerCase();
        setErrorMessage(
          normalized === 'current password is incorrect'
            ? t('adminAccount.currentPasswordIncorrect', { ns: 'admin-account' })
            : normalized === 'new password must be at least 8 characters'
              ? t('adminAccount.validation.newPasswordMin', { ns: 'admin-account', count: MIN_PASSWORD_LENGTH })
              : normalized === 'new password confirmation does not match'
                ? t('adminAccount.validation.confirmPasswordMismatch', { ns: 'admin-account' })
                : normalized === 'new password must be different from current password'
                  ? t('adminAccount.validation.newPasswordDifferent', { ns: 'admin-account' })
                  : message || t('adminAccount.errorFallback', { ns: 'admin-account' }),
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      confirmPassword,
      confirmPasswordError,
      currentPassword,
      currentPasswordError,
      isSubmitting,
      locale,
      newPassword,
      newPasswordError,
      router,
      t,
    ],
  );

  if (isLoading) {
    return (
      <section className="admin-account-shell">
        <div className="post-card admin-account-card admin-account-loading-card">
          <div className="post-card-content admin-account-loading-panel">
            <AdminLoadingState
              className="admin-loading-stack"
              ariaLabel={t('adminCommon.status.loading', { ns: 'admin-common' })}
            />
            <div className="admin-loading-line admin-loading-line-lg" />
            <div className="admin-loading-line admin-loading-line-md" />
            <div className="admin-account-loading-fields">
              <div className="admin-account-loading-field" />
              <div className="admin-account-loading-field" />
              <div className="admin-account-loading-field" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <section className="admin-account-shell">
      <div className="admin-account-grid">
        <div className="post-card admin-account-card admin-account-form-card">
          <div className="post-card-content">
            <h2 className="admin-dashboard-panel-title mb-3">
              {t('adminCommon.actions.changePassword', { ns: 'admin-common' })}
            </h2>
            <p className="admin-dashboard-panel-copy">{t('adminAccount.form.copy', { ns: 'admin-account' })}</p>

            {errorMessage ? (
              <Alert variant="danger" className="mb-4 px-4 py-3 lh-base">
                {errorMessage}
              </Alert>
            ) : null}
            {successMessage ? (
              <Alert variant="success" className="mb-4 px-4 py-3 lh-base">
                {successMessage}
              </Alert>
            ) : null}

            <Form noValidate onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="admin-account-current-password">
                <Form.Label>{t('adminAccount.form.currentPassword', { ns: 'admin-account' })}</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={handleCurrentPasswordChange}
                    placeholder={t('adminAccount.form.currentPasswordPlaceholder', { ns: 'admin-account' })}
                    autoComplete="current-password"
                    isInvalid={showCurrentPasswordError}
                    required
                    autoFocus
                  />
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => setShowCurrentPassword(previous => !previous)}
                    aria-label={
                      showCurrentPassword
                        ? t('adminAccount.form.hidePassword', { ns: 'admin-account' })
                        : t('adminAccount.form.showPassword', { ns: 'admin-account' })
                    }
                  >
                    <FontAwesomeIcon icon={showCurrentPassword ? 'eye-slash' : 'eye'} />
                  </Button>
                </InputGroup>
                <Form.Control.Feedback type="invalid" className={showCurrentPasswordError ? 'd-block' : ''}>
                  {currentPasswordError}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="admin-account-new-password">
                <Form.Label>{t('adminAccount.form.newPassword', { ns: 'admin-account' })}</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    placeholder={t('adminAccount.form.newPasswordPlaceholder', { ns: 'admin-account' })}
                    autoComplete="new-password"
                    isInvalid={showNewPasswordError}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                  />
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => setShowNewPassword(previous => !previous)}
                    aria-label={
                      showNewPassword
                        ? t('adminAccount.form.hidePassword', { ns: 'admin-account' })
                        : t('adminAccount.form.showPassword', { ns: 'admin-account' })
                    }
                  >
                    <FontAwesomeIcon icon={showNewPassword ? 'eye-slash' : 'eye'} />
                  </Button>
                </InputGroup>
                <div
                  className={`admin-password-strength admin-password-strength-${passwordStrength.tone}`}
                  aria-live="polite"
                >
                  <div className="admin-password-strength-head">
                    <span>{t('adminAccount.strength.title', { ns: 'admin-account' })}</span>
                  </div>
                  <div className="admin-password-strength-track" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, index) => (
                      <span
                        key={`strength:${index + 1}`}
                        className={`admin-password-strength-segment${
                          index < passwordStrength.score ? ' is-active' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <Form.Control.Feedback type="invalid" className={showNewPasswordError ? 'd-block' : ''}>
                  {newPasswordError}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4" controlId="admin-account-confirm-password">
                <Form.Label>{t('adminAccount.form.confirmPassword', { ns: 'admin-account' })}</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder={t('adminAccount.form.confirmPasswordPlaceholder', { ns: 'admin-account' })}
                    autoComplete="new-password"
                    isInvalid={showConfirmPasswordError}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                  />
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => setShowConfirmPassword(previous => !previous)}
                    aria-label={
                      showConfirmPassword
                        ? t('adminAccount.form.hidePassword', { ns: 'admin-account' })
                        : t('adminAccount.form.showPassword', { ns: 'admin-account' })
                    }
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? 'eye-slash' : 'eye'} />
                  </Button>
                </InputGroup>
                <Form.Control.Feedback type="invalid" className={showConfirmPasswordError ? 'd-block' : ''}>
                  {confirmPasswordError}
                </Form.Control.Feedback>
              </Form.Group>

              <div className="post-summary-cta">
                <Button type="submit" className="read-more-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="d-inline-flex align-items-center gap-2">
                      <Spinner animation="border" size="sm" />
                      <span className="read-more-label">
                        {t('adminAccount.form.submitting', { ns: 'admin-account' })}
                      </span>
                    </span>
                  ) : (
                    <span className="read-more-label">{t('adminAccount.form.submit', { ns: 'admin-account' })}</span>
                  )}
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
