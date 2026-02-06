import Link from '@/components/common/Link';
import { Post } from '@/types/posts';
import Badge from 'react-bootstrap/Badge';
import DateDisplay from '@/components/common/DateDisplay';
import { useTranslation } from 'next-i18next';
import { assetPrefix } from '@/config/constants';
import Thumbnail from '@/components/common/Thumbnail';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface PostSummaryProps {
  post: Post;
  highlightQuery?: string;
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

export default function PostSummary({ post, highlightQuery }: Readonly<PostSummaryProps>) {
  const { id, title, date, summary, thumbnail, topics, readingTime, link } = post;
  const { t } = useTranslation('post');

  const postLink = link ?? `/posts/${id}`;
  const q = highlightQuery?.trim() ?? '';
  const titleNode = q ? highlight(title, q) : title;
  const summaryNode = q ? highlight(summary, q) : summary;

  return (
    <div className="post-card d-flex align-items-center mb-4">
      <div className="post-card-content flex-grow-1">
        <h2 className="fw-bold mb-4">
          <Link href={postLink} className="link">
            {titleNode}
          </Link>
        </h2>
        <p className="d-flex align-items-center">
          <Link href={postLink} className="link-muted d-flex align-items-center me-3">
            <FontAwesomeIcon icon="calendar-alt" className="me-2" />
            <DateDisplay date={date} />
          </Link>
          <span className="text-muted d-flex align-items-center">
            <FontAwesomeIcon icon="clock" className="me-2" />
            {readingTime}
          </span>
        </p>
        {topics && topics.length > 0 && (
          <div className="mb-4">
            {topics.map(topic => (
              <Link key={topic.id} href={topic.link ?? `/topics/${topic.id}`}>
                <Badge bg={topic.color} className={`me-2 badge-${topic.color}`}>
                  {topic.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
        {thumbnail && (
          <Link href={postLink}>
            <Thumbnail
              className="thumbnail-wrapper"
              src={`${assetPrefix}${thumbnail}`}
              alt={title}
              width={800}
              height={600}
            />
          </Link>
        )}
        <p className="mb-4">{summaryNode}</p>
        <div className="mb-4">
          <Link href={postLink} className="btn btn-primary">
            {t('post.readMore')}
          </Link>
        </div>
      </div>
    </div>
  );
}
