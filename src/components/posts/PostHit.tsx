'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { fetchPost, incrementPostHit } from '@/lib/contentApi';
import { defaultLocale } from '@/i18n/settings';

type PostHitProps = {
  postId: string;
};

const DIGIT_PAD_LENGTH = 6;

export default function PostHit({ postId }: Readonly<PostHitProps>) {
  const { t, i18n } = useTranslation('post');
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const locale = routeLocale ?? defaultLocale;
  const [hits, setHits] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const trackedRef = React.useRef(false);

  const resolvedLanguage = i18n?.resolvedLanguage ?? i18n?.language ?? defaultLocale;
  const numberFormatter = React.useMemo(
    () => new Intl.NumberFormat(resolvedLanguage, { useGrouping: false }),
    [resolvedLanguage],
  );

  React.useEffect(() => {
    let isMounted = true;
    trackedRef.current = false;

    const loadHits = async () => {
      setIsLoading(true);
      setHasError(false);

      const payload = await fetchPost(locale, postId);

      if (!isMounted) {
        return;
      }

      const initialHits = payload?.status === 'success' ? payload.hits : null;
      if (typeof initialHits !== 'number') {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      setHits(Math.max(0, Math.trunc(initialHits)));
      setIsLoading(false);
    };

    void loadHits();

    return () => {
      isMounted = false;
    };
  }, [locale, postId]);

  React.useEffect(() => {
    if (trackedRef.current || hits === null) {
      return;
    }
    trackedRef.current = true;

    let isMounted = true;
    const trackHit = async () => {
      const nextHits = await incrementPostHit(postId);
      if (!isMounted || typeof nextHits !== 'number') {
        return;
      }
      setHits(Math.max(0, Math.trunc(nextHits)));
    };

    void trackHit();

    return () => {
      isMounted = false;
    };
  }, [hits, postId]);

  const rawDigits = numberFormatter.format(Math.max(0, hits ?? 0));
  const hitDigits = rawDigits.padStart(DIGIT_PAD_LENGTH, '0');
  const isLoadingState = isLoading && hits === null;
  const hitDisplay = isLoadingState ? (
    <span className="d-inline-flex align-items-center post-hit-loading">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <output className="visually-hidden">{t('post.hit.loading')}</output>
    </span>
  ) : (
    hitDigits
  );

  return (
    <aside className="post-hit-widget" aria-live="polite">
      <div className={`post-updated-note post-hit-note${hasError ? ' is-error' : ''}`}>
        <span className="post-updated-note-icon" aria-hidden="true">
          <FontAwesomeIcon icon={faEye} />
        </span>
        <p className="post-updated-note-text">
          <span className="post-updated-note-label">{t('post.hit.title')}</span>
          <output className="post-updated-note-date" aria-label={t('post.hit.aria', { count: Math.max(0, hits ?? 0) })}>
            {hitDisplay}
          </output>
        </p>
      </div>
      {hasError && <p className="post-hit-status is-error">{t('post.hit.error')}</p>}
    </aside>
  );
}
