'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

type PostLikeCountProps = {
  likes: number | null;
  isLoading?: boolean;
};

export default function PostLikeCount({ likes, isLoading = false }: Readonly<PostLikeCountProps>) {
  const { i18n, t } = useTranslation('post');

  const numberFormatter = React.useMemo(() => {
    const language = i18n.resolvedLanguage ?? i18n.language ?? 'en';
    return new Intl.NumberFormat(language);
  }, [i18n.language, i18n.resolvedLanguage]);

  if (isLoading && likes === null) {
    return (
      <span className="text-muted d-inline-flex align-items-center post-summary-like-meta">
        <span className="spinner-border spinner-border-sm" role="status" aria-label={t('post.like.loading')} />
      </span>
    );
  }

  if (likes === null) {
    return null;
  }

  const formattedLikes = numberFormatter.format(likes);

  return (
    <span
      className="text-muted d-inline-flex align-items-center post-summary-like-meta"
      aria-label={`${formattedLikes} ${t('post.like.sidebarLabel')}`}
    >
      <FontAwesomeIcon icon={faHeart} className="post-summary-like-icon" />
      <span className="post-summary-like-value">{formattedLikes}</span>
    </span>
  );
}
