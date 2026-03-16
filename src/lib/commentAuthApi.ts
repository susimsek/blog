import { defaultLocale } from '@/i18n/settings';
import { withBasePath } from '@/lib/basePath';
import { isLocalHttpOrigin, normalizeApiBaseUrl } from '@/lib/graphql/apolloClient';
import type { CommentViewer } from '@/types/comments';

const DEFAULT_LOCAL_API_ORIGIN = 'http://localhost:8080';

const getApiEndpoint = (pathname: string) => {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  const localApiOrigin = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_DEV_API_ORIGIN) || DEFAULT_LOCAL_API_ORIGIN;

  if (globalThis.window !== undefined) {
    const browserOrigin = normalizeApiBaseUrl(globalThis.window.location.origin);
    const shouldUseLocalApiOrigin =
      isLocalHttpOrigin(browserOrigin) && (apiBaseUrl.length === 0 || apiBaseUrl === browserOrigin);

    if (shouldUseLocalApiOrigin) {
      return `${localApiOrigin}${normalizedPath}`;
    }
  }

  if (apiBaseUrl.length > 0) {
    return `${apiBaseUrl}${normalizedPath}`;
  }

  return withBasePath(normalizedPath);
};

export type CommentAuthSession = {
  authenticated: boolean;
  providers: {
    google: boolean;
    github: boolean;
  };
  viewer?: CommentViewer;
};

export const fetchCommentAuthSession = async (): Promise<CommentAuthSession | null> => {
  const response = await globalThis.fetch(getApiEndpoint('/api/reader-auth/session'), {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept-Language': defaultLocale,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as CommentAuthSession;
  return {
    authenticated: Boolean(payload?.authenticated),
    providers: {
      google: Boolean(payload?.providers?.google),
      github: Boolean(payload?.providers?.github),
    },
    ...(payload?.viewer ? { viewer: payload.viewer } : {}),
  };
};

export const logoutCommentViewer = async (): Promise<boolean> => {
  const response = await globalThis.fetch(getApiEndpoint('/api/reader-auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });

  return response.ok;
};

export const beginCommentOAuthLogin = (
  provider: 'google' | 'github',
  locale: string,
  returnTo: string,
  rememberMe = true,
) => {
  const params = new URLSearchParams({
    locale: locale.trim().toLowerCase() || defaultLocale,
    returnTo,
    rememberMe: rememberMe ? 'true' : 'false',
  });

  const endpoint = getApiEndpoint(`/api/reader-${provider}/connect`);
  globalThis.window.location.assign(`${endpoint}?${params.toString()}`);
};
