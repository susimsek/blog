// pages/index.tsx
import { getSortedPostsData } from '@/lib/posts';
import PostList from '@/components/PostList';
import { Post } from '@/types/posts';
import Head from 'next/head';

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
    <>
      <Head>
        <title>Welcome to My Blog</title>
        <meta
          name="description"
          content="Explore the latest articles, tutorials, and insights on my blog. Discover a variety of topics including programming, technology, and more."
        />
        <meta name="keywords" content="blog, articles, tutorials, programming, technology" />
        <meta name="author" content="Şuayb Şimşek" />
      </Head>
      <div>
        <header className="text-center py-5">
          <h1 className="fw-bold mb-4">Welcome to My Blog</h1>
          <p className="text-muted fs-5">Explore the latest articles, tutorials, and insights.</p>
        </header>
        <PostList posts={allPostsData} />
      </div>
    </>
  );
}
