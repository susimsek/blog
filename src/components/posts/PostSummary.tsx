import Link from '@/components/common/Link';
import { Post } from '@/types/posts';
import { Badge, Button } from 'react-bootstrap';
import DateDisplay from '@/components/common/DateDisplay';
import { useTranslation } from 'next-i18next';
import { assetPrefix } from '@/config/constants';
import Thumbnail from '@/components/common/Thumbnail';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface PostSummaryProps {
  post: Post;
}

export default function PostSummary({ post }: Readonly<PostSummaryProps>) {
  const { id, title, date, summary, thumbnail, topics, readingTime, link } = post;
  const { t } = useTranslation('post');

  const postLink = link ?? `/posts/${id}`;

  return (
    <div className="post-card d-flex align-items-center mb-4">
      <div className="post-card-content flex-grow-1">
        <h2 className="fw-bold mb-4">
          <Link href={postLink} className="link">
            {title}
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
        <p className="mb-4">{summary}</p>
        <div className="mb-4">
          <Link href={postLink}>
            <Button className="primary">{t('post.readMore')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
