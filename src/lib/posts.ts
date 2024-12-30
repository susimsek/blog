import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Post, PostSummary, Topic } from '@/types/posts';
import i18nextConfig from '../../next-i18next.config';
import { GetStaticPropsContext } from 'next';
import { getI18nProps } from '@/lib/getStatic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { isDev } from '@/config/constants';
import { CacheEntry, getCache, setCache } from '@/lib/cacheUtils';

// Base directory for posts
const postsDirectory = path.join(process.cwd(), 'content/posts');

const topicsDirectory = path.join(process.cwd(), 'content/topics');

export const postsCache: { [key: string]: CacheEntry<PostSummary[]> } = {};

export const postDataCache: { [key: string]: CacheEntry<Post | null> } = {};

export const topicsCache: { [key: string]: CacheEntry<Topic[]> } = {};

export const topicDataCache: { [key: string]: CacheEntry<Topic | null> } = {};

export const postIdsCache: { [key: string]: CacheEntry<{ params: { id: string; locale: string } }[]> } = {};

export const topicIdsCache: { [key: string]: CacheEntry<{ params: { id: string; locale: string } }[]> } = {};

// Helper function to parse a Markdown file
function parsePostFile(filePath: string, includeContent: boolean = false): { data: PostSummary; content?: string } {
  const id = path.basename(filePath, '.md');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const postSummary: PostSummary = {
    id,
    ...data,
  } as PostSummary;

  return includeContent ? { data: postSummary, content } : { data: postSummary };
}

async function collectTopicsFromDirectory(dir: string, topicsMap: Map<string, Topic>) {
  if (!fs.existsSync(dir)) return;

  const fileNames = await fs.promises.readdir(dir);

  for (const fileName of fileNames) {
    const filePath = path.join(dir, fileName);
    const fileContents = await fs.promises.readFile(filePath, 'utf8');

    const { data } = matter(fileContents);

    if (Array.isArray(data.topics)) {
      data.topics.forEach((topic: Topic) => {
        if (!topicsMap.has(topic.id)) {
          topicsMap.set(topic.id, topic);
        }
      });
    }
  }
}

// Get all posts grouped by locale with fallback support
export function getSortedPostsData(locale: string, topicId?: string): PostSummary[] {
  const cacheKey = `${locale}-${topicId || 'all'}`;
  const cachedData = getCache(cacheKey, postsCache);

  if (cachedData) {
    return cachedData;
  }

  const fallbackLocale = i18nextConfig.i18n.defaultLocale;
  const directory = path.join(postsDirectory, locale);
  const fallbackDirectory = path.join(postsDirectory, fallbackLocale);

  const seenIds = new Set<string>();
  const posts: PostSummary[] = [];

  // Localized posts
  if (fs.existsSync(directory)) {
    const fileNames = fs.readdirSync(directory);
    fileNames.forEach(fileName => {
      const filePath = path.join(directory, fileName);
      const { data } = parsePostFile(filePath);

      // Check if the post matches the topicId
      if (!topicId || (Array.isArray(data.topics) && data.topics.some((t: Topic) => t.id === topicId))) {
        seenIds.add(data.id);
        posts.push(data);
      }
    });
  }

  // Fallback posts
  if (locale !== fallbackLocale && fs.existsSync(fallbackDirectory)) {
    const fallbackFileNames = fs.readdirSync(fallbackDirectory);
    fallbackFileNames.forEach(fileName => {
      const filePath = path.join(fallbackDirectory, fileName);
      const { data } = parsePostFile(filePath);

      if (
        !seenIds.has(data.id) &&
        (!topicId || (Array.isArray(data.topics) && data.topics.some((t: Topic) => t.id === topicId)))
      ) {
        posts.push(data);
      }
    });
  }

  const sortedPosts = posts.sort((a, b) => (a.date < b.date ? 1 : -1));

  // Cache'e kaydet
  setCache(cacheKey, sortedPosts, postsCache);

  return sortedPosts;
}

// Get a specific post for all locales with fallback support
export async function getPostData(id: string, locale: string): Promise<Post | null> {
  const cacheKey = `${locale}-${id}`;

  // Cache kontrolü
  const cachedData = getCache<Post | null>(cacheKey, postDataCache);
  if (cachedData) {
    return cachedData;
  }

  const fallbackLocale = i18nextConfig.i18n.defaultLocale;

  // Localized and fallback paths
  const localizedPath = path.join(postsDirectory, locale, `${id}.md`);
  const fallbackPath = path.join(postsDirectory, fallbackLocale, `${id}.md`);

  let filePath: string | null = null;

  if (fs.existsSync(localizedPath)) {
    filePath = localizedPath;
  } else if (fs.existsSync(fallbackPath)) {
    filePath = fallbackPath;
  }

  if (!filePath) {
    setCache(cacheKey, null, postDataCache); // Cache'e `null` ekle
    return null;
  }

  // Parse post file and process content
  const { data, content } = parsePostFile(filePath, true);

  const post: Post = {
    contentHtml: content,
    ...data,
  };

  // Cache'e kaydet
  setCache(cacheKey, post, postDataCache);

  return post;
}

export async function getTopicData(locale: string, topicId: string): Promise<Topic | null> {
  const cacheKey = `${locale}-${topicId}`;

  // Cache kontrolü
  const cachedData = getCache<Topic | null>(cacheKey, topicDataCache);
  if (cachedData) {
    return cachedData;
  }

  const fallbackLocale = i18nextConfig.i18n.defaultLocale;
  const directory = path.join(postsDirectory, locale);
  const fallbackDirectory = path.join(postsDirectory, fallbackLocale);

  const allTopics = new Map<string, Topic>();

  // Verileri toplama
  await collectTopicsFromDirectory(directory, allTopics);
  if (locale !== fallbackLocale) {
    await collectTopicsFromDirectory(fallbackDirectory, allTopics);
  }

  const topic = allTopics.get(topicId) || null;

  // Cache'e kaydet
  setCache(cacheKey, topic, topicDataCache);

  return topic;
}

// Get all unique topics from the posts directory
export async function getAllTopics(locale: string): Promise<Topic[]> {
  const cacheKey = locale;

  // Cache kontrolü
  const cachedData = getCache<Topic[]>(cacheKey, topicsCache);
  if (cachedData) {
    return cachedData;
  }

  const topicsFilePath = path.join(topicsDirectory, locale, 'topics.json');

  if (!fs.existsSync(topicsFilePath)) {
    console.error(`Topics file not found for locale "${locale}": ${topicsFilePath}`);
    setCache(cacheKey, [], topicsCache); // Cache'e boş bir array ekle
    return [];
  }

  try {
    const fileContents = fs.readFileSync(topicsFilePath, 'utf8');
    const topics = JSON.parse(fileContents) as Topic[];

    // Cache'e kaydet
    setCache(cacheKey, topics, topicsCache);

    return topics;
  } catch (error) {
    console.error('Error reading or parsing topics.json:', error);
    setCache(cacheKey, [], topicsCache); // Cache'e boş bir array ekle
    return [];
  }
}

// Generate all post IDs for static paths
export function getAllPostIds() {
  const cacheKey = 'all-post-ids';

  // Cache kontrolü
  const cachedData = getCache(cacheKey, postIdsCache);
  if (cachedData) {
    return cachedData;
  }

  const defaultLocale = i18nextConfig.i18n.defaultLocale;
  const directory = path.join(postsDirectory, defaultLocale);
  const fileNames = fs.existsSync(directory) ? fs.readdirSync(directory) : [];

  const postIds = fileNames.flatMap(fileName => {
    const id = fileName.replace(/\.md$/, '');
    return i18nextConfig.i18n.locales.map(locale => ({
      params: {
        id,
        locale,
      },
    }));
  });

  // Cache'e kaydet
  setCache(cacheKey, postIds, postIdsCache);

  return postIds;
}

export function getAllTopicIds() {
  const cacheKey = 'all-topic-ids';

  // Cache kontrolü
  const cachedData = getCache(cacheKey, topicIdsCache);
  if (cachedData) {
    return cachedData;
  }

  const topicIds: { params: { id: string; locale: string } }[] = [];

  i18nextConfig.i18n.locales.forEach(locale => {
    const topicsFilePath = path.join(topicsDirectory, locale, 'topics.json');

    if (fs.existsSync(topicsFilePath)) {
      try {
        const fileContents = fs.readFileSync(topicsFilePath, 'utf8');
        const topics: Topic[] = JSON.parse(fileContents);

        topics.forEach(topic => {
          topicIds.push({
            params: {
              id: topic.id,
              locale,
            },
          });
        });
      } catch (error) {
        console.error(`Error reading or parsing topics.json for locale "${locale}":`, error);
      }
    } else {
      console.warn(`Topics file not found for locale "${locale}": ${topicsFilePath}`);
    }
  });

  // Cache'e kaydet
  setCache(cacheKey, topicIds, topicIdsCache);

  return topicIds;
}

// Factory for generating localized props for post lists
export const makePostProps =
  (ns: string[] = []) =>
  async (context: GetStaticPropsContext) => {
    const locale = (context?.params?.locale as string) || i18nextConfig.i18n.defaultLocale;

    const posts = getSortedPostsData(locale);
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

    const posts = getSortedPostsData(locale);

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

    const posts = getSortedPostsData(locale, topicId);

    const i18nProps = await getI18nProps(context, ns);

    const topics = await getAllTopics(locale);

    return {
      props: {
        ...i18nProps,
        topic,
        posts,
        topics,
      },
    };
  };
