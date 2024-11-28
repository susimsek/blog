// pages/index.tsx
import { getSortedPostsData } from '@/lib/posts';
import PostList from '@/components/PostList';
import { Post } from '@/types/posts';
import { Container } from 'react-bootstrap';

export async function getStaticProps() {
  const allPostsData: Post[] = getSortedPostsData();
  return {
    props: {
      allPostsData,
    },
  };
}

export default function Home({ allPostsData }: { allPostsData: Post[] }) {
  return (
    <Container className="mt-5">
      <div className="p-5 mb-4 bg-light rounded-3 text-center">
        <h1 className="display-4">Welcome to My Blog</h1>
        <p className="lead">Discover the latest articles and updates.</p>
      </div>
      <PostList posts={allPostsData} />
    </Container>
  );
}
