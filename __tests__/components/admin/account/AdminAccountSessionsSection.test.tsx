import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminAccountSessionsSection from '@/components/admin/account/AdminAccountSessionsSection';
import type { ComponentProps } from 'react';

const t = (key: string, options?: Record<string, unknown>) =>
  options?.value === undefined ? key : `${key}:${String(options.value)}`;
const session = (
  overrides: Partial<{
    id: string;
    device: string;
    ipAddress: string;
    countryCode: string;
    lastActivityAt: string;
    createdAt: string;
    expiresAt: string;
    persistent: boolean;
    current: boolean;
  }> = {},
) => ({
  id: 'session-1',
  device: 'Desktop Chrome',
  ipAddress: '127.0.0.1',
  countryCode: 'TR',
  lastActivityAt: '2026-11-06T12:00:00Z',
  createdAt: '2026-11-01T12:00:00Z',
  expiresAt: '2026-12-01T12:00:00Z',
  persistent: true,
  current: true,
  ...overrides,
});
const makeProps = (
  overrides: Partial<ComponentProps<typeof AdminAccountSessionsSection>> = {},
): ComponentProps<typeof AdminAccountSessionsSection> => ({
  t,
  formatSessionDate: value => `date:${value}`,
  sessionErrorMessage: '',
  sessionSuccessMessage: '',
  isSessionsLoading: false,
  activeSessions: [],
  isRevokingAllSessions: false,
  revokingSessionID: '',
  onRevokeAllSessions: jest.fn(),
  onRevokeSession: jest.fn(),
  resolveSessionDeviceIcon: () => 'desktop',
  ...overrides,
});

describe('AdminAccountSessionsSection', () => {
  it('renders loading and empty states with feedback', () => {
    const loading = render(
      <AdminAccountSessionsSection
        {...makeProps({
          isSessionsLoading: true,
          sessionErrorMessage: 'Session error',
          sessionSuccessMessage: 'Session updated',
        })}
      />,
    );
    expect(screen.getByRole('status', { name: 'adminAccount.sessions.loading' })).toBeInTheDocument();
    expect(screen.getByText('Session error')).toBeInTheDocument();
    expect(screen.getByText('Session updated')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'adminAccount.sessions.actions.revokeAll' })).toBeDisabled();

    loading.rerender(<AdminAccountSessionsSection {...makeProps()} />);
    expect(screen.getByText('adminAccount.sessions.empty')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'adminAccount.sessions.actions.revokeAll' })).toBeDisabled();
  });

  it('renders current and remembered sessions and dispatches revoke actions', () => {
    const sessions = [
      session(),
      session({
        id: 'session-2',
        device: 'Mobile Safari',
        ipAddress: '192.0.2.1',
        countryCode: 'US',
        lastActivityAt: '2026-11-05T12:00:00Z',
        expiresAt: '2026-12-02T12:00:00Z',
        persistent: false,
        current: false,
      }),
    ];
    const onRevokeAllSessions = jest.fn();
    const onRevokeSession = jest.fn();
    const resolveSessionDeviceIcon = jest.fn((device: string) => (device.includes('Mobile') ? 'mobile' : 'desktop'));
    render(
      <AdminAccountSessionsSection
        {...makeProps({
          activeSessions: sessions,
          onRevokeAllSessions,
          onRevokeSession,
          resolveSessionDeviceIcon,
          revokingSessionID: 'session-2',
        })}
      />,
    );

    expect(screen.getByText('Desktop Chrome')).toBeInTheDocument();
    expect(screen.getByText('Mobile Safari')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.sessions.labels.current')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.sessions.labels.remembered')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.sessions.actions.revokingSingle')).toBeInTheDocument();
    expect(resolveSessionDeviceIcon).toHaveBeenCalledTimes(2);
    expect(screen.getByText('adminAccount.sessions.labels.ip:127.0.0.1')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.sessions.labels.ip:192.0.2.1')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.sessions.labels.country:TR')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.sessions.labels.country:US')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.sessions.labels.lastActivity:date:2026-11-06T12:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.sessions.labels.lastActivity:date:2026-11-05T12:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.sessions.labels.expires:date:2026-12-01T12:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.sessions.labels.expires:date:2026-12-02T12:00:00Z')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.sessions.actions.revokeAll' }));
    fireEvent.click(screen.getByRole('button', { name: /adminAccount.sessions.actions.revokeSingle/ }));
    expect(onRevokeAllSessions).not.toHaveBeenCalled();
    expect(onRevokeSession).toHaveBeenCalledWith(sessions[0]);
  });

  it('disables individual revokes while all sessions are being revoked', () => {
    render(
      <AdminAccountSessionsSection {...makeProps({ activeSessions: [session()], isRevokingAllSessions: true })} />,
    );

    expect(screen.getByText('adminAccount.sessions.actions.revokingAll')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'adminAccount.sessions.actions.revokingAll' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /adminAccount.sessions.actions.revokeSingle/ })).toBeDisabled();
  });
});
