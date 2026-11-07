import {
  createAdminErrorMessage,
  deleteAdminErrorMessage,
  fetchAdminErrorMessageAuditLogs,
  fetchAdminErrorMessages,
  updateAdminErrorMessage,
} from '@/lib/admin-api/errors';
import { executeAdminGraphQL } from '@/lib/admin-api/core';

jest.mock('@/lib/admin-api/core', () => ({ executeAdminGraphQL: jest.fn() }));

const respondWith = (value: unknown) => jest.mocked(executeAdminGraphQL).mockResolvedValueOnce(value as never);

describe('admin error messages API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('normalizes message filters and uses default pagination', async () => {
    const page = { items: [], total: 0, page: 1, size: 20 };
    respondWith({ errorMessages: page });
    await expect(
      fetchAdminErrorMessages({ locale: ' TR ', code: ' auth_required ', query: ' expired ', page: 3.8, size: 5.9 }),
    ).resolves.toBe(page);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: { locale: 'tr', code: 'AUTH_REQUIRED', query: 'expired', page: 3, size: 5 } },
      expect.objectContaining({ operationName: 'AdminErrorMessages' }),
    );

    respondWith({ errorMessages: page });
    await fetchAdminErrorMessages({ locale: ' ', code: ' ', query: ' ', page: 0, size: -1 });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: { page: 1 } },
      expect.objectContaining({ operationName: 'AdminErrorMessages' }),
    );
  });

  it('loads audit logs with the requested or default limit', async () => {
    const logs = [{ id: 'audit-1' }];
    respondWith({ errorMessageAuditLogs: logs });
    await expect(fetchAdminErrorMessageAuditLogs(7)).resolves.toBe(logs);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { limit: 7 },
      expect.objectContaining({ operationName: 'AdminErrorMessageAuditLogs' }),
    );

    respondWith({ errorMessageAuditLogs: [] });
    await fetchAdminErrorMessageAuditLogs();
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { limit: 20 },
      expect.objectContaining({ operationName: 'AdminErrorMessageAuditLogs' }),
    );
  });

  it('creates, updates, and deletes normalized error message keys', async () => {
    const message = { scope: 'admin', locale: 'en', code: 'AUTH_REQUIRED', message: 'Sign in' };
    respondWith({ createErrorMessage: message });
    await expect(
      createAdminErrorMessage({
        key: { scope: ' admin ', locale: ' EN ', code: ' auth_required ' },
        message: ' Sign in ',
      }),
    ).resolves.toBe(message);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { key: { scope: 'admin', locale: 'en', code: 'AUTH_REQUIRED' }, message: ' Sign in ' } },
      expect.objectContaining({ operationName: 'AdminCreateErrorMessage' }),
    );

    respondWith({ updateErrorMessage: message });
    await updateAdminErrorMessage({ key: { scope: ' ', locale: 'TR', code: 'not_found' }, message: 'Updated' });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { key: { locale: 'tr', code: 'NOT_FOUND' }, message: 'Updated' } },
      expect.objectContaining({ operationName: 'AdminUpdateErrorMessage' }),
    );

    respondWith({ deleteErrorMessage: { success: true } });
    await expect(deleteAdminErrorMessage({ scope: ' admin ', locale: ' EN ', code: ' auth_required ' })).resolves.toBe(
      true,
    );
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { scope: 'admin', locale: 'en', code: 'AUTH_REQUIRED' } },
      expect.objectContaining({ operationName: 'AdminDeleteErrorMessage' }),
    );
    respondWith({});
    await expect(deleteAdminErrorMessage({ locale: 'en', code: 'missing' })).resolves.toBe(false);
  });
});
