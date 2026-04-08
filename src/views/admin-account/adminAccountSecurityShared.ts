'use client';

export type ConnectedAccountStatus = {
  enabled: boolean;
  loginAvailable: boolean;
};

export type ConnectedMessageVariant = 'success' | 'danger' | 'info';
