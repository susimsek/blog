import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import { PostSummary, Topic } from '@/types/posts';
import i18nextConfig from '../../next-i18next.config';
import { GetStaticPropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { MEDIUM_FEED_URL, TOPIC_COLORS } from '@/config/constants';
import { CacheEntry, getCache, setCache } from '@/lib/cacheUtils';

type MediumItem = Parser.Item & {
  'content:encoded'?: string;
  'content:encodedSnippet'?: string;
};

const parser = new Parser<unknown, MediumItem>({
  customFields: {
    item: ['content:encoded', 'content:encodedSnippet'],
  },
});

const FEED_JSON_PATH = path.join(process.cwd(), 'content', 'medium-feed.json');

export const mediumPostsCache: { [key: string]: CacheEntry<PostSummary[]> } = {};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFirstImage(html: string): string | null {
  const match = html.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
}

function calculateReadingTime(html: string, locale: string): string {
  const wordCount = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 265));
  return locale === 'tr' ? `${minutes} dk okuma` : `${minutes} min read`;
}

function extractSummary(item: MediumItem): string {
  const raw = item['content:encodedSnippet'] ?? stripHtml(item['content:encoded'] ?? item.content ?? '');
  const trimmed = raw.slice(0, 200);
  return raw.length > 200 ? trimmed + '...' : trimmed;
}

function getColorForTopic(topic: string): (typeof TOPIC_COLORS)[number] {
  let hash = 0;
  for (let i = 0; i < topic.length; i++) {
    hash = topic.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TOPIC_COLORS.length;
  return TOPIC_COLORS[index];
}

export async function fetchRssSummaries(locale: string): Promise<PostSummary[]> {
  const cacheName = 'mediumPostsData';
  const cacheKey = `${locale}-all`;

  const cachedData = getCache(cacheKey, mediumPostsCache, cacheName);
  if (cachedData) {
    return cachedData;
  }

  if (!fs.existsSync(FEED_JSON_PATH)) {
    console.error(`Medium feed file not found: ${FEED_JSON_PATH}`);
    setCache(cacheKey, [], mediumPostsCache, cacheName);
    return [];
  }

  try {
    const fileContents = fs.readFileSync(FEED_JSON_PATH, 'utf-8');
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

      return {
        id: item.guid ?? `rss-${index}`,
        title: item.title ?? 'Untitled',
        date: item.pubDate ?? new Date().toISOString(),
        summary,
        thumbnail,
        topics,
        readingTime: calculateReadingTime(content, locale),
        link: item.link,
      };
    });

    setCache(cacheKey, posts, mediumPostsCache, cacheName);
    return posts;
  } catch (error) {
    console.error(`Error reading/parsing Medium feed JSON:`, error);
    setCache(cacheKey, [], mediumPostsCache, cacheName);
    return [];
  }
}

export const makeMediumPostsProps =
  (ns: string[] = []) =>
  async (context: GetStaticPropsContext) => {
    const locale = (context?.params?.locale as string) || i18nextConfig.i18n.defaultLocale;
    const posts = await fetchRssSummaries(locale);
    const i18nProps = await serverSideTranslations(locale, ns);

    return {
      props: {
        ...i18nProps,
        posts,
      },
    };
  };
