import { getAdjacentPosts, getRelatedPosts, sortPosts } from '@/lib/postFilters';
import { PostSummary } from '@/types/posts';

const mockPost: PostSummary = {
  id: '1',
  title: 'Test Post',
  summary: 'This is a summary of the test post.',
  searchText: 'test post this is a summary of the test post topic1 topic 1 topic2 topic 2',
  publishedDate: '2024-01-15',
  thumbnail: null,
  readingTimeMin: 3,
  topics: [
    { id: 'topic1', name: 'Topic 1', color: 'red' },
    { id: 'topic2', name: 'Topic 2', color: 'blue' },
  ],
};

describe('Post Filters', () => {
  describe('sortPosts', () => {
    it('sorts posts by date descending by default', () => {
      const sorted = sortPosts([
        { ...mockPost, id: 'a', publishedDate: '2023-01-01' },
        { ...mockPost, id: 'b', publishedDate: '2024-01-01' },
      ]);
      expect(sorted.map(post => post.id)).toEqual(['b', 'a']);
    });

    it('sorts posts by date ascending when requested', () => {
      const sorted = sortPosts(
        [
          { ...mockPost, id: 'a', publishedDate: '2023-01-01' },
          { ...mockPost, id: 'b', publishedDate: '2024-01-01' },
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
        publishedDate: '2024-01-20',
        topics: [
          { id: 'topic1', name: 'Topic 1', color: 'red' },
          { id: 'topic2', name: 'Topic 2', color: 'blue' },
        ],
      },
      {
        ...mockPost,
        id: 'p1',
        publishedDate: '2024-01-19',
        topics: [{ id: 'topic1', name: 'Topic 1', color: 'red' }],
      },
      {
        ...mockPost,
        id: 'p2',
        publishedDate: '2024-01-18',
        topics: [{ id: 'topic2', name: 'Topic 2', color: 'blue' }],
      },
      {
        ...mockPost,
        id: 'p3',
        publishedDate: '2024-01-17',
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
          publishedDate: '2024-01-20',
          topics: [{ id: 'topic1', name: 'Topic 1', color: 'red' }],
        },
        {
          ...mockPost,
          id: 'tie-old',
          publishedDate: '2024-01-01',
          topics: [{ id: 'topic1', name: 'Topic 1', color: 'red' }],
        },
        {
          ...mockPost,
          id: 'tie-new',
          publishedDate: '2024-01-19',
          topics: [{ id: 'topic1', name: 'Topic 1', color: 'red' }],
        },
        {
          ...mockPost,
          id: 'other',
          publishedDate: '2024-01-10',
          topics: [{ id: 'topic2', name: 'Topic 2', color: 'blue' }],
        },
      ];

      const related = getRelatedPosts(tiePosts[0], tiePosts, 2);
      expect(related.map(post => post.id)).toEqual(['tie-new', 'tie-old']);
    });
  });

  describe('getAdjacentPosts', () => {
    const orderedPosts: PostSummary[] = [
      { ...mockPost, id: 'p3', title: 'Newest', publishedDate: '2024-03-01' },
      { ...mockPost, id: 'p2', title: 'Middle', publishedDate: '2024-02-01' },
      { ...mockPost, id: 'p1', title: 'Oldest', publishedDate: '2024-01-01' },
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
