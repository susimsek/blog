import { filterByQuery, filterByTopics, filterByDateRange } from '@/lib/postFilters';
import { PostSummary } from '@/types/posts';

const mockPost: PostSummary = {
  id: '1',
  title: 'Test Post',
  summary: 'This is a summary of the test post.',
  date: '2024-01-15',
  topics: [
    { id: 'topic1', name: 'Topic 1', color: 'red' },
    { id: 'topic2', name: 'Topic 2', color: 'blue' },
  ],
};

describe('Post Filters', () => {
  describe('filterByQuery', () => {
    it('returns true if the query matches the title', () => {
      expect(filterByQuery(mockPost, 'Test')).toBe(true);
    });

    it('returns true if the query matches the summary', () => {
      expect(filterByQuery(mockPost, 'summary')).toBe(true);
    });

    it('returns false if the query does not match the title or summary', () => {
      expect(filterByQuery(mockPost, 'Nonexistent')).toBe(false);
    });

    it('returns true for an empty query', () => {
      expect(filterByQuery(mockPost, '')).toBe(true);
    });
  });

  describe('filterByTopics', () => {
    it('returns true if any topic matches the selected topics', () => {
      expect(filterByTopics(mockPost, ['topic1'])).toBe(true);
    });

    it('returns false if none of the topics match the selected topics', () => {
      expect(filterByTopics(mockPost, ['nonexistent'])).toBe(false);
    });

    it('returns true if no topics are selected', () => {
      expect(filterByTopics(mockPost, [])).toBe(true);
    });

    it('returns true if the post has no topics and no topics are selected', () => {
      const postWithoutTopics = { ...mockPost, topics: undefined };
      expect(filterByTopics(postWithoutTopics, [])).toBe(true);
    });
  });

  describe('filterByDateRange', () => {
    it('returns true if the post date is within the range', () => {
      expect(filterByDateRange(mockPost, { startDate: '2024-01-01', endDate: '2024-01-31' })).toBe(true);
    });

    it('returns true if the post date matches the start date', () => {
      expect(filterByDateRange(mockPost, { startDate: '2024-01-15', endDate: '2024-01-31' })).toBe(true);
    });

    it('returns true if the post date matches the end date', () => {
      expect(filterByDateRange(mockPost, { startDate: '2024-01-01', endDate: '2024-01-15' })).toBe(true);
    });

    it('returns false if the post date is outside the range', () => {
      expect(filterByDateRange(mockPost, { startDate: '2024-02-01', endDate: '2024-02-28' })).toBe(false);
    });

    it('returns true if no startDate is provided', () => {
      expect(filterByDateRange(mockPost, { endDate: '2024-01-31' })).toBe(true);
    });

    it('returns true if no endDate is provided', () => {
      expect(filterByDateRange(mockPost, { startDate: '2024-01-01' })).toBe(true);
    });

    it('returns true if no date range is provided', () => {
      expect(filterByDateRange(mockPost, {})).toBe(true);
    });
  });
});
