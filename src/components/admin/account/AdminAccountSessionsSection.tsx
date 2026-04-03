'use client';

import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdminLoadingState from '@/components/admin/AdminLoadingState';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;
type SessionIcon = React.ComponentProps<typeof FontAwesomeIcon>['icon'];

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

type AdminAccountSessionsSectionProps = {
  t: AdminAccountTranslate;
  formatSessionDate: (value: string) => string;
  sessionErrorMessage: string;
  sessionSuccessMessage: string;
  isSessionsLoading: boolean;
  activeSessions: AdminSession[];
  isRevokingAllSessions: boolean;
  revokingSessionID: string;
  onRevokeAllSessions: () => void | Promise<void>;
  onRevokeSession: (session: AdminSession) => void | Promise<void>;
  resolveSessionDeviceIcon: (deviceLabel: string) => SessionIcon;
};

export default function AdminAccountSessionsSection({
  t,
  formatSessionDate,
  sessionErrorMessage,
  sessionSuccessMessage,
  isSessionsLoading,
  activeSessions,
  isRevokingAllSessions,
  revokingSessionID,
  onRevokeAllSessions,
  onRevokeSession,
  resolveSessionDeviceIcon,
}: Readonly<AdminAccountSessionsSectionProps>) {
  return (
    <>
      <h3 className="admin-dashboard-panel-title mb-3">{t('adminAccount.sessions.title', { ns: 'admin-account' })}</h3>
      <hr className="admin-section-divider mb-3" />
      <p className="admin-dashboard-panel-copy mb-3">{t('adminAccount.sessions.copy', { ns: 'admin-account' })}</p>

      <div className="d-flex justify-content-end mb-3">
        <Button
          variant="danger"
          size="sm"
          onClick={onRevokeAllSessions}
          disabled={
            isSessionsLoading || activeSessions.length === 0 || isRevokingAllSessions || revokingSessionID !== ''
          }
        >
          {isRevokingAllSessions ? (
            <span className="d-inline-flex align-items-center gap-2">
              <Spinner
                as="span"
                animation="border"
                size="sm"
                className="me-2 flex-shrink-0 admin-action-spinner"
                aria-hidden="true"
              />
              <span>{t('adminAccount.sessions.actions.revokingAll', { ns: 'admin-account' })}</span>
            </span>
          ) : (
            <>
              <FontAwesomeIcon icon="right-from-bracket" className="me-2" />
              {t('adminAccount.sessions.actions.revokeAll', { ns: 'admin-account' })}
            </>
          )}
        </Button>
      </div>

      {sessionErrorMessage ? (
        <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
          {sessionErrorMessage}
        </Alert>
      ) : null}
      {sessionSuccessMessage ? (
        <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
          {sessionSuccessMessage}
        </Alert>
      ) : null}

      {isSessionsLoading ? (
        <div className="admin-account-sessions-loading">
          <AdminLoadingState
            className="admin-loading-stack"
            ariaLabel={t('adminAccount.sessions.loading', { ns: 'admin-account' })}
          />
        </div>
      ) : activeSessions.length === 0 ? (
        <p className="small text-muted mb-0">{t('adminAccount.sessions.empty', { ns: 'admin-account' })}</p>
      ) : (
        <div className="admin-session-list">
          {activeSessions.map(sessionItem => (
            <div key={sessionItem.id} className="admin-session-item">
              <div className="admin-session-icon" aria-hidden="true">
                <FontAwesomeIcon icon={resolveSessionDeviceIcon(sessionItem.device)} />
              </div>
              <div className="admin-session-main">
                <div className="admin-session-title-row">
                  <strong>{sessionItem.device}</strong>
                  {sessionItem.current ? (
                    <span className="admin-session-chip admin-session-chip-current">
                      {t('adminAccount.sessions.labels.current', { ns: 'admin-account' })}
                    </span>
                  ) : null}
                  {sessionItem.persistent ? (
                    <span className="admin-session-chip">
                      {t('adminAccount.sessions.labels.remembered', { ns: 'admin-account' })}
                    </span>
                  ) : null}
                </div>
                <div className="admin-session-meta">
                  <span>
                    {t('adminAccount.sessions.labels.ip', {
                      ns: 'admin-account',
                      value: sessionItem.ipAddress,
                    })}
                  </span>
                  <span>
                    {t('adminAccount.sessions.labels.country', {
                      ns: 'admin-account',
                      value: sessionItem.countryCode,
                    })}
                  </span>
                  <span>
                    {t('adminAccount.sessions.labels.lastActivity', {
                      ns: 'admin-account',
                      value: formatSessionDate(sessionItem.lastActivityAt),
                    })}
                  </span>
                  <span>
                    {t('adminAccount.sessions.labels.expires', {
                      ns: 'admin-account',
                      value: formatSessionDate(sessionItem.expiresAt),
                    })}
                  </span>
                </div>
              </div>
              <Button
                variant={sessionItem.current ? 'danger' : 'secondary'}
                size="sm"
                disabled={isRevokingAllSessions || revokingSessionID === sessionItem.id}
                onClick={() => {
                  void onRevokeSession(sessionItem);
                }}
              >
                {revokingSessionID === sessionItem.id ? (
                  <span className="d-inline-flex align-items-center gap-2">
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-2 flex-shrink-0 admin-action-spinner"
                      aria-hidden="true"
                    />
                    <span>{t('adminAccount.sessions.actions.revokingSingle', { ns: 'admin-account' })}</span>
                  </span>
                ) : (
                  <>
                    <FontAwesomeIcon icon="right-from-bracket" className="me-2" />
                    {t('adminAccount.sessions.actions.revokeSingle', {
                      ns: 'admin-account',
                      context: sessionItem.current ? 'current' : 'other',
                    })}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
