import { PostSummary } from '@/types/posts';

export type AdjacentPostLink = Pick<PostSummary, 'id' | 'title'>;

export const sortPosts = (posts: PostSummary[], sortOrder: 'asc' | 'desc' = 'desc') => {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.publishedDate).getTime();
    const dateB = new Date(b.publishedDate).getTime();

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
    return new Date(b.candidate.publishedDate).getTime() - new Date(a.candidate.publishedDate).getTime();
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
