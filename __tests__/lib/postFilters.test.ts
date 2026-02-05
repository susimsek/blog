import {
  filterByQuery,
  filterByTopics,
  filterByDateRange,
  filterByReadingTime,
  getRelatedPosts,
  sortPosts,
} from '@/lib/postFilters';
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

  describe('filterByReadingTime', () => {
    it('returns true for "any"', () => {
      expect(filterByReadingTime({ ...mockPost, readingTime: '1 min read' }, 'any')).toBe(true);
    });

    it('handles 15+ range with capped and numeric values', () => {
      expect(filterByReadingTime({ ...mockPost, readingTime: '15+ min read' }, '15+')).toBe(true);
      expect(filterByReadingTime({ ...mockPost, readingTime: '16 min read' }, '15+')).toBe(true);
    });

    it('handles bounded ranges', () => {
      expect(filterByReadingTime({ ...mockPost, readingTime: '5 min read' }, '3-7')).toBe(true);
      expect(filterByReadingTime({ ...mockPost, readingTime: '8 min read' }, '3-7')).toBe(false);
      expect(filterByReadingTime({ ...mockPost, readingTime: '10 min read' }, '8-12')).toBe(true);
      expect(filterByReadingTime({ ...mockPost, readingTime: '13 min read' }, '8-12')).toBe(false);
    });

    it('falls back to true when parsing fails', () => {
      expect(filterByReadingTime({ ...mockPost, readingTime: '' }, '3-7')).toBe(true);
      expect(filterByReadingTime({ ...mockPost, readingTime: 'no-time' }, '3-7')).toBe(true);
      expect(filterByReadingTime({ ...mockPost, readingTime: '0 min read' }, '3-7')).toBe(true);
    });
  });

  describe('sortPosts', () => {
    it('sorts posts by date descending by default', () => {
      const sorted = sortPosts([
        { ...mockPost, id: 'a', date: '2023-01-01' },
        { ...mockPost, id: 'b', date: '2024-01-01' },
      ]);
      expect(sorted.map(post => post.id)).toEqual(['b', 'a']);
    });

    it('sorts posts by date ascending when requested', () => {
      const sorted = sortPosts(
        [
          { ...mockPost, id: 'a', date: '2023-01-01' },
          { ...mockPost, id: 'b', date: '2024-01-01' },
        ],
        'asc',
      );
      expect(sorted.map(post => post.id)).toEqual(['a', 'b']);
    });
  });

  describe('getRelatedPosts', () => {
    const basePosts: PostSummary[] = [
      {
        ...mockPost,
        id: 'base',
        date: '2024-01-20',
        topics: [
          { id: 'topic1', name: 'Topic 1', color: 'red' },
          { id: 'topic2', name: 'Topic 2', color: 'blue' },
        ],
      },
      {
        ...mockPost,
        id: 'p1',
        date: '2024-01-19',
        topics: [{ id: 'topic1', name: 'Topic 1', color: 'red' }],
      },
      {
        ...mockPost,
        id: 'p2',
        date: '2024-01-18',
        topics: [{ id: 'topic2', name: 'Topic 2', color: 'blue' }],
      },
      {
        ...mockPost,
        id: 'p3',
        date: '2024-01-17',
        topics: [{ id: 'topic3', name: 'Topic 3', color: 'green' }],
      },
    ];

    it('returns empty array when the current post has no topics', () => {
      const related = getRelatedPosts({ ...basePosts[0], topics: [] }, basePosts);
      expect(related).toEqual([]);
    });

    it('returns topic-related posts with fallback ordering', () => {
      const related = getRelatedPosts(basePosts[0], basePosts, 2);
      expect(related).toHaveLength(2);
      expect(related.map(post => post.id)).toEqual(['p1', 'p2']);
    });
  });
});
