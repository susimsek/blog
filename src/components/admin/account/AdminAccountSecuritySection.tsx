'use client';

import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { MIN_PASSWORD_LENGTH } from '@/lib/adminPassword';
import type { AdminPasswordStrength } from '@/lib/adminPassword';
import type { AdminSessionProfile } from '@/lib/adminSessionProfileCache';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;
type ConnectedAccountStatus = {
  enabled: boolean;
  loginAvailable: boolean;
};
type MessageVariant = 'success' | 'danger' | 'info';
type ConnectedAccountActionProps = {
  isLoading: boolean;
  isLinked: boolean;
  isEnabled: boolean;
  isConnectSubmitting: boolean;
  isDisconnectSubmitting: boolean;
  loadingLabel: string;
  connectContent: React.ReactNode;
  disconnectLabel: string;
  onConnect: () => void | Promise<void>;
  onDisconnect: () => void;
};

type AdminAccountSecuritySectionProps = {
  adminUser: AdminSessionProfile;
  t: AdminAccountTranslate;
  formatSessionDate: (value: string) => string;
  securityErrorMessage: string;
  securitySuccessMessage: string;
  googleConnectMessage: string;
  googleConnectMessageVariant: MessageVariant;
  githubConnectMessage: string;
  githubConnectMessageVariant: MessageVariant;
  googleActionErrorMessage: string;
  githubActionErrorMessage: string;
  isSecurityPasswordExpanded: boolean;
  onToggleSecurityPassword: () => void;
  onManageEmail: () => void;
  handleSecuritySubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  handleCurrentPasswordChange: React.ChangeEventHandler<HTMLInputElement>;
  handleNewPasswordChange: React.ChangeEventHandler<HTMLInputElement>;
  handleConfirmPasswordChange: React.ChangeEventHandler<HTMLInputElement>;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  onToggleCurrentPassword: () => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  showCurrentPasswordError: boolean;
  showNewPasswordError: boolean;
  showConfirmPasswordError: boolean;
  securityCurrentPasswordError: string;
  securityNewPasswordError: string;
  securityConfirmPasswordError: string;
  passwordStrength: AdminPasswordStrength;
  isSecuritySubmitting: boolean;
  googleAuthStatus: ConnectedAccountStatus;
  githubAuthStatus: ConnectedAccountStatus;
  isGoogleAuthStatusLoading: boolean;
  isGithubAuthStatusLoading: boolean;
  isGoogleConnectSubmitting: boolean;
  isGoogleDisconnectSubmitting: boolean;
  isGithubConnectSubmitting: boolean;
  isGithubDisconnectSubmitting: boolean;
  onGoogleConnect: () => void | Promise<void>;
  onOpenGoogleDisconnectModal: () => void;
  onCloseGoogleDisconnectModal: () => void;
  onGoogleDisconnect: () => void | Promise<void>;
  onGithubConnect: () => void | Promise<void>;
  onOpenGithubDisconnectModal: () => void;
  onCloseGithubDisconnectModal: () => void;
  onGithubDisconnect: () => void | Promise<void>;
  isGoogleDisconnectModalOpen: boolean;
  isGithubDisconnectModalOpen: boolean;
};

const renderConnectedAccountAction = ({
  isLoading,
  isLinked,
  isEnabled,
  isConnectSubmitting,
  isDisconnectSubmitting,
  loadingLabel,
  connectContent,
  disconnectLabel,
  onConnect,
  onDisconnect,
}: ConnectedAccountActionProps) => {
  if (isLoading) {
    return (
      <div className="small theme-text-muted d-inline-flex align-items-center">
        <Spinner
          as="span"
          animation="border"
          size="sm"
          className="me-2 flex-shrink-0 admin-action-spinner"
          aria-hidden="true"
        />
        {loadingLabel}
      </div>
    );
  }
  if (isLinked) {
    return (
      <Button
        variant="danger"
        className="admin-newsletter-action admin-newsletter-action--danger"
        onClick={onDisconnect}
        disabled={isConnectSubmitting || isDisconnectSubmitting}
      >
        {disconnectLabel}
      </Button>
    );
  }
  if (!isEnabled) {
    return null;
  }

  return (
    <Button
      variant="primary"
      className="admin-newsletter-action admin-newsletter-action--primary"
      onClick={onConnect}
      disabled={isConnectSubmitting || isDisconnectSubmitting}
    >
      {connectContent}
    </Button>
  );
};

type SecurityMessagesProps = Pick<
  AdminAccountSecuritySectionProps,
  | 'securityErrorMessage'
  | 'securitySuccessMessage'
  | 'googleConnectMessage'
  | 'googleConnectMessageVariant'
  | 'githubConnectMessage'
  | 'githubConnectMessageVariant'
  | 'googleActionErrorMessage'
  | 'githubActionErrorMessage'
>;

function SecurityMessages({
  securityErrorMessage,
  securitySuccessMessage,
  googleConnectMessage,
  googleConnectMessageVariant,
  githubConnectMessage,
  githubConnectMessageVariant,
  googleActionErrorMessage,
  githubActionErrorMessage,
}: Readonly<SecurityMessagesProps>) {
  const messages: Array<{ message: string; variant: MessageVariant }> = [
    { message: securityErrorMessage, variant: 'danger' },
    { message: securitySuccessMessage, variant: 'success' },
    { message: googleConnectMessage, variant: googleConnectMessageVariant },
    { message: githubConnectMessage, variant: githubConnectMessageVariant },
    { message: googleActionErrorMessage, variant: 'danger' },
    { message: githubActionErrorMessage, variant: 'danger' },
  ];

  return (
    <>
      {messages
        .filter(({ message }) => message.length > 0)
        .map(({ message, variant }, index) => (
          <Alert key={`${variant}-${index}`} variant={variant} className="mb-4 px-4 py-3 lh-base">
            {message}
          </Alert>
        ))}
    </>
  );
}

type PasswordChangeFormProps = Pick<
  AdminAccountSecuritySectionProps,
  | 't'
  | 'handleSecuritySubmit'
  | 'currentPassword'
  | 'newPassword'
  | 'confirmPassword'
  | 'handleCurrentPasswordChange'
  | 'handleNewPasswordChange'
  | 'handleConfirmPasswordChange'
  | 'showCurrentPassword'
  | 'showNewPassword'
  | 'showConfirmPassword'
  | 'onToggleCurrentPassword'
  | 'onToggleNewPassword'
  | 'onToggleConfirmPassword'
  | 'showCurrentPasswordError'
  | 'showNewPasswordError'
  | 'showConfirmPasswordError'
  | 'securityCurrentPasswordError'
  | 'securityNewPasswordError'
  | 'securityConfirmPasswordError'
  | 'passwordStrength'
  | 'isSecuritySubmitting'
>;

function PasswordChangeForm({
  t,
  handleSecuritySubmit,
  currentPassword,
  newPassword,
  confirmPassword,
  handleCurrentPasswordChange,
  handleNewPasswordChange,
  handleConfirmPasswordChange,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onToggleConfirmPassword,
  showCurrentPasswordError,
  showNewPasswordError,
  showConfirmPasswordError,
  securityCurrentPasswordError,
  securityNewPasswordError,
  securityConfirmPasswordError,
  passwordStrength,
  isSecuritySubmitting,
}: Readonly<PasswordChangeFormProps>) {
  return (
    <Form noValidate onSubmit={handleSecuritySubmit} className="mt-4 pt-4 border-top">
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
            onClick={onToggleCurrentPassword}
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
          {securityCurrentPasswordError}
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
            onClick={onToggleNewPassword}
            aria-label={
              showNewPassword
                ? t('adminAccount.form.hidePassword', { ns: 'admin-account' })
                : t('adminAccount.form.showPassword', { ns: 'admin-account' })
            }
          >
            <FontAwesomeIcon icon={showNewPassword ? 'eye-slash' : 'eye'} />
          </Button>
        </InputGroup>
        <div className={`admin-password-strength admin-password-strength-${passwordStrength.tone}`} aria-live="polite">
          <div className="admin-password-strength-head">
            <span>{t('adminAccount.strength.title', { ns: 'admin-account' })}</span>
          </div>
          <div className="admin-password-strength-track" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => (
              <span
                key={`strength:${index + 1}`}
                className={`admin-password-strength-segment${index < passwordStrength.score ? ' is-active' : ''}`}
              />
            ))}
          </div>
        </div>
        <Form.Control.Feedback type="invalid" className={showNewPasswordError ? 'd-block' : ''}>
          {securityNewPasswordError}
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
            onClick={onToggleConfirmPassword}
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
          {securityConfirmPasswordError}
        </Form.Control.Feedback>
      </Form.Group>

      <div className="d-flex flex-wrap gap-2">
        <Button
          type="submit"
          className="admin-newsletter-action admin-newsletter-action--primary"
          disabled={isSecuritySubmitting}
        >
          {isSecuritySubmitting ? (
            <span className="d-inline-flex align-items-center gap-2">
              <Spinner
                as="span"
                animation="border"
                size="sm"
                className="me-2 flex-shrink-0 admin-action-spinner"
                aria-hidden="true"
              />
              <span>{t('adminAccount.form.submitting', { ns: 'admin-account' })}</span>
            </span>
          ) : (
            t('adminAccount.form.submit', { ns: 'admin-account' })
          )}
        </Button>
      </div>
    </Form>
  );
}

type ConnectedAccountRowProps = {
  t: AdminAccountTranslate;
  formatSessionDate: (value: string) => string;
  provider: 'google' | 'github';
  icon: IconProp;
  isLinked: boolean;
  email: string;
  linkedAt: string | null | undefined;
  authStatus: ConnectedAccountStatus;
  isStatusLoading: boolean;
  isConnectSubmitting: boolean;
  isDisconnectSubmitting: boolean;
  onConnect: () => void | Promise<void>;
  onOpenDisconnect: () => void;
};

function ConnectedAccountRow({
  t,
  formatSessionDate,
  provider,
  icon,
  isLinked,
  email,
  linkedAt,
  authStatus,
  isStatusLoading,
  isConnectSubmitting,
  isDisconnectSubmitting,
  onConnect,
  onOpenDisconnect,
}: Readonly<ConnectedAccountRowProps>) {
  const label = `adminAccount.connectedAccounts.${provider}`;

  return (
    <ListGroup.Item className="px-4 py-4">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        <div className="d-flex align-items-start gap-3">
          <span className="fs-4 theme-text-body-secondary">
            <FontAwesomeIcon icon={icon} />
          </span>
          <div>
            <div className="fw-semibold mb-1">
              {t(`${label}.title`, { ns: 'admin-account' })}
              {isLinked ? (
                <Badge bg="success" className="ms-2">
                  {t(`${label}.connectedBadge`, { ns: 'admin-account' })}
                </Badge>
              ) : null}
            </div>
            <div className="theme-text-muted">
              {isLinked
                ? t(`${label}.connectedCopy`, { ns: 'admin-account', email })
                : t(`${label}.disconnectedCopy`, { ns: 'admin-account' })}
            </div>
            {linkedAt ? (
              <div className="small theme-text-body-secondary mt-1 d-inline-flex align-items-center gap-2">
                <FontAwesomeIcon icon="calendar-alt" />
                {t(`${label}.linkedAt`, { ns: 'admin-account', value: formatSessionDate(linkedAt) })}
              </div>
            ) : null}
            {isLinked && authStatus.loginAvailable ? (
              <div className="small theme-text-muted mt-1">{t(`${label}.loginEnabled`, { ns: 'admin-account' })}</div>
            ) : null}
            {!isStatusLoading && !authStatus.enabled ? (
              <div className="small theme-text-muted mt-1">
                {t(`${label}.unavailableBadge`, { ns: 'admin-account' })}
              </div>
            ) : null}
          </div>
        </div>
        <div className="d-flex justify-content-lg-end">
          {renderConnectedAccountAction({
            isLoading: isStatusLoading,
            isLinked,
            isEnabled: authStatus.enabled,
            isConnectSubmitting,
            isDisconnectSubmitting,
            loadingLabel: t('adminCommon.status.loading', { ns: 'admin-common' }),
            connectContent: (
              <>
                <FontAwesomeIcon icon={icon} className="me-2" />
                {t(`${label}.connect`, { ns: 'admin-account' })}
              </>
            ),
            disconnectLabel: t(`${label}.disconnect`, { ns: 'admin-account' }),
            onConnect,
            onDisconnect: onOpenDisconnect,
          })}
        </div>
      </div>
    </ListGroup.Item>
  );
}

type DisconnectAccountModalProps = {
  t: AdminAccountTranslate;
  provider: 'google' | 'github';
  email: string;
  isOpen: boolean;
  isConnectSubmitting: boolean;
  isDisconnectSubmitting: boolean;
  actionErrorMessage: string;
  onClose: () => void;
  onDisconnect: () => void | Promise<void>;
};

function DisconnectAccountModal({
  t,
  provider,
  email,
  isOpen,
  isConnectSubmitting,
  isDisconnectSubmitting,
  actionErrorMessage,
  onClose,
  onDisconnect,
}: Readonly<DisconnectAccountModalProps>) {
  const label = `adminAccount.connectedAccounts.${provider}`;

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton={!isDisconnectSubmitting}>
        <Modal.Title>{t(`${label}.disconnectConfirmTitle`, { ns: 'admin-account' })}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">{t(`${label}.disconnectConfirmCopy`, { ns: 'admin-account', email })}</p>
        {actionErrorMessage ? (
          <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
            {actionErrorMessage}
          </Alert>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          className="admin-newsletter-action admin-newsletter-action--secondary"
          onClick={onClose}
          disabled={isDisconnectSubmitting}
        >
          {t('adminCommon.actions.cancel', { ns: 'admin-common' })}
        </Button>
        <Button
          variant="danger"
          className="admin-newsletter-action admin-newsletter-action--danger"
          onClick={onDisconnect}
          disabled={isConnectSubmitting || isDisconnectSubmitting}
        >
          {isDisconnectSubmitting ? (
            <span className="d-inline-flex align-items-center">
              <Spinner
                as="span"
                animation="border"
                size="sm"
                className="me-2 flex-shrink-0 admin-action-spinner"
                aria-hidden="true"
              />
              {t(`${label}.disconnecting`, { ns: 'admin-account' })}
            </span>
          ) : (
            t(`${label}.disconnect`, { ns: 'admin-account' })
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default function AdminAccountSecuritySection({
  adminUser,
  t,
  formatSessionDate,
  securityErrorMessage,
  securitySuccessMessage,
  googleConnectMessage,
  googleConnectMessageVariant,
  githubConnectMessage,
  githubConnectMessageVariant,
  googleActionErrorMessage,
  githubActionErrorMessage,
  isSecurityPasswordExpanded,
  onToggleSecurityPassword,
  onManageEmail,
  handleSecuritySubmit,
  currentPassword,
  newPassword,
  confirmPassword,
  handleCurrentPasswordChange,
  handleNewPasswordChange,
  handleConfirmPasswordChange,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onToggleConfirmPassword,
  showCurrentPasswordError,
  showNewPasswordError,
  showConfirmPasswordError,
  securityCurrentPasswordError,
  securityNewPasswordError,
  securityConfirmPasswordError,
  passwordStrength,
  isSecuritySubmitting,
  googleAuthStatus,
  githubAuthStatus,
  isGoogleAuthStatusLoading,
  isGithubAuthStatusLoading,
  isGoogleConnectSubmitting,
  isGoogleDisconnectSubmitting,
  isGithubConnectSubmitting,
  isGithubDisconnectSubmitting,
  onGoogleConnect,
  onOpenGoogleDisconnectModal,
  onCloseGoogleDisconnectModal,
  onGoogleDisconnect,
  onGithubConnect,
  onOpenGithubDisconnectModal,
  onCloseGithubDisconnectModal,
  onGithubDisconnect,
  isGoogleDisconnectModalOpen,
  isGithubDisconnectModalOpen,
}: Readonly<AdminAccountSecuritySectionProps>) {
  return (
    <>
      <h3 className="admin-dashboard-panel-title mb-3">
        {t('adminAccount.connectedAccounts.title', { ns: 'admin-account' })}
      </h3>
      <hr className="admin-section-divider mb-3" />
      <p className="admin-dashboard-panel-copy">{t('adminAccount.connectedAccounts.copy', { ns: 'admin-account' })}</p>

      <SecurityMessages
        securityErrorMessage={securityErrorMessage}
        securitySuccessMessage={securitySuccessMessage}
        googleConnectMessage={googleConnectMessage}
        googleConnectMessageVariant={googleConnectMessageVariant}
        githubConnectMessage={githubConnectMessage}
        githubConnectMessageVariant={githubConnectMessageVariant}
        googleActionErrorMessage={googleActionErrorMessage}
        githubActionErrorMessage={githubActionErrorMessage}
      />

      <ListGroup className="rounded-4 overflow-hidden border theme-shadow-sm">
        <ListGroup.Item className="px-4 py-4">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            <div className="d-flex align-items-start gap-3">
              <span className="fs-4 theme-text-body-secondary">
                <FontAwesomeIcon icon="envelope" />
              </span>
              <div>
                <div className="fw-semibold mb-1">{t('adminAccount.account.email.title', { ns: 'admin-account' })}</div>
                <div className="theme-text-muted">{adminUser.pendingEmail ?? adminUser.email}</div>
                {adminUser.pendingEmail ? (
                  <div className="small theme-text-muted mt-1">
                    {t('adminAccount.account.email.pending.copy', {
                      ns: 'admin-account',
                      email: adminUser.pendingEmail,
                    })}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="d-flex justify-content-lg-end">
              <Button variant="primary" onClick={onManageEmail}>
                {t('adminAccount.connectedAccounts.actions.manage', { ns: 'admin-account' })}
              </Button>
            </div>
          </div>
        </ListGroup.Item>

        <ListGroup.Item className="px-4 py-4">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            <div className="d-flex align-items-start gap-3">
              <span className="fs-4 theme-text-body-secondary">
                <FontAwesomeIcon icon="lock" />
              </span>
              <div>
                <div className="fw-semibold mb-1">
                  {t('adminCommon.actions.changePassword', { ns: 'admin-common' })}
                </div>
                <div className="theme-text-muted">
                  {t('adminAccount.connectedAccounts.password.copy', { ns: 'admin-account' })}
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-lg-end">
              <Button variant="primary" onClick={onToggleSecurityPassword}>
                {isSecurityPasswordExpanded
                  ? t('adminAccount.connectedAccounts.actions.hide', { ns: 'admin-account' })
                  : t('adminAccount.connectedAccounts.password.action', { ns: 'admin-account' })}
              </Button>
            </div>
          </div>

          {isSecurityPasswordExpanded ? (
            <PasswordChangeForm
              t={t}
              handleSecuritySubmit={handleSecuritySubmit}
              currentPassword={currentPassword}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              handleCurrentPasswordChange={handleCurrentPasswordChange}
              handleNewPasswordChange={handleNewPasswordChange}
              handleConfirmPasswordChange={handleConfirmPasswordChange}
              showCurrentPassword={showCurrentPassword}
              showNewPassword={showNewPassword}
              showConfirmPassword={showConfirmPassword}
              onToggleCurrentPassword={onToggleCurrentPassword}
              onToggleNewPassword={onToggleNewPassword}
              onToggleConfirmPassword={onToggleConfirmPassword}
              showCurrentPasswordError={showCurrentPasswordError}
              showNewPasswordError={showNewPasswordError}
              showConfirmPasswordError={showConfirmPasswordError}
              securityCurrentPasswordError={securityCurrentPasswordError}
              securityNewPasswordError={securityNewPasswordError}
              securityConfirmPasswordError={securityConfirmPasswordError}
              passwordStrength={passwordStrength}
              isSecuritySubmitting={isSecuritySubmitting}
            />
          ) : null}
        </ListGroup.Item>

        <ConnectedAccountRow
          t={t}
          formatSessionDate={formatSessionDate}
          provider="google"
          icon={['fab', 'google']}
          isLinked={adminUser.googleLinked}
          email={adminUser.googleEmail ?? adminUser.email}
          linkedAt={adminUser.googleLinkedAt}
          authStatus={googleAuthStatus}
          isStatusLoading={isGoogleAuthStatusLoading}
          isConnectSubmitting={isGoogleConnectSubmitting}
          isDisconnectSubmitting={isGoogleDisconnectSubmitting}
          onConnect={onGoogleConnect}
          onOpenDisconnect={onOpenGoogleDisconnectModal}
        />
        <ConnectedAccountRow
          t={t}
          formatSessionDate={formatSessionDate}
          provider="github"
          icon={['fab', 'github']}
          isLinked={adminUser.githubLinked}
          email={adminUser.githubEmail ?? adminUser.email}
          linkedAt={adminUser.githubLinkedAt}
          authStatus={githubAuthStatus}
          isStatusLoading={isGithubAuthStatusLoading}
          isConnectSubmitting={isGithubConnectSubmitting}
          isDisconnectSubmitting={isGithubDisconnectSubmitting}
          onConnect={onGithubConnect}
          onOpenDisconnect={onOpenGithubDisconnectModal}
        />
      </ListGroup>

      <DisconnectAccountModal
        t={t}
        provider="google"
        email={adminUser.googleEmail ?? adminUser.email}
        isOpen={isGoogleDisconnectModalOpen}
        isConnectSubmitting={isGoogleConnectSubmitting}
        isDisconnectSubmitting={isGoogleDisconnectSubmitting}
        actionErrorMessage={googleActionErrorMessage}
        onClose={onCloseGoogleDisconnectModal}
        onDisconnect={onGoogleDisconnect}
      />
      <DisconnectAccountModal
        t={t}
        provider="github"
        email={adminUser.githubEmail ?? adminUser.email}
        isOpen={isGithubDisconnectModalOpen}
        isConnectSubmitting={isGithubConnectSubmitting}
        isDisconnectSubmitting={isGithubDisconnectSubmitting}
        actionErrorMessage={githubActionErrorMessage}
        onClose={onCloseGithubDisconnectModal}
        onDisconnect={onGithubDisconnect}
      />
    </>
  );
}
