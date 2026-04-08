'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import {
  disconnectAdminGithub,
  disconnectAdminGoogle,
  fetchAdminGithubAuthStatus,
  fetchAdminGoogleAuthStatus,
  isAdminSessionError,
  resolveAdminError,
  startAdminGithubConnect,
  startAdminGoogleConnect,
} from '@/lib/adminApi';
import { withBasePath } from '@/lib/basePath';
import type { ConnectedAccountStatus, ConnectedMessageVariant } from './adminAccountSecurityShared';

type UseAdminAccountConnectedAccountsParams = {
  locale: string;
  googleConnectMessage: string;
  setGoogleAuthStatus: React.Dispatch<React.SetStateAction<ConnectedAccountStatus>>;
  setGoogleConnectMessage: React.Dispatch<React.SetStateAction<string>>;
  setGoogleConnectMessageVariant: React.Dispatch<React.SetStateAction<ConnectedMessageVariant>>;
  githubConnectMessage: string;
  setGithubAuthStatus: React.Dispatch<React.SetStateAction<ConnectedAccountStatus>>;
  setGithubConnectMessage: React.Dispatch<React.SetStateAction<string>>;
  setGithubConnectMessageVariant: React.Dispatch<React.SetStateAction<ConnectedMessageVariant>>;
  clearSecuritySuccessMessage: () => void;
  onSessionExpired: () => void;
  t: TFunction;
};

export default function useAdminAccountConnectedAccounts({
  locale,
  googleConnectMessage,
  setGoogleAuthStatus,
  setGoogleConnectMessage,
  setGoogleConnectMessageVariant,
  githubConnectMessage,
  setGithubAuthStatus,
  setGithubConnectMessage,
  setGithubConnectMessageVariant,
  clearSecuritySuccessMessage,
  onSessionExpired,
  t,
}: UseAdminAccountConnectedAccountsParams) {
  const [googleActionErrorMessage, setGoogleActionErrorMessage] = React.useState('');
  const [githubActionErrorMessage, setGithubActionErrorMessage] = React.useState('');
  const [isGoogleConnectSubmitting, setIsGoogleConnectSubmitting] = React.useState(false);
  const [isGoogleDisconnectSubmitting, setIsGoogleDisconnectSubmitting] = React.useState(false);
  const [isGithubConnectSubmitting, setIsGithubConnectSubmitting] = React.useState(false);
  const [isGithubDisconnectSubmitting, setIsGithubDisconnectSubmitting] = React.useState(false);
  const [isGoogleDisconnectModalOpen, setIsGoogleDisconnectModalOpen] = React.useState(false);
  const [isGithubDisconnectModalOpen, setIsGithubDisconnectModalOpen] = React.useState(false);

  const clearGoogleConnectMessage = React.useCallback(() => {
    if (googleConnectMessage) {
      setGoogleConnectMessage('');
      setGoogleConnectMessageVariant('info');
    }
  }, [googleConnectMessage, setGoogleConnectMessage, setGoogleConnectMessageVariant]);

  const clearGithubConnectMessage = React.useCallback(() => {
    if (githubConnectMessage) {
      setGithubConnectMessage('');
      setGithubConnectMessageVariant('info');
    }
  }, [githubConnectMessage, setGithubConnectMessage, setGithubConnectMessageVariant]);

  const openGoogleDisconnectModal = React.useCallback(() => {
    setGoogleActionErrorMessage('');
    setIsGoogleDisconnectModalOpen(true);
  }, []);

  const closeGoogleDisconnectModal = React.useCallback(() => {
    if (isGoogleDisconnectSubmitting) {
      return;
    }

    setIsGoogleDisconnectModalOpen(false);
    setGoogleActionErrorMessage('');
  }, [isGoogleDisconnectSubmitting]);

  const openGithubDisconnectModal = React.useCallback(() => {
    setGithubActionErrorMessage('');
    setIsGithubDisconnectModalOpen(true);
  }, []);

  const closeGithubDisconnectModal = React.useCallback(() => {
    if (isGithubDisconnectSubmitting) {
      return;
    }

    setIsGithubDisconnectModalOpen(false);
    setGithubActionErrorMessage('');
  }, [isGithubDisconnectSubmitting]);

  const handleGoogleConnect = React.useCallback(async () => {
    if (isGoogleConnectSubmitting || isGoogleDisconnectSubmitting) {
      return;
    }

    setGoogleActionErrorMessage('');
    clearGoogleConnectMessage();
    clearSecuritySuccessMessage();
    setIsGoogleConnectSubmitting(true);

    try {
      const payload = await startAdminGoogleConnect({
        locale,
      });
      globalThis.location.assign(withBasePath(payload.url));
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }

      const resolvedError = resolveAdminError(error);
      setGoogleActionErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message ||
              t('adminAccount.connectedAccounts.google.messages.failed', { ns: 'admin-account' }),
      );
    } finally {
      setIsGoogleConnectSubmitting(false);
    }
  }, [
    clearGoogleConnectMessage,
    clearSecuritySuccessMessage,
    isGoogleConnectSubmitting,
    isGoogleDisconnectSubmitting,
    locale,
    onSessionExpired,
    t,
  ]);

  const handleGoogleDisconnect = React.useCallback(async () => {
    if (isGoogleConnectSubmitting || isGoogleDisconnectSubmitting) {
      return;
    }

    setGoogleActionErrorMessage('');
    clearGoogleConnectMessage();
    clearSecuritySuccessMessage();
    setIsGoogleDisconnectSubmitting(true);

    try {
      const payload = await disconnectAdminGoogle();
      if (!payload.success) {
        throw new Error(t('adminAccount.connectedAccounts.google.messages.failed', { ns: 'admin-account' }));
      }

      setIsGoogleDisconnectModalOpen(false);
      setGoogleConnectMessage(
        t('adminAccount.connectedAccounts.google.messages.disconnected', { ns: 'admin-account' }),
      );
      setGoogleConnectMessageVariant('success');

      try {
        const nextStatus = await fetchAdminGoogleAuthStatus();
        setGoogleAuthStatus(nextStatus);
      } catch {
        setGoogleAuthStatus({
          enabled: false,
          loginAvailable: false,
        });
      }
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }

      const resolvedError = resolveAdminError(error);
      setGoogleActionErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message ||
              t('adminAccount.connectedAccounts.google.messages.failed', { ns: 'admin-account' }),
      );
    } finally {
      setIsGoogleDisconnectSubmitting(false);
    }
  }, [
    clearGoogleConnectMessage,
    clearSecuritySuccessMessage,
    isGoogleConnectSubmitting,
    isGoogleDisconnectSubmitting,
    onSessionExpired,
    setGoogleAuthStatus,
    setGoogleConnectMessage,
    setGoogleConnectMessageVariant,
    t,
  ]);

  const handleGithubConnect = React.useCallback(async () => {
    if (isGithubConnectSubmitting || isGithubDisconnectSubmitting) {
      return;
    }

    setGithubActionErrorMessage('');
    clearGithubConnectMessage();
    clearSecuritySuccessMessage();
    setIsGithubConnectSubmitting(true);

    try {
      const payload = await startAdminGithubConnect({
        locale,
      });
      globalThis.location.assign(withBasePath(payload.url));
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }

      const resolvedError = resolveAdminError(error);
      setGithubActionErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message ||
              t('adminAccount.connectedAccounts.github.messages.failed', { ns: 'admin-account' }),
      );
    } finally {
      setIsGithubConnectSubmitting(false);
    }
  }, [
    clearGithubConnectMessage,
    clearSecuritySuccessMessage,
    isGithubConnectSubmitting,
    isGithubDisconnectSubmitting,
    locale,
    onSessionExpired,
    t,
  ]);

  const handleGithubDisconnect = React.useCallback(async () => {
    if (isGithubConnectSubmitting || isGithubDisconnectSubmitting) {
      return;
    }

    setGithubActionErrorMessage('');
    clearGithubConnectMessage();
    clearSecuritySuccessMessage();
    setIsGithubDisconnectSubmitting(true);

    try {
      const payload = await disconnectAdminGithub();
      if (!payload.success) {
        throw new Error(t('adminAccount.connectedAccounts.github.messages.failed', { ns: 'admin-account' }));
      }

      setIsGithubDisconnectModalOpen(false);
      setGithubConnectMessage(
        t('adminAccount.connectedAccounts.github.messages.disconnected', { ns: 'admin-account' }),
      );
      setGithubConnectMessageVariant('success');

      try {
        const nextStatus = await fetchAdminGithubAuthStatus();
        setGithubAuthStatus(nextStatus);
      } catch {
        setGithubAuthStatus({
          enabled: false,
          loginAvailable: false,
        });
      }
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }

      const resolvedError = resolveAdminError(error);
      setGithubActionErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message ||
              t('adminAccount.connectedAccounts.github.messages.failed', { ns: 'admin-account' }),
      );
    } finally {
      setIsGithubDisconnectSubmitting(false);
    }
  }, [
    clearGithubConnectMessage,
    clearSecuritySuccessMessage,
    isGithubConnectSubmitting,
    isGithubDisconnectSubmitting,
    onSessionExpired,
    setGithubAuthStatus,
    setGithubConnectMessage,
    setGithubConnectMessageVariant,
    t,
  ]);

  return {
    googleActionErrorMessage,
    githubActionErrorMessage,
    isGoogleConnectSubmitting,
    isGoogleDisconnectSubmitting,
    isGithubConnectSubmitting,
    isGithubDisconnectSubmitting,
    handleGoogleConnect,
    openGoogleDisconnectModal,
    closeGoogleDisconnectModal,
    handleGoogleDisconnect,
    handleGithubConnect,
    openGithubDisconnectModal,
    closeGithubDisconnectModal,
    handleGithubDisconnect,
    isGoogleDisconnectModalOpen,
    isGithubDisconnectModalOpen,
  };
}
