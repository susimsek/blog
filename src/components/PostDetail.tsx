// components/PostDetail.tsx
import { Post } from '@/types/posts';
import { Container, Badge } from 'react-bootstrap';
import { assetPrefix } from '@/config/constants';
import DateDisplay from '@/components/DateDisplay';

export default function PostDetail({ post }: { post: Post }) {
  const { title, date, contentHtml, thumbnail, topics } = post;
  return (
    <Container className="mt-5" style={{ maxWidth: '700px' }}>
      <h1 className="fw-bold display-4 text-center mb-4">{title}</h1>
      <p className="text-muted text-center mb-4" style={{ fontSize: '1.1rem' }}>
        <DateDisplay date={date} />
      </p>
      {topics && topics.length > 0 && (
        <div className="text-center mb-4">
          {topics.map(topic => (
            <Badge key={topic} bg="secondary" className="me-2">
              {topic}
            </Badge>
          ))}
        </div>
      )}
      {thumbnail && (
        <div className="text-center mb-5">
          <img src={`${assetPrefix}${thumbnail}`} alt={title} className="img-fluid rounded" />
        </div>
      )}
      <article className="fs-5 lh-lg" dangerouslySetInnerHTML={{ __html: contentHtml || '' }} />
    </Container>
  );
}
