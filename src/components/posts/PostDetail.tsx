// components/posts/PostDetail.tsx
import { Post } from '@/types/posts';
import { Container, Badge } from 'react-bootstrap';
import { assetPrefix } from '@/config/constants';
import DateDisplay from '@/components/common/DateDisplay';
import Thumbnail from '@/components/common/Thumbnail';

interface PostDetailProps {
  post: Post;
}

export default function PostDetail({ post }: Readonly<PostDetailProps>) {
  const { title, date, contentHtml, thumbnail, topics } = post;

  return (
    <Container className="mt-5" style={{ maxWidth: '700px' }}>
      <h1 className="fw-bold display-4 text-center mb-4">{title}</h1>
      <p className="text-muted text-center mb-4" style={{ fontSize: '1.1rem' }}>
        <DateDisplay date={date} />
      </p>
      {topics && topics.length > 0 && (
        <div className="mb-4">
          {topics.map(topic => (
            <Badge key={topic.name} bg={topic.color} className={`me-2 badge-${topic.color}`}>
              {topic.name}
            </Badge>
          ))}
        </div>
      )}
      {thumbnail && <Thumbnail src={`${assetPrefix}${thumbnail}`} alt={title} width={800} height={600} />}
      <article className="fs-5 lh-lg" dangerouslySetInnerHTML={{ __html: contentHtml ?? '' }} />
    </Container>
  );
}
