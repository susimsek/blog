'use client';

import { withBasePath } from '@/lib/basePath';

const ADMIN_GRAPHQL_ENDPOINT = withBasePath('/api/admin/graphql');

type AdminGraphQLResponse<TData> = {
  data?: TData;
  errors?: Array<{
    message?: string;
    extensions?: {
      code?: string;
    };
  }>;
};

type AdminGraphQLError = {
  message?: string;
  extensions?: {
    code?: string;
  };
};

type AdminMePayload = {
  me: {
    authenticated: boolean;
    user: {
      id: string;
      username: string | null;
      email: string;
      roles: string[];
    } | null;
  };
};

type AdminLoginPayload = {
  login: {
    success: boolean;
    user: {
      id: string;
      username: string | null;
      email: string;
      roles: string[];
    } | null;
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
    user: {
      id: string;
      username: string | null;
      email: string;
      roles: string[];
    } | null;
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

class AdminGraphQLRequestError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AdminGraphQLRequestError';
    this.code = code;
  }
}

const extractGraphQLError = (errors: AdminGraphQLResponse<unknown>['errors']) => {
  const firstError = errors?.[0];
  if (!firstError) {
    return null;
  }

  return {
    message: firstError.message?.trim() || 'Admin GraphQL request failed',
    code: firstError.extensions?.code?.trim(),
  };
};

const shouldRetryAdminRefresh = (error: AdminGraphQLError | null) => {
  const normalizedMessage = error?.message?.trim().toLowerCase() ?? '';
  return (
    error?.extensions?.code?.trim() === 'UNAUTHORIZED' &&
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
        username
        email
        roles
      }
    }
  }
`;

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
  const response = await fetch(ADMIN_GRAPHQL_ENDPOINT, {
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

  const payload = (await response.json()) as AdminGraphQLResponse<TData>;
  const error = extractGraphQLError(payload.errors);
  if (!response.ok || error) {
    const isRefreshOperation = query.includes('mutation AdminRefreshSession');
    if (shouldRetryOnUnauthorized && shouldRetryAdminRefresh(payload.errors?.[0] ?? null) && !isRefreshOperation) {
      await executeAdminGraphQL<AdminRefreshPayload>(REFRESH_MUTATION, undefined, { retryOnUnauthorized: false });
      return executeAdminGraphQL<TData, TVariables>(query, variables, { retryOnUnauthorized: false });
    }

    throw new AdminGraphQLRequestError(error?.message ?? 'Admin GraphQL request failed', error?.code || undefined);
  }

  if (!payload.data) {
    throw new Error('Missing admin GraphQL payload');
  }

  return payload.data;
}

export const fetchAdminMe = async () => {
  const query = `
    query AdminMe {
      me {
        authenticated
        user {
          id
          username
          email
          roles
        }
      }
    }
  `;

  let payload = await executeAdminGraphQL<AdminMePayload>(query, undefined, { retryOnUnauthorized: false });
  if (!payload.me.authenticated) {
    try {
      await executeAdminGraphQL<AdminRefreshPayload>(REFRESH_MUTATION, undefined, { retryOnUnauthorized: false });
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
          username
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
