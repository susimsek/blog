import { getAllPostIds, getPostData } from '@/lib/posts';
import React from 'react';
import PostDetail from '@/components/PostDetail';
import type { Post } from '@/types/posts'; // type-only import

export async function getStaticProps({ params }: { params: { id: string } }) {
  const postData = await getPostData(params.id);
  return {
    props: {
      postData,
    },
  };
}

export async function getStaticPaths() {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
}

export default function Post({ postData }: { postData: Post }) {
  return <PostDetail postData={postData} />;
}
