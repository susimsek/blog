'use client';

import React from 'react';
import PostDetail from '@/components/posts/PostDetail';
import Layout from '@/components/common/Layout';
import { resolvePostContent } from '@/lib/contentCompression';
import type { Localized } from '@/i18n/settings';
import type { PostPageData } from '@/lib/localizedPageData';
import { useLocalizedContent } from '@/i18n/useLocalizedContent';
import { defaultLocale } from '@/i18n/settings';

type PostPageProps = { contentByLocale: Localized<PostPageData> };

export default function PostPage({ contentByLocale }: Readonly<PostPageProps>) {
  const selectedData = useLocalizedContent(contentByLocale);
  const post = selectedData.post ?? contentByLocale[defaultLocale].post;
  const postWithContent = React.useMemo(() => {
    if (!post) return null;
    const contentHtml = resolvePostContent(post);
    return { ...post, contentHtml };
  }, [post]);

  if (!post || !postWithContent) return null;

  return (
    <Layout
      posts={selectedData.layoutPosts}
      topics={selectedData.topics}
      preFooterTopTopics={selectedData.preFooterTopTopics}
      searchEnabled={true}
    >
      <PostDetail
        post={postWithContent}
        relatedPosts={selectedData.relatedPosts}
        previousPost={selectedData.previousPost}
        nextPost={selectedData.nextPost}
      />
    </Layout>
  );
}
