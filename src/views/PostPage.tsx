'use client';

import React from 'react';
import PostDetail from '@/components/posts/PostDetail';
import type { LayoutPostSummary, Post, PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { resolvePostContent } from '@/lib/contentCompression';
import type { AdjacentPostLink } from '@/lib/postFilters';

type PostPageProps = {
  post: Post;
  relatedPosts?: PostSummary[];
  previousPost?: AdjacentPostLink | null;
  nextPost?: AdjacentPostLink | null;
  layoutPosts?: LayoutPostSummary[];
  preFooterTopTopics?: Topic[];
};

export default function PostPage({
  post,
  relatedPosts = [],
  previousPost = null,
  nextPost = null,
  layoutPosts = [],
  preFooterTopTopics = [],
}: Readonly<PostPageProps>) {
  const postWithContent = React.useMemo(() => {
    const contentHtml = resolvePostContent(post);
    return { ...post, contentHtml };
  }, [post]);

  return (
    <Layout posts={layoutPosts} preFooterTopTopics={preFooterTopTopics} searchEnabled={true}>
      <PostDetail post={postWithContent} relatedPosts={relatedPosts} previousPost={previousPost} nextPost={nextPost} />
    </Layout>
  );
}
