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

interface PostSummaryProps {
  post: Post;
  highlightQuery?: string;
  showSource?: boolean;
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

export default function PostSummary({ post, highlightQuery, showSource = false }: Readonly<PostSummaryProps>) {
  const { id, title, date, summary, thumbnail, topics, readingTimeMin, source, link } = post;
  const { t } = useTranslation(['post', 'common']);
  const sourceLabel =
    source === 'medium'
      ? t('common.searchSource.medium', { ns: 'common' })
      : t('common.searchSource.blog', { ns: 'common' });
  const sourceIcon: IconProp = source === 'medium' ? (['fab', 'medium'] as IconProp) : 'book';

  const postLink = link ?? `/posts/${id}`;
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
            <DateDisplay date={date} />
          </Link>
          <span className="text-muted d-flex align-items-center">
            <FontAwesomeIcon icon="clock" className="me-2" />
            {formatReadingTime(readingTimeMin, t)}
          </span>
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
          <Link href={postLink} className="btn btn-primary">
            {t('post.readMore')}
          </Link>
        </div>
      </div>
    </div>
  );
}
