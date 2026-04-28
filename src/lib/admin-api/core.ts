'use client';

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, gql } from '@apollo/client/core';
import type { DocumentNode } from 'graphql';
import { withBasePath } from '@/lib/basePath';
import { defaultLocale } from '@/i18n/settings';
import { AdminGraphQLRequestError, shouldRetryAdminRefresh, toAdminRequestError } from '@/lib/admin-api/errors-core';
export { isAdminSessionError, resolveAdminError, type ResolvedAdminError } from '@/lib/admin-api/errors-core';

const ADMIN_GRAPHQL_ENDPOINT = withBasePath('/api/admin/graphql');

const clientsByEndpoint = new Map<string, ApolloClient>();

type AdminUserDTO = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  email: string;
  pendingEmail: string | null;
  pendingEmailExpiresAt: string | null;
  googleLinked: boolean;
  googleEmail: string | null;
  googleLinkedAt: string | null;
  githubLinked: boolean;
  githubEmail: string | null;
  githubLinkedAt: string | null;
  roles: string[];
};

type AdminRefreshPayload = {
  refreshAdminSession: {
    success: boolean;
    user: AdminUserDTO | null;
  };
};

const ADMIN_REFRESH_MUTATION = gql`
  mutation AdminRefreshSessionMutation {
    refreshAdminSession {
      success
      user {
        id
        name
        username
        avatarUrl
        email
        pendingEmail
        pendingEmailExpiresAt
        googleLinked
        googleEmail
        googleLinkedAt
        githubLinked
        githubEmail
        githubLinkedAt
        roles
      }
    }
  }
`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const getCSRFToken = () => {
  if (typeof document === 'undefined') {
    return '';
  }

  const csrfCookie = document.cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith('admin_csrf='));
  if (!csrfCookie) {
    return '';
  }

  const [, value = ''] = csrfCookie.split('=');
  return decodeURIComponent(value);
};

const resolveAdminRequestLocale = () => {
  if (globalThis.window !== undefined) {
    try {
      const persistedLocale = globalThis.localStorage.getItem('i18nextLng')?.trim().toLowerCase();
      if (persistedLocale) {
        return persistedLocale;
      }
    } catch {
      // Ignore localStorage access errors.
    }
  }

  const htmlLang = globalThis.document?.documentElement?.lang?.trim().toLowerCase() ?? '';
  if (htmlLang) {
    return htmlLang;
  }

  return defaultLocale;
};

const resolveOperationName = (document: DocumentNode) => {
  for (const definition of document.definitions) {
    if (definition.kind === 'OperationDefinition') {
      return normalizeString(definition.name?.value);
    }
  }

  return '';
};

const isMutationDocument = (document: DocumentNode) => {
  for (const definition of document.definitions) {
    if (definition.kind === 'OperationDefinition') {
      return definition.operation === 'mutation';
    }
  }

  return false;
};

const getAdminClient = () => {
  const cachedClient = clientsByEndpoint.get(ADMIN_GRAPHQL_ENDPOINT);
  if (cachedClient) {
    return cachedClient;
  }

  const contextLink = new ApolloLink((operation, forward) => {
    const locale = resolveAdminRequestLocale();
    const csrfToken = isMutationDocument(operation.query) ? getCSRFToken() : '';

    operation.setContext(previousContext => ({
      ...previousContext,
      headers: {
        ...(previousContext?.headers ?? {}),
        'Accept-Language': locale,
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      fetchOptions: {
        ...(isRecord(previousContext?.fetchOptions) ? previousContext.fetchOptions : {}),
        cache: 'no-store',
      },
    }));

    return forward(operation);
  });

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      contextLink,
      new HttpLink({
        uri: ADMIN_GRAPHQL_ENDPOINT,
        fetch: globalThis.fetch.bind(globalThis),
        credentials: 'same-origin',
      }),
    ]),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache',
      },
      mutate: {
        fetchPolicy: 'no-cache',
      },
    },
  });

  clientsByEndpoint.set(ADMIN_GRAPHQL_ENDPOINT, client);
  return client;
};

let inFlightAdminRefresh: Promise<void> | null = null;

export const refreshAdminSessionOnce = async () => {
  inFlightAdminRefresh ??= (async () => {
    try {
      await executeAdminGraphQL<AdminRefreshPayload>(ADMIN_REFRESH_MUTATION, undefined, {
        retryOnUnauthorized: false,
        operationName: 'AdminRefreshSession',
      });
    } finally {
      inFlightAdminRefresh = null;
    }
  })();

  await inFlightAdminRefresh;
};

export async function executeAdminGraphQL<TData, TVariables extends Record<string, unknown> = Record<string, never>>(
  document: DocumentNode,
  variables?: TVariables,
  options: {
    retryOnUnauthorized?: boolean;
    operationName?: string;
  } = {},
): Promise<TData> {
  const client = getAdminClient();
  const shouldRetryOnUnauthorized = options.retryOnUnauthorized ?? true;
  const operationName = options.operationName || resolveOperationName(document);

  try {
    if (isMutationDocument(document)) {
      const result =
        variables === undefined
          ? await client.mutate<TData, Record<string, never>>({
              mutation: document,
            })
          : await client.mutate<TData, TVariables>({
              mutation: document,
              variables,
            });
      if (result.data !== undefined && result.data !== null) {
        return result.data;
      }
      throw new AdminGraphQLRequestError('Missing admin GraphQL payload');
    }

    const result =
      variables === undefined
        ? await client.query<TData, Record<string, never>>({
            query: document,
            fetchPolicy: 'no-cache',
          })
        : await client.query<TData, TVariables>({
            query: document,
            variables,
            fetchPolicy: 'no-cache',
          });
    if (result.data !== undefined && result.data !== null) {
      return result.data;
    }
    throw new AdminGraphQLRequestError('Missing admin GraphQL payload');
  } catch (error) {
    const requestError = toAdminRequestError(error);
    if (shouldRetryOnUnauthorized && shouldRetryAdminRefresh(requestError, operationName)) {
      await refreshAdminSessionOnce();
      return executeAdminGraphQL<TData, TVariables>(document, variables, {
        retryOnUnauthorized: false,
        operationName,
      });
    }

    throw requestError;
  }
}
