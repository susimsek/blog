'use client';

import { gql } from '@apollo/client/core';
import { executeAdminGraphQL } from './core';

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

const ADMIN_ERROR_MESSAGES_QUERY = gql`
  query AdminErrorMessagesQuery($filter: AdminErrorMessageFilterInput) {
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
  query AdminErrorMessageAuditLogsQuery($limit: Int) {
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
  mutation AdminCreateErrorMessageMutation($input: AdminCreateErrorMessageInput!) {
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
  mutation AdminUpdateErrorMessageMutation($input: AdminUpdateErrorMessageInput!) {
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
  mutation AdminDeleteErrorMessageMutation($input: AdminErrorMessageKeyInput!) {
    deleteErrorMessage(input: $input) {
      success
    }
  }
`;

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
