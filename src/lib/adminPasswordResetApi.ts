import { withBasePath } from '@/lib/basePath';

type ErrorPayload = {
  code?: string;
  message?: string;
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

const REQUEST_ENDPOINT = withBasePath('/api/admin-password-reset/request');
const CONFIRM_ENDPOINT = withBasePath('/api/admin-password-reset/confirm');

const normalizeErrorPayload = async (response: Response): Promise<AdminPasswordResetError> => {
  let payload: ErrorPayload | null = null;

  try {
    payload = (await response.json()) as ErrorPayload;
  } catch {
    payload = null;
  }

  return {
    kind: 'api',
    code: (payload?.code ?? 'ADMIN_PASSWORD_RESET_FAILED').trim().toUpperCase(),
    message: (payload?.message ?? 'Admin password reset request failed.').trim(),
  };
};

export const requestAdminPasswordReset = async (email: string, locale: string): Promise<boolean> => {
  let response: Response;
  try {
    response = await globalThis.fetch(REQUEST_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        locale,
      }),
    });
  } catch {
    throw {
      kind: 'network',
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
    } satisfies AdminPasswordResetError;
  }

  if (!response.ok) {
    throw await normalizeErrorPayload(response);
  }

  return true;
};

export const validateAdminPasswordResetToken = async (
  token: string,
  locale: string,
): Promise<AdminPasswordResetValidation> => {
  let response: Response;
  try {
    const params = new URLSearchParams({
      token,
      locale,
    });

    response = await globalThis.fetch(`${CONFIRM_ENDPOINT}?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
  } catch {
    throw {
      kind: 'network',
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
    } satisfies AdminPasswordResetError;
  }

  if (!response.ok) {
    throw await normalizeErrorPayload(response);
  }

  return (await response.json()) as AdminPasswordResetValidation;
};

export const confirmAdminPasswordReset = async (
  token: string,
  locale: string,
  newPassword: string,
  confirmPassword: string,
): Promise<boolean> => {
  let response: Response;
  try {
    response = await globalThis.fetch(CONFIRM_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        locale,
        newPassword,
        confirmPassword,
      }),
    });
  } catch {
    throw {
      kind: 'network',
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
    } satisfies AdminPasswordResetError;
  }

  if (!response.ok) {
    throw await normalizeErrorPayload(response);
  }

  return true;
};

export const resolveAdminPasswordResetError = (error: unknown): AdminPasswordResetError => {
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
