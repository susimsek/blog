import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Post, PostSummary, Topic } from '@/types/posts';
import i18nextConfig from '../../next-i18next.config';
import { GetStaticPropsContext } from 'next';
import { getI18nProps } from '@/lib/getStatic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { createCacheStore } from '@/lib/cacheUtils';
import { sortPosts } from '@/lib/postFilters';

const fsPromises = fs.promises;

const fileExists = async (filePath: string) => fs.existsSync(filePath);

// Base directory for posts
const postsDirectory = path.join(process.cwd(), 'content/posts');
const topicsDirectory = path.join(process.cwd(), 'content/topics');

export const postsCache = createCacheStore<PostSummary[]>('getSortedPostsData');
export const postDataCache = createCacheStore<Post | null>('getPostData');
export const topicsCache = createCacheStore<Topic[]>('getAllTopics');
export const topicDataCache = createCacheStore<Topic | null>('getTopicData');
export const postIdsCache = createCacheStore<{ params: { id: string; locale: string } }[]>('getAllPostIds');
export const topicIdsCache = createCacheStore<{ params: { id: string; locale: string } }[]>('getAllTopicIds');

// Helper function to parse a Markdown file
async function parsePostFile(
  filePath: string,
  includeContent: boolean = false,
): Promise<{ data: PostSummary; content?: string }> {
  const id = path.basename(filePath, '.md');
  const fileContents = await fsPromises.readFile(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const postSummary: PostSummary = {
    id,
    ...data,
  } as PostSummary;

  return includeContent ? { data: postSummary, content } : { data: postSummary };
}

// Get all posts grouped by locale with fallback support
export async function getSortedPostsData(locale: string, topicId?: string): Promise<PostSummary[]> {
  const cacheKey = `${locale}-${topicId ?? 'all'}`;
  const cachedData = postsCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const postsJsonPath = path.join(postsDirectory, locale, 'posts.json');

  if (!(await fileExists(postsJsonPath))) {
    console.error(`Posts file not found for locale "${locale}": ${postsJsonPath}`);
    postsCache.set(cacheKey, []);
    return [];
  }

  try {
    const fileContents = await fsPromises.readFile(postsJsonPath, 'utf8');
    const allPosts: PostSummary[] = JSON.parse(fileContents);
    const filteredPosts = allPosts.filter(
      post => !topicId || (Array.isArray(post.topics) && post.topics.some((t: Topic) => t.id === topicId)),
    );

    const sortedPosts = sortPosts(filteredPosts);
    postsCache.set(cacheKey, sortedPosts);
    return sortedPosts;
  } catch (error) {
    console.error(`Error reading/parsing posts.json for locale "${locale}":`, error);
    postsCache.set(cacheKey, []);
    return [];
  }
}

// Get a specific post for all locales with fallback support
export async function getPostData(id: string, locale: string): Promise<Post | null> {
  const cacheKey = `${locale}-${id}`;

  const cachedData = postDataCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const fallbackLocale = i18nextConfig.i18n.defaultLocale;

  // Localized and fallback paths
  const localizedPath = path.join(postsDirectory, locale, `${id}.md`);
  const fallbackPath = path.join(postsDirectory, fallbackLocale, `${id}.md`);

  let filePath: string | null = null;

  if (await fileExists(localizedPath)) {
    filePath = localizedPath;
  } else if (await fileExists(fallbackPath)) {
    filePath = fallbackPath;
  }

  if (!filePath) {
    postDataCache.set(cacheKey, null);
    return null;
  }

  // Parse post file and process content
  const { data, content } = await parsePostFile(filePath, true);

  const post: Post = {
    contentHtml: content,
    ...data,
  };

  postDataCache.set(cacheKey, post);

  return post;
}

export async function getTopicData(locale: string, topicId: string): Promise<Topic | null> {
  const cacheKey = `${locale}-${topicId}`;

  const cachedData = topicDataCache.get(cacheKey);
  if (cachedData) return cachedData;

  const topics = await getAllTopics(locale);
  const topic = topics.find(item => item.id === topicId) || null;

  topicDataCache.set(cacheKey, topic);
  return topic;
}

// Get all unique topics from the posts directory
export async function getAllTopics(locale: string): Promise<Topic[]> {
  const cachedData = topicsCache.get(locale);
  if (cachedData) {
    return cachedData;
  }

  const topicsFilePath = path.join(topicsDirectory, locale, 'topics.json');

  if (!(await fileExists(topicsFilePath))) {
    console.error(`Topics file not found for locale "${locale}": ${topicsFilePath}`);
    topicsCache.set(locale, []);
    return [];
  }

  try {
    const fileContents = await fsPromises.readFile(topicsFilePath, 'utf8');
    const topics = JSON.parse(fileContents) as Topic[];

    topicsCache.set(locale, topics);

    return topics;
  } catch (error) {
    console.error('Error reading or parsing topics.json:', error);
    topicsCache.set(locale, []);
    return [];
  }
}

// Generate all post IDs for static paths
export async function getAllPostIds() {
  const cachedData = postIdsCache.get('all-post-ids');
  if (cachedData) return cachedData;

  const defaultLocale = i18nextConfig.i18n.defaultLocale;
  const posts = await getSortedPostsData(defaultLocale);
  const postIds = posts.flatMap(post =>
    i18nextConfig.i18n.locales.map(locale => ({
      params: { id: post.id, locale },
    })),
  );

  postIdsCache.set('all-post-ids', postIds);
  return postIds;
}

export async function getAllTopicIds() {
  const cachedData = topicIdsCache.get('all-topic-ids');
  if (cachedData) return cachedData;

  const defaultLocale = i18nextConfig.i18n.defaultLocale;
  const topics = await getAllTopics(defaultLocale);
  const topicIds = topics.flatMap(topic =>
    i18nextConfig.i18n.locales.map(locale => ({
      params: { id: topic.id, locale },
    })),
  );

  topicIdsCache.set('all-topic-ids', topicIds);
  return topicIds;
}

// Factory for generating localized props for post lists
export const makePostProps =
  (ns: string[] = []) =>
  async (context: GetStaticPropsContext) => {
    const locale = (context?.params?.locale as string) || i18nextConfig.i18n.defaultLocale;

    const posts = await getSortedPostsData(locale);
    const topics = await getAllTopics(locale);

    const i18nProps = await serverSideTranslations(locale, ns);

    return {
      props: {
        ...i18nProps,
        posts,
        topics,
      },
    };
  };

// Factory for generating localized props for post details
export const makePostDetailProps =
  (ns: string[] = []) =>
  async (context: GetStaticPropsContext) => {
    const locale = (context?.params?.locale as string) || i18nextConfig.i18n.defaultLocale;
    const id = (context?.params?.id as string) || '';

    const post = await getPostData(id, locale);
    if (!post) {
      return {
        notFound: true,
      };
    }

    const i18nProps = await serverSideTranslations(locale, ns);

    const posts = await getSortedPostsData(locale);

    return {
      props: {
        ...i18nProps,
        post,
        posts,
      },
    };
  };

export const makeTopicProps =
  (ns: string[] = []) =>
  async (context: GetStaticPropsContext) => {
    const locale = (context?.params?.locale as string) || i18nextConfig.i18n.defaultLocale;
    const topicId = (context?.params?.id as string) || '';

    const topic = await getTopicData(locale, topicId);
    if (!topic) {
      return {
        notFound: true,
      };
    }

    const allPosts = await getSortedPostsData(locale);

    const posts = allPosts.filter(post => Array.isArray(post.topics) && post.topics.some(t => t.id === topicId));

    const i18nProps = await getI18nProps(context, ns);

    const topics = await getAllTopics(locale);

    return {
      props: {
        ...i18nProps,
        topic,
        allPosts,
        posts,
        topics,
      },
    };
  };

export const makeSearchProps =
  (ns: string[] = []) =>
  async (context: GetStaticPropsContext) => {
    const locale = (context?.params?.locale as string) || i18nextConfig.i18n.defaultLocale;

    const allPosts = await getSortedPostsData(locale);

    const i18nProps = await serverSideTranslations(locale, ns);

    const topics = await getAllTopics(locale);

    return {
      props: {
        ...i18nProps,
        allPosts,
        topics,
      },
    };
  };
