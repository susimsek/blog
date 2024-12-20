import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Post, PostSummary, Topic } from '@/types/posts';
import i18nextConfig from '../../next-i18next.config';
import { GetStaticPropsContext } from 'next';
import { getI18nProps } from '@/lib/getStatic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Base directory for posts
const postsDirectory = path.join(process.cwd(), 'content/posts');

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

      // Check if the post matches the topicId
      if (
        !seenIds.has(data.id) &&
        (!topicId || (Array.isArray(data.topics) && data.topics.some((t: Topic) => t.id === topicId)))
      ) {
        posts.push(data);
      }
    });
  }

  // Sort by date in descending order
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Get a specific post for all locales with fallback support
export async function getPostData(id: string, locale: string): Promise<Post | null> {
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
    return null;
  }

  // Parse post file and process content
  const { data, content } = parsePostFile(filePath, true);
  return {
    contentHtml: content,
    ...data,
  };
}

export async function getTopicData(locale: string, topicId: string): Promise<Topic | null> {
  const fallbackLocale = i18nextConfig.i18n.defaultLocale;
  const directory = path.join(postsDirectory, locale);
  const fallbackDirectory = path.join(postsDirectory, fallbackLocale);

  const allTopics = new Map<string, Topic>();

  await collectTopicsFromDirectory(directory, allTopics);
  if (locale !== fallbackLocale) {
    await collectTopicsFromDirectory(fallbackDirectory, allTopics);
  }

  return allTopics.get(topicId) || null;
}

// Get all unique topics from the posts directory
export async function getAllTopics(locale: string): Promise<Topic[]> {
  const fallbackLocale = i18nextConfig.i18n.defaultLocale;
  const directory = path.join(postsDirectory, locale);
  const fallbackDirectory = path.join(postsDirectory, fallbackLocale);

  const allTopicsMap = new Map<string, Topic>();

  // Collect topics from the localized directory
  await collectTopicsFromDirectory(directory, allTopicsMap);

  // Collect topics from the fallback directory if the locale is different
  if (locale !== fallbackLocale) {
    await collectTopicsFromDirectory(fallbackDirectory, allTopicsMap);
  }

  // Convert Map to an array
  return Array.from(allTopicsMap.values());
}

// Generate all post IDs for static paths
export function getAllPostIds() {
  const defaultLocale = i18nextConfig.i18n.defaultLocale;
  const directory = path.join(postsDirectory, defaultLocale);
  const fileNames = fs.existsSync(directory) ? fs.readdirSync(directory) : [];

  return fileNames.flatMap(fileName => {
    const id = fileName.replace(/\.md$/, '');
    return i18nextConfig.i18n.locales.map(locale => ({
      params: {
        id,
        locale,
      },
    }));
  });
}

export function getAllTopicIds() {
  const defaultLocale = i18nextConfig.i18n.defaultLocale;
  const directory = path.join(postsDirectory, defaultLocale);
  const fileNames = fs.existsSync(directory) ? fs.readdirSync(directory) : [];

  const topicIds = new Set<string>();

  // Iterate through all post files to collect unique topic IDs
  fileNames.forEach(fileName => {
    const filePath = path.join(directory, fileName);
    const { data } = parsePostFile(filePath);

    if (Array.isArray(data.topics)) {
      data.topics.forEach((topic: { id: string }) => {
        topicIds.add(topic.id); // Add each topic's id to the Set
      });
    }
  });

  // Convert the Set to an array of paths with locales
  return Array.from(topicIds).flatMap(id =>
    i18nextConfig.i18n.locales.map(locale => ({
      params: {
        id,
        locale,
      },
    })),
  );
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
