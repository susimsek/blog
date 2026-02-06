import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Post, PostSummary, Topic } from '@/types/posts';
import i18nextConfig from '@/i18n/settings';
import { createCacheStore } from '@/lib/cacheUtils';
import { sortPosts } from '@/lib/postFilters';
import { calculateReadingTime } from '@/lib/readingTime';
import { compressContentForPayload } from '@/lib/contentCompression';

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
export const readingTimeCache = createCacheStore<string>('getReadingTime');

const DEFAULT_LAYOUT_POSTS_LIMIT = 40;
const DEFAULT_TOP_TOPICS_LIMIT = 6;

async function getPostMarkdownContent(id: string, locale: string): Promise<string | null> {
  const fallbackLocale = i18nextConfig.i18n.defaultLocale;
  const localizedPath = path.join(postsDirectory, locale, `${id}.md`);
  const fallbackPath = path.join(postsDirectory, fallbackLocale, `${id}.md`);

  let filePath: string | null = null;
  if (await fileExists(localizedPath)) {
    filePath = localizedPath;
  } else if (await fileExists(fallbackPath)) {
    filePath = fallbackPath;
  }

  if (!filePath) {
    return null;
  }

  const raw = await fsPromises.readFile(filePath, 'utf8');
  const { content } = matter(raw);
  return content;
}

async function getReadingTimeForPostSummary(
  post: Pick<PostSummary, 'id' | 'title' | 'summary'>,
  locale: string,
): Promise<string> {
  const cacheKey = `${locale}-${post.id}`;
  const cached = readingTimeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const markdown = await getPostMarkdownContent(post.id, locale);
  const computed = calculateReadingTime(markdown ?? `${post.title} ${post.summary}`, locale);
  readingTimeCache.set(cacheKey, computed);
  return computed;
}

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
    const allPosts = JSON.parse(fileContents) as Array<Omit<PostSummary, 'readingTime'> & { readingTime?: string }>;
    const filteredPosts = allPosts.filter(
      post => !topicId || (Array.isArray(post.topics) && post.topics.some((t: Topic) => t.id === topicId)),
    );

    const withReadingTime = await Promise.all(
      filteredPosts.map(async post => ({
        ...post,
        readingTime: await getReadingTimeForPostSummary(post, locale),
      })),
    );

    const sortedPosts = sortPosts(withReadingTime);
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

  const markdownContent = content ?? '';
  const readingTime = calculateReadingTime(markdownContent, locale);
  const serializedContent = compressContentForPayload(markdownContent);

  const post: Post = {
    ...data,
    readingTime,
    ...serializedContent,
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

export const getLayoutPosts = (posts: PostSummary[], limit: number = DEFAULT_LAYOUT_POSTS_LIMIT): PostSummary[] => {
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : DEFAULT_LAYOUT_POSTS_LIMIT;
  return posts.slice(0, safeLimit);
};

export const getTopTopicsFromPosts = (
  posts: PostSummary[],
  topics: Topic[],
  limit: number = DEFAULT_TOP_TOPICS_LIMIT,
): Topic[] => {
  const topicById = new Map(topics.map(topic => [topic.id, topic]));
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const topic of post.topics ?? []) {
      if (!topic?.id) continue;
      counts.set(topic.id, (counts.get(topic.id) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([id, count]) => ({ id, count, topic: topicById.get(id) }))
    .filter(item => item.topic)
    .sort((a, b) => b.count - a.count || String(a.topic?.name).localeCompare(String(b.topic?.name)))
    .slice(0, limit)
    .map(item => item.topic as Topic);
};
