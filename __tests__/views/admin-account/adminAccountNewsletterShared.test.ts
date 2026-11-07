import type { TFunction } from 'i18next';
import { isAdminSessionError, resolveAdminError } from '@/lib/adminApi';
import { handleAdminNewsletterError } from '@/views/admin-account/adminAccountNewsletterShared';

jest.mock('@/lib/adminApi', () => ({
  isAdminSessionError: jest.fn(),
  resolveAdminError: jest.fn(),
}));

const t = jest.fn((key: string) => key) as unknown as TFunction;

describe('handleAdminNewsletterError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: '' });
  });

  it('routes expired sessions to the session handler', () => {
    jest.mocked(isAdminSessionError).mockReturnValue(true);
    const onSessionExpired = jest.fn();
    const setNewsletterErrorMessage = jest.fn();

    expect(
      handleAdminNewsletterError(new Error('expired'), {
        t,
        onSessionExpired,
        setNewsletterErrorMessage,
        fallbackKey: 'adminAccount.newsletter.errors.load',
      }),
    ).toBe(true);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(setNewsletterErrorMessage).not.toHaveBeenCalled();
  });

  it('uses a localized network message or the operation fallback', () => {
    const setNewsletterErrorMessage = jest.fn();
    const options = {
      t,
      onSessionExpired: jest.fn(),
      setNewsletterErrorMessage,
      fallbackKey: 'adminAccount.newsletter.errors.load',
    };

    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'network', message: '' });
    expect(handleAdminNewsletterError(new Error('offline'), options)).toBe(false);
    expect(setNewsletterErrorMessage).toHaveBeenLastCalledWith('adminCommon.errors.network');

    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'unknown', message: '' });
    handleAdminNewsletterError(new Error('failed'), options);
    expect(setNewsletterErrorMessage).toHaveBeenLastCalledWith('adminAccount.newsletter.errors.load');

    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'unknown', message: 'Resolved error' });
    handleAdminNewsletterError(new Error('failed'), options);
    expect(setNewsletterErrorMessage).toHaveBeenLastCalledWith('Resolved error');
  });
});
