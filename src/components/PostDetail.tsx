import { Post } from '@/types/posts';
import { Container, Badge } from 'react-bootstrap';
import { assetPrefix } from '@/config/constants';

export default function PostDetail({ postData }: { postData: Post }) {
  return (
    <Container className="mt-5" style={{ maxWidth: '700px' }}>
      <h1 className="fw-bold display-4 text-center mb-4">{postData.title}</h1>
      <p className="text-muted text-center mb-4" style={{ fontSize: '1.1rem' }}>
        {new Date(postData.date).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      {postData.topics && postData.topics.length > 0 && (
        <div className="text-center mb-4">
          {postData.topics.map(topic => (
            <Badge key={topic} bg="secondary" className="me-2">
              {topic}
            </Badge>
          ))}
        </div>
      )}
      {postData.thumbnail && (
        <div className="text-center mb-5">
          <img src={`${assetPrefix}${postData.thumbnail}`} alt={postData.title} className="img-fluid rounded" />
        </div>
      )}
      <article className="fs-5 lh-lg" dangerouslySetInnerHTML={{ __html: postData.contentHtml || '' }} />
    </Container>
  );
}
