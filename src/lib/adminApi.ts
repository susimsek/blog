'use client';

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, gql } from '@apollo/client/core';
import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client/errors';
import type { DocumentNode } from 'graphql';
import { withBasePath } from '@/lib/basePath';
import { defaultLocale } from '@/i18n/settings';

const ADMIN_GRAPHQL_ENDPOINT = withBasePath('/api/admin/graphql');
const ADMIN_ERROR_FALLBACK_MESSAGE = 'Admin GraphQL request failed';
const ADMIN_NETWORK_ERROR_CODE = 'NETWORK_ERROR';
const clientsByEndpoint = new Map<string, ApolloClient>();

type AdminUserDTO = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  email: string;
  roles: string[];
};

type AdminMePayload = {
  me: {
    authenticated: boolean;
    user: AdminUserDTO | null;
  };
};

type AdminLoginPayload = {
  login: {
    success: boolean;
    user: AdminUserDTO | null;
  };
};

type AdminLogoutPayload = {
  logout: {
    success: boolean;
  };
};

type AdminRefreshPayload = {
  refreshAdminSession: {
    success: boolean;
    user: AdminUserDTO | null;
  };
};

type AdminDashboardPayload = {
  dashboard: {
    totalPosts: number;
    totalSubscribers: number;
    contentHealth: {
      localePairCoverage: number;
      missingTranslations: number;
      missingThumbnails: number;
      latestUpdatedPosts: Array<{
        id: string;
        title: string;
        date: string;
        category: string;
      }>;
      dominantCategory: {
        id: string;
        name: string;
        count: number;
      } | null;
    };
    topViewedPosts: Array<{
      postId: string;
      title: string;
      locale: string;
      publishedDate: string;
      hits: number;
      likes: number;
    }>;
    topLikedPosts: Array<{
      postId: string;
      title: string;
      locale: string;
      publishedDate: string;
      hits: number;
      likes: number;
    }>;
  };
};

type AdminChangePasswordPayload = {
  changePassword: {
    success: boolean;
  };
};

type AdminChangeUsernamePayload = {
  changeUsername: {
    success: boolean;
    user: AdminUserDTO | null;
  };
};

type AdminChangeNamePayload = {
  changeName: {
    success: boolean;
    user: AdminUserDTO | null;
  };
};

type AdminChangeAvatarPayload = {
  changeAvatar: {
    success: boolean;
    user: AdminUserDTO | null;
  };
};

type AdminDeleteAccountPayload = {
  deleteAccount: {
    success: boolean;
  };
};

type AdminSession = {
  id: string;
  device: string;
  ipAddress: string;
  countryCode: string;
  lastActivityAt: string;
  createdAt: string;
  expiresAt: string;
  persistent: boolean;
  current: boolean;
};

type AdminActiveSessionsPayload = {
  activeSessions: AdminSession[];
};

type AdminSessionRevokePayload = {
  revokeSession?: {
    success: boolean;
  };
  revokeAllSessions?: {
    success: boolean;
  };
};

export class AdminGraphQLRequestError extends Error {
  code?: string;
  status?: number;
  requestId?: string;

  constructor(message: string, options?: { code?: string; status?: number; requestId?: string }) {
    super(message);
    this.name = 'AdminGraphQLRequestError';
    this.code = options?.code;
    this.status = options?.status;
    this.requestId = options?.requestId;
  }
}

const ADMIN_ME_QUERY = gql`
  query AdminMe {
    me {
      authenticated
      user {
        id
        name
        username
        avatarUrl
        email
        roles
      }
    }
  }
`;

const ADMIN_LOGIN_MUTATION = gql`
  mutation AdminLogin($input: AdminLoginInput!) {
    login(input: $input) {
      success
      user {
        id
        name
        username
        avatarUrl
        email
        roles
      }
    }
  }
`;

const ADMIN_LOGOUT_MUTATION = gql`
  mutation AdminLogout {
    logout {
      success
    }
  }
`;

const ADMIN_REFRESH_MUTATION = gql`
  mutation AdminRefreshSession {
    refreshAdminSession {
      success
      user {
        id
        name
        username
        avatarUrl
        email
        roles
      }
    }
  }
`;

const ADMIN_DASHBOARD_QUERY = gql`
  query AdminDashboard {
    dashboard {
      totalPosts
      totalSubscribers
      contentHealth {
        localePairCoverage
        missingTranslations
        missingThumbnails
        latestUpdatedPosts {
          id
          title
          date
          category
        }
        dominantCategory {
          id
          name
          count
        }
      }
      topViewedPosts {
        postId
        title
        locale
        publishedDate
        hits
        likes
      }
      topLikedPosts {
        postId
        title
        locale
        publishedDate
        hits
        likes
      }
    }
  }
`;

const ADMIN_CHANGE_PASSWORD_MUTATION = gql`
  mutation AdminChangePassword($input: AdminChangePasswordInput!) {
    changePassword(input: $input) {
      success
    }
  }
`;

const ADMIN_CHANGE_USERNAME_MUTATION = gql`
  mutation AdminChangeUsername($input: AdminChangeUsernameInput!) {
    changeUsername(input: $input) {
      success
      user {
        id
        name
        username
        avatarUrl
        email
        roles
      }
    }
  }
`;

const ADMIN_CHANGE_NAME_MUTATION = gql`
  mutation AdminChangeName($input: AdminChangeNameInput!) {
    changeName(input: $input) {
      success
      user {
        id
        name
        username
        avatarUrl
        email
        roles
      }
    }
  }
`;

const ADMIN_CHANGE_AVATAR_MUTATION = gql`
  mutation AdminChangeAvatar($input: AdminChangeAvatarInput!) {
    changeAvatar(input: $input) {
      success
      user {
        id
        name
        username
        avatarUrl
        email
        roles
      }
    }
  }
`;

const ADMIN_DELETE_ACCOUNT_MUTATION = gql`
  mutation AdminDeleteAccount($input: AdminDeleteAccountInput!) {
    deleteAccount(input: $input) {
      success
    }
  }
`;

const ADMIN_ACTIVE_SESSIONS_QUERY = gql`
  query AdminActiveSessions {
    activeSessions {
      id
      device
      ipAddress
      countryCode
      lastActivityAt
      createdAt
      expiresAt
      persistent
      current
    }
  }
`;

const ADMIN_REVOKE_SESSION_MUTATION = gql`
  mutation RevokeAdminSession($sessionId: ID!) {
    revokeSession(sessionId: $sessionId) {
      success
    }
  }
`;

const ADMIN_REVOKE_ALL_SESSIONS_MUTATION = gql`
  mutation RevokeAllAdminSessions {
    revokeAllSessions {
      success
    }
  }
`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const normalizeCode = (value: unknown) => normalizeString(value).toUpperCase();

type AdminErrorKind = 'session_expired' | 'network' | 'unknown';

type AdminErrorDescriptor = {
  message: string;
  code?: string;
  requestId?: string;
  status?: number;
};

type ResolvedAdminError = {
  kind: AdminErrorKind;
  message: string;
  code?: string;
  requestId?: string;
  status?: number;
};

const resolveAdminErrorKind = (descriptor: AdminErrorDescriptor): AdminErrorKind => {
  const normalizedCode = normalizeCode(descriptor.code);
  const status = descriptor.status;

  if (normalizedCode === ADMIN_NETWORK_ERROR_CODE) {
    return 'network';
  }
  if (
    normalizedCode === 'ADMIN_SESSION_INVALID' ||
    normalizedCode === 'ADMIN_AUTH_REQUIRED' ||
    normalizedCode === 'UNAUTHORIZED'
  ) {
    return 'session_expired';
  }
  if (status === 401) {
    return 'session_expired';
  }

  return 'unknown';
};

const normalizeAdminErrorDescriptor = (descriptor: AdminErrorDescriptor): ResolvedAdminError => {
  const kind = resolveAdminErrorKind(descriptor);
  const normalizedCode = normalizeCode(descriptor.code) || undefined;
  const fallbackMessage = descriptor.message || ADMIN_ERROR_FALLBACK_MESSAGE;

  return {
    kind,
    message: fallbackMessage,
    code: normalizedCode,
    requestId: descriptor.requestId,
    status: descriptor.status,
  };
};

export const resolveAdminError = (error: unknown): ResolvedAdminError => {
  if (error instanceof AdminGraphQLRequestError) {
    return normalizeAdminErrorDescriptor({
      message: normalizeString(error.message),
      code: error.code,
      requestId: error.requestId,
      status: error.status,
    });
  }

  if (error instanceof Error) {
    return normalizeAdminErrorDescriptor({
      message: normalizeString(error.message),
    });
  }

  return normalizeAdminErrorDescriptor({
    message: ADMIN_ERROR_FALLBACK_MESSAGE,
  });
};

export const isAdminSessionError = (error: unknown) => resolveAdminError(error).kind === 'session_expired';

const shouldRetryAdminRefresh = (error: AdminGraphQLRequestError, operationName: string) => {
  if (operationName === 'AdminRefreshSession' || operationName === 'AdminLogin') {
    return false;
  }
  if (typeof error.status === 'number' && error.status >= 500) {
    return false;
  }

  const resolved = resolveAdminError(error);
  return resolved.kind === 'session_expired';
};

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

const resolveAdminErrorFromPayload = (payload: unknown, status?: number, fallbackRequestId = '') => {
  if (!isRecord(payload)) {
    return null;
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const firstError = payload.errors[0];
    if (isRecord(firstError)) {
      const extensions = isRecord(firstError.extensions) ? firstError.extensions : null;
      return normalizeAdminErrorDescriptor({
        message: normalizeString(firstError.message) || ADMIN_ERROR_FALLBACK_MESSAGE,
        code: normalizeString(extensions?.code) || undefined,
        requestId: normalizeString(extensions?.requestId) || fallbackRequestId || undefined,
        status,
      });
    }
  }

  const message = normalizeString(payload.message);
  const code = normalizeString(payload.code);
  const requestId = normalizeString(payload.requestId) || fallbackRequestId;
  if (message === '' && code === '' && requestId === '') {
    return null;
  }

  return normalizeAdminErrorDescriptor({
    message: message || ADMIN_ERROR_FALLBACK_MESSAGE,
    code: code || undefined,
    requestId: requestId || undefined,
    status,
  });
};

const toAdminRequestError = (error: unknown): AdminGraphQLRequestError => {
  if (error instanceof AdminGraphQLRequestError) {
    return error;
  }

  if (CombinedGraphQLErrors.is(error)) {
    const primary = error.errors[0];
    const extensions = isRecord(primary?.extensions) ? primary.extensions : null;
    const statusFromExtensions =
      typeof extensions?.httpStatus === 'number'
        ? extensions.httpStatus
        : typeof extensions?.http_status === 'number'
          ? extensions.http_status
          : undefined;
    const descriptor = normalizeAdminErrorDescriptor({
      message: normalizeString(primary?.message) || ADMIN_ERROR_FALLBACK_MESSAGE,
      code: normalizeString(extensions?.code) || undefined,
      requestId: normalizeString(extensions?.requestId) || undefined,
      status: statusFromExtensions,
    });
    return new AdminGraphQLRequestError(descriptor.message, {
      code: descriptor.code,
      status: descriptor.status,
      requestId: descriptor.requestId,
    });
  }

  if (ServerError.is(error)) {
    const requestId = normalizeString(error.response?.headers.get('X-Request-ID'));
    let serverPayload: unknown = null;
    const bodyText = normalizeString(error.bodyText);
    if (bodyText !== '') {
      try {
        serverPayload = JSON.parse(bodyText) as unknown;
      } catch {
        serverPayload = null;
      }
    }
    const descriptor =
      resolveAdminErrorFromPayload(serverPayload, error.statusCode, requestId) ??
      normalizeAdminErrorDescriptor({
        message: normalizeString(error.message) || ADMIN_ERROR_FALLBACK_MESSAGE,
        requestId: requestId || undefined,
        status: error.statusCode,
      });
    return new AdminGraphQLRequestError(descriptor.message, {
      code: descriptor.code,
      status: descriptor.status,
      requestId: descriptor.requestId,
    });
  }

  if (ServerParseError.is(error)) {
    const descriptor = normalizeAdminErrorDescriptor({
      message: normalizeString(error.message) || ADMIN_ERROR_FALLBACK_MESSAGE,
      status: error.statusCode,
    });
    return new AdminGraphQLRequestError(descriptor.message, {
      code: descriptor.code,
      status: descriptor.status,
      requestId: descriptor.requestId,
    });
  }

  if (error instanceof Error) {
    const descriptor = normalizeAdminErrorDescriptor({
      message: normalizeString(error.message) || 'Network error',
      code: ADMIN_NETWORK_ERROR_CODE,
    });
    return new AdminGraphQLRequestError(descriptor.message, {
      code: descriptor.code,
      status: descriptor.status,
      requestId: descriptor.requestId,
    });
  }

  const descriptor = normalizeAdminErrorDescriptor({
    message: ADMIN_ERROR_FALLBACK_MESSAGE,
    code: ADMIN_NETWORK_ERROR_CODE,
  });
  return new AdminGraphQLRequestError(descriptor.message, {
    code: descriptor.code,
    status: descriptor.status,
    requestId: descriptor.requestId,
  });
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

const refreshAdminSessionOnce = async () => {
  if (!inFlightAdminRefresh) {
    inFlightAdminRefresh = (async () => {
      try {
        await executeAdminGraphQL<AdminRefreshPayload>(ADMIN_REFRESH_MUTATION, undefined, {
          retryOnUnauthorized: false,
          operationName: 'AdminRefreshSession',
        });
      } finally {
        inFlightAdminRefresh = null;
      }
    })();
  }

  await inFlightAdminRefresh;
};

async function executeAdminGraphQL<TData, TVariables extends Record<string, unknown> = Record<string, never>>(
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

export const fetchAdminMe = async () => {
  let payload = await executeAdminGraphQL<AdminMePayload>(ADMIN_ME_QUERY, undefined, {
    retryOnUnauthorized: false,
    operationName: 'AdminMe',
  });
  if (!payload.me.authenticated) {
    try {
      await refreshAdminSessionOnce();
      payload = await executeAdminGraphQL<AdminMePayload>(ADMIN_ME_QUERY, undefined, {
        retryOnUnauthorized: false,
        operationName: 'AdminMe',
      });
    } catch {
      return payload.me;
    }
  }

  return payload.me;
};

export const loginAdmin = async (email: string, password: string, rememberMe = false) => {
  const payload = await executeAdminGraphQL<
    AdminLoginPayload,
    { input: { email: string; password: string; rememberMe: boolean } }
  >(
    ADMIN_LOGIN_MUTATION,
    {
      input: { email, password, rememberMe },
    },
    {
      retryOnUnauthorized: false,
      operationName: 'AdminLogin',
    },
  );

  return payload.login;
};

export const logoutAdmin = async () => {
  const payload = await executeAdminGraphQL<AdminLogoutPayload>(ADMIN_LOGOUT_MUTATION, undefined, {
    operationName: 'AdminLogout',
  });

  return payload.logout;
};

export const fetchAdminDashboard = async () => {
  const payload = await executeAdminGraphQL<AdminDashboardPayload>(ADMIN_DASHBOARD_QUERY, undefined, {
    operationName: 'AdminDashboard',
  });

  return payload.dashboard;
};

export const changeAdminPassword = async (input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  const payload = await executeAdminGraphQL<
    AdminChangePasswordPayload,
    {
      input: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
      };
    }
  >(ADMIN_CHANGE_PASSWORD_MUTATION, { input }, { operationName: 'AdminChangePassword' });

  return payload.changePassword;
};

export const changeAdminUsername = async (input: { newUsername: string }) => {
  const payload = await executeAdminGraphQL<
    AdminChangeUsernamePayload,
    {
      input: {
        newUsername: string;
      };
    }
  >(ADMIN_CHANGE_USERNAME_MUTATION, { input }, { operationName: 'AdminChangeUsername' });

  return payload.changeUsername;
};

export const changeAdminName = async (input: { name: string }) => {
  const payload = await executeAdminGraphQL<
    AdminChangeNamePayload,
    {
      input: {
        name: string;
      };
    }
  >(ADMIN_CHANGE_NAME_MUTATION, { input }, { operationName: 'AdminChangeName' });

  return payload.changeName;
};

export const changeAdminAvatar = async (input: { avatarUrl?: string | null }) => {
  const payload = await executeAdminGraphQL<
    AdminChangeAvatarPayload,
    {
      input: {
        avatarUrl?: string | null;
      };
    }
  >(ADMIN_CHANGE_AVATAR_MUTATION, { input }, { operationName: 'AdminChangeAvatar' });

  return payload.changeAvatar;
};

export const deleteAdminAccount = async (input: { currentPassword: string }) => {
  const payload = await executeAdminGraphQL<
    AdminDeleteAccountPayload,
    {
      input: {
        currentPassword: string;
      };
    }
  >(ADMIN_DELETE_ACCOUNT_MUTATION, { input }, { operationName: 'AdminDeleteAccount' });

  return payload.deleteAccount;
};

export const fetchAdminActiveSessions = async () => {
  const payload = await executeAdminGraphQL<AdminActiveSessionsPayload>(ADMIN_ACTIVE_SESSIONS_QUERY, undefined, {
    operationName: 'AdminActiveSessions',
  });

  return payload.activeSessions;
};

export const revokeAdminSession = async (sessionId: string) => {
  const payload = await executeAdminGraphQL<
    AdminSessionRevokePayload,
    {
      sessionId: string;
    }
  >(ADMIN_REVOKE_SESSION_MUTATION, { sessionId }, { operationName: 'RevokeAdminSession' });

  return payload.revokeSession?.success === true;
};

export const revokeAllAdminSessions = async () => {
  const payload = await executeAdminGraphQL<AdminSessionRevokePayload>(ADMIN_REVOKE_ALL_SESSIONS_MUTATION, undefined, {
    operationName: 'RevokeAllAdminSessions',
  });

  return payload.revokeAllSessions?.success === true;
};
