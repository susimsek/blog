'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import { defaultLocale } from '@/i18n/settings';
import { getAdminPasswordStrength, MIN_PASSWORD_LENGTH } from '@/lib/adminPassword';
import { ADMIN_ROUTES, withAdminLocalePath } from '@/lib/adminRoutes';
import {
  confirmAdminPasswordReset,
  resolveAdminPasswordResetError,
  validateAdminPasswordResetToken,
} from '@/lib/adminPasswordResetApi';

const SUCCESS_MESSAGE_AUTO_HIDE_MS = 3500;
type ResetTokenStatus = 'valid' | 'invalid' | 'expired';
type Translate = ReturnType<typeof useTranslation>['t'];

const resolveResetTokenStatus = (status: string) => {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === 'success') {
    return 'valid' as const;
  }

  if (normalizedStatus === 'expired') {
    return 'expired' as const;
  }

  return 'invalid' as const;
};

const resolvePasswordError = (password: string, t: ReturnType<typeof useTranslation>['t']) => {
  if (password.trim() === '') {
    return t('adminPasswordReset.reset.validation.passwordRequired');
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return t('adminPasswordReset.reset.validation.passwordTooShort');
  }

  return '';
};

const resolveConfirmPasswordError = (
  password: string,
  confirmPassword: string,
  t: ReturnType<typeof useTranslation>['t'],
) => {
  if (confirmPassword.trim() === '') {
    return t('adminPasswordReset.reset.validation.confirmRequired');
  }

  if (password !== confirmPassword) {
    return t('adminPasswordReset.reset.validation.confirmMismatch');
  }

  return '';
};

const resolvePasswordToggleLabel = (isVisible: boolean, showKey: string, hideKey: string, t: Translate) =>
  isVisible ? t(hideKey) : t(showKey);

const resolveDisplayError = (code: string, fallbackMessage: string, t: Translate) => {
  const translationKey = `adminPasswordReset.errors.codes.${code}`;
  const translated = t(translationKey);
  if (translated === translationKey) {
    return fallbackMessage;
  }

  return translated;
};

const useAdminPasswordResetTokenState = (token: string, locale: string, t: Translate) => {
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isCheckingToken, setIsCheckingToken] = React.useState(true);
  const [tokenStatus, setTokenStatus] = React.useState<ResetTokenStatus>('invalid');

  React.useEffect(() => {
    let isMounted = true;

    if (token === '') {
      setTokenStatus('invalid');
      setIsCheckingToken(false);
      return () => {
        isMounted = false;
      };
    }

    void validateAdminPasswordResetToken(token, locale)
      .then(result => {
        if (!isMounted) {
          return;
        }

        setTokenStatus(resolveResetTokenStatus(result.status));
      })
      .catch(error => {
        if (!isMounted) {
          return;
        }

        const resolved = resolveAdminPasswordResetError(error);
        setErrorMessage(
          resolved.kind === 'network'
            ? t('adminPasswordReset.errors.network')
            : resolveDisplayError(resolved.code, resolved.message, t),
        );
        setTokenStatus('invalid');
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingToken(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [locale, t, token]);

  return { errorMessage, isCheckingToken, tokenStatus };
};

const submitAdminPasswordReset = async (options: {
  confirmPassword: string;
  locale: string;
  password: string;
  t: Translate;
  token: string;
}) => {
  const { confirmPassword, locale, password, t, token } = options;

  try {
    await confirmAdminPasswordReset(token, locale, password, confirmPassword);
    return { ok: true as const, errorMessage: '' };
  } catch (error) {
    const resolved = resolveAdminPasswordResetError(error);
    return {
      ok: false as const,
      errorMessage:
        resolved.kind === 'network'
          ? t('adminPasswordReset.errors.network')
          : resolveDisplayError(resolved.code, resolved.message, t),
    };
  }
};

const renderTokenState = (isCheckingToken: boolean, tokenStatus: ResetTokenStatus, t: Translate) => {
  if (isCheckingToken) {
    return <AdminLoadingState className="admin-loading-stack py-4" ariaLabel={t('adminPasswordReset.reset.loading')} />;
  }

  if (tokenStatus === 'expired') {
    return (
      <Alert variant="warning" className="mb-4 px-4 py-3 lh-base">
        {t('adminPasswordReset.reset.expired')}
      </Alert>
    );
  }

  if (tokenStatus === 'invalid') {
    return (
      <Alert variant="danger" className="mb-4 px-4 py-3 lh-base">
        {t('adminPasswordReset.reset.invalid')}
      </Alert>
    );
  }

  return null;
};

export default function AdminResetPasswordPage() {
  // NOSONAR
  const { t } = useTranslation(['admin-password-reset', 'admin-account']);
  const searchParams = useSearchParams();
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const locale = routeLocale ?? defaultLocale;
  const loginHref = withAdminLocalePath(locale, ADMIN_ROUTES.login);
  const forgotPasswordHref = withAdminLocalePath(locale, ADMIN_ROUTES.forgotPassword);
  const token = (searchParams?.get('token') ?? '').trim();

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [touchedFields, setTouchedFields] = React.useState({
    password: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  useAutoClearValue(showSuccessMessage, setShowSuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS, {
    nextValue: false,
    isEmpty: value => value === false,
  });
  const passwordStrength = getAdminPasswordStrength(password);
  const tokenState = useAdminPasswordResetTokenState(token, locale, t);
  const displayedErrorMessage = errorMessage || tokenState.errorMessage;

  const passwordError = resolvePasswordError(password, t);
  const confirmPasswordError = resolveConfirmPasswordError(password, confirmPassword, t);
  const showPasswordError = (hasSubmitted || touchedFields.password) && passwordError !== '';
  const showConfirmPasswordError = (hasSubmitted || touchedFields.confirmPassword) && confirmPasswordError !== '';

  const handleSubmit = React.useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting || tokenState.tokenStatus !== 'valid') {
        return;
      }

      setHasSubmitted(true);
      if (passwordError || confirmPasswordError) {
        return;
      }

      setIsSubmitting(true);
      setErrorMessage('');

      const result = await submitAdminPasswordReset({
        confirmPassword,
        locale,
        password,
        t,
        token,
      });
      if (result.ok) {
        setIsSuccess(true);
        setShowSuccessMessage(true);
      } else {
        setErrorMessage(result.errorMessage);
      }

      setIsSubmitting(false);
    },
    [
      confirmPassword,
      confirmPasswordError,
      isSubmitting,
      locale,
      password,
      passwordError,
      t,
      token,
      tokenState.tokenStatus,
    ],
  );

  return (
    <section className="py-5 admin-login-section">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 col-xl-7 mx-auto">
          <div className="post-card d-flex align-items-center post-summary-card admin-login-card">
            <div className="post-card-content flex-grow-1">
              <div className="admin-login-eyebrow d-flex align-items-center gap-2 text-uppercase small fw-semibold text-muted mb-3">
                <FontAwesomeIcon icon="lock" />
                <span>{t('adminPasswordReset.reset.eyebrow')}</span>
              </div>
              <div className="post-summary-title-row">
                <h1 className="fw-bold post-summary-title mb-0">{t('adminPasswordReset.reset.title')}</h1>
              </div>
              <p className="post-summary-text admin-login-subtitle mb-4">{t('adminPasswordReset.reset.subtitle')}</p>

              {showSuccessMessage ? (
                <Alert variant="success" className="mb-4 px-4 py-3 lh-base">
                  {t('adminPasswordReset.reset.success')}
                </Alert>
              ) : null}

              {displayedErrorMessage ? (
                <Alert variant="danger" className="mb-4 px-4 py-3 lh-base">
                  {displayedErrorMessage}
                </Alert>
              ) : null}

              {renderTokenState(tokenState.isCheckingToken, tokenState.tokenStatus, t)}

              {tokenState.tokenStatus === 'valid' && !isSuccess ? (
                <Form noValidate onSubmit={handleSubmit}>
                  <Form.Group className="mb-4" controlId="admin-reset-password">
                    <Form.Label>{t('adminPasswordReset.reset.password')}</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={event => {
                          setPassword(event.currentTarget.value);
                          setTouchedFields(previous => ({ ...previous, password: true }));
                          if (displayedErrorMessage) {
                            setErrorMessage('');
                          }
                        }}
                        onBlur={() => {
                          setTouchedFields(previous => ({ ...previous, password: true }));
                        }}
                        placeholder={t('adminPasswordReset.reset.passwordPlaceholder')}
                        autoComplete="new-password"
                        isInvalid={showPasswordError}
                        minLength={MIN_PASSWORD_LENGTH}
                        required
                      />
                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(previous => !previous)}
                        aria-label={resolvePasswordToggleLabel(
                          showPassword,
                          'adminPasswordReset.reset.showPassword',
                          'adminPasswordReset.reset.hidePassword',
                          t,
                        )}
                      >
                        <FontAwesomeIcon icon={showPassword ? 'eye-slash' : 'eye'} />
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
                            key={`reset-strength:${index + 1}`}
                            className={`admin-password-strength-segment${
                              index < passwordStrength.score ? ' is-active' : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <Form.Text className="text-muted">
                      {t('adminAccount.form.passwordHint', {
                        ns: 'admin-account',
                        count: MIN_PASSWORD_LENGTH,
                      })}
                    </Form.Text>
                    <Form.Control.Feedback type="invalid" className={showPasswordError ? 'd-block' : ''}>
                      {passwordError}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="admin-reset-password-confirm">
                    <Form.Label>{t('adminPasswordReset.reset.confirmPassword')}</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={event => {
                          setConfirmPassword(event.currentTarget.value);
                          setTouchedFields(previous => ({ ...previous, confirmPassword: true }));
                          if (displayedErrorMessage) {
                            setErrorMessage('');
                          }
                        }}
                        onBlur={() => {
                          setTouchedFields(previous => ({ ...previous, confirmPassword: true }));
                        }}
                        placeholder={t('adminPasswordReset.reset.confirmPasswordPlaceholder')}
                        autoComplete="new-password"
                        isInvalid={showConfirmPasswordError}
                        minLength={MIN_PASSWORD_LENGTH}
                        required
                      />
                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() => setShowConfirmPassword(previous => !previous)}
                        aria-label={resolvePasswordToggleLabel(
                          showConfirmPassword,
                          'adminPasswordReset.reset.showConfirmPassword',
                          'adminPasswordReset.reset.hideConfirmPassword',
                          t,
                        )}
                      >
                        <FontAwesomeIcon icon={showConfirmPassword ? 'eye-slash' : 'eye'} />
                      </Button>
                    </InputGroup>
                    <Form.Control.Feedback type="invalid" className={showConfirmPasswordError ? 'd-block' : ''}>
                      {confirmPasswordError}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="d-flex flex-column flex-sm-row gap-3">
                    <Button
                      type="submit"
                      className="post-summary-read-more justify-content-center"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />
                          <span className="read-more-label">{t('adminPasswordReset.reset.submitting')}</span>
                        </>
                      ) : (
                        <span className="read-more-label d-inline-flex align-items-center justify-content-center gap-2">
                          <FontAwesomeIcon icon="lock" />
                          <span>{t('adminPasswordReset.reset.submit')}</span>
                        </span>
                      )}
                    </Button>
                    <a href={loginHref} className="btn btn-secondary">
                      <span className="d-inline-flex align-items-center gap-2">
                        <FontAwesomeIcon icon="right-to-bracket" />
                        <span>{t('adminPasswordReset.reset.backToLogin')}</span>
                      </span>
                    </a>
                  </div>
                </Form>
              ) : null}

              {!tokenState.isCheckingToken &&
              (tokenState.tokenStatus === 'invalid' || tokenState.tokenStatus === 'expired' || isSuccess) ? (
                <div className="d-flex flex-column flex-sm-row gap-3">
                  {tokenState.tokenStatus === 'invalid' || tokenState.tokenStatus === 'expired' ? (
                    <a href={forgotPasswordHref} className="btn btn-primary">
                      <span className="d-inline-flex align-items-center gap-2">
                        <FontAwesomeIcon icon="envelope" />
                        <span>{t('adminPasswordReset.reset.requestAnother')}</span>
                      </span>
                    </a>
                  ) : null}
                  <a href={loginHref} className="btn btn-secondary">
                    <span className="d-inline-flex align-items-center gap-2">
                      <FontAwesomeIcon icon="right-to-bracket" />
                      <span>{t('adminPasswordReset.reset.backToLogin')}</span>
                    </span>
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
