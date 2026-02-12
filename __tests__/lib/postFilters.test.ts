import {
  filterByQuery,
  filterByTopics,
  filterByDateRange,
  filterByReadingTime,
  getAdjacentPosts,
  getRelatedPosts,
  sortPosts,
} from '@/lib/postFilters';
import { PostSummary } from '@/types/posts';

const mockPost: PostSummary = {
  id: '1',
  title: 'Test Post',
  summary: 'This is a summary of the test post.',
  searchText: 'test post this is a summary of the test post topic1 topic 1 topic2 topic 2',
  date: '2024-01-15',
  thumbnail: null,
  readingTimeMin: 3,
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

    it('matches Turkish characters without diacritics', () => {
      const post = {
        ...mockPost,
        title: 'Güvenlik Notları',
        summary: 'Kimlik doğrulama',
        searchText: 'guvenlik notlari kimlik dogrulama',
      };
      expect(filterByQuery(post, 'guvenlik')).toBe(true);
      expect(filterByQuery(post, 'dogrulama')).toBe(true);
    });

    it('matches topic text via normalized combined searchText', () => {
      expect(filterByQuery(mockPost, 'topic1')).toBe(true);
      expect(filterByQuery(mockPost, 'Topic 2')).toBe(true);
    });

    it('does not fallback to title/summary when searchText is empty', () => {
      const postWithoutSearchText = { ...mockPost, searchText: '' };
      expect(filterByQuery(postWithoutSearchText, 'Test')).toBe(false);
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
      expect(filterByReadingTime({ ...mockPost, readingTimeMin: 1 }, 'any')).toBe(true);
    });

    it('handles 15+ range with capped and numeric values', () => {
      expect(filterByReadingTime({ ...mockPost, readingTimeMin: 15 }, '15+')).toBe(true);
      expect(filterByReadingTime({ ...mockPost, readingTimeMin: 16 }, '15+')).toBe(true);
    });

    it('handles bounded ranges', () => {
      expect(filterByReadingTime({ ...mockPost, readingTimeMin: 5 }, '3-7')).toBe(true);
      expect(filterByReadingTime({ ...mockPost, readingTimeMin: 8 }, '3-7')).toBe(false);
      expect(filterByReadingTime({ ...mockPost, readingTimeMin: 10 }, '8-12')).toBe(true);
      expect(filterByReadingTime({ ...mockPost, readingTimeMin: 13 }, '8-12')).toBe(false);
    });

    it('returns false when reading time minutes are invalid', () => {
      expect(filterByReadingTime({ ...mockPost, readingTimeMin: Number.NaN }, '3-7')).toBe(false);
      expect(filterByReadingTime({ ...mockPost, readingTimeMin: -1 }, '3-7')).toBe(false);
      expect(filterByReadingTime({ ...mockPost, readingTimeMin: 0 }, '3-7')).toBe(false);
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

    it('handles candidates with missing topic ids and falls back when score is low', () => {
      const postsWithSparseTopics: PostSummary[] = [
        { ...basePosts[0], id: 'base-low', topics: [{ id: 'topic1', name: 'Topic 1', color: 'red' }] },
        { ...basePosts[1], id: 'low-a', topics: [{ id: 'topic1', name: 'Topic 1', color: 'red' }] },
        { ...basePosts[2], id: 'low-b', topics: [{ id: 'topic1', name: 'Topic 1', color: 'red' }] },
        { ...basePosts[3], id: 'invalid-topic', topics: [{ id: '', name: 'No Id', color: 'gray' }] },
      ];

      const related = getRelatedPosts(postsWithSparseTopics[0], postsWithSparseTopics, 2);
      expect(related.map(post => post.id)).toEqual(['low-a', 'low-b']);
    });

    it('sorts by shared count and recency when scores tie', () => {
      const tiePosts: PostSummary[] = [
        {
          ...mockPost,
          id: 'base-tie',
          date: '2024-01-20',
          topics: [{ id: 'topic1', name: 'Topic 1', color: 'red' }],
        },
        {
          ...mockPost,
          id: 'tie-old',
          date: '2024-01-01',
          topics: [{ id: 'topic1', name: 'Topic 1', color: 'red' }],
        },
        {
          ...mockPost,
          id: 'tie-new',
          date: '2024-01-19',
          topics: [{ id: 'topic1', name: 'Topic 1', color: 'red' }],
        },
        {
          ...mockPost,
          id: 'other',
          date: '2024-01-10',
          topics: [{ id: 'topic2', name: 'Topic 2', color: 'blue' }],
        },
      ];

      const related = getRelatedPosts(tiePosts[0], tiePosts, 2);
      expect(related.map(post => post.id)).toEqual(['tie-new', 'tie-old']);
    });
  });

  describe('getAdjacentPosts', () => {
    const orderedPosts: PostSummary[] = [
      { ...mockPost, id: 'p3', title: 'Newest', date: '2024-03-01' },
      { ...mockPost, id: 'p2', title: 'Middle', date: '2024-02-01' },
      { ...mockPost, id: 'p1', title: 'Oldest', date: '2024-01-01' },
    ];

    it('returns both adjacent posts for a middle item', () => {
      const adjacent = getAdjacentPosts('p2', orderedPosts);
      expect(adjacent).toEqual({
        previousPost: { id: 'p1', title: 'Oldest' },
        nextPost: { id: 'p3', title: 'Newest' },
      });
    });

    it('returns only next post for the first item', () => {
      const adjacent = getAdjacentPosts('p3', orderedPosts);
      expect(adjacent).toEqual({
        previousPost: { id: 'p2', title: 'Middle' },
        nextPost: null,
      });
    });

    it('returns only previous post for the last item', () => {
      const adjacent = getAdjacentPosts('p1', orderedPosts);
      expect(adjacent).toEqual({
        previousPost: null,
        nextPost: { id: 'p2', title: 'Middle' },
      });
    });

    it('returns null links when current post is missing', () => {
      const adjacent = getAdjacentPosts('unknown-id', orderedPosts);
      expect(adjacent).toEqual({
        previousPost: null,
        nextPost: null,
      });
    });
  });
});
