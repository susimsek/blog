import Link from 'next/link';
import { Post } from '@/types/posts';
import { Container } from 'react-bootstrap';

export default function PostList({ posts }: { posts: Post[] }) {
  return (
    <Container className="mt-5" style={{ maxWidth: '700px' }}>
      {posts.map(({ id, title, date, summary }) => (
        <div key={id} className="mb-5">
          <h2 className="fw-bold mb-3">
            <Link href={`/posts/${id}`} className="text-decoration-none hover-link">
              {title}
            </Link>
          </h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            {new Date(date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="fs-5 lh-lg text-muted">{summary}</p>
          <Link href={`/posts/${id}`} className="text-decoration-none hover-link">
            <span className="fw-bold">Read More</span>
          </Link>
        </div>
      ))}
    </Container>
  );
}
