// pages/index.tsx
import { getSortedPostsData } from '@/lib/posts';
import PostList from '@/components/PostList';
import { Post } from '@/types/posts';

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
    <div className="container mt-5">
      <h1>My Blog</h1>
      <p>Welcome to my blog! Here are the latest posts:</p>
      <PostList posts={allPostsData} />
    </div>
  );
}
