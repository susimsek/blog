'use client';

import React from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { TFunction } from 'i18next';
import {
  fetchAdminActiveSessions,
  fetchAdminGithubAuthStatus,
  fetchAdminGoogleAuthStatus,
  fetchAdminMe,
  isAdminSessionError,
  resolveAdminError,
} from '@/lib/adminApi';
import {
  clearAdminSessionProfileCache,
  readAdminSessionProfileCache,
  writeAdminSessionProfileCache,
  type AdminSessionProfile,
} from '@/lib/adminSessionProfileCache';
import { resolveConnectedAccountMessage } from './helpers';

type AdminIdentity = AdminSessionProfile | null;
type AdminAlertVariant = 'success' | 'danger' | 'info';
type SearchParamsLike = { get(name: string): string | null } | null | undefined;

type AdminSession = {
  id: string;
  device: string;
  ipAddress: string;
  countryCode: string;
  lastActivityAt: string;
  createdAt: string;
  expiresAt: string;
  persistent: boolean;
  current: boolean;
};

type UseAdminAccountBootstrapParams = {
  isSecuritySection: boolean;
  isSessionsSection: boolean;
  locale: string;
  pathname: string;
  router: AppRouterInstance;
  searchParams: SearchParamsLike;
  setNameInput: React.Dispatch<React.SetStateAction<string>>;
  setUsernameInput: React.Dispatch<React.SetStateAction<string>>;
  t: TFunction;
};

export default function useAdminAccountBootstrap({
  isSecuritySection,
  isSessionsSection,
  locale,
  pathname,
  router,
  searchParams,
  setNameInput,
  setUsernameInput,
  t,
}: UseAdminAccountBootstrapParams) {
  const [adminUser, setAdminUser] = React.useState<AdminIdentity>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeSessions, setActiveSessions] = React.useState<AdminSession[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = React.useState(isSessionsSection);
  const [sessionErrorMessage, setSessionErrorMessage] = React.useState('');
  const [googleAuthStatus, setGoogleAuthStatus] = React.useState({
    enabled: false,
    loginAvailable: false,
  });
  const [githubAuthStatus, setGithubAuthStatus] = React.useState({
    enabled: false,
    loginAvailable: false,
  });
  const [isGoogleAuthStatusLoading, setIsGoogleAuthStatusLoading] = React.useState(isSecuritySection);
  const [isGithubAuthStatusLoading, setIsGithubAuthStatusLoading] = React.useState(isSecuritySection);
  const [googleConnectMessage, setGoogleConnectMessage] = React.useState('');
  const [githubConnectMessage, setGithubConnectMessage] = React.useState('');
  const [googleConnectMessageVariant, setGoogleConnectMessageVariant] = React.useState<AdminAlertVariant>('info');
  const [githubConnectMessageVariant, setGithubConnectMessageVariant] = React.useState<AdminAlertVariant>('info');

  const redirectToAdminLoginRef = React.useRef<() => void>(() => {});

  const syncAdminUser = React.useCallback((nextUser: AdminIdentity) => {
    setAdminUser(nextUser);
    writeAdminSessionProfileCache(nextUser);
  }, []);

  const patchAdminUser = React.useCallback((updater: (previous: AdminIdentity) => AdminIdentity) => {
    setAdminUser(previous => {
      const nextUser = updater(previous);
      writeAdminSessionProfileCache(nextUser);
      return nextUser;
    });
  }, []);

  React.useEffect(() => {
    redirectToAdminLoginRef.current = () => {
      clearAdminSessionProfileCache();
      router.replace(`/${locale}/admin/login`);
    };
  }, [locale, router]);

  const handleAdminSessionExpired = React.useCallback(() => {
    redirectToAdminLoginRef.current();
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const cachedUser = readAdminSessionProfileCache();
        const resolvedUser = cachedUser ?? null;

        if (resolvedUser) {
          syncAdminUser(resolvedUser);
          setNameInput(resolvedUser.name ?? '');
          setUsernameInput(resolvedUser.username ?? '');
        } else {
          const me = await fetchAdminMe();
          if (!isMounted) {
            return;
          }

          if (!me.authenticated || !me.user) {
            redirectToAdminLoginRef.current();
            return;
          }

          syncAdminUser(me.user);
          setNameInput(me.user.name ?? '');
          setUsernameInput(me.user.username ?? '');
        }

        if (!isSessionsSection) {
          return;
        }

        setIsSessionsLoading(true);
        try {
          const sessions = await fetchAdminActiveSessions();
          if (!isMounted) {
            return;
          }
          setActiveSessions(sessions);
          setSessionErrorMessage('');
        } catch (error) {
          if (!isMounted) {
            return;
          }
          if (isAdminSessionError(error)) {
            redirectToAdminLoginRef.current();
            return;
          }
          const resolvedError = resolveAdminError(error);
          setSessionErrorMessage(
            resolvedError.kind === 'network'
              ? t('adminCommon.errors.network', { ns: 'admin-common' })
              : resolvedError.message || t('adminAccount.sessions.errors.load', { ns: 'admin-account' }),
          );
        } finally {
          if (isMounted) {
            setIsSessionsLoading(false);
          }
        }
      } catch {
        if (isMounted) {
          redirectToAdminLoginRef.current();
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
  }, [isSessionsSection, setNameInput, setUsernameInput, syncAdminUser, t]);

  React.useEffect(() => {
    if (!isSecuritySection) {
      return;
    }

    let isMounted = true;
    setIsGoogleAuthStatusLoading(true);

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
      })
      .finally(() => {
        if (isMounted) {
          setIsGoogleAuthStatusLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isSecuritySection]);

  React.useEffect(() => {
    if (!isSecuritySection) {
      return;
    }

    let isMounted = true;
    setIsGithubAuthStatusLoading(true);

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
      })
      .finally(() => {
        if (isMounted) {
          setIsGithubAuthStatusLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isSecuritySection]);

  React.useEffect(() => {
    if (!isSecuritySection || !searchParams) {
      return;
    }

    const googleStatus = (searchParams.get('google') ?? '').trim().toLowerCase();
    if (googleStatus === '') {
      return;
    }

    const { message: nextMessage, variant: nextVariant } = resolveConnectedAccountMessage('google', googleStatus, t);
    setGoogleConnectMessage(nextMessage);
    setGoogleConnectMessageVariant(nextVariant);
    router.replace(pathname, { scroll: false });
  }, [isSecuritySection, pathname, router, searchParams, t]);

  React.useEffect(() => {
    if (!isSecuritySection || !searchParams) {
      return;
    }

    const githubStatus = (searchParams.get('github') ?? '').trim().toLowerCase();
    if (githubStatus === '') {
      return;
    }

    const { message: nextMessage, variant: nextVariant } = resolveConnectedAccountMessage('github', githubStatus, t);
    setGithubConnectMessage(nextMessage);
    setGithubConnectMessageVariant(nextVariant);
    router.replace(pathname, { scroll: false });
  }, [isSecuritySection, pathname, router, searchParams, t]);

  return {
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
  };
}
