import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { withBasePath } from '@/lib/basePath';

type GraphQLOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

const DEFAULT_REQUEST_TIMEOUT_MS = 8000;
const GRAPHQL_PATH = '/graphql';
const DEFAULT_LOCAL_API_ORIGIN = 'http://localhost:8080';

const normalizeApiBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/g, '') ?? '';
const isLocalHttpOrigin = (value: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value);

const getGraphQLEndpoint = () => {
  const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  const localApiOrigin = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_DEV_API_ORIGIN) || DEFAULT_LOCAL_API_ORIGIN;

  if (typeof window !== 'undefined') {
    const browserOrigin = normalizeApiBaseUrl(window.location.origin);
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

const getClient = (endpoint: string) => {
  const cachedClient = clientsByEndpoint.get(endpoint);
  if (cachedClient) {
    return cachedClient;
  }

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: endpoint,
      fetch: globalThis.fetch.bind(globalThis),
    }),
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
  } catch {
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
  } catch {
    return null;
  } finally {
    globalThis.clearTimeout(timeoutId);
    removeAbortListener?.();
  }

  return null;
};
