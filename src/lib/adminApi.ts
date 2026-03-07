'use client';

import { withBasePath } from '@/lib/basePath';

const ADMIN_GRAPHQL_ENDPOINT = withBasePath('/api/admin/graphql');

type AdminTransportErrorResponse = {
  status?: string;
  code?: string;
  message?: string;
  timestamp?: string;
  requestId?: string;
};

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

class AdminGraphQLRequestError extends Error {
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const fallbackMessageForStatus = (status: number) => {
  if (status === 401) {
    return 'invalid admin session';
  }
  if (status >= 500) {
    return 'admin service unavailable';
  }
  return 'Admin GraphQL request failed';
};

const parseJSONBodySafe = async (response: Response) => {
  const raw = await response.text();
  if (raw.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

const extractGraphQLError = (payload: unknown) => {
  if (!isRecord(payload) || !Array.isArray(payload.errors) || payload.errors.length === 0) {
    return null;
  }

  const firstError = payload.errors[0];
  if (!isRecord(firstError)) {
    return null;
  }

  const extensions = isRecord(firstError.extensions) ? firstError.extensions : null;
  const message = normalizeString(firstError.message) || 'Admin GraphQL request failed';

  return {
    message,
    code: normalizeString(extensions?.code) || undefined,
    requestId: normalizeString(extensions?.requestId) || undefined,
  };
};

const extractTransportError = (payload: unknown, status: number) => {
  if (!isRecord(payload)) {
    return {
      message: fallbackMessageForStatus(status),
      code: undefined,
      requestId: undefined,
    };
  }

  const response = payload as AdminTransportErrorResponse;

  return {
    message: normalizeString(response.message) || fallbackMessageForStatus(status),
    code: normalizeString(response.code) || undefined,
    requestId: normalizeString(response.requestId) || undefined,
  };
};

const isRefreshOperation = (query: string) => query.includes('mutation AdminRefreshSession');

const isLoginOperation = (query: string) => query.includes('mutation AdminLogin');

const shouldRetryAdminRefresh = (error: AdminGraphQLRequestError, query: string) => {
  if (isRefreshOperation(query) || isLoginOperation(query)) {
    return false;
  }
  if (typeof error.status === 'number' && error.status >= 500) {
    return false;
  }

  const normalizedMessage = error.message.trim().toLowerCase();
  const isUnauthorized = error.status === 401 || error.code === 'UNAUTHORIZED';

  return (
    isUnauthorized &&
    (normalizedMessage === 'invalid admin session' || normalizedMessage === 'admin authentication required')
  );
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

const REFRESH_MUTATION = `
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

let inFlightAdminRefresh: Promise<void> | null = null;

const refreshAdminSessionOnce = async () => {
  if (!inFlightAdminRefresh) {
    inFlightAdminRefresh = (async () => {
      try {
        await executeAdminGraphQL<AdminRefreshPayload>(REFRESH_MUTATION, undefined, { retryOnUnauthorized: false });
      } finally {
        inFlightAdminRefresh = null;
      }
    })();
  }

  await inFlightAdminRefresh;
};

async function executeAdminGraphQL<TData, TVariables extends Record<string, unknown> = Record<string, never>>(
  query: string,
  variables?: TVariables,
  options: {
    retryOnUnauthorized?: boolean;
  } = {},
): Promise<TData> {
  const shouldRetryOnUnauthorized = options.retryOnUnauthorized ?? true;
  const isMutation = query.trim().startsWith('mutation');
  const csrfToken = isMutation ? getCSRFToken() : '';

  let response: Response;
  try {
    response = await fetch(ADMIN_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify({
        query,
        variables,
      }),
    });
  } catch (error) {
    const message = error instanceof Error && error.message.trim() !== '' ? error.message.trim() : 'Network error';
    throw new AdminGraphQLRequestError(message, { code: 'NETWORK_ERROR' });
  }

  const payload = await parseJSONBodySafe(response);
  const graphQLError = extractGraphQLError(payload);

  if (!response.ok) {
    const transportError = extractTransportError(payload, response.status);
    const requestError = new AdminGraphQLRequestError(transportError.message, {
      code: transportError.code,
      status: response.status,
      requestId: transportError.requestId,
    });

    if (shouldRetryOnUnauthorized && shouldRetryAdminRefresh(requestError, query)) {
      await refreshAdminSessionOnce();
      return executeAdminGraphQL<TData, TVariables>(query, variables, { retryOnUnauthorized: false });
    }

    throw requestError;
  }

  if (graphQLError) {
    const requestError = new AdminGraphQLRequestError(graphQLError.message, {
      code: graphQLError.code,
      status: response.status,
      requestId: graphQLError.requestId,
    });

    if (shouldRetryOnUnauthorized && shouldRetryAdminRefresh(requestError, query)) {
      await refreshAdminSessionOnce();
      return executeAdminGraphQL<TData, TVariables>(query, variables, { retryOnUnauthorized: false });
    }

    throw requestError;
  }

  if (!isRecord(payload) || !('data' in payload) || payload.data === undefined || payload.data === null) {
    throw new AdminGraphQLRequestError('Missing admin GraphQL payload', { status: response.status });
  }

  return payload.data as TData;
}

export const fetchAdminMe = async () => {
  const query = `
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

  let payload = await executeAdminGraphQL<AdminMePayload>(query, undefined, { retryOnUnauthorized: false });
  if (!payload.me.authenticated) {
    try {
      await refreshAdminSessionOnce();
      payload = await executeAdminGraphQL<AdminMePayload>(query, undefined, { retryOnUnauthorized: false });
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
    `
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
    `,
    {
      input: { email, password, rememberMe },
    },
    {
      retryOnUnauthorized: false,
    },
  );

  return payload.login;
};

export const logoutAdmin = async () => {
  const payload = await executeAdminGraphQL<AdminLogoutPayload>(`
    mutation AdminLogout {
      logout {
        success
      }
    }
  `);

  return payload.logout;
};

export const fetchAdminDashboard = async () => {
  const payload = await executeAdminGraphQL<AdminDashboardPayload>(`
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
  `);

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
  >(
    `
      mutation AdminChangePassword($input: AdminChangePasswordInput!) {
        changePassword(input: $input) {
          success
        }
      }
    `,
    { input },
  );

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
  >(
    `
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
    `,
    { input },
  );

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
  >(
    `
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
    `,
    { input },
  );

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
  >(
    `
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
    `,
    { input },
  );

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
  >(
    `
      mutation AdminDeleteAccount($input: AdminDeleteAccountInput!) {
        deleteAccount(input: $input) {
          success
        }
      }
    `,
    { input },
  );

  return payload.deleteAccount;
};

export const fetchAdminActiveSessions = async () => {
  const payload = await executeAdminGraphQL<AdminActiveSessionsPayload>(`
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
  `);

  return payload.activeSessions;
};

export const revokeAdminSession = async (sessionId: string) => {
  const payload = await executeAdminGraphQL<
    AdminSessionRevokePayload,
    {
      sessionId: string;
    }
  >(
    `
      mutation RevokeAdminSession($sessionId: ID!) {
        revokeSession(sessionId: $sessionId) {
          success
        }
      }
    `,
    { sessionId },
  );

  return payload.revokeSession?.success === true;
};

export const revokeAllAdminSessions = async () => {
  const payload = await executeAdminGraphQL<AdminSessionRevokePayload>(`
    mutation RevokeAllAdminSessions {
      revokeAllSessions {
        success
      }
    }
  `);

  return payload.revokeAllSessions?.success === true;
};
