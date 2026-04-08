'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import { isAdminSessionError, resolveAdminError, revokeAdminSession, revokeAllAdminSessions } from '@/lib/adminApi';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import type { AdminSession } from './adminAccountShared';

type UseAdminAccountSessionActionsParams = {
  setActiveSessions: React.Dispatch<React.SetStateAction<AdminSession[]>>;
  setSessionErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  onSessionExpired: () => void;
  successMessageAutoHideMs: number;
  t: TFunction;
};

export default function useAdminAccountSessionActions({
  setActiveSessions,
  setSessionErrorMessage,
  onSessionExpired,
  successMessageAutoHideMs,
  t,
}: UseAdminAccountSessionActionsParams) {
  const [sessionSuccessMessage, setSessionSuccessMessage] = React.useState('');
  const [revokingSessionID, setRevokingSessionID] = React.useState('');
  const [isRevokingAllSessions, setIsRevokingAllSessions] = React.useState(false);

  useAutoClearValue(sessionSuccessMessage, setSessionSuccessMessage, successMessageAutoHideMs);

  const handleRevokeSession = React.useCallback(
    async (sessionItem: AdminSession) => {
      if (revokingSessionID || isRevokingAllSessions) {
        return;
      }

      setSessionErrorMessage('');
      setSessionSuccessMessage('');
      setRevokingSessionID(sessionItem.id);

      try {
        const success = await revokeAdminSession(sessionItem.id);
        if (!success) {
          throw new Error(t('adminAccount.sessions.errors.revokeSingle', { ns: 'admin-account' }));
        }

        if (sessionItem.current) {
          onSessionExpired();
          return;
        }

        setActiveSessions(previous => previous.filter(candidate => candidate.id !== sessionItem.id));
        setSessionSuccessMessage(t('adminAccount.sessions.success.revokeSingle', { ns: 'admin-account' }));
      } catch (error) {
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setSessionErrorMessage(
          resolvedError.message || t('adminAccount.sessions.errors.revokeSingle', { ns: 'admin-account' }),
        );
      } finally {
        setRevokingSessionID('');
      }
    },
    [isRevokingAllSessions, onSessionExpired, revokingSessionID, setActiveSessions, setSessionErrorMessage, t],
  );

  const handleRevokeAllSessions = React.useCallback(async () => {
    if (isRevokingAllSessions || revokingSessionID) {
      return;
    }

    setSessionErrorMessage('');
    setSessionSuccessMessage('');
    setIsRevokingAllSessions(true);

    try {
      const success = await revokeAllAdminSessions();
      if (!success) {
        throw new Error(t('adminAccount.sessions.errors.revokeAll', { ns: 'admin-account' }));
      }

      onSessionExpired();
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setSessionErrorMessage(
        resolvedError.message || t('adminAccount.sessions.errors.revokeAll', { ns: 'admin-account' }),
      );
    } finally {
      setIsRevokingAllSessions(false);
    }
  }, [isRevokingAllSessions, onSessionExpired, revokingSessionID, setSessionErrorMessage, t]);

  return {
    sessionSuccessMessage,
    revokingSessionID,
    isRevokingAllSessions,
    handleRevokeSession,
    handleRevokeAllSessions,
  };
}
