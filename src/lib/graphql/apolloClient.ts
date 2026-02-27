import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client/core';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client/errors';
import { withBasePath } from '@/lib/basePath';
import { AppError, AppErrorCode, publishAppError, reportAppError, unknownAppError } from '@/lib/errors/appError';

type GraphQLOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  onError?: (error: AppError) => void;
};

const DEFAULT_REQUEST_TIMEOUT_MS = 8000;
const GRAPHQL_PATH = '/graphql';
const DEFAULT_LOCAL_API_ORIGIN = 'http://localhost:8080';

export const normalizeApiBaseUrl = (value: string | undefined) => value?.trim().replaceAll(/\/+$/g, '') ?? '';
export const isLocalHttpOrigin = (value: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value);

export const getGraphQLEndpoint = () => {
  const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  const localApiOrigin = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_DEV_API_ORIGIN) || DEFAULT_LOCAL_API_ORIGIN;

  if (globalThis.window !== undefined) {
    const browserOrigin = normalizeApiBaseUrl(globalThis.window.location.origin);
    const shouldUseLocalApiOrigin =
      isLocalHttpOrigin(browserOrigin) && (apiBaseUrl.length === 0 || apiBaseUrl === browserOrigin);

    if (shouldUseLocalApiOrigin) {
      return `${localApiOrigin}${GRAPHQL_PATH}`;
    }
  }

  if (apiBaseUrl.length > 0) {
    return `${apiBaseUrl}${GRAPHQL_PATH}`;
  }

  return withBasePath(GRAPHQL_PATH);
};

const clientsByEndpoint = new Map<string, ApolloClient>();

export const mapHttpStatusToCode = (status?: number): AppErrorCode => {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 405) return 'METHOD_NOT_ALLOWED';
  if (status === 409) return 'CONFLICT';
  if (status === 429) return 'RATE_LIMITED';
  if (status === 503) return 'SERVICE_UNAVAILABLE';
  if (typeof status === 'number' && status >= 500) return 'INTERNAL_ERROR';
  return 'UNKNOWN_ERROR';
};

export const toGraphQLAppError = (error: unknown): AppError => {
  if (CombinedGraphQLErrors.is(error)) {
    const primary = error.errors[0];
    const extensionCode = typeof primary?.extensions?.code === 'string' ? primary.extensions.code.toUpperCase() : '';
    const message = primary?.message || 'GraphQL operation failed';
    return new AppError(message, (extensionCode || 'GRAPHQL_ERROR') as AppErrorCode, undefined, error.errors);
  }

  if (ServerError.is(error)) {
    const statusCode = error.statusCode ?? undefined;
    return new AppError(error.message || 'Server request failed', mapHttpStatusToCode(statusCode), statusCode, error);
  }

  if (ServerParseError.is(error)) {
    return new AppError(error.message || 'Server response parse failed', 'INTERNAL_ERROR', error.statusCode, error);
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AppError('Request aborted', 'TIMEOUT', undefined, error);
  }

  return unknownAppError(error, 'Network request failed');
};

const notifyGraphQLError = (error: AppError, options: GraphQLOptions, operationName?: string) => {
  options.onError?.(error);
  const context = {
    source: 'apollo-client',
    operationName,
  };
  publishAppError(error, context);
  reportAppError(error, context);
};

const getClient = (endpoint: string) => {
  const cachedClient = clientsByEndpoint.get(endpoint);
  if (cachedClient) {
    return cachedClient;
  }

  const errorLink = new ErrorLink(({ error, operation }) => {
    if (!error) {
      return;
    }

    const appError = toGraphQLAppError(error);
    reportAppError(appError, {
      source: 'apollo-error-link',
      operationName: operation.operationName,
    });
  });

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      errorLink,
      new HttpLink({
        uri: endpoint,
        fetch: globalThis.fetch.bind(globalThis),
      }),
    ]),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache',
      },
    },
  });

  clientsByEndpoint.set(endpoint, client);
  return client;
};

export const queryGraphQL = async <TData, TVariables extends Record<string, unknown>>(
  query: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  options: GraphQLOptions = {},
): Promise<TData | null> => {
  const endpoint = getGraphQLEndpoint();
  const client = getClient(endpoint);
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  let removeAbortListener: (() => void) | undefined;
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      const onAbort = () => controller.abort();
      options.signal.addEventListener('abort', onAbort, { once: true });
      removeAbortListener = () => options.signal?.removeEventListener('abort', onAbort);
    }
  }

  try {
    const result = await client.query<TData, TVariables>({
      query,
      variables,
      context: {
        fetchOptions: {
          signal: controller.signal,
        },
      },
    });
    if (result.data) {
      return result.data as TData;
    }
  } catch (error) {
    notifyGraphQLError(toGraphQLAppError(error), options);
    return null;
  } finally {
    globalThis.clearTimeout(timeoutId);
    removeAbortListener?.();
  }

  return null;
};

export const mutateGraphQL = async <TData, TVariables extends Record<string, unknown>>(
  mutation: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  options: GraphQLOptions = {},
): Promise<TData | null> => {
  const endpoint = getGraphQLEndpoint();
  const client = getClient(endpoint);
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  let removeAbortListener: (() => void) | undefined;
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      const onAbort = () => controller.abort();
      options.signal.addEventListener('abort', onAbort, { once: true });
      removeAbortListener = () => options.signal?.removeEventListener('abort', onAbort);
    }
  }

  try {
    const result = await client.mutate<TData, TVariables>({
      mutation,
      variables,
      context: {
        fetchOptions: {
          signal: controller.signal,
        },
      },
    });
    if (result.data) {
      return result.data as TData;
    }
  } catch (error) {
    notifyGraphQLError(toGraphQLAppError(error), options);
    return null;
  } finally {
    globalThis.clearTimeout(timeoutId);
    removeAbortListener?.();
  }

  return null;
};
