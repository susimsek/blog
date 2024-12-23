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
  const startDate = dateRange.startDate ? new Date(dateRange.startDate).setHours(0, 0, 0, 0) : undefined;
  const endDate = dateRange.endDate ? new Date(dateRange.endDate).setHours(23, 59, 59, 999) : undefined;

  return (!startDate || postDate >= startDate) && (!endDate || postDate <= endDate);
};
