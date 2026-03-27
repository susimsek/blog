export {};

const withBasePathMock = jest.fn((value: string) => `/base${value}`);

jest.mock('@/lib/basePath', () => ({
  withBasePath: (value: string) => withBasePathMock(value),
}));

describe('adminPasswordResetApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('submits password reset requests and confirmation payloads', async () => {
    const { confirmAdminPasswordReset, requestAdminPasswordReset, validateAdminPasswordResetToken } =
      await import('@/lib/adminPasswordResetApi');
    const fetchMock = jest.mocked(global.fetch);

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            requestPasswordReset: {
              success: true,
            },
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            validatePasswordResetToken: {
              status: 'success',
              locale: 'en',
            },
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            confirmPasswordReset: {
              success: true,
              locale: 'en',
            },
          },
        }),
      } as Response);

    await expect(requestAdminPasswordReset('admin@example.com', 'en')).resolves.toBe(true);
    await expect(validateAdminPasswordResetToken('reset-token', 'en')).resolves.toEqual({
      status: 'success',
      locale: 'en',
    });
    await expect(confirmAdminPasswordReset('reset-token', 'en', 'new-password', 'new-password')).resolves.toBe(true);

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/base/api/admin/graphql', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.any(String),
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({
      operationName: 'AdminRequestPasswordReset',
      query: expect.stringContaining('mutation AdminRequestPasswordReset'),
      variables: {
        input: {
          email: 'admin@example.com',
          locale: 'en',
        },
      },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/base/api/admin/graphql', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.any(String),
    });
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toEqual({
      operationName: 'AdminValidatePasswordResetToken',
      query: expect.stringContaining('query AdminValidatePasswordResetToken'),
      variables: {
        token: 'reset-token',
        locale: 'en',
      },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(3, '/base/api/admin/graphql', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.any(String),
    });
    expect(JSON.parse(fetchMock.mock.calls[2][1]?.body as string)).toEqual({
      operationName: 'AdminConfirmPasswordReset',
      query: expect.stringContaining('mutation AdminConfirmPasswordReset'),
      variables: {
        input: {
          token: 'reset-token',
          locale: 'en',
          newPassword: 'new-password',
          confirmPassword: 'new-password',
        },
      },
    });
  });

  it('normalizes API and network errors', async () => {
    const {
      confirmAdminPasswordReset,
      requestAdminPasswordReset,
      resolveAdminPasswordResetError,
      validateAdminPasswordResetToken,
    } = await import('@/lib/adminPasswordResetApi');
    const fetchMock = jest.mocked(global.fetch);

    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          errors: [
            {
              message: 'Email invalid.',
              extensions: {
                code: 'admin_password_reset_email_invalid',
              },
            },
          ],
        }),
      } as Response)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('invalid json');
        },
      } as unknown as Response);

    await expect(requestAdminPasswordReset('admin@example.com', 'en')).rejects.toMatchObject({
      kind: 'api',
      code: 'ADMIN_PASSWORD_RESET_EMAIL_INVALID',
      message: 'Email invalid.',
    });
    await expect(validateAdminPasswordResetToken('reset-token', 'en')).rejects.toMatchObject({
      kind: 'network',
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
    });
    await expect(confirmAdminPasswordReset('reset-token', 'en', 'new-password', 'new-password')).rejects.toMatchObject({
      kind: 'api',
      code: 'ADMIN_PASSWORD_RESET_FAILED',
      message: 'Admin password reset request failed.',
    });

    expect(
      resolveAdminPasswordResetError({
        kind: 'api',
        code: ' admin_password_reset_token_invalid ',
        message: ' token invalid ',
      }),
    ).toEqual({
      kind: 'api',
      code: 'ADMIN_PASSWORD_RESET_TOKEN_INVALID',
      message: 'token invalid',
    });
    expect(resolveAdminPasswordResetError(null)).toEqual({
      kind: 'api',
      code: 'ADMIN_PASSWORD_RESET_FAILED',
      message: 'Admin password reset request failed.',
    });
  });
});
