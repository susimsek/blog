import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostPage from '@/views/PostPage';
import {
  getAllPostIds,
  getAllTopics,
  getLayoutPosts,
  getPostData,
  getSortedPostsData,
  getTopTopicsFromPosts,
} from '@/lib/posts';
import { getAdjacentPosts, getRelatedPosts } from '@/lib/postFilters';
import { AUTHOR_NAME } from '@/config/constants';
import { buildNotFoundMetadata, buildPageMetadata } from '@/lib/metadata';

export async function generateStaticParams() {
  const paths = await getAllPostIds();
  return paths.map(path => ({
    locale: path.params.locale,
    id: path.params.id,
  }));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/posts/[id]'>): Promise<Metadata> {
  const { locale, id } = await params;
  const post = await getPostData(id, locale);

  if (!post) {
    return buildNotFoundMetadata();
  }

  const keywords = (post.topics ?? []).map(topic => topic.name);

  return buildPageMetadata({
    locale,
    title: post.title,
    description: post.summary,
    keywords: keywords.join(', '),
    path: `posts/${id}`,
    image: post.thumbnail ?? undefined,
    type: 'article',
    openGraph: {
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: [AUTHOR_NAME],
      tags: keywords,
    },
  });
}

export default async function PostRoute({ params }: Readonly<PageProps<'/[locale]/posts/[id]'>>) {
  const { locale, id } = await params;

  const post = await getPostData(id, locale);
  if (!post) {
    notFound();
  }

  const allPosts = await getSortedPostsData(locale);
  const relatedPosts = getRelatedPosts(post, allPosts, 3);
  const { previousPost, nextPost } = getAdjacentPosts(post.id, allPosts);
  const layoutPosts = getLayoutPosts(allPosts);
  const topics = await getAllTopics(locale);
  const preFooterTopTopics = getTopTopicsFromPosts(allPosts, topics);

  return (
    <PostPage
      locale={locale}
      post={post}
      relatedPosts={relatedPosts}
      previousPost={previousPost}
      nextPost={nextPost}
      layoutPosts={layoutPosts}
      preFooterTopTopics={preFooterTopTopics}
    />
  );
}
