export {};

const withBasePathMock = jest.fn((value: string) => `/base${value}`);

jest.mock('@/lib/basePath', () => ({
  withBasePath: (value: string) => withBasePathMock(value),
}));

describe('adminEmailChangeApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('submits email change confirmation to admin graphql', async () => {
    const { confirmAdminEmailChange } = await import('@/lib/adminEmailChangeApi');
    const fetchMock = jest.mocked(global.fetch);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          confirmEmailChange: {
            status: 'success',
            locale: 'en',
          },
        },
      }),
    } as Response);

    await expect(confirmAdminEmailChange('confirm-token', 'en')).resolves.toEqual({
      status: 'success',
      locale: 'en',
    });

    expect(fetchMock).toHaveBeenCalledWith('/base/api/admin/graphql', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.any(String),
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({
      operationName: 'AdminConfirmEmailChange',
      query: expect.stringContaining('mutation AdminConfirmEmailChange'),
      variables: {
        token: 'confirm-token',
        locale: 'en',
      },
    });
  });

  it('normalizes api and network failures', async () => {
    const { confirmAdminEmailChange, resolveAdminEmailChangeError } = await import('@/lib/adminEmailChangeApi');
    const fetchMock = jest.mocked(global.fetch);

    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          errors: [
            {
              message: 'Email change failed.',
              extensions: {
                code: 'service_unavailable',
              },
            },
          ],
        }),
      } as Response)
      .mockRejectedValueOnce(new Error('network'));

    await expect(confirmAdminEmailChange('confirm-token', 'en')).rejects.toMatchObject({
      kind: 'api',
      code: 'SERVICE_UNAVAILABLE',
      message: 'Email change failed.',
    });

    await expect(confirmAdminEmailChange('confirm-token', 'en')).rejects.toMatchObject({
      kind: 'network',
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
    });

    expect(
      resolveAdminEmailChangeError({
        kind: 'api',
        code: ' service_unavailable ',
        message: ' temporary failure ',
      }),
    ).toEqual({
      kind: 'api',
      code: 'SERVICE_UNAVAILABLE',
      message: 'temporary failure',
    });
  });
});
