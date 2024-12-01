import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { Post, PostMeta } from '@/types/posts';
import i18nextConfig from '../../next-i18next.config';
import { GetStaticPropsContext } from 'next';
import { getI18nProps } from '@/lib/getStatic';

// Base directory for posts
const postsDirectory = path.join(process.cwd(), 'content/posts');

// Helper function to parse a Markdown file
function parsePostFile(filePath: string): { id: string; data: PostMeta; content: string } {
  const id = path.basename(filePath, '.md');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return { id, data: data as PostMeta, content };
}

// Get all posts grouped by locale with fallback support
export function getSortedPostsData(): { [locale: string]: Post[] } {
  const locales = i18nextConfig.i18n.locales;
  const fallbackLocale = i18nextConfig.i18n.defaultLocale;
  const postsByLocale: { [locale: string]: Post[] } = {};

  // Preload fallback posts
  const fallbackDirectory = path.join(postsDirectory, fallbackLocale);
  const fallbackPosts = fs.existsSync(fallbackDirectory)
    ? fs.readdirSync(fallbackDirectory).reduce((acc, fileName) => {
        const filePath = path.join(fallbackDirectory, fileName);
        const { id, data } = parsePostFile(filePath);
        acc.set(id, { id, ...data });
        return acc;
      }, new Map<string, Post>())
    : new Map<string, Post>();

  locales.forEach(locale => {
    const directory = path.join(postsDirectory, locale);
    const fileNames = fs.existsSync(directory) ? fs.readdirSync(directory) : [];
    const seenIds = new Set<string>();
    const posts: Post[] = [];

    // Parse localized posts
    fileNames.forEach(fileName => {
      const filePath = path.join(directory, fileName);
      const { id, data } = parsePostFile(filePath);
      seenIds.add(id);
      posts.push({ id, ...data });
    });

    // Add fallback posts not present in the current locale
    fallbackPosts.forEach((fallbackPost, id) => {
      if (!seenIds.has(id)) {
        posts.push(fallbackPost);
      }
    });

    postsByLocale[locale] = posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  });

  return postsByLocale;
}

// Get a specific post for all locales with fallback support
export async function getPostData(id: string): Promise<{ [locale: string]: Post }> {
  const locales = i18nextConfig.i18n.locales;
  const fallbackLocale = i18nextConfig.i18n.defaultLocale;
  const postsByLocale: { [locale: string]: Post } = {};

  for (const locale of locales) {
    const localizedPath = path.join(postsDirectory, locale, `${id}.md`);
    const fallbackPath = path.join(postsDirectory, fallbackLocale, `${id}.md`);
    const filePath = fs.existsSync(localizedPath) ? localizedPath : fs.existsSync(fallbackPath) ? fallbackPath : null;

    if (filePath) {
      const { data, content } = parsePostFile(filePath);
      const processedContent = await remark().use(html).process(content);
      postsByLocale[locale] = {
        id,
        contentHtml: processedContent.toString(),
        ...data,
      };
    }
  }

  return postsByLocale;
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

// Factory for generating localized props for post lists
export const makePostProps =
  (ns: string[] = []) =>
  async (context: GetStaticPropsContext) => {
    const locale = (context?.params?.locale as string) || i18nextConfig.i18n.defaultLocale;

    const allPostsData = getSortedPostsData();

    const localizedPosts = allPostsData[locale] || [];

    const i18nProps = await getI18nProps(context, ns);

    return {
      props: {
        ...i18nProps,
        posts: localizedPosts,
      },
    };
  };

// Factory for generating localized props for post details
export const makePostDetailProps =
  (ns: string[] = []) =>
  async (context: GetStaticPropsContext) => {
    const locale = (context?.params?.locale as string) || i18nextConfig.i18n.defaultLocale;
    const id = (context?.params?.id as string) || '';

    const currentLocale = locale || i18nextConfig.i18n.defaultLocale;

    const postData = await getPostData(id);

    const localizedPost = postData[currentLocale] || [];

    const i18nProps = await getI18nProps({ locale: currentLocale }, ns);

    return {
      props: {
        ...i18nProps,
        post: localizedPost,
      },
    };
  };
