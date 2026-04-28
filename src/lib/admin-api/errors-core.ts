'use client';

import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client/errors';

const ADMIN_ERROR_FALLBACK_MESSAGE = 'Admin GraphQL request failed';
const ADMIN_NETWORK_ERROR_CODE = 'NETWORK_ERROR';

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

export type ResolvedAdminError = {
  kind: AdminErrorKind;
  message: string;
  code?: string;
  requestId?: string;
  status?: number;
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

export const shouldRetryAdminRefresh = (error: AdminGraphQLRequestError, operationName: string) => {
  if (operationName === 'AdminRefreshSession' || operationName === 'AdminLogin') {
    return false;
  }
  if (typeof error.status === 'number' && error.status >= 500) {
    return false;
  }

  return resolveAdminError(error).kind === 'session_expired';
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

export const toAdminRequestError = (error: unknown): AdminGraphQLRequestError => {
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
