'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdminContentManagementPanel from '@/components/admin/AdminContentManagementPanel';
import AdminAccountAccountSection from '@/components/admin/account/AdminAccountAccountSection';
import AdminAccountAppearanceSection from '@/components/admin/account/AdminAccountAppearanceSection';
import AdminAccountAvatarCropModal from '@/components/admin/account/AdminAccountAvatarCropModal';
import AdminAccountCommentsSection from '@/components/admin/account/AdminAccountCommentsSection';
import AdminAccountEmailSection from '@/components/admin/account/AdminAccountEmailSection';
import AdminAccountErrorsSection from '@/components/admin/account/AdminAccountErrorsSection';
import AdminAccountNewsletterSection from '@/components/admin/account/AdminAccountNewsletterSection';
import AdminAccountProfileSection from '@/components/admin/account/AdminAccountProfileSection';
import AdminAccountSecuritySection from '@/components/admin/account/AdminAccountSecuritySection';
import AdminAccountSessionsSection from '@/components/admin/account/AdminAccountSessionsSection';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import { MAX_NAME_LENGTH, MIN_NAME_LENGTH, resolveSessionDeviceIcon } from '@/views/admin-account/adminAccountShared';
import useAdminAccountAccountSection from '@/views/admin-account/useAdminAccountAccountSection';
import useAdminAccountAvatarSection from '@/views/admin-account/useAdminAccountAvatarSection';
import useAdminAccountBootstrap from '@/views/admin-account/useAdminAccountBootstrap';
import useAdminAccountEmailSection from '@/views/admin-account/useAdminAccountEmailSection';
import useAdminAccountNewsletterSection from '@/views/admin-account/useAdminAccountNewsletterSection';
import useAdminAccountSecuritySection from '@/views/admin-account/useAdminAccountSecuritySection';
import useAdminCommentsSection from '@/views/admin-account/useAdminCommentsSection';
import useAdminErrorsSection from '@/views/admin-account/useAdminErrorsSection';
import { changeAdminName, isAdminSessionError, resolveAdminError } from '@/lib/adminApi';
import { withAdminAvatarSize } from '@/lib/adminAvatar';
import { ADMIN_ROUTES } from '@/lib/adminRoutes';
import { defaultLocale } from '@/i18n/settings';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import Link from '@/components/common/Link';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { resetToSystemTheme, setTheme, type Theme } from '@/reducers/theme';
import { THEMES } from '@/config/constants';

type AdminAccountPageProps = {
  section:
    | 'profile'
    | 'account'
    | 'email'
    | 'appearance'
    | 'sessions'
    | 'newsletter'
    | 'newsletterSubscribers'
    | 'comments'
    | 'security'
    | 'errors'
    | 'content';
};

type AsyncSectionContentProps = {
  isLoading: boolean;
  loadingLabel: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
};

const SUCCESS_MESSAGE_AUTO_HIDE_MS = 3500;

const renderAsyncSectionContent = ({
  isLoading,
  loadingLabel,
  isEmpty,
  emptyMessage,
  children,
}: AsyncSectionContentProps) => {
  if (isLoading) {
    return (
      <div className="admin-account-sessions-loading">
        <AdminLoadingState className="admin-loading-stack" ariaLabel={loadingLabel} />
      </div>
    );
  }
  if (isEmpty) {
    return <p className="small text-muted mb-0">{emptyMessage}</p>;
  }

  return children;
};

const parseDateValue = (value: string) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed);
};

const resolveAppearanceCardClass = (value: Theme | 'system') => {
  switch (value) {
    case 'light':
      return 'admin-account-appearance-option--light';
    case 'dark':
      return 'admin-account-appearance-option--dark';
    case 'oceanic':
      return 'admin-account-appearance-option--oceanic';
    case 'forest':
      return 'admin-account-appearance-option--forest';
    default:
      return 'admin-account-appearance-option--system';
  }
};

const resolveAppearanceMetaIcon = (value: Theme | 'system') => {
  switch (value) {
    case 'light':
      return 'sun';
    case 'dark':
      return 'moon';
    case 'oceanic':
      return 'water';
    case 'forest':
      return 'leaf';
    default:
      return 'desktop';
  }
};

export default function AdminAccountPage({ section }: Readonly<AdminAccountPageProps>) {
  const { t } = useTranslation(['admin-account', 'admin-common']);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const locale = routeLocale ?? defaultLocale;
  const isProfileSection = section === 'profile';
  const isAccountSection = section === 'account';
  const isEmailSection = section === 'email';
  const isAppearanceSection = section === 'appearance';
  const isSessionsSection = section === 'sessions';
  const isNewsletterOverviewSection = section === 'newsletter';
  const isNewsletterSubscribersSection = section === 'newsletterSubscribers';
  const isNewsletterSection = isNewsletterOverviewSection || isNewsletterSubscribersSection;
  const isCommentsSection = section === 'comments';
  const isSecuritySection = section === 'security';
  const isErrorsSection = section === 'errors';
  const isContentSection = section === 'content';
  const newsletterTab = isNewsletterSubscribersSection ? 'subscribers' : 'overview';

  const [usernameInput, setUsernameInput] = React.useState('');
  const [nameInput, setNameInput] = React.useState('');
  const [isNameSubmitting, setIsNameSubmitting] = React.useState(false);
  const [nameSubmitted, setNameSubmitted] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');
  const [nameSuccessMessage, setNameSuccessMessage] = React.useState('');
  const selectedTheme = useAppSelector(state => state.theme.theme);
  const hasExplicitTheme = useAppSelector(state => state.theme.hasExplicitTheme);

  const sessionDateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale],
  );

  const {
    adminUser,
    isLoading,
    activeSessions,
    setActiveSessions,
    isSessionsLoading,
    sessionErrorMessage,
    setSessionErrorMessage,
    googleAuthStatus,
    setGoogleAuthStatus,
    githubAuthStatus,
    setGithubAuthStatus,
    isGoogleAuthStatusLoading,
    isGithubAuthStatusLoading,
    googleConnectMessage,
    setGoogleConnectMessage,
    githubConnectMessage,
    setGithubConnectMessage,
    googleConnectMessageVariant,
    setGoogleConnectMessageVariant,
    githubConnectMessageVariant,
    setGithubConnectMessageVariant,
    redirectToAdminLoginRef,
    handleAdminSessionExpired,
    syncAdminUser,
    patchAdminUser,
  } = useAdminAccountBootstrap({
    isSecuritySection,
    isSessionsSection,
    locale,
    pathname,
    router,
    searchParams,
    setNameInput,
    setUsernameInput,
    t,
  });

  const commentsSection = useAdminCommentsSection({
    isActive: isCommentsSection,
    hasAdminUser: adminUser !== null,
    t,
    onSessionExpired: handleAdminSessionExpired,
    successMessageAutoHideMs: SUCCESS_MESSAGE_AUTO_HIDE_MS,
  });

  const errorsSection = useAdminErrorsSection({
    isActive: isErrorsSection,
    hasAdminUser: adminUser !== null,
    t,
    onSessionExpired: handleAdminSessionExpired,
    successMessageAutoHideMs: SUCCESS_MESSAGE_AUTO_HIDE_MS,
  });

  const avatarSection = useAdminAccountAvatarSection({
    adminUser,
    successMessageAutoHideMs: SUCCESS_MESSAGE_AUTO_HIDE_MS,
    syncAdminUser,
    onSessionExpired: handleAdminSessionExpired,
    t,
  });

  const emailSection = useAdminAccountEmailSection({
    adminUser,
    locale,
    patchAdminUser,
    onSessionExpired: handleAdminSessionExpired,
    successMessageAutoHideMs: SUCCESS_MESSAGE_AUTO_HIDE_MS,
    t,
  });

  const accountSection = useAdminAccountAccountSection({
    adminUser,
    usernameInput,
    setUsernameInput,
    syncAdminUser,
    onSessionExpired: handleAdminSessionExpired,
    successMessageAutoHideMs: SUCCESS_MESSAGE_AUTO_HIDE_MS,
    t,
  });

  const securitySection = useAdminAccountSecuritySection({
    locale,
    setActiveSessions,
    setSessionErrorMessage,
    googleAuthStatus,
    setGoogleAuthStatus,
    setGoogleConnectMessage,
    setGoogleConnectMessageVariant,
    githubAuthStatus,
    setGithubAuthStatus,
    setGithubConnectMessage,
    setGithubConnectMessageVariant,
    googleConnectMessage,
    githubConnectMessage,
    onSessionExpired: handleAdminSessionExpired,
    successMessageAutoHideMs: SUCCESS_MESSAGE_AUTO_HIDE_MS,
    t,
  });

  const newsletterSection = useAdminAccountNewsletterSection({
    adminEmail: adminUser?.email,
    hasAdminUser: adminUser !== null,
    isNewsletterOverviewSection,
    isNewsletterSubscribersSection,
    successMessageAutoHideMs: SUCCESS_MESSAGE_AUTO_HIDE_MS,
    t,
    onSessionExpired: handleAdminSessionExpired,
  });

  useAutoClearValue(nameSuccessMessage, setNameSuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS);
  useAutoClearValue(googleConnectMessage, setGoogleConnectMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS, {
    when: googleConnectMessageVariant === 'success',
  });
  useAutoClearValue(githubConnectMessage, setGithubConnectMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS, {
    when: githubConnectMessageVariant === 'success',
  });

  const resolvedNameInput = nameInput.trim();
  const profileName = adminUser?.name?.trim() ?? '';
  const profileUsername = adminUser?.username?.trim() ?? '';
  const profileAvatarURL = withAdminAvatarSize(adminUser?.avatarUrl, 200);
  const settingsSidebarAvatarURL = withAdminAvatarSize(adminUser?.avatarUrl, 48);
  const profileRoles = adminUser?.roles?.join(', ') ?? '';
  const isNameDirty = resolvedNameInput !== profileName;
  const nameValidationError =
    resolvedNameInput === ''
      ? t('adminAccount.validation.nameRequired', { ns: 'admin-account' })
      : resolvedNameInput.length < MIN_NAME_LENGTH || resolvedNameInput.length > MAX_NAME_LENGTH
        ? t('adminAccount.validation.nameLength', {
            ns: 'admin-account',
            min: MIN_NAME_LENGTH,
            max: MAX_NAME_LENGTH,
          })
        : '';
  const showNameValidationError = (nameSubmitted || isNameDirty) && nameValidationError !== '';
  const activeAppearance = hasExplicitTheme ? selectedTheme : 'system';

  const formatSessionDate = React.useCallback(
    (value: string) => {
      const parsed = parseDateValue(value);
      if (!parsed) {
        return value;
      }

      return sessionDateFormatter.format(parsed);
    },
    [sessionDateFormatter],
  );

  const handleNameSubmit = React.useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isNameSubmitting) {
        return;
      }

      setNameSubmitted(true);
      setNameErrorMessage('');
      setNameSuccessMessage('');
      if (nameValidationError) {
        return;
      }

      setIsNameSubmitting(true);
      try {
        const payload = await changeAdminName({ name: resolvedNameInput });
        if (!payload.success) {
          throw new Error(t('adminAccount.profile.errors.nameUpdate', { ns: 'admin-account' }));
        }

        const nextName = payload.user?.name ?? resolvedNameInput;
        patchAdminUser(previous =>
          previous
            ? {
                ...previous,
                name: nextName,
              }
            : previous,
        );
        setNameInput(nextName);
        setNameSubmitted(false);
        setNameSuccessMessage(t('adminAccount.profile.success.nameUpdated', { ns: 'admin-account' }));
      } catch (error) {
        if (isAdminSessionError(error)) {
          redirectToAdminLoginRef.current();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setNameErrorMessage(
          resolvedError.message || t('adminAccount.profile.errors.nameUpdate', { ns: 'admin-account' }),
        );
      } finally {
        setIsNameSubmitting(false);
      }
    },
    [isNameSubmitting, nameValidationError, patchAdminUser, redirectToAdminLoginRef, resolvedNameInput, t],
  );

  const handleAppearanceChange = React.useCallback(
    (value: Theme | 'system') => {
      if (value === 'system') {
        dispatch(resetToSystemTheme());
        return;
      }

      dispatch(setTheme(value));
    },
    [dispatch],
  );

  const handleNewsletterTabSelect = React.useCallback(
    (key: string | null) => {
      if (key === 'subscribers') {
        router.push(`/${locale}${ADMIN_ROUTES.settings.newsletterSubscribers}`);
        return;
      }

      router.push(`/${locale}${ADMIN_ROUTES.settings.newsletter}`);
    },
    [locale, router],
  );

  const settingsSidebar = (
    <aside className="post-card admin-account-card admin-settings-sidebar">
      <div className="post-card-content">
        {adminUser ? (
          <div className="admin-settings-profile-summary">
            <div className="admin-settings-profile-avatar rounded-circle overflow-hidden d-flex align-items-center justify-content-center">
              {settingsSidebarAvatarURL ? (
                <Image
                  src={settingsSidebarAvatarURL}
                  alt={profileName || profileUsername || adminUser.email}
                  width={48}
                  height={48}
                  sizes="48px"
                  unoptimized
                  className="w-100 h-100 object-fit-cover"
                />
              ) : (
                <FontAwesomeIcon icon="user" />
              )}
            </div>
            <div className="admin-settings-profile-meta">
              <div className="admin-settings-profile-title">
                <span>{profileName || profileUsername || adminUser.email}</span>
                {profileUsername ? <span className="admin-settings-profile-username">({profileUsername})</span> : null}
              </div>
            </div>
          </div>
        ) : null}
        <h2 className="admin-dashboard-panel-title mb-2">
          {t('adminAccount.settings.title', { ns: 'admin-account' })}
        </h2>
        <p className="admin-dashboard-panel-copy mb-3">{t('adminAccount.settings.copy', { ns: 'admin-account' })}</p>
        <nav className="admin-settings-nav" aria-label={t('adminAccount.settings.navLabel', { ns: 'admin-account' })}>
          <Link
            href={ADMIN_ROUTES.settings.profile}
            className={`admin-settings-nav-link${isProfileSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="user" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.profile', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.account}
            className={`admin-settings-nav-link${isAccountSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="gear" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.account', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.appearance}
            className={`admin-settings-nav-link${isAppearanceSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="palette" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.appearance', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.email}
            className={`admin-settings-nav-link${isEmailSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="envelope" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.email', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.sessions}
            className={`admin-settings-nav-link${isSessionsSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="desktop" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.sessions', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.newsletter}
            className={`admin-settings-nav-link${isNewsletterSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="envelope" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.newsletter', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.comments}
            className={`admin-settings-nav-link${isCommentsSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="comments" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.comments', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.errors}
            className={`admin-settings-nav-link${isErrorsSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="exclamation-triangle" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.errors', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.content}
            className={`admin-settings-nav-link${isContentSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="layer-group" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.content', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.security}
            className={`admin-settings-nav-link${isSecuritySection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="lock" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.security', { ns: 'admin-account' })}
            </span>
          </Link>
        </nav>
      </div>
    </aside>
  );

  if (isLoading) {
    return (
      <section className="admin-account-shell">
        <div className="admin-settings-layout">
          {settingsSidebar}
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
        </div>
      </section>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <section className="admin-account-shell">
      <div className="admin-settings-layout">
        {settingsSidebar}

        <div className="admin-settings-content">
          <div className="post-card admin-account-card admin-account-form-card">
            <div className="post-card-content">
              {isProfileSection ? (
                <AdminAccountProfileSection
                  adminUser={adminUser}
                  t={t}
                  profileAvatarURL={profileAvatarURL}
                  profileName={profileName}
                  profileUsername={profileUsername}
                  profileRoles={profileRoles}
                  nameErrorMessage={nameErrorMessage}
                  avatarErrorMessage={avatarSection.avatarErrorMessage}
                  nameSuccessMessage={nameSuccessMessage}
                  avatarSuccessMessage={avatarSection.avatarSuccessMessage}
                  maxAvatarFileSizeMb={avatarSection.maxAvatarFileSizeMb}
                  isAvatarSubmitting={avatarSection.isAvatarSubmitting}
                  avatarPendingAction={avatarSection.avatarPendingAction}
                  avatarFileInputRef={avatarSection.avatarFileInputRef}
                  onOpenAvatarPicker={avatarSection.openAvatarPicker}
                  onRemoveAvatar={avatarSection.handleRemoveAvatar}
                  onAvatarFileChange={avatarSection.handleAvatarFileChange}
                  handleNameSubmit={handleNameSubmit}
                  nameInput={nameInput}
                  onNameInputChange={setNameInput}
                  clearNameFeedback={() => {
                    if (nameErrorMessage) {
                      setNameErrorMessage('');
                    }
                    if (nameSuccessMessage) {
                      setNameSuccessMessage('');
                    }
                  }}
                  showNameValidationError={showNameValidationError}
                  nameValidationError={nameValidationError}
                  minNameLength={MIN_NAME_LENGTH}
                  maxNameLength={MAX_NAME_LENGTH}
                  isNameSubmitting={isNameSubmitting}
                />
              ) : null}

              {isEmailSection ? (
                <AdminAccountEmailSection
                  adminUser={adminUser}
                  t={t}
                  formatSessionDate={formatSessionDate}
                  pendingEmail={emailSection.pendingEmail}
                  emailErrorMessage={emailSection.emailErrorMessage}
                  emailSuccessMessage={emailSection.emailSuccessMessage}
                  handleEmailSubmit={emailSection.handleEmailSubmit}
                  emailInput={emailSection.emailInput}
                  onEmailInputChange={emailSection.handleEmailInputChange}
                  onEmailInputBlur={emailSection.handleEmailInputBlur}
                  showEmailValidationError={emailSection.showEmailValidationError}
                  emailValidationError={emailSection.emailValidationError}
                  emailCurrentPassword={emailSection.emailCurrentPassword}
                  onEmailCurrentPasswordChange={emailSection.handleEmailCurrentPasswordChange}
                  onEmailCurrentPasswordBlur={emailSection.handleEmailCurrentPasswordBlur}
                  showEmailCurrentPasswordError={emailSection.showEmailCurrentPasswordError}
                  emailCurrentPasswordError={emailSection.emailCurrentPasswordError}
                  isEmailSubmitting={emailSection.isEmailSubmitting}
                />
              ) : null}

              {isAccountSection ? (
                <AdminAccountAccountSection
                  t={t}
                  usernameErrorMessage={accountSection.usernameErrorMessage}
                  usernameSuccessMessage={accountSection.usernameSuccessMessage}
                  handleUsernameSubmit={accountSection.handleUsernameSubmit}
                  usernameInput={usernameInput}
                  onUsernameInputChange={setUsernameInput}
                  clearUsernameFeedback={accountSection.clearUsernameFeedback}
                  showUsernameValidationError={accountSection.showUsernameValidationError}
                  usernameValidationError={accountSection.usernameValidationError}
                  minUsernameLength={accountSection.minUsernameLength}
                  maxUsernameLength={accountSection.maxUsernameLength}
                  isUsernameSubmitting={accountSection.isUsernameSubmitting}
                  deleteErrorMessage={accountSection.deleteErrorMessage}
                  deleteSuccessMessage={accountSection.deleteSuccessMessage}
                  handleDeleteSubmit={accountSection.handleDeleteSubmit}
                  deleteCurrentPassword={accountSection.deleteCurrentPassword}
                  onDeleteCurrentPasswordChange={accountSection.setDeleteCurrentPassword}
                  deleteConfirmation={accountSection.deleteConfirmation}
                  onDeleteConfirmationChange={accountSection.setDeleteConfirmation}
                  clearDeleteFeedback={accountSection.clearDeleteFeedback}
                  showDeletePassword={accountSection.showDeletePassword}
                  onToggleDeletePassword={accountSection.toggleDeletePassword}
                  showDeletePasswordError={accountSection.showDeletePasswordError}
                  deletePasswordError={accountSection.deletePasswordError}
                  showDeleteConfirmError={accountSection.showDeleteConfirmError}
                  deleteConfirmError={accountSection.deleteConfirmError}
                  deleteConfirmationValue={accountSection.deleteConfirmationValue}
                  isDeleteSubmitting={accountSection.isDeleteSubmitting}
                />
              ) : null}

              {isAppearanceSection ? (
                <AdminAccountAppearanceSection
                  t={t}
                  activeAppearance={activeAppearance}
                  appearanceOptions={[
                    {
                      key: 'system',
                      label: t('adminAccount.account.appearance.options.system', { ns: 'admin-account' }),
                      value: 'system',
                    },
                    ...THEMES.map(option => ({
                      key: option.key,
                      label: t(`adminAccount.account.appearance.options.${option.key}`, { ns: 'admin-account' }),
                      value: option.key,
                    })),
                  ]}
                  onAppearanceChange={handleAppearanceChange}
                  resolveAppearanceCardClass={resolveAppearanceCardClass}
                  resolveAppearanceMetaIcon={resolveAppearanceMetaIcon}
                />
              ) : null}

              {isSessionsSection ? (
                <AdminAccountSessionsSection
                  t={t}
                  formatSessionDate={formatSessionDate}
                  sessionErrorMessage={sessionErrorMessage}
                  sessionSuccessMessage={securitySection.sessionSuccessMessage}
                  isSessionsLoading={isSessionsLoading}
                  activeSessions={activeSessions}
                  isRevokingAllSessions={securitySection.isRevokingAllSessions}
                  revokingSessionID={securitySection.revokingSessionID}
                  onRevokeAllSessions={securitySection.handleRevokeAllSessions}
                  onRevokeSession={securitySection.handleRevokeSession}
                  resolveSessionDeviceIcon={resolveSessionDeviceIcon}
                />
              ) : null}

              {isNewsletterSection ? (
                <AdminAccountNewsletterSection
                  t={t}
                  formatSessionDate={formatSessionDate}
                  newsletterErrorMessage={newsletterSection.newsletterErrorMessage}
                  newsletterSuccessMessage={newsletterSection.newsletterSuccessMessage}
                  newsletterTab={newsletterTab}
                  onNewsletterTabSelect={handleNewsletterTabSelect}
                  isNewsletterDispatchRunning={newsletterSection.isNewsletterDispatchRunning}
                  onTriggerNewsletterDispatch={newsletterSection.handleTriggerNewsletterDispatch}
                  newsletterDispatchTimestamp={newsletterSection.newsletterDispatchTimestamp}
                  newsletterDispatchResults={newsletterSection.newsletterDispatchResults}
                  isNewsletterSummaryLoading={newsletterSection.isNewsletterSummaryLoading}
                  newsletterSubscriberSummary={newsletterSection.newsletterSubscriberSummary}
                  isNewsletterCampaignsLoading={newsletterSection.isNewsletterCampaignsLoading}
                  newsletterCampaigns={newsletterSection.newsletterCampaigns}
                  newsletterCampaignThumbnails={newsletterSection.newsletterCampaignThumbnails}
                  renderAsyncSectionContent={renderAsyncSectionContent}
                  onOpenNewsletterTest={newsletterSection.handleOpenNewsletterTest}
                  onViewNewsletterFailures={newsletterSection.handleViewNewsletterFailures}
                  newsletterFilterLocale={newsletterSection.newsletterFilterLocale}
                  onNewsletterFilterLocaleChange={newsletterSection.handleNewsletterFilterLocaleChange}
                  newsletterFilterStatus={newsletterSection.newsletterFilterStatus}
                  onNewsletterFilterStatusChange={newsletterSection.handleNewsletterFilterStatusChange}
                  newsletterFilterQuery={newsletterSection.newsletterFilterQuery}
                  onNewsletterFilterQueryChange={newsletterSection.handleNewsletterFilterQueryChange}
                  newsletterListTopRef={newsletterSection.newsletterListTopRef}
                  isNewsletterLoading={newsletterSection.isNewsletterLoading}
                  totalNewsletterSubscribers={newsletterSection.totalNewsletterSubscribers}
                  newsletterSubscribers={newsletterSection.newsletterSubscribers}
                  updatingNewsletterEmail={newsletterSection.updatingNewsletterEmail}
                  deletingNewsletterEmail={newsletterSection.deletingNewsletterEmail}
                  onNewsletterStatusUpdate={newsletterSection.handleNewsletterStatusUpdate}
                  onOpenNewsletterDelete={newsletterSection.handleOpenNewsletterDelete}
                  newsletterPage={newsletterSection.newsletterPage}
                  totalNewsletterPages={newsletterSection.totalNewsletterPages}
                  newsletterPageSize={newsletterSection.newsletterPageSize}
                  onNewsletterPageChange={newsletterSection.handleNewsletterPageChange}
                  onNewsletterPageSizeChange={newsletterSection.handleNewsletterPageSizeChange}
                  pendingNewsletterDelete={newsletterSection.pendingNewsletterDelete}
                  onCloseNewsletterDelete={newsletterSection.handleCloseNewsletterDelete}
                  onDeleteNewsletterSubscriber={newsletterSection.handleDeleteNewsletterSubscriber}
                  selectedNewsletterCampaign={newsletterSection.selectedNewsletterCampaign}
                  onCloseNewsletterFailures={newsletterSection.handleCloseNewsletterFailures}
                  isNewsletterFailuresLoading={newsletterSection.isNewsletterFailuresLoading}
                  newsletterCampaignFailures={newsletterSection.newsletterCampaignFailures}
                  newsletterFailuresTotal={newsletterSection.newsletterFailuresTotal}
                  pendingNewsletterTestCampaign={newsletterSection.pendingNewsletterTestCampaign}
                  onCloseNewsletterTest={newsletterSection.handleCloseNewsletterTest}
                  isNewsletterTestSending={newsletterSection.isNewsletterTestSending}
                  newsletterTestEmail={newsletterSection.newsletterTestEmail}
                  onNewsletterTestEmailChange={newsletterSection.setNewsletterTestEmail}
                  onSendNewsletterTestEmail={newsletterSection.handleSendNewsletterTestEmail}
                />
              ) : null}

              {isCommentsSection ? (
                <AdminAccountCommentsSection
                  t={t}
                  locale={locale}
                  formatSessionDate={formatSessionDate}
                  commentsErrorMessage={commentsSection.commentsErrorMessage}
                  commentsSuccessMessage={commentsSection.commentsSuccessMessage}
                  commentsListTopRef={commentsSection.commentsListTopRef}
                  commentFilterStatus={commentsSection.commentFilterStatus}
                  onCommentFilterStatusChange={commentsSection.onCommentFilterStatusChange}
                  commentFilterQuery={commentsSection.commentFilterQuery}
                  onCommentFilterQueryChange={commentsSection.onCommentFilterQueryChange}
                  onClearCommentFilterQuery={commentsSection.onClearCommentFilterQuery}
                  comments={commentsSection.comments}
                  isCommentsLoading={commentsSection.isCommentsLoading}
                  totalComments={commentsSection.totalComments}
                  renderAsyncSectionContent={renderAsyncSectionContent}
                  allVisibleCommentsSelected={commentsSection.allVisibleCommentsSelected}
                  hasSelectedComments={commentsSection.hasSelectedComments}
                  selectedCommentCount={commentsSection.selectedCommentCount}
                  isBulkCommentActionPending={commentsSection.isBulkCommentActionPending}
                  bulkCommentActionStatus={commentsSection.bulkCommentActionStatus}
                  isBulkCommentDeleting={commentsSection.isBulkCommentDeleting}
                  onToggleVisibleCommentsSelection={commentsSection.onToggleVisibleCommentsSelection}
                  onClearSelectedComments={commentsSection.onClearSelectedComments}
                  onBulkCommentStatusUpdate={commentsSection.onBulkCommentStatusUpdate}
                  onOpenBulkCommentDelete={commentsSection.onOpenBulkCommentDelete}
                  selectedCommentIDs={commentsSection.selectedCommentIDs}
                  onToggleCommentSelection={commentsSection.onToggleCommentSelection}
                  resolveCommentStatusVariant={commentsSection.resolveCommentStatusVariant}
                  commentActionID={commentsSection.commentActionID}
                  commentActionStatus={commentsSection.commentActionStatus}
                  deletingCommentID={commentsSection.deletingCommentID}
                  onCommentStatusUpdate={commentsSection.onCommentStatusUpdate}
                  onOpenCommentDelete={commentsSection.onOpenCommentDelete}
                  commentsPage={commentsSection.commentsPage}
                  totalCommentPages={commentsSection.totalCommentPages}
                  commentsPageSize={commentsSection.commentsPageSize}
                  onCommentsPageChange={commentsSection.onCommentsPageChange}
                  onCommentsPageSizeChange={commentsSection.onCommentsPageSizeChange}
                  pendingBulkCommentDeleteCount={commentsSection.pendingBulkCommentDeleteCount}
                  onCloseBulkCommentDelete={commentsSection.onCloseBulkCommentDelete}
                  onConfirmBulkCommentDelete={commentsSection.onConfirmBulkCommentDelete}
                  pendingCommentDelete={commentsSection.pendingCommentDelete}
                  onCloseCommentDelete={commentsSection.onCloseCommentDelete}
                  onConfirmCommentDelete={commentsSection.onConfirmCommentDelete}
                />
              ) : null}

              {isErrorsSection ? (
                <AdminAccountErrorsSection
                  t={t}
                  formatSessionDate={formatSessionDate}
                  errorMessagesErrorMessage={errorsSection.errorMessagesErrorMessage}
                  errorMessagesSuccessMessage={errorsSection.errorMessagesSuccessMessage}
                  isErrorMessagesLoading={errorsSection.isErrorMessagesLoading}
                  isErrorCreateSubmitting={errorsSection.isErrorCreateSubmitting}
                  isErrorUpdateSubmitting={errorsSection.isErrorUpdateSubmitting}
                  isErrorDeleteSubmitting={errorsSection.isErrorDeleteSubmitting}
                  onOpenCreateErrorMessage={errorsSection.onOpenCreateErrorMessage}
                  errorMessagesListTopRef={errorsSection.errorMessagesListTopRef}
                  errorFilterLocale={errorsSection.errorFilterLocale}
                  onErrorFilterLocaleChange={errorsSection.onErrorFilterLocaleChange}
                  errorFilterQuery={errorsSection.errorFilterQuery}
                  onErrorFilterQueryChange={errorsSection.onErrorFilterQueryChange}
                  onClearErrorFilterQuery={errorsSection.onClearErrorFilterQuery}
                  totalErrorMessages={errorsSection.totalErrorMessages}
                  errorMessages={errorsSection.errorMessages}
                  deletingErrorMessageKey={errorsSection.deletingErrorMessageKey}
                  getErrorMessageKey={errorsSection.getErrorMessageKey}
                  onSelectErrorMessage={errorsSection.onSelectErrorMessage}
                  onOpenUpdateErrorMessage={errorsSection.onOpenUpdateErrorMessage}
                  onOpenDeleteErrorMessage={errorsSection.onOpenDeleteErrorMessage}
                  errorMessagesPage={errorsSection.errorMessagesPage}
                  totalErrorMessagePages={errorsSection.totalErrorMessagePages}
                  errorMessagesPageSize={errorsSection.errorMessagesPageSize}
                  onErrorMessagesPageChange={errorsSection.onErrorMessagesPageChange}
                  onErrorMessagesPageSizeChange={errorsSection.onErrorMessagesPageSizeChange}
                  isErrorEditorModalOpen={errorsSection.isErrorEditorModalOpen}
                  onCloseErrorEditor={errorsSection.onCloseErrorEditor}
                  errorCrudTab={errorsSection.errorCrudTab}
                  selectedErrorMessage={errorsSection.selectedErrorMessage}
                  errorCreateLocale={errorsSection.errorCreateLocale}
                  onErrorCreateLocaleChange={errorsSection.onErrorCreateLocaleChange}
                  errorCreateCode={errorsSection.errorCreateCode}
                  onErrorCreateCodeChange={errorsSection.onErrorCreateCodeChange}
                  normalizedErrorCreateCode={errorsSection.normalizedErrorCreateCode}
                  isErrorCreateCodeValid={errorsSection.isErrorCreateCodeValid}
                  errorCreateMessage={errorsSection.errorCreateMessage}
                  onErrorCreateMessageChange={errorsSection.onErrorCreateMessageChange}
                  errorUpdateMessage={errorsSection.errorUpdateMessage}
                  onErrorUpdateMessageChange={errorsSection.onErrorUpdateMessageChange}
                  canCreateErrorMessage={errorsSection.canCreateErrorMessage}
                  canUpdateErrorMessage={errorsSection.canUpdateErrorMessage}
                  onCreateErrorMessageSubmit={errorsSection.onCreateErrorMessageSubmit}
                  onUpdateErrorMessageSubmit={errorsSection.onUpdateErrorMessageSubmit}
                  pendingErrorMessageDelete={errorsSection.pendingErrorMessageDelete}
                  onCloseDeleteErrorMessage={errorsSection.onCloseDeleteErrorMessage}
                  onDeleteErrorMessageSubmit={errorsSection.onDeleteErrorMessageSubmit}
                />
              ) : null}

              {isContentSection ? (
                <AdminContentManagementPanel
                  formatDate={formatSessionDate}
                  onSessionExpired={() => {
                    redirectToAdminLoginRef.current();
                  }}
                />
              ) : null}

              {isSecuritySection ? (
                <AdminAccountSecuritySection
                  adminUser={adminUser}
                  t={t}
                  formatSessionDate={formatSessionDate}
                  securityErrorMessage={securitySection.securityErrorMessage}
                  securitySuccessMessage={securitySection.securitySuccessMessage}
                  googleConnectMessage={googleConnectMessage}
                  googleConnectMessageVariant={googleConnectMessageVariant}
                  githubConnectMessage={githubConnectMessage}
                  githubConnectMessageVariant={githubConnectMessageVariant}
                  googleActionErrorMessage={securitySection.googleActionErrorMessage}
                  githubActionErrorMessage={securitySection.githubActionErrorMessage}
                  isSecurityPasswordExpanded={securitySection.isSecurityPasswordExpanded}
                  onToggleSecurityPassword={securitySection.toggleSecurityPasswordExpanded}
                  onManageEmail={() => router.push(`/${locale}${ADMIN_ROUTES.settings.email}`)}
                  handleSecuritySubmit={securitySection.handleSecuritySubmit}
                  currentPassword={securitySection.currentPassword}
                  newPassword={securitySection.newPassword}
                  confirmPassword={securitySection.confirmPassword}
                  handleCurrentPasswordChange={securitySection.handleCurrentPasswordChange}
                  handleNewPasswordChange={securitySection.handleNewPasswordChange}
                  handleConfirmPasswordChange={securitySection.handleConfirmPasswordChange}
                  showCurrentPassword={securitySection.showCurrentPassword}
                  showNewPassword={securitySection.showNewPassword}
                  showConfirmPassword={securitySection.showConfirmPassword}
                  onToggleCurrentPassword={securitySection.toggleCurrentPassword}
                  onToggleNewPassword={securitySection.toggleNewPassword}
                  onToggleConfirmPassword={securitySection.toggleConfirmPassword}
                  showCurrentPasswordError={securitySection.showCurrentPasswordError}
                  showNewPasswordError={securitySection.showNewPasswordError}
                  showConfirmPasswordError={securitySection.showConfirmPasswordError}
                  securityCurrentPasswordError={securitySection.securityCurrentPasswordError}
                  securityNewPasswordError={securitySection.securityNewPasswordError}
                  securityConfirmPasswordError={securitySection.securityConfirmPasswordError}
                  passwordStrength={securitySection.passwordStrength}
                  isSecuritySubmitting={securitySection.isSecuritySubmitting}
                  googleAuthStatus={googleAuthStatus}
                  githubAuthStatus={githubAuthStatus}
                  isGoogleAuthStatusLoading={isGoogleAuthStatusLoading}
                  isGithubAuthStatusLoading={isGithubAuthStatusLoading}
                  isGoogleConnectSubmitting={securitySection.isGoogleConnectSubmitting}
                  isGoogleDisconnectSubmitting={securitySection.isGoogleDisconnectSubmitting}
                  isGithubConnectSubmitting={securitySection.isGithubConnectSubmitting}
                  isGithubDisconnectSubmitting={securitySection.isGithubDisconnectSubmitting}
                  onGoogleConnect={securitySection.handleGoogleConnect}
                  onOpenGoogleDisconnectModal={securitySection.openGoogleDisconnectModal}
                  onCloseGoogleDisconnectModal={securitySection.closeGoogleDisconnectModal}
                  onGoogleDisconnect={securitySection.handleGoogleDisconnect}
                  onGithubConnect={securitySection.handleGithubConnect}
                  onOpenGithubDisconnectModal={securitySection.openGithubDisconnectModal}
                  onCloseGithubDisconnectModal={securitySection.closeGithubDisconnectModal}
                  onGithubDisconnect={securitySection.handleGithubDisconnect}
                  isGoogleDisconnectModalOpen={securitySection.isGoogleDisconnectModalOpen}
                  isGithubDisconnectModalOpen={securitySection.isGithubDisconnectModalOpen}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <AdminAccountAvatarCropModal
        t={t}
        isOpen={avatarSection.isAvatarCropModalOpen}
        onClose={avatarSection.closeAvatarCropModal}
        isDragging={avatarSection.isAvatarCropDragging}
        isResizing={avatarSection.isAvatarCropResizing}
        stageRef={avatarSection.avatarCropStageRef}
        stageStyle={avatarSection.avatarCropStageStyle}
        cropSource={avatarSection.avatarCropSource}
        imageSize={avatarSection.avatarCropImageSize}
        imageStyle={avatarSection.avatarCropImageStyle}
        cropBoxStyle={avatarSection.avatarCropBoxStyle}
        onPointerDown={avatarSection.handleAvatarCropPointerDown}
        onPointerMove={avatarSection.handleAvatarCropPointerMove}
        onPointerEnd={avatarSection.endAvatarCropDrag}
        onResizeStart={avatarSection.handleAvatarCropResizeStart}
        isSaving={avatarSection.isAvatarCropSaving}
        isSubmitting={avatarSection.isAvatarSubmitting}
        avatarPendingAction={avatarSection.avatarPendingAction}
        onSave={avatarSection.handleAvatarCropSave}
      />
    </section>
  );
}
