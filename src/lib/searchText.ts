import type { PostSummary, Topic } from '@/types/posts';

const normalizeWhitespace = (value: string) =>
  value
    .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replaceAll(/\s+/g, ' ');

export const normalizeSearchText = (value: string): string => {
  const lowered = value.toLocaleLowerCase('tr');
  const dotlessNormalized = lowered.replaceAll('ı', 'i');
  const withoutMarks = dotlessNormalized.normalize('NFKD').replaceAll(/\p{M}+/gu, '');
  return normalizeWhitespace(withoutMarks);
};

const flattenTopicText = (topics: Topic[] | undefined): string[] => {
  if (!Array.isArray(topics)) {
    return [];
  }

  return topics.flatMap(topic => {
    if (!topic || typeof topic !== 'object') {
      return [];
    }

    return [topic.id, topic.name].filter((value): value is string => typeof value === 'string' && value.length > 0);
  });
};

export const buildPostSearchText = (post: Pick<PostSummary, 'id' | 'title' | 'summary' | 'topics'>): string => {
  const parts = [post.id, post.title, post.summary, ...flattenTopicText(post.topics)];
  return normalizeSearchText(parts.join(' '));
};

export const topicMatchesQuery = (topic: Pick<Topic, 'name'>, query: string): boolean => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return true;
  }

  const normalizedName = normalizeSearchText(topic.name);
  return normalizedName.includes(normalizedQuery);
};
