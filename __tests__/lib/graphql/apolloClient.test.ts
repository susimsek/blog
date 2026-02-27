const queryMock = jest.fn();
const mutateMock = jest.fn();
const withBasePathMock = jest.fn((value: string) => `/base${value}`);
const publishAppErrorMock = jest.fn();
const reportAppErrorMock = jest.fn();
const unknownAppErrorMock = jest.fn();
const combinedGraphQLErrorsIsMock = jest.fn();
const serverErrorIsMock = jest.fn();
const serverParseErrorIsMock = jest.fn();
const httpLinkMock = jest.fn();
const apolloLinkFromMock = jest.fn((links: unknown[]) => links);
const errorLinkHandlers: Array<(args: { error?: unknown; operation: { operationName?: string } }) => void> = [];

class MockAppError extends Error {
  code: string;
  statusCode?: number;
  details?: unknown;

  constructor(message: string, code: string, statusCode?: number, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

jest.mock('@apollo/client/core', () => ({
  ApolloClient: class ApolloClient {
    query = queryMock;
    mutate = mutateMock;

    constructor(_config: unknown) {}
  },
  ApolloLink: {
    from: (links: unknown[]) => apolloLinkFromMock(links),
  },
  HttpLink: class HttpLink {
    constructor(config: unknown) {
      httpLinkMock(config);
    }
  },
  InMemoryCache: class InMemoryCache {},
}));

jest.mock('@apollo/client/link/error', () => ({
  ErrorLink: class ErrorLink {
    constructor(handler: (args: { error?: unknown; operation: { operationName?: string } }) => void) {
      errorLinkHandlers.push(handler);
    }
  },
}));

jest.mock('@apollo/client/errors', () => ({
  CombinedGraphQLErrors: {
    is: (error: unknown) => combinedGraphQLErrorsIsMock(error),
  },
  ServerError: {
    is: (error: unknown) => serverErrorIsMock(error),
  },
  ServerParseError: {
    is: (error: unknown) => serverParseErrorIsMock(error),
  },
}));

jest.mock('@/lib/basePath', () => ({
  withBasePath: (value: string) => withBasePathMock(value),
}));

jest.mock('@/lib/errors/appError', () => ({
  AppError: MockAppError,
  publishAppError: (...args: unknown[]) => publishAppErrorMock(...args),
  reportAppError: (...args: unknown[]) => reportAppErrorMock(...args),
  unknownAppError: (error: unknown, message: string) => unknownAppErrorMock(error, message),
}));

const importApolloClient = async () => import('@/lib/graphql/apolloClient');

describe('apolloClient', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    errorLinkHandlers.length = 0;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_DEV_API_ORIGIN;
    global.fetch = jest.fn() as unknown as typeof fetch;
    delete (globalThis as { window?: unknown }).window;
    unknownAppErrorMock.mockImplementation(
      (error: unknown, message: string) => new MockAppError(message, 'UNKNOWN_ERROR', undefined, error),
    );
  });

  it('uses the local dev api origin for localhost browser requests', async () => {
    process.env.NEXT_PUBLIC_DEV_API_ORIGIN = 'http://localhost:9090/';
    (globalThis as { window?: unknown }).window = {
      location: {
        origin: 'http://localhost:3000',
      },
    };
    queryMock.mockResolvedValue({ data: { posts: [] } });

    const { queryGraphQL } = await importApolloClient();
    await expect(queryGraphQL({} as never, { locale: 'en' })).resolves.toEqual({ posts: [] });

    expect(httpLinkMock).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: 'http://localhost:9090/graphql',
        fetch: expect.any(Function),
      }),
    );
  });

  it('uses the configured api base url, caches clients, and returns null without response data', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com///';
    queryMock.mockResolvedValue({ data: { post: { id: '1' } } });

    const { queryGraphQL } = await importApolloClient();
    await expect(queryGraphQL({} as never, { id: '1' })).resolves.toEqual({ post: { id: '1' } });
    await expect(queryGraphQL({} as never, { id: '2' })).resolves.toEqual({ post: { id: '1' } });

    expect(httpLinkMock).toHaveBeenCalledTimes(1);
    expect(httpLinkMock).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: 'https://api.example.com/graphql',
      }),
    );

    jest.resetModules();
    jest.clearAllMocks();
    errorLinkHandlers.length = 0;
    global.fetch = jest.fn() as unknown as typeof fetch;
    delete (globalThis as { window?: unknown }).window;
    queryMock.mockResolvedValue({});

    const fallbackModule = await importApolloClient();
    await expect(fallbackModule.queryGraphQL({} as never, { id: '3' })).resolves.toBeNull();
  });

  it('falls back to the base path when there is no browser or api base url', async () => {
    queryMock.mockResolvedValue({ data: { ok: true } });

    await jest.isolateModulesAsync(async () => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      delete process.env.NEXT_PUBLIC_DEV_API_ORIGIN;
      delete (globalThis as { window?: unknown }).window;
      global.fetch = jest.fn() as unknown as typeof fetch;

      const { queryGraphQL } = await import('@/lib/graphql/apolloClient');
      await expect(queryGraphQL({} as never, { ok: true })).resolves.toEqual({ ok: true });
    });
  });

  it('exports pure endpoint and error helpers for direct branch coverage', async () => {
    const { getGraphQLEndpoint, isLocalHttpOrigin, mapHttpStatusToCode, normalizeApiBaseUrl, toGraphQLAppError } =
      await importApolloClient();

    expect(normalizeApiBaseUrl(' https://api.example.com/// ')).toBe('https://api.example.com');
    expect(normalizeApiBaseUrl(undefined)).toBe('');
    expect(isLocalHttpOrigin('http://localhost:3000')).toBe(true);
    expect(isLocalHttpOrigin('https://127.0.0.1:8080')).toBe(true);
    expect(isLocalHttpOrigin('https://example.com')).toBe(false);

    expect(mapHttpStatusToCode(400)).toBe('BAD_REQUEST');
    expect(mapHttpStatusToCode(401)).toBe('UNAUTHORIZED');
    expect(mapHttpStatusToCode(403)).toBe('FORBIDDEN');
    expect(mapHttpStatusToCode(404)).toBe('NOT_FOUND');
    expect(mapHttpStatusToCode(405)).toBe('METHOD_NOT_ALLOWED');
    expect(mapHttpStatusToCode(409)).toBe('CONFLICT');
    expect(mapHttpStatusToCode(429)).toBe('RATE_LIMITED');
    expect(mapHttpStatusToCode(500)).toBe('INTERNAL_ERROR');
    expect(mapHttpStatusToCode(undefined)).toBe('UNKNOWN_ERROR');

    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://remote.example.com';
    (globalThis as { window?: unknown }).window = {
      location: {
        origin: 'http://localhost:3000',
      },
    };
    expect(getGraphQLEndpoint()).toBe('https://remote.example.com/graphql');

    const graphQLError = {
      errors: [
        {
          message: '',
          extensions: {},
        },
      ],
    };
    const serverError = {
      message: '',
      statusCode: 404,
    };
    const parseError = {
      message: '',
      statusCode: 502,
    };
    combinedGraphQLErrorsIsMock.mockImplementation(error => error === graphQLError);
    serverErrorIsMock.mockImplementation(error => error === serverError);
    serverParseErrorIsMock.mockImplementation(error => error === parseError);

    expect(toGraphQLAppError(graphQLError)).toEqual(
      expect.objectContaining({
        message: 'GraphQL operation failed',
        code: 'GRAPHQL_ERROR',
      }),
    );
    expect(toGraphQLAppError(serverError)).toEqual(
      expect.objectContaining({
        message: 'Server request failed',
        code: 'NOT_FOUND',
      }),
    );
    expect(toGraphQLAppError(parseError)).toEqual(
      expect.objectContaining({
        message: 'Server response parse failed',
        code: 'INTERNAL_ERROR',
      }),
    );
  });

  it('maps graphQL and server errors to app errors and reports them', async () => {
    const graphQLError = {
      errors: [
        {
          message: 'Forbidden',
          extensions: {
            code: 'forbidden',
          },
        },
      ],
    };
    const httpError = {
      message: 'Too many requests',
      statusCode: 429,
    };
    combinedGraphQLErrorsIsMock.mockImplementation(error => error === graphQLError);
    serverErrorIsMock.mockImplementation(error => error === httpError);
    queryMock.mockRejectedValueOnce(graphQLError).mockRejectedValueOnce(httpError);

    const { queryGraphQL } = await importApolloClient();
    const onError = jest.fn();

    await expect(queryGraphQL({} as never, { id: '1' }, { onError })).resolves.toBeNull();
    await expect(queryGraphQL({} as never, { id: '2' }, { onError })).resolves.toBeNull();

    expect(onError).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        code: 'FORBIDDEN',
      }),
    );
    expect(onError).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        code: 'RATE_LIMITED',
      }),
    );
    expect(publishAppErrorMock).toHaveBeenCalledTimes(2);
    expect(reportAppErrorMock).toHaveBeenCalledTimes(2);
  });

  it('maps parse and unknown mutation errors and forwards error-link reports', async () => {
    const parseError = {
      message: 'Parse failed',
      statusCode: 500,
    };
    const genericError = new Error('Boom');
    serverParseErrorIsMock.mockImplementation(error => error === parseError);
    mutateMock.mockRejectedValueOnce(parseError).mockRejectedValueOnce(genericError);

    const { mutateGraphQL } = await importApolloClient();

    await expect(mutateGraphQL({} as never, { id: '1' })).resolves.toBeNull();
    await expect(mutateGraphQL({} as never, { id: '2' })).resolves.toBeNull();

    expect(unknownAppErrorMock).toHaveBeenCalledWith(genericError, 'Network request failed');

    errorLinkHandlers[0]?.({
      error: parseError,
      operation: {
        operationName: 'TestMutation',
      },
    });

    expect(reportAppErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INTERNAL_ERROR',
      }),
      expect.objectContaining({
        source: 'apollo-error-link',
        operationName: 'TestMutation',
      }),
    );
  });

  it('aborts requests when the provided signal is already cancelled', async () => {
    queryMock.mockResolvedValue({ data: { ok: true } });

    const { queryGraphQL } = await importApolloClient();
    const controller = new AbortController();
    controller.abort();

    await queryGraphQL({} as never, { ok: true }, { signal: controller.signal });

    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          fetchOptions: expect.objectContaining({
            signal: expect.objectContaining({
              aborted: true,
            }),
          }),
        }),
      }),
    );
  });

  it('handles abort listeners, missing errors, and null mutation payloads', async () => {
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();
    const signal = {
      aborted: false,
      addEventListener,
      removeEventListener,
    } as unknown as AbortSignal;

    queryMock.mockResolvedValue({ data: { ok: true } });
    mutateMock.mockResolvedValue({});

    const { queryGraphQL, mutateGraphQL } = await importApolloClient();
    await expect(queryGraphQL({} as never, { id: '1' }, { signal })).resolves.toEqual({ ok: true });
    await expect(mutateGraphQL({} as never, { id: '1' }, { signal })).resolves.toBeNull();

    expect(addEventListener).toHaveBeenCalledWith('abort', expect.any(Function), { once: true });
    expect(removeEventListener).toHaveBeenCalledWith('abort', expect.any(Function));

    errorLinkHandlers[0]?.({
      operation: {
        operationName: 'NoErrorOperation',
      },
    });
    expect(reportAppErrorMock).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        operationName: 'NoErrorOperation',
      }),
    );
  });

  it('returns mutation data and handles pre-aborted mutation signals', async () => {
    mutateMock.mockResolvedValue({ data: { ok: true } });

    const { mutateGraphQL } = await importApolloClient();
    const controller = new AbortController();
    controller.abort();

    await expect(mutateGraphQL({} as never, { id: '1' }, { signal: controller.signal })).resolves.toEqual({ ok: true });
    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          fetchOptions: expect.objectContaining({
            signal: expect.objectContaining({
              aborted: true,
            }),
          }),
        }),
      }),
    );
  });

  it('maps abort and service-unavailable failures to app errors', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    const serviceError = {
      message: 'Service unavailable',
      statusCode: 503,
    };
    serverErrorIsMock.mockImplementation(error => error === serviceError);
    queryMock.mockRejectedValueOnce(abortError).mockRejectedValueOnce(serviceError);

    const { queryGraphQL } = await importApolloClient();
    const onError = jest.fn();

    await expect(queryGraphQL({} as never, { id: 'abort' }, { onError })).resolves.toBeNull();
    await expect(queryGraphQL({} as never, { id: 'service' }, { onError })).resolves.toBeNull();

    expect(onError).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        code: 'TIMEOUT',
      }),
    );
    expect(onError).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        code: 'SERVICE_UNAVAILABLE',
      }),
    );
  });
});
/** @jest-environment node */
