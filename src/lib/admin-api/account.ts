'use client';

import { gql } from '@apollo/client/core';
import { executeAdminGraphQL, refreshAdminSessionOnce } from './core';

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

const ADMIN_USER_FIELDS = `
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
`;

type AdminGoogleAuthStatusPayload = {
  googleAuthStatus: {
    enabled: boolean;
    loginAvailable: boolean;
  };
};

type AdminGithubAuthStatusPayload = {
  githubAuthStatus: {
    enabled: boolean;
    loginAvailable: boolean;
  };
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

type AdminRequestEmailChangePayload = {
  requestEmailChange: {
    success: boolean;
    pendingEmail: string;
    expiresAt: string;
  };
};

type AdminStartGoogleConnectPayload = {
  startGoogleConnect: {
    url: string;
  };
};

type AdminStartGithubConnectPayload = {
  startGithubConnect: {
    url: string;
  };
};

type AdminDisconnectGooglePayload = {
  disconnectGoogle: {
    success: boolean;
    user: AdminUserDTO | null;
  };
};

type AdminDisconnectGithubPayload = {
  disconnectGithub: {
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

const ADMIN_ME_QUERY = gql`
  query AdminMeQuery {
    me {
      authenticated
      user {
        ${ADMIN_USER_FIELDS}
      }
    }
  }
`;

const ADMIN_GOOGLE_AUTH_STATUS_QUERY = gql`
  query AdminGoogleAuthStatusQuery {
    googleAuthStatus {
      enabled
      loginAvailable
    }
  }
`;

const ADMIN_GITHUB_AUTH_STATUS_QUERY = gql`
  query AdminGithubAuthStatusQuery {
    githubAuthStatus {
      enabled
      loginAvailable
    }
  }
`;

const ADMIN_LOGIN_MUTATION = gql`
  mutation AdminLoginMutation($input: AdminLoginInput!) {
    login(input: $input) {
      success
      user {
        ${ADMIN_USER_FIELDS}
      }
    }
  }
`;

const ADMIN_LOGOUT_MUTATION = gql`
  mutation AdminLogoutMutation {
    logout {
      success
    }
  }
`;

const ADMIN_DASHBOARD_QUERY = gql`
  query AdminDashboardQuery {
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
  mutation AdminChangePasswordMutation($input: AdminChangePasswordInput!) {
    changePassword(input: $input) {
      success
    }
  }
`;

const ADMIN_START_GOOGLE_CONNECT_MUTATION = gql`
  mutation AdminStartGoogleConnectMutation($input: AdminStartGoogleConnectInput!) {
    startGoogleConnect(input: $input) {
      url
    }
  }
`;

const ADMIN_START_GITHUB_CONNECT_MUTATION = gql`
  mutation AdminStartGithubConnectMutation($input: AdminStartGithubConnectInput!) {
    startGithubConnect(input: $input) {
      url
    }
  }
`;

const ADMIN_DISCONNECT_GOOGLE_MUTATION = gql`
  mutation AdminDisconnectGoogleMutation {
    disconnectGoogle {
      success
      user {
        ${ADMIN_USER_FIELDS}
      }
    }
  }
`;

const ADMIN_DISCONNECT_GITHUB_MUTATION = gql`
  mutation AdminDisconnectGithubMutation {
    disconnectGithub {
      success
      user {
        ${ADMIN_USER_FIELDS}
      }
    }
  }
`;

const ADMIN_CHANGE_USERNAME_MUTATION = gql`
  mutation AdminChangeUsernameMutation($input: AdminChangeUsernameInput!) {
    changeUsername(input: $input) {
      success
      user {
        ${ADMIN_USER_FIELDS}
      }
    }
  }
`;

const ADMIN_REQUEST_EMAIL_CHANGE_MUTATION = gql`
  mutation AdminRequestEmailChangeMutation($input: AdminRequestEmailChangeInput!) {
    requestEmailChange(input: $input) {
      success
      pendingEmail
      expiresAt
    }
  }
`;

const ADMIN_CHANGE_NAME_MUTATION = gql`
  mutation AdminChangeNameMutation($input: AdminChangeNameInput!) {
    changeName(input: $input) {
      success
      user {
        ${ADMIN_USER_FIELDS}
      }
    }
  }
`;

const ADMIN_CHANGE_AVATAR_MUTATION = gql`
  mutation AdminChangeAvatarMutation($input: AdminChangeAvatarInput!) {
    changeAvatar(input: $input) {
      success
      user {
        ${ADMIN_USER_FIELDS}
      }
    }
  }
`;

const ADMIN_DELETE_ACCOUNT_MUTATION = gql`
  mutation AdminDeleteAccountMutation($input: AdminDeleteAccountInput!) {
    deleteAccount(input: $input) {
      success
    }
  }
`;

const ADMIN_ACTIVE_SESSIONS_QUERY = gql`
  query AdminActiveSessionsQuery {
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
  mutation AdminRevokeSessionMutation($sessionId: ID!) {
    revokeSession(sessionId: $sessionId) {
      success
    }
  }
`;

const ADMIN_REVOKE_ALL_SESSIONS_MUTATION = gql`
  mutation AdminRevokeAllSessionsMutation {
    revokeAllSessions {
      success
    }
  }
`;

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

export const fetchAdminGoogleAuthStatus = async () => {
  const payload = await executeAdminGraphQL<AdminGoogleAuthStatusPayload>(ADMIN_GOOGLE_AUTH_STATUS_QUERY, undefined, {
    retryOnUnauthorized: false,
    operationName: 'AdminGoogleAuthStatus',
  });

  return payload.googleAuthStatus;
};

export const fetchAdminGithubAuthStatus = async () => {
  const payload = await executeAdminGraphQL<AdminGithubAuthStatusPayload>(ADMIN_GITHUB_AUTH_STATUS_QUERY, undefined, {
    retryOnUnauthorized: false,
    operationName: 'AdminGithubAuthStatus',
  });

  return payload.githubAuthStatus;
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

export const startAdminGoogleConnect = async (input: { locale?: string }) => {
  const payload = await executeAdminGraphQL<AdminStartGoogleConnectPayload, { input: { locale?: string } }>(
    ADMIN_START_GOOGLE_CONNECT_MUTATION,
    {
      input: {
        locale: input.locale?.trim().toLowerCase() || undefined,
      },
    },
    { operationName: 'AdminStartGoogleConnect' },
  );

  return payload.startGoogleConnect;
};

export const disconnectAdminGoogle = async () => {
  const payload = await executeAdminGraphQL<AdminDisconnectGooglePayload, Record<string, never>>(
    ADMIN_DISCONNECT_GOOGLE_MUTATION,
    {},
    { operationName: 'AdminDisconnectGoogle' },
  );

  return payload.disconnectGoogle;
};

export const startAdminGithubConnect = async (input: { locale?: string }) => {
  const payload = await executeAdminGraphQL<AdminStartGithubConnectPayload, { input: { locale?: string } }>(
    ADMIN_START_GITHUB_CONNECT_MUTATION,
    {
      input: {
        locale: input.locale?.trim().toLowerCase() || undefined,
      },
    },
    { operationName: 'AdminStartGithubConnect' },
  );

  return payload.startGithubConnect;
};

export const disconnectAdminGithub = async () => {
  const payload = await executeAdminGraphQL<AdminDisconnectGithubPayload, Record<string, never>>(
    ADMIN_DISCONNECT_GITHUB_MUTATION,
    {},
    { operationName: 'AdminDisconnectGithub' },
  );

  return payload.disconnectGithub;
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

export const requestAdminEmailChange = async (input: {
  newEmail: string;
  currentPassword: string;
  locale?: string;
}) => {
  const payload = await executeAdminGraphQL<
    AdminRequestEmailChangePayload,
    {
      input: {
        newEmail: string;
        currentPassword: string;
        locale?: string;
      };
    }
  >(
    ADMIN_REQUEST_EMAIL_CHANGE_MUTATION,
    {
      input: {
        newEmail: input.newEmail.trim().toLowerCase(),
        currentPassword: input.currentPassword,
        locale: input.locale?.trim().toLowerCase() || undefined,
      },
    },
    { operationName: 'AdminRequestEmailChange' },
  );

  return payload.requestEmailChange;
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
