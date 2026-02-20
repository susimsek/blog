import Link from '@/components/common/Link';
import { Post } from '@/types/posts';
import Badge from 'react-bootstrap/Badge';
import DateDisplay from '@/components/common/DateDisplay';
import { useTranslation } from 'react-i18next';
import { assetPrefix } from '@/config/constants';
import Thumbnail from '@/components/common/Thumbnail';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatReadingTime } from '@/lib/readingTime';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { useAppSelector } from '@/config/store';
import React from 'react';
import PostLikeCount from '@/components/posts/PostLikeCount';

interface PostSummaryProps {
  post: Post;
  highlightQuery?: string;
  showSource?: boolean;
  showLikes?: boolean;
  likeCount?: number | null;
  likeCountLoading?: boolean;
}

const escapeRegExp = (value: string) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const highlight = (text: string, query: string): React.ReactNode => {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length >= 2);

  if (tokens.length === 0) {
    return text;
  }

  const regex = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <mark key={`${part}-${index}`} className="px-1">
          {part}
        </mark>
      );
    }
    return part;
  });
};

export default function PostSummary({
  post,
  highlightQuery,
  showSource = false,
  showLikes = false,
  likeCount = null,
  likeCountLoading = false,
}: Readonly<PostSummaryProps>) {
  const { id, title, publishedDate, summary, thumbnail, topics, readingTimeMin, source, link } = post;
  const { t } = useTranslation(['post', 'common']);
  const isVoiceEnabled = useAppSelector(state => state.voice.isEnabled);
  const readMoreSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const sourceLabel =
    source === 'medium'
      ? t('common.searchSource.medium', { ns: 'common' })
      : t('common.searchSource.blog', { ns: 'common' });
  const sourceIcon: IconProp = source === 'medium' ? (['fab', 'medium'] as IconProp) : 'book';

  const postLink = link ?? `/posts/${id}`;
  const shouldRenderLikeMeta = showLikes && (likeCount !== null || likeCountLoading);
  const resolveThumbnailSrc = (value: string) => {
    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    const normalizedPath = value.startsWith('/') ? value : `/${value}`;
    if (!assetPrefix) {
      return normalizedPath;
    }

    const normalizedPrefix = assetPrefix.endsWith('/') ? assetPrefix.slice(0, -1) : assetPrefix;
    return `${normalizedPrefix}${normalizedPath}`;
  };
  const thumbnailSrc = (() => {
    if (!thumbnail) {
      return null;
    }
    return resolveThumbnailSrc(thumbnail);
  })();
  const q = highlightQuery?.trim() ?? '';
  const titleNode = q ? highlight(title, q) : title;
  const summaryNode = q ? highlight(summary, q) : summary;

  React.useEffect(
    () => () => {
      if (readMoreSoundRef.current) {
        readMoreSoundRef.current.pause();
        readMoreSoundRef.current = null;
      }
    },
    [],
  );

  const handleReadMoreHoverStart = React.useCallback(() => {
    if (!isVoiceEnabled || typeof globalThis.Audio === 'undefined') {
      return;
    }

    try {
      if (!readMoreSoundRef.current) {
        readMoreSoundRef.current = new Audio('/sounds/rising-pops.mp3');
        readMoreSoundRef.current.preload = 'auto';
      }

      const sound = readMoreSoundRef.current;
      sound.volume = 0.25;
      sound.playbackRate = 1;
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
  }, [isVoiceEnabled]);

  const handleReadMoreHoverEnd = React.useCallback(() => {
    if (!readMoreSoundRef.current) {
      return;
    }

    readMoreSoundRef.current.pause();
    readMoreSoundRef.current.currentTime = 0;
  }, []);

  return (
    <div className="post-card d-flex align-items-center post-summary-card">
      <div className="post-card-content flex-grow-1">
        <h2 className="fw-bold post-summary-title">
          <Link href={postLink} className="link">
            {titleNode}
          </Link>
        </h2>
        <p className="post-summary-meta">
          <Link href={postLink} className="link-muted d-flex align-items-center">
            <FontAwesomeIcon icon="calendar-alt" className="me-2" />
            <DateDisplay date={publishedDate} />
          </Link>
          <span className="text-muted d-flex align-items-center">
            <FontAwesomeIcon icon="clock" className="me-2" />
            {formatReadingTime(readingTimeMin, t)}
          </span>
          {shouldRenderLikeMeta && (
            <Link href={postLink} className="link-muted d-flex align-items-center">
              <PostLikeCount likes={likeCount} isLoading={likeCountLoading} />
            </Link>
          )}
          {showSource && (
            <span className="text-muted d-flex align-items-center">
              <FontAwesomeIcon icon={sourceIcon} className="me-2" />
              {sourceLabel}
            </span>
          )}
        </p>
        {topics && topics.length > 0 && (
          <div className="post-summary-topics">
            {topics.map(topic => (
              <Link key={topic.id} href={topic.link ?? `/topics/${topic.id}`}>
                <Badge bg={topic.color} className={`badge-${topic.color}`}>
                  {topic.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
        {thumbnailSrc && (
          <Link href={postLink} className="post-summary-thumbnail">
            <Thumbnail className="thumbnail-wrapper" src={thumbnailSrc} alt={title} width={800} height={600} />
          </Link>
        )}
        <p className="post-summary-text">{summaryNode}</p>
        <div className="post-summary-cta">
          <Link
            href={postLink}
            className="btn btn-primary post-summary-read-more"
            aria-label={t('post.readMore')}
            onMouseEnter={handleReadMoreHoverStart}
            onMouseLeave={handleReadMoreHoverEnd}
          >
            <span className="read-more-label">{t('post.readMore')}</span>
            <span className="visually-hidden">: {title}</span>
            <span className="read-more-icon-rail" aria-hidden="true">
              <span className="read-more-icon read-more-icon-front">
                <FontAwesomeIcon icon="angle-right" />
              </span>
              <span className="read-more-icon read-more-icon-back">
                <FontAwesomeIcon icon="angle-right" />
              </span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
