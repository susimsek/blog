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

// Helper function to read and parse a Markdown file
function parsePostFile(locale: string, fileName: string): { id: string; data: PostMeta; content: string } {
  const id = fileName.replace(/\.md$/, '');
  const fullPath = path.join(postsDirectory, locale, fileName);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Post file "${fileName}" not found for locale "${locale}".`);
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return { id, data: data as PostMeta, content };
}

// Retrieve all posts grouped by locale
export function getSortedPostsData(): { [locale: string]: Post[] } {
  const locales = i18nextConfig.i18n.locales;
  const fallbackLocale = i18nextConfig.i18n.defaultLocale;
  const postsByLocale: { [locale: string]: Post[] } = {};

  const fallbackDirectory = path.join(postsDirectory, fallbackLocale);
  const fallbackPosts: Map<string, Post> = new Map();

  if (fs.existsSync(fallbackDirectory)) {
    fs.readdirSync(fallbackDirectory).forEach(fileName => {
      const { id, data } = parsePostFile(fallbackLocale, fileName);
      fallbackPosts.set(id, { id, ...data });
    });
  }

  locales.forEach(locale => {
    const directory = path.join(postsDirectory, locale);

    const fileNames: string[] = fs.existsSync(directory) ? fs.readdirSync(directory) : [];

    const seenIds = new Set<string>();
    const posts: Post[] = [];

    fileNames.forEach(fileName => {
      const { id, data } = parsePostFile(locale, fileName);
      seenIds.add(id);
      posts.push({ id, ...data });
    });

    fallbackPosts.forEach((fallbackPost, id) => {
      if (!seenIds.has(id)) {
        posts.push(fallbackPost);
      }
    });

    postsByLocale[locale] = posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  });

  return postsByLocale;
}

// Retrieve detailed data for a single post for a specific locale, with fallback
export async function getPostData(id: string): Promise<{ [locale: string]: Post }> {
  const locales = i18nextConfig.i18n.locales;
  const postsByLocale: { [locale: string]: Post } = {};
  const fallbackLocale = i18nextConfig.i18n.defaultLocale;

  for (const locale of locales) {
    const localizedPath = path.join(postsDirectory, locale, `${id}.md`);
    const fallbackPath = path.join(postsDirectory, fallbackLocale, `${id}.md`);

    let fullPath: string | null = null;

    if (fs.existsSync(localizedPath)) {
      fullPath = localizedPath;
    } else if (fs.existsSync(fallbackPath)) {
      fullPath = fallbackPath;
    }

    if (fullPath) {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      const processedContent = await remark().use(html).process(content);
      const contentHtml = processedContent.toString();

      postsByLocale[locale] = {
        id,
        contentHtml,
        title: data.title,
        date: data.date,
        summary: data.summary,
        topics: data.topics,
        thumbnail: data.thumbnail,
      };
    } else {
      throw new Error(`Post "${id}" not found in "${locale}" or fallback "${fallbackLocale}".`);
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
    const allPostsData = getSortedPostsData();
    const i18nProps = await getI18nProps(context, ns);

    return {
      props: {
        ...i18nProps,
        allPostsData,
      },
    };
  };

// Factory for generating localized props for post details
export const makePostDetailProps =
  (ns: string[] = []) =>
  async (ctx: GetStaticPropsContext<{ id: string }>) => {
    const { params, locale } = ctx;

    const postData = await getPostData(params!.id);
    const i18nProps = await getI18nProps({ locale }, ns);

    return {
      props: {
        ...i18nProps,
        postData,
      },
    };
  };
