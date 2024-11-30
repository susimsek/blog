// lib/posts.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { Post } from '@/types/posts';
import i18nextConfig from '../../next-i18next.config';

const postsDirectory = path.join(process.cwd(), 'content/posts');

// Helper function to read and parse a Markdown file
function parsePostFile(fileName: string): { id: string; data: Record<string, any>; content: string } {
  const id = fileName.replace(/\.md$/, '');
  const fullPath = path.join(postsDirectory, fileName);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return { id, data, content };
}

// Retrieve all post metadata sorted by date
export function getSortedPostsData(): Post[] {
  const fileNames = fs.readdirSync(postsDirectory);

  const allPostsData = fileNames.map(fileName => {
    const { id, data } = parsePostFile(fileName);

    return {
      id,
      ...(data as {
        title: string;
        date: string;
        summary: string;
        thumbnail?: string;
        topics?: string[];
      }),
    };
  });

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Retrieve detailed data for a single post
export async function getPostData(id: string): Promise<Post> {
  const fileName = `${id}.md`;
  const { data, content } = parsePostFile(fileName);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    ...(data as {
      title: string;
      date: string;
      summary: string;
      thumbnail?: string;
      topics?: string[];
    }),
  };
}

// Generate all post IDs for static paths
export function getAllPostIds() {
  const fileNames = fs.readdirSync(postsDirectory);

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

// Retrieve posts filtered by topic
export function getPostsByTopic(topic: string): Post[] {
  const allPosts = getSortedPostsData();
  return allPosts.filter(post => post.topics?.includes(topic));
}
