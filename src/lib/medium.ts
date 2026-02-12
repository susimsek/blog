import Parser from 'rss-parser';
import fs from 'node:fs';
import path from 'node:path';
import { PostSummary, Topic } from '@/types/posts';
import { TOPIC_COLORS } from '@/config/constants';
import { createCacheStore } from '@/lib/cacheUtils';
import { buildPostSearchText } from '@/lib/searchText';

type MediumItem = Parser.Item & {
  'content:encoded'?: string;
  'content:encodedSnippet'?: string;
};

const fsPromises = fs.promises;
const fileExists = async (filePath: string) => fs.existsSync(filePath);

const FEED_JSON_PATH = path.join(process.cwd(), 'public', 'data', 'medium-feed.json');

export const mediumPostsCache = createCacheStore<PostSummary[]>('mediumPostsData');

const WHITESPACE_CHARS = new Set([' ', '\n', '\r', '\t', '\f', '\v']);

const collapseWhitespace = (value: string): string => {
  let result = '';
  let inWhitespace = false;

  for (const char of value) {
    if (WHITESPACE_CHARS.has(char)) {
      if (!inWhitespace) {
        result += ' ';
        inWhitespace = true;
      }
    } else {
      inWhitespace = false;
      result += char;
    }
  }

  return result.trim();
};

function stripHtml(html: string): string {
  let result = '';
  let insideTag = false;

  for (const char of html) {
    if (char === '<') {
      insideTag = true;
      continue;
    }

    if (char === '>') {
      insideTag = false;
      result += ' ';
      continue;
    }

    if (!insideTag) {
      result += char;
    }
  }

  return collapseWhitespace(result);
}

const extractAttributeValue = (tag: string, attribute: string): string | null => {
  const lowerTag = tag.toLowerCase();
  const attributePattern = `${attribute.toLowerCase()}=`;
  const attrIndex = lowerTag.indexOf(attributePattern);

  if (attrIndex === -1) {
    return null;
  }

  let valueStart = attrIndex + attributePattern.length;
  const quoteChar = tag[valueStart];
  let valueEnd: number;

  if (quoteChar === '"' || quoteChar === "'") {
    valueStart += 1;
    valueEnd = tag.indexOf(quoteChar, valueStart);
    if (valueEnd === -1) {
      return null;
    }
    return tag.slice(valueStart, valueEnd);
  }

  valueEnd = valueStart;
  while (valueEnd < tag.length && !WHITESPACE_CHARS.has(tag[valueEnd]) && tag[valueEnd] !== '>') {
    valueEnd += 1;
  }

  return tag.slice(valueStart, valueEnd);
};

function extractFirstImage(html: string): string | null {
  const lowerHtml = html.toLowerCase();
  let searchIndex = 0;

  while (searchIndex < lowerHtml.length) {
    const imgIndex = lowerHtml.indexOf('<img', searchIndex);
    if (imgIndex === -1) {
      return null;
    }

    const tagEnd = lowerHtml.indexOf('>', imgIndex);
    if (tagEnd === -1) {
      return null;
    }

    const tag = html.slice(imgIndex, tagEnd + 1);
    const srcValue = extractAttributeValue(tag, 'src');
    if (srcValue) {
      return srcValue;
    }

    searchIndex = tagEnd + 1;
  }

  return null;
}

function calculateReadingTimeMin(html: string): number {
  const wordCount = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 265));
}

function extractSummary(item: MediumItem): string {
  const raw = item['content:encodedSnippet'] ?? stripHtml(item['content:encoded'] ?? item.content ?? '');
  const trimmed = raw.slice(0, 200);
  return raw.length > 200 ? trimmed + '...' : trimmed;
}

function getColorForTopic(topic: string): (typeof TOPIC_COLORS)[number] {
  let hash = 0;
  for (const char of topic) {
    hash = (char.codePointAt(0) ?? 0) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TOPIC_COLORS.length;
  return TOPIC_COLORS[index];
}

export async function fetchRssSummaries(locale: string): Promise<PostSummary[]> {
  const cacheKey = `${locale}-all`;

  const cachedData = mediumPostsCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  if (!(await fileExists(FEED_JSON_PATH))) {
    console.error(`Medium feed file not found: ${FEED_JSON_PATH}`);
    mediumPostsCache.set(cacheKey, []);
    return [];
  }

  try {
    const fileContents = await fsPromises.readFile(FEED_JSON_PATH, 'utf-8');
    const feed: Parser.Output<MediumItem> = JSON.parse(fileContents);

    const posts: PostSummary[] = feed.items.map((item, index) => {
      const content = item['content:encoded'] ?? item.content ?? '';
      const summary = extractSummary(item);
      const thumbnail = extractFirstImage(content);

      const topics: Topic[] =
        item.categories?.map(cat => ({
          id: cat,
          name: cat,
          color: getColorForTopic(cat),
          link: `https://medium.com/tag/${cat}`,
        })) ?? [];
      const id = item.guid ?? `rss-${index}`;
      const title = item.title ?? 'Untitled';

      return {
        id,
        title,
        date: item.pubDate ?? new Date().toISOString(),
        summary,
        searchText: buildPostSearchText({ title, summary, topics }),
        thumbnail,
        topics,
        readingTimeMin: calculateReadingTimeMin(content),
        source: 'medium',
        link: item.link,
      };
    });

    mediumPostsCache.set(cacheKey, posts);
    return posts;
  } catch (error) {
    console.error(`Error reading/parsing Medium feed JSON:`, error);
    mediumPostsCache.set(cacheKey, []);
    return [];
  }
}
