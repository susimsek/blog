import { withBasePath } from '@/lib/basePath';

type GraphQLErrorPayload = {
  message?: string;
  extensions?: {
    code?: string;
  };
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLErrorPayload[];
};

export type AdminEmailChangeConfirmResult = {
  status: string;
  locale: string;
};

export type AdminEmailChangeError = {
  kind: 'network' | 'api';
  code: string;
  message: string;
};

type ConfirmEmailChangePayload = {
  confirmEmailChange: AdminEmailChangeConfirmResult;
};

const ADMIN_GRAPHQL_ENDPOINT = withBasePath('/api/admin/graphql');
const CONFIRM_EMAIL_CHANGE_MUTATION = `
  mutation AdminConfirmEmailChange($token: String!, $locale: Locale) {
    confirmEmailChange(token: $token, locale: $locale) {
      status
      locale
    }
  }
`;

class AdminEmailChangeApiError extends Error implements AdminEmailChangeError {
  kind: AdminEmailChangeError['kind'];
  code: string;

  constructor(kind: AdminEmailChangeError['kind'], code: string, message: string) {
    super(message);
    this.name = 'AdminEmailChangeApiError';
    this.kind = kind;
    this.code = code;
  }
}

const createAdminEmailChangeError = (kind: AdminEmailChangeError['kind'], code: string, message: string) =>
  new AdminEmailChangeApiError(kind, code.trim().toUpperCase(), message.trim());

const normalizeResponseError = async (response: Response): Promise<AdminEmailChangeError> => {
  let payload: GraphQLResponse<unknown> | null = null;

  try {
    payload = (await response.json()) as GraphQLResponse<unknown>;
  } catch {
    payload = null;
  }

  const firstError = payload?.errors?.[0];
  return {
    kind: 'api',
    code: (firstError?.extensions?.code ?? 'ADMIN_EMAIL_CHANGE_FAILED').trim().toUpperCase(),
    message: (firstError?.message ?? 'Admin email change confirmation failed.').trim(),
  };
};

const parseGraphQLResponse = async <TData>(response: Response): Promise<TData> => {
  let payload: GraphQLResponse<TData>;
  try {
    payload = (await response.json()) as GraphQLResponse<TData>;
  } catch {
    throw createAdminEmailChangeError('api', 'ADMIN_EMAIL_CHANGE_FAILED', 'Admin email change confirmation failed.');
  }

  if (!response.ok || (payload.errors?.length ?? 0) > 0) {
    const firstError = payload.errors?.[0];
    throw createAdminEmailChangeError(
      'api',
      firstError?.extensions?.code ?? 'ADMIN_EMAIL_CHANGE_FAILED',
      firstError?.message ?? 'Admin email change confirmation failed.',
    );
  }

  if (payload.data === undefined || payload.data === null) {
    throw createAdminEmailChangeError('api', 'ADMIN_EMAIL_CHANGE_FAILED', 'Admin email change confirmation failed.');
  }

  return payload.data;
};

export const confirmAdminEmailChange = async (
  token: string,
  locale: string,
): Promise<AdminEmailChangeConfirmResult> => {
  let response: Response;
  try {
    response = await globalThis.fetch(ADMIN_GRAPHQL_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operationName: 'AdminConfirmEmailChange',
        query: CONFIRM_EMAIL_CHANGE_MUTATION,
        variables: {
          token,
          locale,
        },
      }),
    });
  } catch {
    throw createAdminEmailChangeError('network', 'NETWORK_ERROR', 'Network request failed');
  }

  if (!response.ok) {
    throw await normalizeResponseError(response);
  }

  const payload = await parseGraphQLResponse<ConfirmEmailChangePayload>(response);
  return payload.confirmEmailChange;
};

export const resolveAdminEmailChangeError = (error: unknown): AdminEmailChangeError => {
  if (error instanceof AdminEmailChangeApiError) {
    return {
      kind: error.kind,
      code: error.code,
      message: error.message.trim(),
    };
  }

  if (typeof error === 'object' && error !== null && 'kind' in error && 'code' in error && 'message' in error) {
    const candidate = error as AdminEmailChangeError;
    return {
      kind: candidate.kind,
      code: candidate.code.trim().toUpperCase(),
      message: candidate.message.trim(),
    };
  }

  return {
    kind: 'api',
    code: 'ADMIN_EMAIL_CHANGE_FAILED',
    message: 'Admin email change confirmation failed.',
  };
};
