import { gql } from '@apollo/client/core';

jest.mock('@/lib/basePath', () => ({ withBasePath: (value: string) => `/base${value}` }));
jest.mock('@/i18n/clientLocale', () => ({ resolveDocumentLocale: () => 'tr' }));

const jsonResponse = (body: unknown, status = 200) =>
  ({
    status,
    statusText: status === 200 ? 'OK' : 'Request failed',
    ok: status >= 200 && status < 300,
    url: '/api/admin/graphql',
    headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
    text: async () => JSON.stringify(body),
  }) as Response;

const getHeader = (options: RequestInit | undefined, name: string) => {
  const headers = options?.headers as Record<string, string> | undefined;
  return Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] ?? null;
};

const importAdminCore = async () => import('@/lib/admin-api/core');

describe('admin GraphQL transport', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    global.fetch = jest.fn() as unknown as typeof fetch;
    document.cookie = 'admin_csrf=; Max-Age=0';
  });

  it('sends no-cache query requests with locale headers and reuses the Apollo client', async () => {
    const fetchMock = jest.mocked(global.fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: { health: 'ok' } }))
      .mockResolvedValueOnce(jsonResponse({ data: { health: 'ready' } }));
    const { executeAdminGraphQL } = await importAdminCore();
    const query = gql`
      query AdminHealthQuery {
        health
      }
    `;

    await expect(executeAdminGraphQL(query)).resolves.toEqual({ health: 'ok' });
    await expect(executeAdminGraphQL(query, { detail: true })).resolves.toEqual({ health: 'ready' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, options] = fetchMock.mock.calls[0]!;
    expect(getHeader(options, 'Accept-Language')).toBe('tr');
    expect(getHeader(options, 'X-CSRF-Token')).toBeNull();
    expect(options?.credentials).toBe('same-origin');
    expect(JSON.parse(String(options?.body))).toMatchObject({ operationName: 'AdminHealthQuery' });
  });

  it('adds decoded CSRF tokens to mutation requests and supports omitted variables', async () => {
    document.cookie = 'admin_csrf=csrf%20token';
    const fetchMock = jest.mocked(global.fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: { update: true } }))
      .mockResolvedValueOnce(jsonResponse({ data: { logout: true } }));
    const { executeAdminGraphQL } = await importAdminCore();
    const mutation = gql`
      mutation UpdateAdminMutation($value: Boolean!) {
        update(value: $value)
      }
    `;
    const noVariablesMutation = gql`
      mutation AdminLogoutMutation {
        logout
      }
    `;

    await expect(executeAdminGraphQL(mutation, { value: true })).resolves.toEqual({ update: true });
    await expect(executeAdminGraphQL(noVariablesMutation)).resolves.toEqual({ logout: true });

    for (const [, options] of fetchMock.mock.calls) {
      expect(getHeader(options, 'X-CSRF-Token')).toBe('csrf token');
    }
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).variables).toEqual({ value: true });
  });

  it('returns typed request errors for missing payloads and network failures', async () => {
    jest
      .mocked(global.fetch)
      .mockResolvedValueOnce(jsonResponse({ data: null }))
      .mockRejectedValueOnce(new Error('offline'));
    const { executeAdminGraphQL } = await importAdminCore();
    const query = gql`
      query EmptyAdminQuery {
        value
      }
    `;

    await expect(executeAdminGraphQL(query)).rejects.toMatchObject({
      name: 'AdminGraphQLRequestError',
      message: 'Missing admin GraphQL payload',
    });
    await expect(executeAdminGraphQL(query)).rejects.toMatchObject({
      name: 'AdminGraphQLRequestError',
      code: 'NETWORK_ERROR',
      message: 'offline',
    });
  });

  it('coalesces concurrent refresh calls and clears the in-flight promise afterward', async () => {
    const fetchMock = jest.mocked(global.fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: { refreshAdminSession: { success: true, user: null } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { refreshAdminSession: { success: true, user: null } } }));
    const { refreshAdminSessionOnce } = await importAdminCore();

    await Promise.all([refreshAdminSessionOnce(), refreshAdminSessionOnce()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await refreshAdminSessionOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
