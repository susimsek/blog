'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import {
  beginCommentOAuthLogin,
  fetchCommentAuthSession,
  logoutCommentViewer,
  type CommentAuthSession,
} from '@/lib/commentAuthApi';

type CommentAccessMethod = 'email' | 'google' | 'github';

const DEFAULT_COMMENT_AUTH_SESSION: CommentAuthSession = {
  authenticated: false,
  providers: {
    google: true,
    github: true,
  },
};

const buildCommentReturnTo = (locale: string) => {
  if (globalThis.window === undefined) {
    return `/${locale}`;
  }

  const currentURL = new URL(globalThis.window.location.href);
  currentURL.searchParams.delete('commentAuth');
  currentURL.searchParams.delete('commentProvider');
  const query = currentURL.searchParams.toString();
  const querySuffix = query ? `?${query}` : '';

  return `${currentURL.pathname}${querySuffix}${currentURL.hash}`;
};

const buildCommentAuthCleanupURL = (searchParams: URLSearchParams) => {
  const nextQuery = searchParams.toString();
  const querySuffix = nextQuery ? `?${nextQuery}` : '';
  return `${globalThis.window.location.pathname}${querySuffix}${globalThis.window.location.hash}`;
};

const resolveNextComposerAccessMethod = (
  currentMethod: CommentAccessMethod,
  provider: string | undefined,
): CommentAccessMethod => {
  if (currentMethod !== 'email') {
    return currentMethod;
  }

  return provider === 'github' ? 'github' : 'google';
};

type UsePostCommentAuthParams = {
  locale: string;
  t: TFunction<'post'>;
  onLoggedOut?: () => void;
};

export function usePostCommentAuth({ locale, t, onLoggedOut }: UsePostCommentAuthParams) {
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [authSession, setAuthSession] = React.useState<CommentAuthSession>(DEFAULT_COMMENT_AUTH_SESSION);
  const [authFeedback, setAuthFeedback] = React.useState<{ variant: 'success' | 'danger'; message: string } | null>(
    null,
  );
  const [composerAccessMethod, setComposerAccessMethod] = React.useState<CommentAccessMethod>('email');

  const authenticatedViewer = authSession.authenticated ? (authSession.viewer ?? null) : null;
  const composerViewer = composerAccessMethod === 'email' ? null : authenticatedViewer;

  const resolveProviderLabel = React.useCallback(
    (provider: string) => {
      switch (provider.trim().toLowerCase()) {
        case 'google':
          return t('post.comments.auth.providers.google');
        case 'github':
          return t('post.comments.auth.providers.github');
        default:
          return t('post.comments.auth.providers.account');
      }
    },
    [t],
  );

  const getCommentReturnTo = React.useCallback(() => buildCommentReturnTo(locale), [locale]);

  const loadAuthSession = React.useCallback(async () => {
    setIsAuthLoading(true);

    try {
      const session = (await fetchCommentAuthSession()) ?? DEFAULT_COMMENT_AUTH_SESSION;
      setAuthSession(session);
      if (session.authenticated && session.viewer) {
        const provider = session.viewer.provider?.trim().toLowerCase();
        setComposerAccessMethod(current => resolveNextComposerAccessMethod(current, provider));
      }
      return session;
    } catch {
      setAuthSession(DEFAULT_COMMENT_AUTH_SESSION);
      return DEFAULT_COMMENT_AUTH_SESSION;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      let authStatus = '';
      let authProvider = '';

      if (globalThis.window !== undefined) {
        const searchParams = new URLSearchParams(globalThis.window.location.search);
        authStatus = searchParams.get('commentAuth')?.trim().toLowerCase() ?? '';
        authProvider = searchParams.get('commentProvider')?.trim().toLowerCase() ?? '';

        if (authStatus || authProvider) {
          searchParams.delete('commentAuth');
          searchParams.delete('commentProvider');
          const nextURL = buildCommentAuthCleanupURL(searchParams);
          globalThis.window.history.replaceState(globalThis.window.history.state, '', nextURL);
        }
      }

      const session = await loadAuthSession();
      if (!isMounted || !authStatus) {
        return;
      }

      const providerLabel = resolveProviderLabel(authProvider);
      if (authStatus === 'connected' && session.authenticated && session.viewer) {
        setAuthFeedback({
          variant: 'success',
          message: t('post.comments.auth.connected', {
            provider: providerLabel,
            name: session.viewer.name,
          }),
        });
        return;
      }

      if (authStatus === 'cancelled') {
        setAuthFeedback({
          variant: 'danger',
          message: t('post.comments.auth.cancelled', { provider: providerLabel }),
        });
        return;
      }

      if (authStatus === 'failed' || authStatus === 'connected') {
        setAuthFeedback({
          variant: 'danger',
          message: t('post.comments.auth.failed', { provider: providerLabel }),
        });
      }
    };

    void bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [loadAuthSession, resolveProviderLabel, t]);

  const handleComposerAccessMethodChange = React.useCallback(
    (nextMethod: CommentAccessMethod) => {
      if (nextMethod === 'email') {
        setComposerAccessMethod('email');
        setAuthFeedback(null);
        return;
      }

      if (authenticatedViewer && authenticatedViewer.provider?.trim().toLowerCase() === nextMethod) {
        setComposerAccessMethod(nextMethod);
        setAuthFeedback(null);
        return;
      }

      beginCommentOAuthLogin(nextMethod, locale, getCommentReturnTo());
    },
    [authenticatedViewer, getCommentReturnTo, locale],
  );

  const handleViewerLogout = React.useCallback(async () => {
    setIsLoggingOut(true);
    setAuthFeedback(null);

    try {
      await logoutCommentViewer();
      setAuthSession(DEFAULT_COMMENT_AUTH_SESSION);
      setComposerAccessMethod('email');
      onLoggedOut?.();
      setAuthFeedback({
        variant: 'success',
        message: t('post.comments.auth.signedOut'),
      });
    } finally {
      setIsLoggingOut(false);
    }
  }, [onLoggedOut, t]);

  return {
    isAuthLoading,
    isLoggingOut,
    authSession,
    authFeedback,
    composerAccessMethod,
    authenticatedViewer,
    composerViewer,
    resolveProviderLabel,
    handleComposerAccessMethodChange,
    handleViewerLogout,
  };
}
