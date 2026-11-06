import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostPage from '@/views/PostPage';
import { getAllPostIds, getPostData } from '@/lib/posts';
import { AUTHOR_NAME } from '@/config/constants';
import { defaultLocale } from '@/i18n/settings';
import { buildNotFoundMetadata, buildPageMetadata } from '@/lib/metadata';
import { getLocalizedPostPageData } from '@/lib/localizedPageData';

type PostRouteParams = { id: string };

export async function generateStaticParams(): Promise<PostRouteParams[]> {
  const paths = await getAllPostIds();
  return paths.filter(path => path.params.locale === defaultLocale).map(path => ({ id: path.params.id }));
}

export async function generateMetadata({ params }: PageProps<'/posts/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostData(id, defaultLocale);

  if (!post) {
    return buildNotFoundMetadata();
  }

  const keywords = (post.topics ?? []).map(topic => topic.name);
  const availableLocales = (await getAllPostIds())
    .filter(postPath => postPath.params.id === id)
    .map(postPath => postPath.params.locale);

  return buildPageMetadata({
    locale: defaultLocale,
    title: post.title,
    description: post.summary,
    keywords: keywords.join(', '),
    path: `posts/${id}`,
    image: post.thumbnail ?? undefined,
    type: 'article',
    availableLocales,
    openGraph: {
      type: 'article',
      publishedTime: post.publishedDate,
      modifiedTime: post.updatedDate ?? post.publishedDate,
      authors: [AUTHOR_NAME],
      tags: keywords,
    },
  });
}

export default async function PostRoute({ params }: Readonly<PageProps<'/posts/[id]'>>) {
  const { id } = await params;
  const contentByLocale = await getLocalizedPostPageData(id);
  if (!contentByLocale[defaultLocale].post) {
    notFound();
  }

  return <PostPage contentByLocale={contentByLocale} />;
}
