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

export type AdminContentPostItem = {
  locale: string;
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  contentMode: string | null;
  thumbnail: string | null;
  source: string;
  publishedDate: string;
  updatedDate: string | null;
  categoryId: string | null;
  categoryName: string | null;
  topicIds: string[];
  topicNames: string[];
  contentUpdatedAt: string | null;
  updatedAt: string | null;
};

export type AdminContentPostGroupItem = {
  id: string;
  source: string;
  preferred: AdminContentPostItem;
  en: AdminContentPostItem | null;
  tr: AdminContentPostItem | null;
};

export type AdminContentTopicItem = {
  locale: string;
  id: string;
  name: string;
  color: string;
  link: string | null;
  updatedAt: string | null;
};

export type AdminContentTopicGroupItem = {
  id: string;
  preferred: AdminContentTopicItem;
  en: AdminContentTopicItem | null;
  tr: AdminContentTopicItem | null;
};

export type AdminContentCategoryItem = {
  locale: string;
  id: string;
  name: string;
  color: string;
  icon: string | null;
  link: string | null;
  updatedAt: string | null;
};

export type AdminContentCategoryGroupItem = {
  id: string;
  preferred: AdminContentCategoryItem;
  en: AdminContentCategoryItem | null;
  tr: AdminContentCategoryItem | null;
};

type AdminContentPostsPayload = {
  contentPosts: {
    items: AdminContentPostGroupItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminContentPostPayload = {
  contentPost: AdminContentPostItem | null;
};

type AdminContentTopicsPayload = {
  contentTopics: AdminContentTopicItem[];
};

type AdminContentCategoriesPayload = {
  contentCategories: AdminContentCategoryItem[];
};

type AdminContentTopicsPagePayload = {
  contentTopicsPage: {
    items: AdminContentTopicGroupItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminContentCategoriesPagePayload = {
  contentCategoriesPage: {
    items: AdminContentCategoryGroupItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminUpdateContentPostMetadataPayload = {
  updateContentPostMetadata: AdminContentPostItem;
};

type AdminUpdateContentPostContentPayload = {
  updateContentPostContent: AdminContentPostItem;
};

type AdminDeleteContentPostPayload = {
  deleteContentPost: {
    success: boolean;
  };
};

type AdminCreateContentTopicPayload = {
  createContentTopic: AdminContentTopicItem;
};

type AdminUpdateContentTopicPayload = {
  updateContentTopic: AdminContentTopicItem;
};

type AdminDeleteContentTopicPayload = {
  deleteContentTopic: {
    success: boolean;
  };
};

type AdminCreateContentCategoryPayload = {
  createContentCategory: AdminContentCategoryItem;
};

type AdminUpdateContentCategoryPayload = {
  updateContentCategory: AdminContentCategoryItem;
};

type AdminDeleteContentCategoryPayload = {
  deleteContentCategory: {
    success: boolean;
  };
};

export type AdminErrorMessageItem = {
  scope: string;
  locale: string;
  code: string;
  message: string;
  updatedAt: string | null;
};

export type AdminErrorMessageAuditLog = {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  scope: string;
  locale: string;
  code: string;
  beforeValue: string;
  afterValue: string;
  status: string;
  failureCode: string | null;
  requestId: string | null;
  remoteIp: string | null;
  countryCode: string | null;
  userAgent: string | null;
  createdAt: string;
};

type AdminErrorMessagesPayload = {
  errorMessages: {
    items: AdminErrorMessageItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminErrorMessageAuditLogsPayload = {
  errorMessageAuditLogs: AdminErrorMessageAuditLog[];
};

type AdminCreateErrorMessagePayload = {
  createErrorMessage: AdminErrorMessageItem;
};

type AdminUpdateErrorMessagePayload = {
  updateErrorMessage: AdminErrorMessageItem;
};

type AdminDeleteErrorMessagePayload = {
  deleteErrorMessage: {
    success: boolean;
  };
};

export type AdminNewsletterSubscriberItem = {
  email: string;
  locale: string;
  status: 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';
  tags: string[];
  formName: string | null;
  source: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
};

type AdminNewsletterSubscribersPayload = {
  newsletterSubscribers: {
    items: AdminNewsletterSubscriberItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminUpdateNewsletterSubscriberStatusPayload = {
  updateNewsletterSubscriberStatus: AdminNewsletterSubscriberItem;
};

type AdminDeleteNewsletterSubscriberPayload = {
  deleteNewsletterSubscriber: {
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

const ADMIN_CONTENT_POSTS_QUERY = gql`
  query AdminContentPosts($filter: AdminContentPostFilterInput) {
    contentPosts(filter: $filter) {
      items {
        id
        source
        preferred {
          locale
          id
          title
          summary
          content
          contentMode
          thumbnail
          source
          publishedDate
          updatedDate
          categoryId
          categoryName
          topicIds
          topicNames
          contentUpdatedAt
          updatedAt
        }
        en {
          locale
          id
          title
          summary
          content
          contentMode
          thumbnail
          source
          publishedDate
          updatedDate
          categoryId
          categoryName
          topicIds
          topicNames
          contentUpdatedAt
          updatedAt
        }
        tr {
          locale
          id
          title
          summary
          content
          contentMode
          thumbnail
          source
          publishedDate
          updatedDate
          categoryId
          categoryName
          topicIds
          topicNames
          contentUpdatedAt
          updatedAt
        }
      }
      total
      page
      size
    }
  }
`;

const ADMIN_CONTENT_POST_QUERY = gql`
  query AdminContentPost($input: AdminContentEntityKeyInput!) {
    contentPost(input: $input) {
      locale
      id
      title
      summary
      content
      contentMode
      thumbnail
      source
      publishedDate
      updatedDate
      categoryId
      categoryName
      topicIds
      topicNames
      contentUpdatedAt
      updatedAt
    }
  }
`;

const ADMIN_CONTENT_TOPICS_QUERY = gql`
  query AdminContentTopics($locale: String) {
    contentTopics(locale: $locale) {
      locale
      id
      name
      color
      link
      updatedAt
    }
  }
`;

const ADMIN_CONTENT_CATEGORIES_QUERY = gql`
  query AdminContentCategories($locale: String) {
    contentCategories(locale: $locale) {
      locale
      id
      name
      color
      icon
      link
      updatedAt
    }
  }
`;

const ADMIN_CONTENT_TOPICS_PAGE_QUERY = gql`
  query AdminContentTopicsPage($filter: AdminContentTaxonomyFilterInput) {
    contentTopicsPage(filter: $filter) {
      items {
        id
        preferred {
          locale
          id
          name
          color
          link
          updatedAt
        }
        en {
          locale
          id
          name
          color
          link
          updatedAt
        }
        tr {
          locale
          id
          name
          color
          link
          updatedAt
        }
      }
      total
      page
      size
    }
  }
`;

const ADMIN_CONTENT_CATEGORIES_PAGE_QUERY = gql`
  query AdminContentCategoriesPage($filter: AdminContentTaxonomyFilterInput) {
    contentCategoriesPage(filter: $filter) {
      items {
        id
        preferred {
          locale
          id
          name
          color
          icon
          link
          updatedAt
        }
        en {
          locale
          id
          name
          color
          icon
          link
          updatedAt
        }
        tr {
          locale
          id
          name
          color
          icon
          link
          updatedAt
        }
      }
      total
      page
      size
    }
  }
`;

const ADMIN_UPDATE_CONTENT_POST_METADATA_MUTATION = gql`
  mutation AdminUpdateContentPostMetadata($input: AdminUpdateContentPostMetadataInput!) {
    updateContentPostMetadata(input: $input) {
      locale
      id
      title
      summary
      content
      contentMode
      thumbnail
      source
      publishedDate
      updatedDate
      categoryId
      categoryName
      topicIds
      topicNames
      contentUpdatedAt
      updatedAt
    }
  }
`;

const ADMIN_UPDATE_CONTENT_POST_CONTENT_MUTATION = gql`
  mutation AdminUpdateContentPostContent($input: AdminUpdateContentPostContentInput!) {
    updateContentPostContent(input: $input) {
      locale
      id
      title
      summary
      content
      contentMode
      thumbnail
      source
      publishedDate
      updatedDate
      categoryId
      categoryName
      topicIds
      topicNames
      contentUpdatedAt
      updatedAt
    }
  }
`;

const ADMIN_DELETE_CONTENT_POST_MUTATION = gql`
  mutation AdminDeleteContentPost($input: AdminContentEntityKeyInput!) {
    deleteContentPost(input: $input) {
      success
    }
  }
`;

const ADMIN_CREATE_CONTENT_TOPIC_MUTATION = gql`
  mutation AdminCreateContentTopic($input: AdminContentTopicInput!) {
    createContentTopic(input: $input) {
      locale
      id
      name
      color
      link
      updatedAt
    }
  }
`;

const ADMIN_UPDATE_CONTENT_TOPIC_MUTATION = gql`
  mutation AdminUpdateContentTopic($input: AdminContentTopicInput!) {
    updateContentTopic(input: $input) {
      locale
      id
      name
      color
      link
      updatedAt
    }
  }
`;

const ADMIN_DELETE_CONTENT_TOPIC_MUTATION = gql`
  mutation AdminDeleteContentTopic($input: AdminContentEntityKeyInput!) {
    deleteContentTopic(input: $input) {
      success
    }
  }
`;

const ADMIN_CREATE_CONTENT_CATEGORY_MUTATION = gql`
  mutation AdminCreateContentCategory($input: AdminContentCategoryInput!) {
    createContentCategory(input: $input) {
      locale
      id
      name
      color
      icon
      link
      updatedAt
    }
  }
`;

const ADMIN_UPDATE_CONTENT_CATEGORY_MUTATION = gql`
  mutation AdminUpdateContentCategory($input: AdminContentCategoryInput!) {
    updateContentCategory(input: $input) {
      locale
      id
      name
      color
      icon
      link
      updatedAt
    }
  }
`;

const ADMIN_DELETE_CONTENT_CATEGORY_MUTATION = gql`
  mutation AdminDeleteContentCategory($input: AdminContentEntityKeyInput!) {
    deleteContentCategory(input: $input) {
      success
    }
  }
`;

const ADMIN_ERROR_MESSAGES_QUERY = gql`
  query AdminErrorMessages($filter: AdminErrorMessageFilterInput) {
    errorMessages(filter: $filter) {
      items {
        scope
        locale
        code
        message
        updatedAt
      }
      total
      page
      size
    }
  }
`;

const ADMIN_ERROR_MESSAGE_AUDIT_LOGS_QUERY = gql`
  query AdminErrorMessageAuditLogs($limit: Int) {
    errorMessageAuditLogs(limit: $limit) {
      id
      actorId
      actorEmail
      action
      scope
      locale
      code
      beforeValue
      afterValue
      status
      failureCode
      requestId
      remoteIp
      countryCode
      userAgent
      createdAt
    }
  }
`;

const ADMIN_CREATE_ERROR_MESSAGE_MUTATION = gql`
  mutation AdminCreateErrorMessage($input: AdminCreateErrorMessageInput!) {
    createErrorMessage(input: $input) {
      scope
      locale
      code
      message
      updatedAt
    }
  }
`;

const ADMIN_UPDATE_ERROR_MESSAGE_MUTATION = gql`
  mutation AdminUpdateErrorMessage($input: AdminUpdateErrorMessageInput!) {
    updateErrorMessage(input: $input) {
      scope
      locale
      code
      message
      updatedAt
    }
  }
`;

const ADMIN_DELETE_ERROR_MESSAGE_MUTATION = gql`
  mutation AdminDeleteErrorMessage($input: AdminErrorMessageKeyInput!) {
    deleteErrorMessage(input: $input) {
      success
    }
  }
`;

const ADMIN_NEWSLETTER_SUBSCRIBERS_QUERY = gql`
  query AdminNewsletterSubscribers($filter: AdminNewsletterSubscriberFilterInput) {
    newsletterSubscribers(filter: $filter) {
      items {
        email
        locale
        status
        tags
        formName
        source
        updatedAt
        createdAt
        confirmedAt
        unsubscribedAt
      }
      total
      page
      size
    }
  }
`;

const ADMIN_UPDATE_NEWSLETTER_SUBSCRIBER_STATUS_MUTATION = gql`
  mutation AdminUpdateNewsletterSubscriberStatus($input: AdminUpdateNewsletterSubscriberStatusInput!) {
    updateNewsletterSubscriberStatus(input: $input) {
      email
      locale
      status
      tags
      formName
      source
      updatedAt
      createdAt
      confirmedAt
      unsubscribedAt
    }
  }
`;

const ADMIN_DELETE_NEWSLETTER_SUBSCRIBER_MUTATION = gql`
  mutation AdminDeleteNewsletterSubscriber($input: AdminDeleteNewsletterSubscriberInput!) {
    deleteNewsletterSubscriber(input: $input) {
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

export const fetchAdminContentPosts = async (filter?: {
  locale?: string;
  preferredLocale?: string;
  source?: 'blog' | 'medium';
  query?: string;
  categoryId?: string;
  topicId?: string;
  page?: number;
  size?: number;
}) => {
  const resolvedLocale = filter?.locale?.trim().toLowerCase() ?? '';
  const resolvedPreferredLocale = filter?.preferredLocale?.trim().toLowerCase() ?? '';
  const resolvedSourceRaw = filter?.source?.trim().toLowerCase() ?? '';
  const resolvedSource: 'blog' | 'medium' | '' =
    resolvedSourceRaw === 'medium' ? 'medium' : resolvedSourceRaw === 'blog' ? 'blog' : '';
  const resolvedQuery = filter?.query?.trim() ?? '';
  const resolvedCategoryID = filter?.categoryId?.trim().toLowerCase() ?? '';
  const resolvedTopicID = filter?.topicId?.trim().toLowerCase() ?? '';
  const resolvedPage = filter?.page && Number.isFinite(filter.page) && filter.page > 0 ? Math.trunc(filter.page) : 1;
  const resolvedSize =
    filter?.size && Number.isFinite(filter.size) && filter.size > 0 ? Math.trunc(filter.size) : undefined;

  const payload = await executeAdminGraphQL<
    AdminContentPostsPayload,
    {
      filter?: {
        locale?: string;
        preferredLocale?: string;
        source?: 'blog' | 'medium';
        query?: string;
        categoryId?: string;
        topicId?: string;
        page?: number;
        size?: number;
      };
    }
  >(
    ADMIN_CONTENT_POSTS_QUERY,
    {
      filter: {
        ...(resolvedLocale ? { locale: resolvedLocale } : {}),
        ...(resolvedPreferredLocale ? { preferredLocale: resolvedPreferredLocale } : {}),
        ...(resolvedSource ? { source: resolvedSource } : {}),
        ...(resolvedQuery ? { query: resolvedQuery } : {}),
        ...(resolvedCategoryID ? { categoryId: resolvedCategoryID } : {}),
        ...(resolvedTopicID ? { topicId: resolvedTopicID } : {}),
        ...(resolvedPage ? { page: resolvedPage } : {}),
        ...(resolvedSize ? { size: resolvedSize } : {}),
      },
    },
    {
      operationName: 'AdminContentPosts',
    },
  );

  return payload.contentPosts;
};

export const fetchAdminContentPost = async (input: { locale: string; id: string }) => {
  const payload = await executeAdminGraphQL<
    AdminContentPostPayload,
    {
      input: {
        locale: string;
        id: string;
      };
    }
  >(
    ADMIN_CONTENT_POST_QUERY,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
      },
    },
    {
      operationName: 'AdminContentPost',
    },
  );

  return payload.contentPost;
};

export const fetchAdminContentTopics = async (locale?: string) => {
  const resolvedLocale = locale?.trim().toLowerCase() ?? '';
  const payload = await executeAdminGraphQL<
    AdminContentTopicsPayload,
    {
      locale?: string;
    }
  >(
    ADMIN_CONTENT_TOPICS_QUERY,
    {
      ...(resolvedLocale ? { locale: resolvedLocale } : {}),
    },
    {
      operationName: 'AdminContentTopics',
    },
  );

  return payload.contentTopics;
};

export const fetchAdminContentCategories = async (locale?: string) => {
  const resolvedLocale = locale?.trim().toLowerCase() ?? '';
  const payload = await executeAdminGraphQL<
    AdminContentCategoriesPayload,
    {
      locale?: string;
    }
  >(
    ADMIN_CONTENT_CATEGORIES_QUERY,
    {
      ...(resolvedLocale ? { locale: resolvedLocale } : {}),
    },
    {
      operationName: 'AdminContentCategories',
    },
  );

  return payload.contentCategories;
};

export const fetchAdminContentTopicsPage = async (params?: {
  locale?: string;
  preferredLocale?: string;
  query?: string;
  page?: number;
  size?: number;
}) => {
  const resolvedLocale = params?.locale?.trim().toLowerCase() ?? '';
  const resolvedPreferredLocale = params?.preferredLocale?.trim().toLowerCase() ?? '';
  const resolvedQuery = params?.query?.trim() ?? '';
  const resolvedPage = Number.isFinite(params?.page) ? (params?.page as number) : undefined;
  const resolvedSize = Number.isFinite(params?.size) ? (params?.size as number) : undefined;

  const payload = await executeAdminGraphQL<
    AdminContentTopicsPagePayload,
    {
      filter?: {
        locale?: string;
        preferredLocale?: string;
        query?: string;
        page?: number;
        size?: number;
      };
    }
  >(
    ADMIN_CONTENT_TOPICS_PAGE_QUERY,
    {
      filter: {
        ...(resolvedLocale ? { locale: resolvedLocale } : {}),
        ...(resolvedPreferredLocale ? { preferredLocale: resolvedPreferredLocale } : {}),
        ...(resolvedQuery ? { query: resolvedQuery } : {}),
        ...(resolvedPage ? { page: resolvedPage } : {}),
        ...(resolvedSize ? { size: resolvedSize } : {}),
      },
    },
    {
      operationName: 'AdminContentTopicsPage',
    },
  );

  return payload.contentTopicsPage;
};

export const fetchAdminContentCategoriesPage = async (params?: {
  locale?: string;
  preferredLocale?: string;
  query?: string;
  page?: number;
  size?: number;
}) => {
  const resolvedLocale = params?.locale?.trim().toLowerCase() ?? '';
  const resolvedPreferredLocale = params?.preferredLocale?.trim().toLowerCase() ?? '';
  const resolvedQuery = params?.query?.trim() ?? '';
  const resolvedPage = Number.isFinite(params?.page) ? (params?.page as number) : undefined;
  const resolvedSize = Number.isFinite(params?.size) ? (params?.size as number) : undefined;

  const payload = await executeAdminGraphQL<
    AdminContentCategoriesPagePayload,
    {
      filter?: {
        locale?: string;
        preferredLocale?: string;
        query?: string;
        page?: number;
        size?: number;
      };
    }
  >(
    ADMIN_CONTENT_CATEGORIES_PAGE_QUERY,
    {
      filter: {
        ...(resolvedLocale ? { locale: resolvedLocale } : {}),
        ...(resolvedPreferredLocale ? { preferredLocale: resolvedPreferredLocale } : {}),
        ...(resolvedQuery ? { query: resolvedQuery } : {}),
        ...(resolvedPage ? { page: resolvedPage } : {}),
        ...(resolvedSize ? { size: resolvedSize } : {}),
      },
    },
    {
      operationName: 'AdminContentCategoriesPage',
    },
  );

  return payload.contentCategoriesPage;
};

export const updateAdminContentPostMetadata = async (input: {
  locale: string;
  id: string;
  title?: string;
  summary?: string;
  thumbnail?: string;
  publishedDate?: string;
  updatedDate?: string;
  categoryId?: string | null;
  topicIds: string[];
}) => {
  const payload = await executeAdminGraphQL<
    AdminUpdateContentPostMetadataPayload,
    {
      input: {
        locale: string;
        id: string;
        title?: string;
        summary?: string;
        thumbnail?: string;
        publishedDate?: string;
        updatedDate?: string;
        categoryId?: string;
        topicIds: string[];
      };
    }
  >(
    ADMIN_UPDATE_CONTENT_POST_METADATA_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
        ...(typeof input.title === 'string' ? { title: input.title.trim() } : {}),
        ...(typeof input.summary === 'string' ? { summary: input.summary.trim() } : {}),
        ...(typeof input.thumbnail === 'string' ? { thumbnail: input.thumbnail.trim() } : {}),
        ...(typeof input.publishedDate === 'string' ? { publishedDate: input.publishedDate.trim() } : {}),
        ...(typeof input.updatedDate === 'string' ? { updatedDate: input.updatedDate.trim() } : {}),
        ...(input.categoryId?.trim() ? { categoryId: input.categoryId.trim().toLowerCase() } : {}),
        topicIds: input.topicIds.map(item => item.trim().toLowerCase()).filter(item => item !== ''),
      },
    },
    {
      operationName: 'AdminUpdateContentPostMetadata',
    },
  );

  return payload.updateContentPostMetadata;
};

export const updateAdminContentPostContent = async (input: { locale: string; id: string; content: string }) => {
  const payload = await executeAdminGraphQL<
    AdminUpdateContentPostContentPayload,
    {
      input: {
        locale: string;
        id: string;
        content: string;
      };
    }
  >(
    ADMIN_UPDATE_CONTENT_POST_CONTENT_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
        content: input.content,
      },
    },
    {
      operationName: 'AdminUpdateContentPostContent',
    },
  );

  return payload.updateContentPostContent;
};

export const deleteAdminContentPost = async (input: { locale: string; id: string }) => {
  const payload = await executeAdminGraphQL<
    AdminDeleteContentPostPayload,
    {
      input: {
        locale: string;
        id: string;
      };
    }
  >(
    ADMIN_DELETE_CONTENT_POST_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
      },
    },
    {
      operationName: 'AdminDeleteContentPost',
    },
  );

  return payload.deleteContentPost?.success === true;
};

export const createAdminContentTopic = async (input: {
  locale: string;
  id: string;
  name: string;
  color: string;
  link?: string | null;
}) => {
  const payload = await executeAdminGraphQL<
    AdminCreateContentTopicPayload,
    {
      input: {
        locale: string;
        id: string;
        name: string;
        color: string;
        link?: string;
      };
    }
  >(
    ADMIN_CREATE_CONTENT_TOPIC_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
        name: input.name.trim(),
        color: input.color.trim().toLowerCase(),
        ...(input.link?.trim() ? { link: input.link.trim() } : {}),
      },
    },
    {
      operationName: 'AdminCreateContentTopic',
    },
  );

  return payload.createContentTopic;
};

export const updateAdminContentTopic = async (input: {
  locale: string;
  id: string;
  name: string;
  color: string;
  link?: string | null;
}) => {
  const payload = await executeAdminGraphQL<
    AdminUpdateContentTopicPayload,
    {
      input: {
        locale: string;
        id: string;
        name: string;
        color: string;
        link?: string;
      };
    }
  >(
    ADMIN_UPDATE_CONTENT_TOPIC_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
        name: input.name.trim(),
        color: input.color.trim().toLowerCase(),
        ...(input.link?.trim() ? { link: input.link.trim() } : {}),
      },
    },
    {
      operationName: 'AdminUpdateContentTopic',
    },
  );

  return payload.updateContentTopic;
};

export const deleteAdminContentTopic = async (input: { locale: string; id: string }) => {
  const payload = await executeAdminGraphQL<
    AdminDeleteContentTopicPayload,
    {
      input: {
        locale: string;
        id: string;
      };
    }
  >(
    ADMIN_DELETE_CONTENT_TOPIC_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
      },
    },
    {
      operationName: 'AdminDeleteContentTopic',
    },
  );

  return payload.deleteContentTopic?.success === true;
};

export const createAdminContentCategory = async (input: {
  locale: string;
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  link?: string | null;
}) => {
  const payload = await executeAdminGraphQL<
    AdminCreateContentCategoryPayload,
    {
      input: {
        locale: string;
        id: string;
        name: string;
        color: string;
        icon?: string;
        link?: string;
      };
    }
  >(
    ADMIN_CREATE_CONTENT_CATEGORY_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
        name: input.name.trim(),
        color: input.color.trim().toLowerCase(),
        ...(input.icon?.trim() ? { icon: input.icon.trim() } : {}),
        ...(input.link?.trim() ? { link: input.link.trim() } : {}),
      },
    },
    {
      operationName: 'AdminCreateContentCategory',
    },
  );

  return payload.createContentCategory;
};

export const updateAdminContentCategory = async (input: {
  locale: string;
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  link?: string | null;
}) => {
  const payload = await executeAdminGraphQL<
    AdminUpdateContentCategoryPayload,
    {
      input: {
        locale: string;
        id: string;
        name: string;
        color: string;
        icon?: string;
        link?: string;
      };
    }
  >(
    ADMIN_UPDATE_CONTENT_CATEGORY_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
        name: input.name.trim(),
        color: input.color.trim().toLowerCase(),
        ...(input.icon?.trim() ? { icon: input.icon.trim() } : {}),
        ...(input.link?.trim() ? { link: input.link.trim() } : {}),
      },
    },
    {
      operationName: 'AdminUpdateContentCategory',
    },
  );

  return payload.updateContentCategory;
};

export const deleteAdminContentCategory = async (input: { locale: string; id: string }) => {
  const payload = await executeAdminGraphQL<
    AdminDeleteContentCategoryPayload,
    {
      input: {
        locale: string;
        id: string;
      };
    }
  >(
    ADMIN_DELETE_CONTENT_CATEGORY_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
      },
    },
    {
      operationName: 'AdminDeleteContentCategory',
    },
  );

  return payload.deleteContentCategory?.success === true;
};

export const fetchAdminErrorMessages = async (filter?: {
  locale?: string;
  code?: string;
  query?: string;
  page?: number;
  size?: number;
}) => {
  const resolvedLocale = filter?.locale?.trim().toLowerCase() ?? '';
  const resolvedCode = filter?.code?.trim().toUpperCase() ?? '';
  const resolvedQuery = filter?.query?.trim() ?? '';
  const resolvedPage = filter?.page && Number.isFinite(filter.page) && filter.page > 0 ? Math.trunc(filter.page) : 1;
  const resolvedSize =
    filter?.size && Number.isFinite(filter.size) && filter.size > 0 ? Math.trunc(filter.size) : undefined;

  const payload = await executeAdminGraphQL<
    AdminErrorMessagesPayload,
    {
      filter?: {
        locale?: string;
        code?: string;
        query?: string;
        page?: number;
        size?: number;
      };
    }
  >(
    ADMIN_ERROR_MESSAGES_QUERY,
    {
      filter: {
        ...(resolvedLocale ? { locale: resolvedLocale } : {}),
        ...(resolvedCode ? { code: resolvedCode } : {}),
        ...(resolvedQuery ? { query: resolvedQuery } : {}),
        ...(resolvedPage ? { page: resolvedPage } : {}),
        ...(resolvedSize ? { size: resolvedSize } : {}),
      },
    },
    {
      operationName: 'AdminErrorMessages',
    },
  );

  return payload.errorMessages;
};

export const fetchAdminErrorMessageAuditLogs = async (limit = 20) => {
  const payload = await executeAdminGraphQL<
    AdminErrorMessageAuditLogsPayload,
    {
      limit: number;
    }
  >(
    ADMIN_ERROR_MESSAGE_AUDIT_LOGS_QUERY,
    {
      limit,
    },
    {
      operationName: 'AdminErrorMessageAuditLogs',
    },
  );

  return payload.errorMessageAuditLogs;
};

export const createAdminErrorMessage = async (input: {
  key: {
    scope?: string | null;
    locale: string;
    code: string;
  };
  message: string;
}) => {
  const payload = await executeAdminGraphQL<
    AdminCreateErrorMessagePayload,
    {
      input: {
        key: {
          scope?: string;
          locale: string;
          code: string;
        };
        message: string;
      };
    }
  >(
    ADMIN_CREATE_ERROR_MESSAGE_MUTATION,
    {
      input: {
        key: {
          ...(input.key.scope?.trim() ? { scope: input.key.scope.trim() } : {}),
          locale: input.key.locale.trim().toLowerCase(),
          code: input.key.code.trim().toUpperCase(),
        },
        message: input.message,
      },
    },
    {
      operationName: 'AdminCreateErrorMessage',
    },
  );

  return payload.createErrorMessage;
};

export const updateAdminErrorMessage = async (input: {
  key: {
    scope?: string | null;
    locale: string;
    code: string;
  };
  message: string;
}) => {
  const payload = await executeAdminGraphQL<
    AdminUpdateErrorMessagePayload,
    {
      input: {
        key: {
          scope?: string;
          locale: string;
          code: string;
        };
        message: string;
      };
    }
  >(
    ADMIN_UPDATE_ERROR_MESSAGE_MUTATION,
    {
      input: {
        key: {
          ...(input.key.scope?.trim() ? { scope: input.key.scope.trim() } : {}),
          locale: input.key.locale.trim().toLowerCase(),
          code: input.key.code.trim().toUpperCase(),
        },
        message: input.message,
      },
    },
    {
      operationName: 'AdminUpdateErrorMessage',
    },
  );

  return payload.updateErrorMessage;
};

export const deleteAdminErrorMessage = async (input: { scope?: string | null; locale: string; code: string }) => {
  const payload = await executeAdminGraphQL<
    AdminDeleteErrorMessagePayload,
    {
      input: {
        scope?: string;
        locale: string;
        code: string;
      };
    }
  >(
    ADMIN_DELETE_ERROR_MESSAGE_MUTATION,
    {
      input: {
        ...(input.scope?.trim() ? { scope: input.scope.trim() } : {}),
        locale: input.locale.trim().toLowerCase(),
        code: input.code.trim().toUpperCase(),
      },
    },
    {
      operationName: 'AdminDeleteErrorMessage',
    },
  );

  return payload.deleteErrorMessage?.success === true;
};

export const fetchAdminNewsletterSubscribers = async (filter?: {
  locale?: string;
  status?: 'pending' | 'active' | 'unsubscribed';
  query?: string;
  page?: number;
  size?: number;
}) => {
  const resolvedLocale = filter?.locale?.trim().toLowerCase() ?? '';
  const resolvedStatus = filter?.status?.trim().toLowerCase() ?? '';
  const resolvedQuery = filter?.query?.trim() ?? '';
  const resolvedPage = filter?.page && Number.isFinite(filter.page) && filter.page > 0 ? Math.trunc(filter.page) : 1;
  const resolvedSize =
    filter?.size && Number.isFinite(filter.size) && filter.size > 0 ? Math.trunc(filter.size) : undefined;

  const statusEnum =
    resolvedStatus === 'active'
      ? 'ACTIVE'
      : resolvedStatus === 'unsubscribed'
        ? 'UNSUBSCRIBED'
        : resolvedStatus === 'pending'
          ? 'PENDING'
          : undefined;

  const payload = await executeAdminGraphQL<
    AdminNewsletterSubscribersPayload,
    {
      filter?: {
        locale?: string;
        status?: 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';
        query?: string;
        page?: number;
        size?: number;
      };
    }
  >(
    ADMIN_NEWSLETTER_SUBSCRIBERS_QUERY,
    {
      filter: {
        ...(resolvedLocale ? { locale: resolvedLocale } : {}),
        ...(statusEnum ? { status: statusEnum } : {}),
        ...(resolvedQuery ? { query: resolvedQuery } : {}),
        ...(resolvedPage ? { page: resolvedPage } : {}),
        ...(resolvedSize ? { size: resolvedSize } : {}),
      },
    },
    {
      operationName: 'AdminNewsletterSubscribers',
    },
  );

  return payload.newsletterSubscribers;
};

export const updateAdminNewsletterSubscriberStatus = async (input: {
  email: string;
  status: 'active' | 'unsubscribed';
}) => {
  const status = input.status.trim().toLowerCase() === 'active' ? 'ACTIVE' : 'UNSUBSCRIBED';

  const payload = await executeAdminGraphQL<
    AdminUpdateNewsletterSubscriberStatusPayload,
    {
      input: {
        email: string;
        status: 'ACTIVE' | 'UNSUBSCRIBED';
      };
    }
  >(
    ADMIN_UPDATE_NEWSLETTER_SUBSCRIBER_STATUS_MUTATION,
    {
      input: {
        email: input.email.trim().toLowerCase(),
        status,
      },
    },
    {
      operationName: 'AdminUpdateNewsletterSubscriberStatus',
    },
  );

  return payload.updateNewsletterSubscriberStatus;
};

export const deleteAdminNewsletterSubscriber = async (input: { email: string }) => {
  const payload = await executeAdminGraphQL<
    AdminDeleteNewsletterSubscriberPayload,
    {
      input: {
        email: string;
      };
    }
  >(
    ADMIN_DELETE_NEWSLETTER_SUBSCRIBER_MUTATION,
    {
      input: {
        email: input.email.trim().toLowerCase(),
      },
    },
    {
      operationName: 'AdminDeleteNewsletterSubscriber',
    },
  );

  return payload.deleteNewsletterSubscriber?.success === true;
};
