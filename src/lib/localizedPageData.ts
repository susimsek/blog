import 'server-only';
import { defaultLocale, locales } from '@/i18n/settings';
import type { Locale } from '@/i18n/settings';
import {
  getAllPostsData,
  getAllTopics,
  getCategoryData,
  getLayoutPosts,
  getPostData,
  getSortedPostsData,
  getTopicData,
  getTopTopicsFromPosts,
} from '@/lib/posts';
import { getAdjacentPosts, getRelatedPosts } from '@/lib/postFilters';
import type { Category, LayoutPostSummary, Post, PostSummary, Topic } from '@/types/posts';
import type { AdjacentPostLink } from '@/lib/postFilters';

export type LocalizedContent<T> = Record<Locale, T>;

const forEachLocale = async <T>(load: (locale: Locale) => Promise<T>): Promise<LocalizedContent<T>> => {
  const entries = await Promise.all(locales.map(async locale => [locale, await load(locale)] as const));
  return Object.fromEntries(entries) as LocalizedContent<T>;
};
export type LayoutPageData = {
  layoutPosts: LayoutPostSummary[];
  topics: Topic[];
  preFooterTopTopics: Topic[];
};

export type SearchPageData = { posts: PostSummary[]; topics: Topic[] };
export type MediumPageData = LayoutPageData & { mediumPosts: PostSummary[] };
export type CategoryPageData = LayoutPageData & { category: Category | null; posts: PostSummary[] };
export type TopicPageData = LayoutPageData & { topic: Topic | null; posts: PostSummary[] };

const getLayoutPageData = async (locale: Locale): Promise<LayoutPageData> => {
  const allPosts = await getSortedPostsData(locale);
  const topics = await getAllTopics(locale);

  return {
    layoutPosts: getLayoutPosts(allPosts),
    topics,
    preFooterTopTopics: getTopTopicsFromPosts(allPosts, topics),
  };
};

export const getLocalizedLayoutPageData = () => forEachLocale(getLayoutPageData);

export const getLocalizedHomePageData = () =>
  forEachLocale(async locale => ({
    posts: await getSortedPostsData(locale),
    topics: await getAllTopics(locale),
  }));

export const getLocalizedSearchPageData = () =>
  forEachLocale(async locale => ({
    posts: await getAllPostsData(locale),
    topics: await getAllTopics(locale),
  }));

export const getLocalizedMediumPageData = () =>
  forEachLocale(async locale => {
    const [layout, mediumPosts] = await Promise.all([
      getLayoutPageData(locale),
      getSortedPostsData(locale, undefined, 'medium'),
    ]);
    return { ...layout, mediumPosts };
  });

export const getLocalizedCategoryPageData = async (id: string) => {
  const contentByLocale = await forEachLocale(async locale => {
    const [layout, category, allPosts] = await Promise.all([
      getLayoutPageData(locale),
      getCategoryData(locale, id),
      getSortedPostsData(locale),
    ]);
    return {
      ...layout,
      category,
      posts: allPosts.filter(post => post.category?.id.trim().toLowerCase() === id),
    };
  });
  const fallbackCategory =
    contentByLocale[defaultLocale].category ?? Object.values(contentByLocale).find(item => item.category)?.category;
  if (!fallbackCategory) return contentByLocale;
  return Object.fromEntries(
    locales.map(locale => [
      locale,
      { ...contentByLocale[locale], category: contentByLocale[locale].category ?? fallbackCategory },
    ]),
  ) as typeof contentByLocale;
};

export const getLocalizedTopicPageData = async (id: string) => {
  const contentByLocale = await forEachLocale(async locale => {
    const [layout, topic, allPosts] = await Promise.all([
      getLayoutPageData(locale),
      getTopicData(locale, id),
      getSortedPostsData(locale),
    ]);
    return {
      ...layout,
      topic,
      posts: allPosts.filter(post => Array.isArray(post.topics) && post.topics.some(item => item.id === id)),
    };
  });
  const fallbackTopic =
    contentByLocale[defaultLocale].topic ?? Object.values(contentByLocale).find(item => item.topic)?.topic;
  if (!fallbackTopic) return contentByLocale;
  return Object.fromEntries(
    locales.map(locale => [
      locale,
      { ...contentByLocale[locale], topic: contentByLocale[locale].topic ?? fallbackTopic },
    ]),
  ) as typeof contentByLocale;
};

export type PostPageData = LayoutPageData & {
  post: Post | null;
  relatedPosts: PostSummary[];
  previousPost: AdjacentPostLink | null;
  nextPost: AdjacentPostLink | null;
};

export const getLocalizedPostPageData = async (id: string) => {
  const contentByLocale = await forEachLocale(async locale => {
    const [layout, post, allPosts] = await Promise.all([
      getLayoutPageData(locale),
      getPostData(id, locale),
      getSortedPostsData(locale),
    ]);
    const { previousPost, nextPost } = getAdjacentPosts(id, allPosts);

    return {
      ...layout,
      post,
      relatedPosts: post ? getRelatedPosts(post, allPosts, 3) : [],
      previousPost,
      nextPost,
    };
  });
  const fallbackPost =
    contentByLocale[defaultLocale].post ?? Object.values(contentByLocale).find(item => item.post)?.post;
  if (!fallbackPost) return contentByLocale;
  return Object.fromEntries(
    locales.map(locale => [locale, { ...contentByLocale[locale], post: contentByLocale[locale].post ?? fallbackPost }]),
  ) as typeof contentByLocale;
};
