'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { withBasePath } from '@/lib/basePath';

type PostLikeProps = {
  postId: string;
};

type PostLikeResponse = {
  status?: string;
  likes?: number;
};

const LIKE_REQUEST_TIMEOUT_MS = 8000;

const normalizeApiBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/g, '') ?? '';

const getLikeEndpoints = (apiPath: string) => {
  const prefixedEndpoint = withBasePath(apiPath);
  const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  const endpoints = new Set<string>();

  if (apiBaseUrl) {
    endpoints.add(`${apiBaseUrl}${apiPath}`);
    endpoints.add(`${apiBaseUrl}${prefixedEndpoint}`);
  }

  endpoints.add(prefixedEndpoint);
  endpoints.add(apiPath);
  return [...endpoints];
};

export default function PostLike({ postId }: Readonly<PostLikeProps>) {
  const { t, i18n } = useTranslation('post');
  const [likes, setLikes] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [plusOneToken, setPlusOneToken] = React.useState(0);
  const [plusOneVisible, setPlusOneVisible] = React.useState(false);
  const [isCountPopping, setIsCountPopping] = React.useState(false);
  const plusOneTimeoutRef = React.useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const countPopTimeoutRef = React.useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  const numberFormatter = React.useMemo(() => {
    const language = i18n.resolvedLanguage ?? i18n.language ?? 'en';
    return new Intl.NumberFormat(language);
  }, [i18n.language, i18n.resolvedLanguage]);

  const callLikesAPI = React.useCallback(
    async (method: 'GET' | 'POST') => {
      const basePath = '/api/post-likes';
      const query = new URLSearchParams({ postId }).toString();
      const endpointPath = method === 'GET' ? `${basePath}?${query}` : basePath;
      const endpoints = getLikeEndpoints(endpointPath);

      for (const endpoint of endpoints) {
        const controller = new AbortController();
        const timeoutID = globalThis.setTimeout(() => controller.abort(), LIKE_REQUEST_TIMEOUT_MS);

        try {
          const response = await fetch(endpoint, {
            method,
            headers:
              method === 'POST'
                ? {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                  }
                : {
                    Accept: 'application/json',
                  },
            body: method === 'POST' ? JSON.stringify({ postId }) : undefined,
            signal: controller.signal,
          });

          const payload = (await response.json().catch(() => null)) as PostLikeResponse | null;
          if (!response.ok || payload?.status !== 'success') {
            continue;
          }

          return payload;
        } catch {
          // Try next endpoint candidate.
        } finally {
          globalThis.clearTimeout(timeoutID);
        }
      }

      return null;
    },
    [postId],
  );

  React.useEffect(() => {
    let isMounted = true;

    const loadLikes = async () => {
      setIsLoading(true);
      setHasError(false);

      const result = await callLikesAPI('GET');
      if (!isMounted) {
        return;
      }

      if (!result || typeof result.likes !== 'number') {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      setLikes(result.likes);
      setIsLoading(false);
    };

    void loadLikes();

    return () => {
      isMounted = false;
    };
  }, [callLikesAPI]);

  React.useEffect(
    () => () => {
      if (plusOneTimeoutRef.current) {
        globalThis.clearTimeout(plusOneTimeoutRef.current);
      }
      if (countPopTimeoutRef.current) {
        globalThis.clearTimeout(countPopTimeoutRef.current);
      }
    },
    [],
  );

  const formattedLikes = numberFormatter.format(Math.max(0, likes));

  const handleLike = React.useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setHasError(false);

    const result = await callLikesAPI('POST');
    if (!result || typeof result.likes !== 'number') {
      setHasError(true);
      setIsSubmitting(false);
      return;
    }

    setLikes(result.likes);
    setPlusOneToken(previous => previous + 1);
    setPlusOneVisible(true);
    setIsCountPopping(true);

    if (plusOneTimeoutRef.current) {
      globalThis.clearTimeout(plusOneTimeoutRef.current);
    }
    plusOneTimeoutRef.current = globalThis.setTimeout(() => {
      setPlusOneVisible(false);
    }, 900);

    if (countPopTimeoutRef.current) {
      globalThis.clearTimeout(countPopTimeoutRef.current);
    }
    countPopTimeoutRef.current = globalThis.setTimeout(() => {
      setIsCountPopping(false);
    }, 280);

    setIsSubmitting(false);
  }, [callLikesAPI, isSubmitting]);

  const busy = isLoading || isSubmitting;

  return (
    <div className="post-like-widget" aria-live="polite">
      <button
        type="button"
        className="post-like-button"
        onClick={handleLike}
        disabled={busy}
        aria-label={`${t('post.like.button')} ${formattedLikes}`}
      >
        <span className={`post-like-heart${plusOneVisible ? ' is-burst' : ''}`} aria-hidden="true">
          <FontAwesomeIcon icon={faHeart} className="post-like-heart-icon" />
        </span>
        <span className="post-like-count-wrap">
          {plusOneVisible && (
            <span key={plusOneToken} className="post-like-plus-one" aria-hidden="true">
              +1
            </span>
          )}
          <span className={`post-like-count${isCountPopping ? ' is-pop' : ''}`}>{formattedLikes}</span>
        </span>
      </button>
      <p className={`post-like-status${hasError ? ' is-error' : ''}`}>
        {hasError ? (
          t('post.like.error')
        ) : isLoading ? (
          <span className="d-inline-flex align-items-center gap-2">
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            <span>{t('post.like.loading')}</span>
          </span>
        ) : (
          t('post.like.countLabel')
        )}
      </p>
    </div>
  );
}
