import { PostSummary } from '@/types/posts';

/**
 * Filters posts by query.
 */
export const filterByQuery = (post: PostSummary, query: string) =>
  post.title.toLowerCase().includes(query.toLowerCase()) || post.summary.toLowerCase().includes(query.toLowerCase());

/**
 * Filters posts by selected topics.
 */
export const filterByTopics = (post: PostSummary, selectedTopics: string[]) =>
  selectedTopics.length === 0 || post.topics?.some(topic => selectedTopics.includes(topic.id));

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

const getReadingTimeMinutes = (readingTime: string): { minutes: number; isCapped: boolean } | null => {
  const normalized = readingTime.trim();
  if (!normalized) return null;

  const isCapped = normalized.includes('15+');
  const match = /(\d+)/.exec(normalized);
  if (!match) return null;

  const minutes = Number(match[1]);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;

  return { minutes, isCapped };
};

export const filterByReadingTime = (post: PostSummary, range: 'any' | '3-7' | '8-12' | '15+') => {
  if (range === 'any') return true;

  const parsed = getReadingTimeMinutes(post.readingTime);
  if (!parsed) return true;

  if (range === '15+') {
    return parsed.isCapped || parsed.minutes >= 15;
  }

  if (range === '3-7') {
    return parsed.minutes >= 3 && parsed.minutes <= 7;
  }

  return parsed.minutes >= 8 && parsed.minutes <= 12;
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
