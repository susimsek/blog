// pages/index.tsx
import { getSortedPostsData } from '@/lib/posts';
import PostList from '@/components/PostList';
import { Post } from '@/types/posts';
import { Container } from 'react-bootstrap';

type HomeProps = {
  allPostsData: Post[];
};

export async function getStaticProps() {
  const allPostsData: Post[] = getSortedPostsData();
  return {
    props: {
      allPostsData,
    },
  };
}

export default function Home({ allPostsData }: HomeProps) {
  return (
    <div>
      <header className="text-center py-5">
        <h1 className="fw-bold mb-4">Welcome to My Blog</h1>
        <p className="text-muted fs-5">Explore the latest articles, tutorials, and insights.</p>
      </header>
      <PostList posts={allPostsData} />
    </div>
  );
}
