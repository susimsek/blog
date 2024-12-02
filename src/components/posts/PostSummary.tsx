import Link from '@/components/common/Link';
import Image from 'next/image';
import { Post } from '@/types/posts';
import { Badge, Button } from 'react-bootstrap';
import DateDisplay from '@/components/common/DateDisplay';
import { useTranslation } from 'next-i18next';
import { assetPrefix } from '@/config/constants';

interface PostCardProps {
  post: Post;
}

export default function PostSummary({ post }: PostCardProps) {
  const { id, title, date, summary, thumbnail, topics } = post;
  const { t } = useTranslation('post');

  return (
    <div className="post-card d-flex align-items-center mb-4">
      <div className="post-card-content flex-grow-1">
        <h2 className="fw-bold mb-4">
          <Link href={`/posts/${id}`} className="link">
            {title}
          </Link>
        </h2>
        <p className="text-muted">
          <DateDisplay date={date} />
        </p>
        {topics && topics.length > 0 && (
          <div className="mb-4">
            {topics.map(topic => (
              <Badge key={topic} bg="secondary" className="me-2">
                {topic}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-muted mb-4">{summary}</p>
        <div className="mt-4">
          <Link href={`/posts/${id}`}>
            <Button className="primary">{t('post.readMore')}</Button>
          </Link>
        </div>
      </div>
      {thumbnail && (
        <Link href={`/posts/${id}`}>
          <div className="post-card-thumbnail-wrapper ms-3">
            <Image
              src={`${assetPrefix}${thumbnail}`}
              alt={title}
              className="rounded"
              width={120}
              height={80}
              style={{ objectFit: 'cover' }}
            />
          </div>
        </Link>
      )}
    </div>
  );
}