import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostPage from '@/views/PostPage';
import { getAllPostIds, getPostData } from '@/lib/posts';
import { AUTHOR_NAME } from '@/config/constants';
import { buildNotFoundMetadata, buildPageMetadata } from '@/lib/metadata';
import { defaultLocale, isSupportedLocale } from '@/i18n/settings';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { loadLocaleResources } from '@/i18n/server';
import { getLocalizedPostPageData } from '@/lib/localizedPageData';

export async function generateStaticParams() {
  const paths = await getAllPostIds();
  return paths
    .filter(path => path.params.locale !== defaultLocale)
    .map(path => ({
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
  const availableLocales = (await getAllPostIds())
    .filter(postPath => postPath.params.id === id)
    .map(postPath => postPath.params.locale);

  return buildPageMetadata({
    locale,
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

export default async function PostRoute({ params }: Readonly<PageProps<'/[locale]/posts/[id]'>>) {
  const { locale, id } = await params;
  const contentByLocale = await getLocalizedPostPageData(id);
  if (!isSupportedLocale(locale) || !contentByLocale[locale]?.post) notFound();
  const resources = await loadLocaleResources(locale, ['post']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <PostPage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
