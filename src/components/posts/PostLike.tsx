'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import { fetchPosts, incrementPostLike } from '@/lib/contentApi';
import { defaultLocale } from '@/i18n/settings';
import { useAppSelector } from '@/config/store';

type PostLikeProps = {
  postId: string;
};

const LIKE_SOUND_CONFIG = {
  src: '/sounds/pop-light.mp3',
  volume: 0.25,
} as const;

export default function PostLike({ postId }: Readonly<PostLikeProps>) {
  const { t, i18n } = useTranslation('post');
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
  const locale = routeLocale ?? defaultLocale;
  const isVoiceEnabled = useAppSelector(state => state.voice.isEnabled);
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

  React.useEffect(() => {
    let isMounted = true;

    const loadLikes = async () => {
      setIsLoading(true);
      setHasError(false);

      const payload = await fetchPosts(locale, {
        page: 1,
        size: 1,
        scopeIds: [postId],
      });
      if (!isMounted) {
        return;
      }

      const result = payload?.status === 'success' ? payload.likesByPostId?.[postId] : null;
      if (typeof result !== 'number') {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      setLikes(result);
      setIsLoading(false);
    };

    void loadLikes();

    return () => {
      isMounted = false;
    };
  }, [locale, postId]);

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

  const playSound = React.useCallback((src: string, volume = 1) => {
    try {
      const sound = new Audio(src);
      sound.preload = 'auto';
      sound.volume = volume;
      sound.currentTime = 0;
      const playPromise = sound.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Ignore playback failures (autoplay restrictions / unsupported environments).
        });
      }
    } catch {
      // Ignore playback failures (autoplay restrictions / unsupported environments).
    }
  }, []);

  const playLikeSound = React.useCallback(() => {
    if (!isVoiceEnabled || typeof globalThis.Audio === 'undefined') {
      return;
    }
    playSound(LIKE_SOUND_CONFIG.src, LIKE_SOUND_CONFIG.volume);
  }, [isVoiceEnabled, playSound]);

  const handleLike = React.useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    const previousLikes = likes;
    setIsSubmitting(true);
    setHasError(false);
    playLikeSound();
    setLikes(previous => previous + 1);
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

    const result = await incrementPostLike(postId);
    if (typeof result !== 'number') {
      setLikes(previousLikes);
      setHasError(true);
      setIsSubmitting(false);
      return;
    }

    setLikes(result);
    setIsSubmitting(false);
  }, [isSubmitting, likes, playLikeSound, postId]);

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
        ) : busy ? (
          <span className="d-inline-flex align-items-center">
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            <span className="visually-hidden">{t('post.like.loading')}</span>
          </span>
        ) : (
          t('post.like.countLabel')
        )}
      </p>
    </div>
  );
}
