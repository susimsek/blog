import { PostSummary } from '@/types/posts';
import { normalizeSearchText } from '@/lib/searchText';
import Fuse from 'fuse.js';
import type { IFuseOptions, FuseResult } from 'fuse.js';
import type { SourceFilter } from '@/reducers/postsQuery';

export type AdjacentPostLink = Pick<PostSummary, 'id' | 'title'>;

const FUSE_OPTIONS: IFuseOptions<PostSummary> = {
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.34,
  minMatchCharLength: 2,
  shouldSort: false,
  keys: ['searchText'],
};

const postFuseCache = new WeakMap<ReadonlyArray<PostSummary>, Fuse<PostSummary>>();

const getPostFuse = (posts: PostSummary[]): Fuse<PostSummary> => {
  const cached = postFuseCache.get(posts);
  if (cached) {
    return cached;
  }

  const created = new Fuse(posts, FUSE_OPTIONS);
  postFuseCache.set(posts, created);
  return created;
};

const normalizeFuseScore = (score: number): number => Math.round((1 - score) * 1000);
const getSourceRank = (post: PostSummary): number => ((post.source ?? 'blog') === 'blog' ? 0 : 1);

const searchWithFuse = (posts: PostSummary[], query: string, limit?: number): FuseResult<PostSummary>[] => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [];
  }

  const fuse = getPostFuse(posts);
  const searchOptions =
    typeof limit === 'number' && Number.isFinite(limit) ? { limit: Math.max(0, Math.floor(limit)) } : undefined;

  const rawResults = fuse.search(normalizedQuery, searchOptions);

  return rawResults.sort((left, right) => {
    const leftSourceRank = getSourceRank(left.item);
    const rightSourceRank = getSourceRank(right.item);
    if (leftSourceRank !== rightSourceRank) {
      return leftSourceRank - rightSourceRank;
    }

    const leftScore = left.score ?? 1;
    const rightScore = right.score ?? 1;
    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }
    return new Date(right.item.date).getTime() - new Date(left.item.date).getTime();
  });
};

export const getQueryRelevanceScore = (post: PostSummary, query: string): number => {
  const results = searchWithFuse([post], query, 1);
  if (results.length === 0) {
    return 0;
  }

  return normalizeFuseScore(results[0].score ?? 1);
};

export const searchPostsByRelevance = (
  posts: PostSummary[],
  query: string,
  limit: number = Number.POSITIVE_INFINITY,
): PostSummary[] => {
  if (!normalizeSearchText(query)) {
    return posts;
  }

  return searchWithFuse(posts, query, limit).map(result => result.item);
};

/**
 * Filters posts by query.
 */
export const filterByQuery = (post: PostSummary, query: string) => {
  if (!normalizeSearchText(query)) {
    return true;
  }

  return getQueryRelevanceScore(post, query) > 0;
};

/**
 * Filters posts by selected topics.
 */
export const filterByTopics = (post: PostSummary, selectedTopics: string[]) =>
  selectedTopics.length === 0 || post.topics?.some(topic => selectedTopics.includes(topic.id));

export const filterBySource = (post: PostSummary, sourceFilter: SourceFilter) => {
  if (sourceFilter === 'all') {
    return true;
  }

  const source = post.source ?? 'blog';
  return source === sourceFilter;
};

/**
 * Filters posts by date range.
 */
export const filterByDateRange = (post: PostSummary, dateRange: { startDate?: string; endDate?: string }) => {
  const postDate = new Date(post.date).getTime();
  const parseDate = (value: string): Date => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return new Date(value);
    }
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  };
  const startDate = dateRange.startDate ? parseDate(dateRange.startDate).setHours(0, 0, 0, 0) : undefined;
  const endDate = dateRange.endDate ? parseDate(dateRange.endDate).setHours(23, 59, 59, 999) : undefined;

  return (!startDate || postDate >= startDate) && (!endDate || postDate <= endDate);
};

export const filterByReadingTime = (post: PostSummary, range: 'any' | '3-7' | '8-12' | '15+') => {
  if (range === 'any') return true;

  const minutes = Number(post.readingTimeMin);
  if (!Number.isFinite(minutes) || minutes <= 0) return false;

  if (range === '15+') {
    return minutes >= 15;
  }

  if (range === '3-7') {
    return minutes >= 3 && minutes <= 7;
  }

  return minutes >= 8 && minutes <= 12;
};

export const sortPosts = (posts: PostSummary[], sortOrder: 'asc' | 'desc' = 'desc') => {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();

    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });
};

export const getRelatedPosts = (post: PostSummary, allPosts: PostSummary[], limit: number = 3): PostSummary[] => {
  const postTopicIds = new Set((post.topics ?? []).map(topic => topic.id).filter(Boolean));
  if (postTopicIds.size === 0) {
    return [];
  }

  const minScore = 0.5;
  const totalPosts = allPosts.length;
  const topicFrequency = new Map<string, number>();
  for (const candidate of allPosts) {
    for (const topic of candidate.topics ?? []) {
      if (!topic?.id) continue;
      topicFrequency.set(topic.id, (topicFrequency.get(topic.id) ?? 0) + 1);
    }
  }

  const idf = (topicId: string) => {
    const freq = topicFrequency.get(topicId) ?? 0;
    return Math.log((totalPosts + 1) / (freq + 1));
  };

  const scoredAll = allPosts
    .filter(candidate => candidate.id !== post.id)
    .map(candidate => {
      let sharedCount = 0;
      let score = 0;

      for (const topic of candidate.topics ?? []) {
        if (!topic?.id) continue;
        if (!postTopicIds.has(topic.id)) continue;
        sharedCount += 1;
        score += idf(topic.id);
      }

      return { candidate, sharedCount, score };
    })
    .filter(item => item.sharedCount > 0);

  scoredAll.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.sharedCount !== a.sharedCount) {
      return b.sharedCount - a.sharedCount;
    }
    return new Date(b.candidate.date).getTime() - new Date(a.candidate.date).getTime();
  });

  const strong = scoredAll.filter(item => item.score >= minScore);
  const selected = strong.slice(0, limit);

  if (selected.length < limit) {
    const selectedIds = new Set(selected.map(item => item.candidate.id));
    const fallback = scoredAll.filter(item => item.score > 0 && !selectedIds.has(item.candidate.id));
    selected.push(...fallback.slice(0, limit - selected.length));
  }

  return selected.map(item => item.candidate);
};

export const getAdjacentPosts = (
  postId: string,
  allPosts: PostSummary[],
): { previousPost: AdjacentPostLink | null; nextPost: AdjacentPostLink | null } => {
  const currentIndex = allPosts.findIndex(post => post.id === postId);

  if (currentIndex === -1) {
    return { previousPost: null, nextPost: null };
  }

  const previous = allPosts[currentIndex + 1];
  const next = allPosts[currentIndex - 1];

  return {
    previousPost: previous ? { id: previous.id, title: previous.title } : null,
    nextPost: next ? { id: next.id, title: next.title } : null,
  };
};
