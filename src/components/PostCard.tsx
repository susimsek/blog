import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types/posts';
import { Badge } from 'react-bootstrap'; // React-Bootstrap Badge bileşeni

interface PostCardProps {
  post: Post;
}

const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || '';

export default function PostCard({ post }: PostCardProps) {
  const { id, title, date, summary, thumbnail, topics } = post;

  return (
    <div className="post-card d-flex align-items-center mb-4">
      <div className="post-card-content flex-grow-1">
        <h2 className="fw-bold mb-2">
          <Link href={`/posts/${id}`} className="link">
            {title}
          </Link>
        </h2>
        <p className="text-muted mb-2">{summary}</p>
        <p className="text-muted">
          {new Date(date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        {topics && topics.length > 0 && (
          <div className="mt-2">
            {topics.map(topic => (
              <Badge key={topic} bg="secondary" className="me-2">
                {topic}
              </Badge>
            ))}
          </div>
        )}
      </div>
      {thumbnail && (
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
      )}
    </div>
  );
}
