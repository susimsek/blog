'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  fetchAdminGithubAuthStatus,
  fetchAdminGoogleAuthStatus,
  fetchAdminMe,
  loginAdmin,
  resolveAdminError,
} from '@/lib/adminApi';
import { withBasePath } from '@/lib/basePath';
import { useLocale } from '@/i18n/useLocale';
import { useAppSelector } from '@/config/store';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import { ADMIN_ROUTES, withAdminLocalePath } from '@/lib/adminRoutes';
import { writeAdminSessionProfileCache } from '@/lib/adminSessionProfileCache';
import { isValidEmail } from '@/lib/emailValidation';

type AdminLoginTranslate = ReturnType<typeof useTranslation>['t'];
type AdminOAuthStatus = { enabled: boolean; loginAvailable: boolean };

const resolveLoginValidation = (email: string, password: string, t: AdminLoginTranslate) => {
  const trimmedEmail = email.trim();
  let emailError = '';
  if (trimmedEmail === '') {
    emailError = t('adminLogin.validation.emailRequired', { ns: 'admin-login' });
  } else if (!isValidEmail(trimmedEmail)) {
    emailError = t('adminLogin.validation.emailInvalid', { ns: 'admin-login' });
  }

  return {
    trimmedEmail,
    emailError,
    passwordError: password.trim() === '' ? t('adminLogin.validation.passwordRequired', { ns: 'admin-login' }) : '',
  };
};

const AdminLoginPasswordField = ({
  password,
  passwordError,
  showPassword,
  showPasswordError,
  hasErrorMessage,
  setPassword,
  setShowPassword,
  clearError,
  t,
}: {
  password: string;
  passwordError: string;
  showPassword: boolean;
  showPasswordError: boolean;
  hasErrorMessage: boolean;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  clearError: () => void;
  t: AdminLoginTranslate;
}) => (
  <Form.Group className="mb-4" controlId="admin-login-password">
    <Form.Label className="mb-2">{t('adminLogin.password', { ns: 'admin-login' })}</Form.Label>
    <InputGroup>
      <Form.Control
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={event => {
          setPassword(event.currentTarget.value);
          if (hasErrorMessage) {
            clearError();
          }
        }}
        placeholder={t('adminLogin.passwordPlaceholder', { ns: 'admin-login' })}
        autoComplete="current-password"
        isInvalid={showPasswordError}
        required
      />
      <Button
        variant="outline-secondary"
        type="button"
        onClick={() => setShowPassword(previous => !previous)}
        aria-label={
          showPassword
            ? t('adminLogin.hidePassword', { ns: 'admin-login' })
            : t('adminLogin.showPassword', { ns: 'admin-login' })
        }
      >
        <FontAwesomeIcon icon={showPassword ? 'eye-slash' : 'eye'} />
      </Button>
    </InputGroup>
    <Form.Control.Feedback type="invalid" className={showPasswordError ? 'd-block' : ''}>
      {passwordError}
    </Form.Control.Feedback>
  </Form.Group>
);

const AdminLoginSocialOptions = ({
  googleAuthStatus,
  githubAuthStatus,
  handleGoogleLogin,
  handleGithubLogin,
  handleSubmitHoverStart,
  handleSubmitHoverEnd,
  t,
}: {
  googleAuthStatus: AdminOAuthStatus;
  githubAuthStatus: AdminOAuthStatus;
  handleGoogleLogin: () => void;
  handleGithubLogin: () => void;
  handleSubmitHoverStart: () => void;
  handleSubmitHoverEnd: () => void;
  t: AdminLoginTranslate;
}) => {
  const hasGoogle = googleAuthStatus.enabled && googleAuthStatus.loginAvailable;
  const hasGithub = githubAuthStatus.enabled && githubAuthStatus.loginAvailable;
  if (!hasGoogle && !hasGithub) {
    return null;
  }

  return (
    <>
      <div className="d-flex align-items-center gap-3 theme-text-muted small text-uppercase fw-semibold mb-4">
        <span className="flex-grow-1 border-top" />
        <span>{t('adminLogin.google.or', { ns: 'admin-login' })}</span>
        <span className="flex-grow-1 border-top" />
      </div>
      {hasGoogle ? (
        <div className={hasGithub ? 'mb-3' : 'mb-4'}>
          <Button
            type="button"
            variant="danger"
            className="post-summary-read-more w-100 justify-content-center"
            onClick={handleGoogleLogin}
            onMouseEnter={handleSubmitHoverStart}
            onMouseLeave={handleSubmitHoverEnd}
          >
            <span className="read-more-label d-inline-flex align-items-center justify-content-center gap-2">
              <FontAwesomeIcon icon={['fab', 'google']} />
              <span>{t('adminLogin.google.submit', { ns: 'admin-login' })}</span>
            </span>
            <span className="read-more-icon-rail" aria-hidden="true">
              <span className="read-more-icon read-more-icon-front">
                <FontAwesomeIcon icon="angle-right" />
              </span>
              <span className="read-more-icon read-more-icon-back">
                <FontAwesomeIcon icon="angle-right" />
              </span>
            </span>
          </Button>
        </div>
      ) : null}
      {hasGithub ? (
        <div className="mb-4">
          <Button
            type="button"
            variant="secondary"
            className="post-summary-read-more w-100 justify-content-center"
            onClick={handleGithubLogin}
            onMouseEnter={handleSubmitHoverStart}
            onMouseLeave={handleSubmitHoverEnd}
          >
            <span className="read-more-label d-inline-flex align-items-center justify-content-center gap-2">
              <FontAwesomeIcon icon={['fab', 'github']} />
              <span>{t('adminLogin.github.submit', { ns: 'admin-login' })}</span>
            </span>
            <span className="read-more-icon-rail" aria-hidden="true">
              <span className="read-more-icon read-more-icon-front">
                <FontAwesomeIcon icon="angle-right" />
              </span>
              <span className="read-more-icon read-more-icon-back">
                <FontAwesomeIcon icon="angle-right" />
              </span>
            </span>
          </Button>
        </div>
      ) : null}
    </>
  );
};

export default function AdminLoginPage() {
  // NOSONAR
  const { t } = useTranslation(['admin-login', 'admin-common']);
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const forgotPasswordHref = withAdminLocalePath(locale, ADMIN_ROUTES.forgotPassword);
  const isVoiceEnabled = useAppSelector(state => state.voice.isEnabled);
  const submitSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [googleAuthStatus, setGoogleAuthStatus] = React.useState({
    enabled: false,
    loginAvailable: false,
  });
  const [githubAuthStatus, setGithubAuthStatus] = React.useState({
    enabled: false,
    loginAvailable: false,
  });

  const { trimmedEmail, emailError, passwordError } = resolveLoginValidation(email, password, t);
  const showEmailError = hasSubmitted && emailError !== '';
  const showPasswordError = hasSubmitted && passwordError !== '';

  React.useEffect(
    () => () => {
      if (submitSoundRef.current) {
        submitSoundRef.current.pause();
        submitSoundRef.current = null;
      }
    },
    [],
  );

  React.useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const me = await fetchAdminMe();
        if (isMounted && me.authenticated) {
          router.replace(ADMIN_ROUTES.root);
          return;
        }
      } catch {
        // Ignore bootstrap auth errors and allow the login form to render.
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [locale, router]);

  React.useEffect(() => {
    let isMounted = true;

    void fetchAdminGoogleAuthStatus()
      .then(payload => {
        if (!isMounted) {
          return;
        }
        setGoogleAuthStatus(payload);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setGoogleAuthStatus({
          enabled: false,
          loginAvailable: false,
        });
      });

    void fetchAdminGithubAuthStatus()
      .then(payload => {
        if (!isMounted) {
          return;
        }
        setGithubAuthStatus(payload);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setGithubAuthStatus({
          enabled: false,
          loginAvailable: false,
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!searchParams) {
      return;
    }

    const providerStatuses = [
      {
        provider: 'google',
        status: (searchParams.get('google') ?? '').trim().toLowerCase(),
      },
      {
        provider: 'github',
        status: (searchParams.get('github') ?? '').trim().toLowerCase(),
      },
    ];

    for (const providerStatus of providerStatuses) {
      if (providerStatus.status === '') {
        continue;
      }

      const baseKey = `adminLogin.${providerStatus.provider}`;
      switch (providerStatus.status) {
        case 'cancelled':
          setErrorMessage(t(`${baseKey}.cancelled`, { ns: 'admin-login' }));
          return;
        case 'not-linked':
          setErrorMessage(t(`${baseKey}.notLinked`, { ns: 'admin-login' }));
          return;
        default:
          setErrorMessage(t(`${baseKey}.failed`, { ns: 'admin-login' }));
          return;
      }
    }
  }, [searchParams, t]);

  const handleGoogleLogin = React.useCallback(() => {
    globalThis.location.assign(
      withBasePath(
        `/api/oauth/connect?provider=google&flow=admin&intent=login&locale=${encodeURIComponent(locale)}&rememberMe=${
          rememberMe ? '1' : '0'
        }`,
      ),
    );
  }, [locale, rememberMe]);

  const handleGithubLogin = React.useCallback(() => {
    globalThis.location.assign(
      withBasePath(
        `/api/oauth/connect?provider=github&flow=admin&intent=login&locale=${encodeURIComponent(locale)}&rememberMe=${
          rememberMe ? '1' : '0'
        }`,
      ),
    );
  }, [locale, rememberMe]);

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) {
        return;
      }

      setHasSubmitted(true);
      if (emailError || passwordError) {
        return;
      }

      setIsSubmitting(true);
      setErrorMessage('');

      try {
        const payload = await loginAdmin(trimmedEmail, password, rememberMe);
        if (!payload.success) {
          throw new Error(t('adminLogin.errorFallback', { ns: 'admin-login' }));
        }
        writeAdminSessionProfileCache(payload.user ?? null);
        globalThis.dispatchEvent(new CustomEvent('admin:user-updated', { detail: { user: payload.user ?? null } }));
        router.replace(ADMIN_ROUTES.root);
      } catch (error) {
        const resolvedError = resolveAdminError(error);
        if (resolvedError.kind === 'network') {
          setErrorMessage(t('adminCommon.errors.network', { ns: 'admin-common' }));
        } else {
          const displayErrorMessage =
            resolvedError.message.trim() === ''
              ? t('adminLogin.errorFallback', { ns: 'admin-login' })
              : resolvedError.message;
          setErrorMessage(displayErrorMessage);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [emailError, isSubmitting, locale, password, passwordError, rememberMe, router, t, trimmedEmail],
  );

  const handleSubmitHoverStart = React.useCallback(() => {
    if (isSubmitting || !isVoiceEnabled || globalThis.Audio === undefined) {
      return;
    }

    try {
      if (!submitSoundRef.current) {
        submitSoundRef.current = new Audio('/sounds/rising-pops.mp3');
        submitSoundRef.current.preload = 'auto';
      }

      const sound = submitSoundRef.current;
      sound.volume = 0.25;
      sound.playbackRate = 1;
      sound.currentTime = 0;
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Ignore playback failures (autoplay restrictions / unsupported environments).
        });
      }
    } catch {
      // Ignore playback failures (autoplay restrictions / unsupported environments).
    }
  }, [isSubmitting, isVoiceEnabled]);

  const handleSubmitHoverEnd = React.useCallback(() => {
    if (!submitSoundRef.current) {
      return;
    }

    submitSoundRef.current.pause();
    submitSoundRef.current.currentTime = 0;
  }, []);

  if (isCheckingSession) {
    return (
      <section className="py-5 admin-login-section">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-7 mx-auto">
            <div className="post-card d-flex align-items-center post-summary-card admin-login-card admin-login-card-loading">
              <div className="post-card-content flex-grow-1 text-center py-4">
                <AdminLoadingState
                  className="admin-loading-stack"
                  ariaLabel={t('adminCommon.status.loading', { ns: 'admin-common' })}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5 admin-login-section">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 col-xl-7 mx-auto">
          <div className="post-card d-flex align-items-center post-summary-card admin-login-card">
            <div className="post-card-content flex-grow-1">
              <div className="admin-login-eyebrow d-flex align-items-center gap-2 text-uppercase small fw-semibold theme-text-muted mb-3">
                <FontAwesomeIcon icon="shield-halved" />
                <span>{t('adminLogin.eyebrow', { ns: 'admin-login' })}</span>
              </div>
              <div className="post-summary-title-row">
                <h1 className="fw-bold post-summary-title mb-0">{t('adminLogin.title', { ns: 'admin-login' })}</h1>
              </div>
              <p className="post-summary-text admin-login-subtitle mb-4">
                {t('adminLogin.subtitle', { ns: 'admin-login' })}
              </p>

              {errorMessage ? (
                <Alert variant="danger" className="mb-4 px-4 py-3 lh-base">
                  {errorMessage}
                </Alert>
              ) : null}

              <Form noValidate onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="admin-login-email">
                  <Form.Label>{t('adminLogin.email', { ns: 'admin-login' })}</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={event => {
                      const nextValue = event.currentTarget.value;
                      setEmail(nextValue);
                      if (errorMessage) {
                        setErrorMessage('');
                      }
                    }}
                    placeholder={t('adminLogin.emailPlaceholder', { ns: 'admin-login' })}
                    autoComplete="username"
                    autoFocus
                    isInvalid={showEmailError}
                    required
                  />
                  <Form.Control.Feedback type="invalid">{emailError}</Form.Control.Feedback>
                </Form.Group>

                <AdminLoginPasswordField
                  password={password}
                  passwordError={passwordError}
                  showPassword={showPassword}
                  showPasswordError={showPasswordError}
                  hasErrorMessage={Boolean(errorMessage)}
                  setPassword={setPassword}
                  setShowPassword={setShowPassword}
                  clearError={() => setErrorMessage('')}
                  t={t}
                />

                <Form.Group className="mb-4" controlId="admin-login-remember-me">
                  <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                    <Form.Check
                      type="checkbox"
                      label={t('adminLogin.rememberMe', { ns: 'admin-login' })}
                      checked={rememberMe}
                      onChange={event => {
                        setRememberMe(event.currentTarget.checked);
                      }}
                    />
                    <Link href={forgotPasswordHref} className="small fw-semibold text-decoration-none text-nowrap">
                      {t('adminLogin.forgotPassword', { ns: 'admin-login' })}
                    </Link>
                  </div>
                </Form.Group>

                <div className="mb-4">
                  <Button
                    type="submit"
                    className="post-summary-read-more w-100 justify-content-center"
                    disabled={isSubmitting}
                    onMouseEnter={handleSubmitHoverStart}
                    onMouseLeave={handleSubmitHoverEnd}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          className="me-2 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span className="read-more-label">{t('adminLogin.submitting', { ns: 'admin-login' })}</span>
                      </>
                    ) : (
                      <>
                        <span className="read-more-label d-inline-flex align-items-center justify-content-center gap-2">
                          <FontAwesomeIcon icon="right-to-bracket" />
                          <span>{t('adminLogin.submit', { ns: 'admin-login' })}</span>
                        </span>
                        <span className="read-more-icon-rail" aria-hidden="true">
                          <span className="read-more-icon read-more-icon-front">
                            <FontAwesomeIcon icon="angle-right" />
                          </span>
                          <span className="read-more-icon read-more-icon-back">
                            <FontAwesomeIcon icon="angle-right" />
                          </span>
                        </span>
                      </>
                    )}
                  </Button>
                </div>

                <AdminLoginSocialOptions
                  googleAuthStatus={googleAuthStatus}
                  githubAuthStatus={githubAuthStatus}
                  handleGoogleLogin={handleGoogleLogin}
                  handleGithubLogin={handleGithubLogin}
                  handleSubmitHoverStart={handleSubmitHoverStart}
                  handleSubmitHoverEnd={handleSubmitHoverEnd}
                  t={t}
                />

                <p className="small theme-text-muted mb-0 mt-3">{t('adminLogin.help', { ns: 'admin-login' })}</p>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
