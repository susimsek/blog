import type { TFunction } from 'i18next';
import {
  resolveAdminEmailErrorField,
  resolveEmailValidationError,
  resolveSessionDeviceIcon,
} from '@/views/admin-account/adminAccountShared';

const translate = ((key: string) => key) as unknown as TFunction;

describe('admin account shared helpers', () => {
  it('validates email input and detects unchanged addresses', () => {
    expect(resolveEmailValidationError('', 'admin@example.com', translate)).toBe(
      'adminAccount.validation.emailRequired',
    );
    expect(resolveEmailValidationError('not-an-email', 'admin@example.com', translate)).toBe(
      'adminAccount.validation.emailInvalid',
    );
    expect(resolveEmailValidationError('admin@example.com', 'admin@example.com', translate)).toBe(
      'adminAccount.validation.emailDifferent',
    );
    expect(resolveEmailValidationError('new@example.com', 'admin@example.com', translate)).toBe('');
  });

  it('maps API email errors to the relevant field', () => {
    expect(resolveAdminEmailErrorField('ADMIN_CURRENT_PASSWORD_INCORRECT')).toBe('currentPassword');
    expect(resolveAdminEmailErrorField('ADMIN_CURRENT_PASSWORD_REQUIRED')).toBe('currentPassword');
    expect(resolveAdminEmailErrorField('ADMIN_EMAIL_INVALID')).toBe('newEmail');
    expect(resolveAdminEmailErrorField('ADMIN_EMAIL_SAME')).toBe('newEmail');
    expect(resolveAdminEmailErrorField('ADMIN_EMAIL_TAKEN')).toBe('newEmail');
    expect(resolveAdminEmailErrorField('OTHER_ERROR')).toBe('generic');
    expect(resolveAdminEmailErrorField()).toBe('generic');
  });

  it('selects device icons from common device labels', () => {
    expect(resolveSessionDeviceIcon('Android phone')).toBe('mobile-screen-button');
    expect(resolveSessionDeviceIcon('iPad')).toBe('tablet-screen-button');
    expect(resolveSessionDeviceIcon('Windows laptop')).toBe('laptop');
    expect(resolveSessionDeviceIcon('Unknown device')).toBe('desktop');
  });
});
