'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import type { AdminSession } from './adminAccountShared';
import type { ConnectedAccountStatus, ConnectedMessageVariant } from './adminAccountSecurityShared';
import useAdminAccountConnectedAccounts from './useAdminAccountConnectedAccounts';
import useAdminAccountPasswordSecurity from './useAdminAccountPasswordSecurity';
import useAdminAccountSessionActions from './useAdminAccountSessionActions';

type UseAdminAccountSecuritySectionParams = {
  locale: string;
  setActiveSessions: React.Dispatch<React.SetStateAction<AdminSession[]>>;
  setSessionErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  googleAuthStatus: ConnectedAccountStatus;
  setGoogleAuthStatus: React.Dispatch<React.SetStateAction<ConnectedAccountStatus>>;
  setGoogleConnectMessage: React.Dispatch<React.SetStateAction<string>>;
  setGoogleConnectMessageVariant: React.Dispatch<React.SetStateAction<ConnectedMessageVariant>>;
  githubAuthStatus: ConnectedAccountStatus;
  setGithubAuthStatus: React.Dispatch<React.SetStateAction<ConnectedAccountStatus>>;
  setGithubConnectMessage: React.Dispatch<React.SetStateAction<string>>;
  setGithubConnectMessageVariant: React.Dispatch<React.SetStateAction<ConnectedMessageVariant>>;
  googleConnectMessage: string;
  githubConnectMessage: string;
  onSessionExpired: () => void;
  successMessageAutoHideMs: number;
  t: TFunction;
};

export default function useAdminAccountSecuritySection({
  locale,
  setActiveSessions,
  setSessionErrorMessage,
  setGoogleAuthStatus,
  setGoogleConnectMessage,
  setGoogleConnectMessageVariant,
  setGithubAuthStatus,
  setGithubConnectMessage,
  setGithubConnectMessageVariant,
  googleConnectMessage,
  githubConnectMessage,
  onSessionExpired,
  successMessageAutoHideMs,
  t,
}: UseAdminAccountSecuritySectionParams) {
  const passwordSection = useAdminAccountPasswordSecurity({
    onSessionExpired,
    successMessageAutoHideMs,
    t,
  });

  const sessionSection = useAdminAccountSessionActions({
    setActiveSessions,
    setSessionErrorMessage,
    onSessionExpired,
    successMessageAutoHideMs,
    t,
  });

  const connectedAccountsSection = useAdminAccountConnectedAccounts({
    locale,
    googleConnectMessage,
    setGoogleAuthStatus,
    setGoogleConnectMessage,
    setGoogleConnectMessageVariant,
    githubConnectMessage,
    setGithubAuthStatus,
    setGithubConnectMessage,
    setGithubConnectMessageVariant,
    clearSecuritySuccessMessage: passwordSection.clearSecuritySuccessMessage,
    onSessionExpired,
    t,
  });

  return {
    ...passwordSection,
    ...sessionSection,
    ...connectedAccountsSection,
  };
}
