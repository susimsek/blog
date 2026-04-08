'use client';

import type { TFunction } from 'i18next';
import type { AdminSessionProfile } from '@/lib/adminSessionProfileCache';

export type AdminIdentity = AdminSessionProfile | null;
export type AdminEmailErrorField = 'currentPassword' | 'newEmail' | 'generic';
export type AdminSession = {
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

export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 80;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 32;
export const DELETE_CONFIRMATION_VALUE = 'DELETE';
export const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const resolveEmailValidationError = (email: string, profileEmail: string, translate: TFunction) => {
  if (email === '') {
    return translate('adminAccount.validation.emailRequired', { ns: 'admin-account' });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return translate('adminAccount.validation.emailInvalid', { ns: 'admin-account' });
  }
  if (profileEmail === email) {
    return translate('adminAccount.validation.emailDifferent', { ns: 'admin-account' });
  }

  return '';
};

export const resolveAdminEmailErrorField = (code?: string): AdminEmailErrorField => {
  if (code === 'ADMIN_CURRENT_PASSWORD_INCORRECT' || code === 'ADMIN_CURRENT_PASSWORD_REQUIRED') {
    return 'currentPassword';
  }
  if (code === 'ADMIN_EMAIL_INVALID' || code === 'ADMIN_EMAIL_SAME' || code === 'ADMIN_EMAIL_TAKEN') {
    return 'newEmail';
  }

  return 'generic';
};

export const resolveSessionDeviceIcon = (deviceLabel: string) => {
  const normalized = deviceLabel.toLowerCase();
  if (normalized.includes('iphone') || normalized.includes('android') || normalized.includes('mobile')) {
    return 'mobile-screen-button';
  }
  if (normalized.includes('ipad') || normalized.includes('tablet')) {
    return 'tablet-screen-button';
  }
  if (normalized.includes('mac') || normalized.includes('windows') || normalized.includes('linux')) {
    return 'laptop';
  }

  return 'desktop';
};
