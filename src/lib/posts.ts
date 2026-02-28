import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Category, LayoutPostSummary, Post, PostCategoryRef, PostSource, PostSummary, Topic } from '@/types/posts';
import i18nextConfig from '@/i18n/settings';
import { createCacheStore } from '@/lib/cacheUtils';
import { sortPosts } from '@/lib/postFilters';
import { calculateReadingTimeMinutes } from '@/lib/readingTime';
import { compressContentForPayload } from '@/lib/contentCompression';
import { buildPostSearchText } from '@/lib/searchText';
import { normalizePostCategoryRef } from '@/lib/postCategoryRef';

const fsPromises = fs.promises;

export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fsPromises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

// Base directories for post markdown and post index data
const postsMarkdownDirectory = path.join(process.cwd(), 'content/posts');
const postsIndexDirectory = path.join(process.cwd(), 'public/data');
const topicsIndexDirectory = path.join(process.cwd(), 'public/data');

export const postsCache = createCacheStore<PostSummary[]>('getSortedPostsData');
export const postDataCache = createCacheStore<Post | null>('getPostData');
export const topicsCache = createCacheStore<Topic[]>('getAllTopics');
export const topicDataCache = createCacheStore<Topic | null>('getTopicData');
export const categoriesCache = createCacheStore<Category[]>('getAllCategories');
export const categoryDataCache = createCacheStore<Category | null>('getCategoryData');
export const postIdsCache = createCacheStore<{ params: { id: string; locale: string } }[]>('getAllPostIds');
export const topicIdsCache = createCacheStore<{ params: { id: string; locale: string } }[]>('getAllTopicIds');
export const categoryIdsCache = createCacheStore<{ params: { id: string; locale: string } }[]>('getAllCategoryIds');
export const readingTimeCache = createCacheStore<number>('getReadingTime');

const DEFAULT_LAYOUT_POSTS_LIMIT = 12;
const DEFAULT_TOP_TOPICS_LIMIT = 6;
const ALL_POST_IDS_CACHE_KEY = 'all-post-ids';
const ALL_TOPIC_IDS_CACHE_KEY = 'all-topic-ids';
const ALL_CATEGORY_IDS_CACHE_KEY = 'all-category-ids';
const ALL_SOURCES_POSTS_CACHE_KEY_SUFFIX = 'all-sources';

export const readIdsFromIndexFile = async (
  indexPath: string,
  fileLabel: string,
  options?: { source?: PostSource },
): Promise<string[]> => {
  if (!(await fileExists(indexPath))) {
    return [];
  }

  try {
    const fileContents = await fsPromises.readFile(indexPath, 'utf8');
    const parsed = JSON.parse(fileContents) as Array<{ id?: unknown; source?: unknown }>;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .flatMap(item => {
        const id = typeof item?.id === 'string' ? item.id.trim() : '';
        if (!id) {
          return [];
        }

        if (!options?.source) {
          return [id];
        }

        const source = item?.source === 'medium' ? 'medium' : 'blog';
        return source === options.source ? [id] : [];
      })
      .filter(Boolean);
  } catch (error) {
    console.error(`Error reading/parsing ${fileLabel}:`, error);
    return [];
  }
};

// Helper function to parse a Markdown file
async function parsePostFile(filePath: string): Promise<{ data: PostSummary; content: string }> {
  const id = path.basename(filePath, '.md');
  const fileContents = await fsPromises.readFile(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const postSummary: PostSummary = {
    id,
    ...(data as Omit<PostSummary, 'id'>),
    category: normalizePostCategoryRef(data.category),
  };

  return { data: postSummary, content };
}

export async function getAllPostsData(locale: string): Promise<PostSummary[]> {
  const cacheKey = `${locale}-${ALL_SOURCES_POSTS_CACHE_KEY_SUFFIX}`;
  const cachedData = postsCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const postsJsonPath = path.join(postsIndexDirectory, `posts.${locale}.json`);
  if (!(await fileExists(postsJsonPath))) {
    console.error(`Posts index not found for locale "${locale}": ${postsJsonPath}`);
    postsCache.set(cacheKey, []);
    return [];
  }

  try {
    const fileContents = await fsPromises.readFile(postsJsonPath, 'utf8');
    const allPosts = JSON.parse(fileContents) as PostSummary[];
    const normalizedPosts = allPosts
      .map(post => {
        const category = normalizePostCategoryRef(post.category);
        return {
          ...post,
          category,
          source: post.source === 'medium' ? ('medium' as const) : ('blog' as const),
        };
      })
      .filter(
        post =>
          typeof post.readingTimeMin === 'number' &&
          Number.isFinite(post.readingTimeMin) &&
          post.readingTimeMin > 0 &&
          typeof post.searchText === 'string',
      );

    const sortedPosts = sortPosts(normalizedPosts);
    postsCache.set(cacheKey, sortedPosts);
    return sortedPosts;
  } catch (error) {
    console.error(`Error reading/parsing posts index for locale "${locale}":`, error);
    postsCache.set(cacheKey, []);
    return [];
  }
}

// Get all posts grouped by locale
export async function getSortedPostsData(
  locale: string,
  topicId?: string,
  source: PostSource = 'blog',
): Promise<PostSummary[]> {
  const cacheKey = `${locale}-${topicId ?? 'all'}-${source}`;
  const cachedData = postsCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const allPosts = await getAllPostsData(locale);
  const filteredPosts = allPosts
    .filter(post => post.source === source)
    .filter(post => !topicId || (Array.isArray(post.topics) && post.topics.some((t: Topic) => t.id === topicId)));

  postsCache.set(cacheKey, filteredPosts);
  return filteredPosts;
}

// Get a specific post for locale
export async function getPostData(id: string, locale: string): Promise<Post | null> {
  const cacheKey = `${locale}-${id}`;

  const cachedData = postDataCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Localized path
  const localizedPath = path.join(postsMarkdownDirectory, locale, `${id}.md`);
  if (!(await fileExists(localizedPath))) {
    postDataCache.set(cacheKey, null);
    return null;
  }

  // Parse post file and process content
  const { data, content } = await parsePostFile(localizedPath);

  const markdownContent = content;
  const readingTimeMin = calculateReadingTimeMinutes(markdownContent, 3);
  const serializedContent = compressContentForPayload(markdownContent);

  const post: Post = {
    ...data,
    source: 'blog',
    readingTimeMin,
    searchText: buildPostSearchText({
      title: data.title,
      summary: data.summary,
      topics: data.topics,
    }),
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

export async function getCategoryData(locale: string, categoryId: string): Promise<Category | null> {
  const cacheKey = `${locale}-${categoryId}`;

  const cachedData = categoryDataCache.get(cacheKey);
  if (cachedData) return cachedData;

  const categories = await getAllCategories(locale);
  const category = categories.find(item => item.id === categoryId) || null;

  categoryDataCache.set(cacheKey, category);
  return category;
}

// Get all topics from the topics index
export async function getAllTopics(locale: string): Promise<Topic[]> {
  const cachedData = topicsCache.get(locale);
  if (cachedData) {
    return cachedData;
  }

  const topicsFilePath = path.join(topicsIndexDirectory, `topics.${locale}.json`);

  if (!(await fileExists(topicsFilePath))) {
    console.error(`Topics index not found for locale "${locale}": ${topicsFilePath}`);
    topicsCache.set(locale, []);
    return [];
  }

  try {
    const fileContents = await fsPromises.readFile(topicsFilePath, 'utf8');
    const topics = JSON.parse(fileContents) as Topic[];

    topicsCache.set(locale, topics);

    return topics;
  } catch (error) {
    console.error('Error reading or parsing topics index:', error);
    topicsCache.set(locale, []);
    return [];
  }
}

export async function getAllCategories(locale: string): Promise<Category[]> {
  const cachedData = categoriesCache.get(locale);
  if (cachedData) {
    return cachedData;
  }

  const categoriesFilePath = path.join(topicsIndexDirectory, `categories.${locale}.json`);

  if (!(await fileExists(categoriesFilePath))) {
    console.error(`Categories index not found for locale "${locale}": ${categoriesFilePath}`);
    categoriesCache.set(locale, []);
    return [];
  }

  try {
    const fileContents = await fsPromises.readFile(categoriesFilePath, 'utf8');
    const categories = JSON.parse(fileContents) as Category[];

    categoriesCache.set(locale, categories);

    return categories;
  } catch (error) {
    console.error('Error reading or parsing categories index:', error);
    categoriesCache.set(locale, []);
    return [];
  }
}

// Generate all post IDs for static paths
export async function getAllPostIds() {
  const cachedData = postIdsCache.get(ALL_POST_IDS_CACHE_KEY);
  if (cachedData) return cachedData;

  const localeList = i18nextConfig.i18n.locales;
  const localizedIds = await Promise.all(
    localeList.map(async locale => {
      const postsJsonPath = path.join(postsIndexDirectory, `posts.${locale}.json`);
      const ids = await readIdsFromIndexFile(postsJsonPath, `posts index for locale "${locale}"`, {
        source: 'blog',
      });
      return [...new Set(ids)].map(id => ({
        params: { id, locale },
      }));
    }),
  );

  const localeOrder = new Map(localeList.map((locale, index) => [locale, index]));
  const postIds = localizedIds
    .flat()
    .sort(
      (a, b) =>
        a.params.id.localeCompare(b.params.id) ||
        (localeOrder.get(a.params.locale) ?? Number.MAX_SAFE_INTEGER) -
          (localeOrder.get(b.params.locale) ?? Number.MAX_SAFE_INTEGER),
    );

  postIdsCache.set(ALL_POST_IDS_CACHE_KEY, postIds);
  return postIds;
}

export async function getAllTopicIds() {
  const cachedData = topicIdsCache.get(ALL_TOPIC_IDS_CACHE_KEY);
  if (cachedData) return cachedData;

  const localeList = i18nextConfig.i18n.locales;
  const topicIdSet = new Set<string>();

  await Promise.all(
    localeList.map(async locale => {
      const topicsJsonPath = path.join(topicsIndexDirectory, `topics.${locale}.json`);
      const ids = await readIdsFromIndexFile(topicsJsonPath, `topics index for locale "${locale}"`);
      ids.forEach(id => topicIdSet.add(id));
    }),
  );

  const topicIds = [...topicIdSet]
    .sort((a, b) => a.localeCompare(b))
    .flatMap(id =>
      localeList.map(locale => ({
        params: { id, locale },
      })),
    );

  topicIdsCache.set(ALL_TOPIC_IDS_CACHE_KEY, topicIds);
  return topicIds;
}

export async function getAllCategoryIds() {
  const cachedData = categoryIdsCache.get(ALL_CATEGORY_IDS_CACHE_KEY);
  if (cachedData) return cachedData;

  const localeList = i18nextConfig.i18n.locales;
  const categoryIDSet = new Set<string>();

  await Promise.all(
    localeList.map(async locale => {
      const categoriesJsonPath = path.join(topicsIndexDirectory, `categories.${locale}.json`);
      const ids = await readIdsFromIndexFile(categoriesJsonPath, `categories index for locale "${locale}"`);
      ids.forEach(id => categoryIDSet.add(id));
    }),
  );

  const categoryIds = [...categoryIDSet]
    .sort((a, b) => a.localeCompare(b))
    .flatMap(id =>
      localeList.map(locale => ({
        params: { id, locale },
      })),
    );

  categoryIdsCache.set(ALL_CATEGORY_IDS_CACHE_KEY, categoryIds);
  return categoryIds;
}

export const toLayoutPostSummary = (post: PostSummary): LayoutPostSummary => ({
  id: post.id,
  title: post.title,
  publishedDate: post.publishedDate,
  updatedDate: post.updatedDate,
});

export const getLayoutPosts = (
  posts: PostSummary[],
  limit: number = DEFAULT_LAYOUT_POSTS_LIMIT,
): LayoutPostSummary[] => {
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : DEFAULT_LAYOUT_POSTS_LIMIT;
  return posts.slice(0, safeLimit).map(toLayoutPostSummary);
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
