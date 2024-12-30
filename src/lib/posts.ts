import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Post, PostSummary, Topic } from '@/types/posts';
import i18nextConfig from '../../next-i18next.config';
import { GetStaticPropsContext } from 'next';
import { getI18nProps } from '@/lib/getStatic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { isDev } from '@/config/constants';

// Base directory for posts
const postsDirectory = path.join(process.cwd(), 'content/posts');

const topicsDirectory = path.join(process.cwd(), 'content/topics');

export const postsCache: { [key: string]: PostSummary[] } = {};

export const postDataCache: { [key: string]: Post | null } = {};

export const topicsCache: { [key: string]: Topic[] } = {};

export const topicDataCache: { [key: string]: Topic | null } = {};

export const postIdsCache: { [key: string]: { params: { id: string; locale: string } }[] } = {};

export const topicIdsCache: { [key: string]: { params: { id: string; locale: string } }[] } = {};

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

  if (postsCache[cacheKey]) {
    if (isDev) {
      console.log(`[Cache Hit] getSortedPostsData: ${cacheKey}`);
    }
    return postsCache[cacheKey];
  }

  if (isDev) {
    console.log(`[Cache Miss] getSortedPostsData: ${cacheKey}`);
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

  postsCache[cacheKey] = sortedPosts;

  if (isDev) {
    console.log(`[Cache Update] getSortedPostsData: ${cacheKey}`);
  }

  return sortedPosts;
}

// Get a specific post for all locales with fallback support
export async function getPostData(id: string, locale: string): Promise<Post | null> {
  const cacheKey = `${locale}-${id}`;

  // Cache kontrolü
  if (postDataCache[cacheKey]) {
    if (isDev) {
      console.log(`[Cache Hit] getPostData: ${cacheKey}`);
    }
    return postDataCache[cacheKey];
  }

  if (isDev) {
    console.log(`[Cache Miss] getPostData: ${cacheKey}`);
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
    if (isDev) {
      console.log(`[Cache Update] getPostData: ${cacheKey} - No file found`);
    }
    postDataCache[cacheKey] = null;
    return null;
  }

  // Parse post file and process content
  const { data, content } = parsePostFile(filePath, true);

  const post: Post = {
    contentHtml: content,
    ...data,
  };

  // Cache'e kaydet
  postDataCache[cacheKey] = post;

  if (isDev) {
    console.log(`[Cache Update] getPostData: ${cacheKey} - Data cached`);
  }

  return post;
}

export async function getTopicData(locale: string, topicId: string): Promise<Topic | null> {
  const cacheKey = `${locale}-${topicId}`;

  // Cache kontrolü
  if (topicDataCache[cacheKey]) {
    if (isDev) {
      console.log(`[Cache Hit] getTopicData: ${cacheKey}`);
    }
    return topicDataCache[cacheKey];
  }

  if (isDev) {
    console.log(`[Cache Miss] getTopicData: ${cacheKey}`);
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
  topicDataCache[cacheKey] = topic;

  if (isDev) {
    if (topic) {
      console.log(`[Cache Update] getTopicData: ${cacheKey} - Data cached`);
    } else {
      console.log(`[Cache Update] getTopicData: ${cacheKey} - No data found`);
    }
  }

  return topic;
}

// Get all unique topics from the posts directory
// Get all unique topics from the topics.json file
export async function getAllTopics(locale: string): Promise<Topic[]> {
  const cacheKey = locale;

  // Cache kontrolü
  if (topicsCache[cacheKey]) {
    if (isDev) {
      console.log(`[Cache Hit] getAllTopics: ${cacheKey}`);
    }
    return topicsCache[cacheKey];
  }

  if (isDev) {
    console.log(`[Cache Miss] getAllTopics: ${cacheKey}`);
  }

  const topicsFilePath = path.join(topicsDirectory, locale, 'topics.json');

  if (!fs.existsSync(topicsFilePath)) {
    console.error(`Topics file not found for locale "${locale}": ${topicsFilePath}`);
    topicsCache[cacheKey] = [];
    return [];
  }

  try {
    const fileContents = fs.readFileSync(topicsFilePath, 'utf8');
    const topics = JSON.parse(fileContents) as Topic[];

    topicsCache[cacheKey] = topics;

    if (isDev) {
      console.log(`[Cache Update] getAllTopics: ${cacheKey} - Data cached`);
    }

    return topics;
  } catch (error) {
    console.error('Error reading or parsing topics.json:', error);
    topicsCache[cacheKey] = [];

    if (isDev) {
      console.log(`[Cache Update] getAllTopics: ${cacheKey} - Error encountered`);
    }

    return [];
  }
}

// Generate all post IDs for static paths
export function getAllPostIds() {
  const cacheKey = 'all-post-ids';

  // Cache kontrolü
  if (postIdsCache[cacheKey]) {
    if (isDev) {
      console.log(`[Cache Hit] getAllPostIds`);
    }
    return postIdsCache[cacheKey];
  }

  if (isDev) {
    console.log(`[Cache Miss] getAllPostIds`);
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
  postIdsCache[cacheKey] = postIds;

  if (isDev) {
    console.log(`[Cache Update] getAllPostIds - Data cached`);
  }

  return postIds;
}

export function getAllTopicIds() {
  const cacheKey = 'all-topic-ids';

  // Cache kontrolü
  if (topicIdsCache[cacheKey]) {
    if (isDev) {
      console.log(`[Cache Hit] getAllTopicIds`);
    }
    return topicIdsCache[cacheKey];
  }

  if (isDev) {
    console.log(`[Cache Miss] getAllTopicIds`);
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

        if (isDev) {
          console.log(`[Data Loaded] getAllTopicIds: Topics loaded for locale "${locale}"`);
        }
      } catch (error) {
        console.error(`Error reading or parsing topics.json for locale "${locale}":`, error);
      }
    } else {
      console.warn(`Topics file not found for locale "${locale}": ${topicsFilePath}`);
    }
  });

  // Cache'e kaydet
  topicIdsCache[cacheKey] = topicIds;

  if (isDev) {
    console.log(`[Cache Update] getAllTopicIds - Data cached`);
  }

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

    return {
      props: {
        ...i18nProps,
        post,
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

    return {
      props: {
        ...i18nProps,
        topic,
        posts,
      },
    };
  };
