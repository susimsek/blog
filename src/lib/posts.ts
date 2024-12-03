import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { Post, PostSummary } from '@/types/posts';
import i18nextConfig from '../../next-i18next.config';
import { GetStaticPropsContext } from 'next';
import { getI18nProps } from '@/lib/getStatic';

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

// Get all posts grouped by locale with fallback support
export function getSortedPostsData(locale: string): PostSummary[] {
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
      const { data } = parsePostFile(filePath, false);
      seenIds.add(data.id);
      posts.push(data);
    });
  }

  // Fallback posts
  if (locale !== fallbackLocale && fs.existsSync(fallbackDirectory)) {
    const fallbackFileNames = fs.readdirSync(fallbackDirectory);
    fallbackFileNames.forEach(fileName => {
      const filePath = path.join(fallbackDirectory, fileName);
      const { data } = parsePostFile(filePath, false);

      if (!seenIds.has(data.id)) {
        posts.push(data);
      }
    });
  }

  // Sort by date in descending order
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Get a specific post for all locales with fallback support
export async function getPostData(id: string, locale: string): Promise<Post> {
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
    throw new Error(`Post "${id}" not found in "${locale}" or fallback "${fallbackLocale}".`);
  }

  // Parse post file and process content
  const { data, content } = parsePostFile(filePath, true);
  const processedContent = await remark().use(html).process(content);

  return {
    contentHtml: processedContent.toString(),
    ...data,
  };
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

    const posts = getSortedPostsData(locale);

    const i18nProps = await getI18nProps(context, ns);

    return {
      props: {
        ...i18nProps,
        posts,
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

    const i18nProps = await getI18nProps({ locale }, ns);

    return {
      props: {
        ...i18nProps,
        post,
      },
    };
  };
