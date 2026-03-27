import { withBasePath } from '@/lib/basePath';

type GraphQLErrorPayload = {
  message?: string;
  extensions?: {
    code?: string;
  };
};

export type AdminPasswordResetError = {
  kind: 'network' | 'api';
  code: string;
  message: string;
};

export type AdminPasswordResetValidation = {
  status: string;
  locale: string;
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLErrorPayload[];
};

type RequestPasswordResetPayload = {
  requestPasswordReset: {
    success: boolean;
  };
};

type ValidatePasswordResetTokenPayload = {
  validatePasswordResetToken: AdminPasswordResetValidation;
};

type ConfirmPasswordResetPayload = {
  confirmPasswordReset: {
    success: boolean;
    locale: string;
  };
};

const ADMIN_GRAPHQL_ENDPOINT = withBasePath('/api/admin/graphql');
const REQUEST_PASSWORD_RESET_MUTATION = `
  mutation AdminRequestPasswordReset($input: AdminRequestPasswordResetInput!) {
    requestPasswordReset(input: $input) {
      success
    }
  }
`;
const VALIDATE_PASSWORD_RESET_TOKEN_QUERY = `
  query AdminValidatePasswordResetToken($token: String!, $locale: Locale) {
    validatePasswordResetToken(token: $token, locale: $locale) {
      status
      locale
    }
  }
`;
const CONFIRM_PASSWORD_RESET_MUTATION = `
  mutation AdminConfirmPasswordReset($input: AdminConfirmPasswordResetInput!) {
    confirmPasswordReset(input: $input) {
      success
      locale
    }
  }
`;

class AdminPasswordResetApiError extends Error implements AdminPasswordResetError {
  kind: AdminPasswordResetError['kind'];
  code: string;

  constructor(kind: AdminPasswordResetError['kind'], code: string, message: string) {
    super(message);
    this.name = 'AdminPasswordResetApiError';
    this.kind = kind;
    this.code = code;
  }
}

const createAdminPasswordResetError = (kind: AdminPasswordResetError['kind'], code: string, message: string) =>
  new AdminPasswordResetApiError(kind, code.trim().toUpperCase(), message.trim());

const normalizeResponseError = async (response: Response): Promise<AdminPasswordResetError> => {
  let payload: GraphQLResponse<unknown> | null = null;

  try {
    payload = (await response.json()) as GraphQLResponse<unknown>;
  } catch {
    payload = null;
  }

  const firstError = payload?.errors?.[0];
  return {
    kind: 'api',
    code: (firstError?.extensions?.code ?? 'ADMIN_PASSWORD_RESET_FAILED').trim().toUpperCase(),
    message: (firstError?.message ?? 'Admin password reset request failed.').trim(),
  };
};

const parseGraphQLResponse = async <TData>(response: Response): Promise<TData> => {
  let payload: GraphQLResponse<TData>;
  try {
    payload = (await response.json()) as GraphQLResponse<TData>;
  } catch {
    throw createAdminPasswordResetError('api', 'ADMIN_PASSWORD_RESET_FAILED', 'Admin password reset request failed.');
  }

  if (!response.ok || (payload.errors?.length ?? 0) > 0) {
    const firstError = payload.errors?.[0];
    throw createAdminPasswordResetError(
      'api',
      firstError?.extensions?.code ?? 'ADMIN_PASSWORD_RESET_FAILED',
      firstError?.message ?? 'Admin password reset request failed.',
    );
  }

  if (payload.data === undefined || payload.data === null) {
    throw createAdminPasswordResetError('api', 'ADMIN_PASSWORD_RESET_FAILED', 'Admin password reset request failed.');
  }

  return payload.data;
};

const postAdminPasswordResetGraphQL = async <TData>(
  query: string,
  variables: Record<string, unknown>,
  operationName: string,
): Promise<TData> => {
  let response: Response;
  try {
    response = await globalThis.fetch(ADMIN_GRAPHQL_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
        operationName,
      }),
    });
  } catch {
    throw createAdminPasswordResetError('network', 'NETWORK_ERROR', 'Network request failed');
  }

  if (!response.ok) {
    throw await normalizeResponseError(response);
  }

  return parseGraphQLResponse<TData>(response);
};

export const requestAdminPasswordReset = async (email: string, locale: string): Promise<boolean> => {
  const payload = await postAdminPasswordResetGraphQL<RequestPasswordResetPayload>(
    REQUEST_PASSWORD_RESET_MUTATION,
    {
      input: {
        email,
        locale,
      },
    },
    'AdminRequestPasswordReset',
  );

  return payload.requestPasswordReset.success;
};

export const validateAdminPasswordResetToken = async (
  token: string,
  locale: string,
): Promise<AdminPasswordResetValidation> => {
  const payload = await postAdminPasswordResetGraphQL<ValidatePasswordResetTokenPayload>(
    VALIDATE_PASSWORD_RESET_TOKEN_QUERY,
    {
      token,
      locale,
    },
    'AdminValidatePasswordResetToken',
  );

  return payload.validatePasswordResetToken;
};

export const confirmAdminPasswordReset = async (
  token: string,
  locale: string,
  newPassword: string,
  confirmPassword: string,
): Promise<boolean> => {
  const payload = await postAdminPasswordResetGraphQL<ConfirmPasswordResetPayload>(
    CONFIRM_PASSWORD_RESET_MUTATION,
    {
      input: {
        token,
        locale,
        newPassword,
        confirmPassword,
      },
    },
    'AdminConfirmPasswordReset',
  );

  return payload.confirmPasswordReset.success;
};

export const resolveAdminPasswordResetError = (error: unknown): AdminPasswordResetError => {
  if (error instanceof AdminPasswordResetApiError) {
    return {
      kind: error.kind,
      code: error.code,
      message: error.message.trim(),
    };
  }

  if (typeof error === 'object' && error !== null && 'kind' in error && 'code' in error && 'message' in error) {
    const candidate = error as AdminPasswordResetError;
    return {
      kind: candidate.kind,
      code: candidate.code.trim().toUpperCase(),
      message: candidate.message.trim(),
    };
  }

  return {
    kind: 'api',
    code: 'ADMIN_PASSWORD_RESET_FAILED',
    message: 'Admin password reset request failed.',
  };
};
