import {
  filterAndSortPosts,
  isTrackablePostId,
  matchesCategoryFilter,
  matchesPostListFilters,
  matchesPublishedDateRange,
  matchesReadingTimeRange,
  matchesSearchQuery,
  matchesSelectedTopics,
  matchesSourceFilter,
  mergeLoadedLikesByPostId,
  resolveEffectiveSourceFilter,
  sortPostsByPublishedDate,
} from '@/components/posts/PostList';
import { mockPostSummaries } from '@tests/__mocks__/mockPostData';

describe('PostList helpers', () => {
  const basePost = mockPostSummaries[0];

  it('resolves effective source filters by route type', () => {
    expect(resolveEffectiveSourceFilter(true, false, false, 'all')).toBe('all');
    expect(resolveEffectiveSourceFilter(false, true, false, 'all')).toBe('medium');
    expect(resolveEffectiveSourceFilter(false, false, true, 'medium')).toBe('blog');
    expect(resolveEffectiveSourceFilter(false, false, false, 'blog')).toBe('all');
  });

  it('matches reading time, search, topic, category, and source filters', () => {
    expect(matchesReadingTimeRange(5, '3-7')).toBe(true);
    expect(matchesReadingTimeRange(10, '8-12')).toBe(true);
    expect(matchesReadingTimeRange(20, '15+')).toBe(true);
    expect(matchesReadingTimeRange(2, '3-7')).toBe(false);

    expect(matchesSearchQuery(basePost, '')).toBe(true);
    expect(matchesSearchQuery(basePost, basePost.title.toLowerCase())).toBe(true);
    expect(matchesSearchQuery(basePost, 'not-found')).toBe(false);

    expect(matchesSelectedTopics(basePost, [])).toBe(true);
    expect(matchesSelectedTopics(basePost, [basePost.topics?.[0]?.id ?? 'missing'])).toBe(true);
    expect(matchesSelectedTopics(basePost, ['missing-topic'])).toBe(false);

    expect(matchesCategoryFilter(basePost, 'all')).toBe(true);
    expect(matchesCategoryFilter(basePost, basePost.category?.id?.toLowerCase() ?? 'all')).toBe(true);
    expect(matchesCategoryFilter(basePost, 'backend')).toBe(false);

    expect(matchesSourceFilter({ ...basePost, source: 'medium' }, 'all')).toBe(true);
    expect(matchesSourceFilter({ ...basePost, source: 'medium' }, 'medium')).toBe(true);
    expect(matchesSourceFilter({ ...basePost, source: undefined }, 'blog')).toBe(true);
    expect(matchesSourceFilter({ ...basePost, source: 'medium' }, 'blog')).toBe(false);
  });

  it('matches published dates and combined post filters', () => {
    const inRange = matchesPublishedDateRange(
      basePost,
      new Date('2023-01-01').getTime(),
      new Date('2030-01-01').getTime(),
    );
    const outOfRange = matchesPublishedDateRange(basePost, null, new Date('2020-01-01').getTime());

    expect(inRange).toBe(true);
    expect(outOfRange).toBe(false);

    expect(
      matchesPostListFilters(basePost, {
        normalizedQuery: basePost.title.toLowerCase(),
        selectedTopics: [],
        categoryFilter: 'all',
        effectiveSourceFilter: 'all',
        startDateMs: null,
        endDateMs: null,
        readingTimeRange: 'any',
        scopedIdSet: null,
      }),
    ).toBe(true);

    expect(
      matchesPostListFilters(basePost, {
        normalizedQuery: '',
        selectedTopics: [],
        categoryFilter: 'all',
        effectiveSourceFilter: 'all',
        startDateMs: null,
        endDateMs: null,
        readingTimeRange: 'any',
        scopedIdSet: new Set(['other-post']),
      }),
    ).toBe(false);
  });

  it('sorts posts, filters collections, and merges loaded likes', () => {
    const ascSorted = [...mockPostSummaries].sort((left, right) => sortPostsByPublishedDate(left, right, 'asc'));
    expect(new Date(ascSorted[0].publishedDate).getTime()).toBeLessThanOrEqual(
      new Date(ascSorted.at(-1)?.publishedDate ?? 0).getTime(),
    );

    const filtered = filterAndSortPosts(
      mockPostSummaries,
      {
        normalizedQuery: 'post',
        selectedTopics: [],
        categoryFilter: 'all',
        effectiveSourceFilter: 'all',
        startDateMs: null,
        endDateMs: null,
        readingTimeRange: '15+',
        scopedIdSet: null,
      },
      'desc',
    );
    expect(filtered.every(post => post.readingTimeMin >= 15)).toBe(true);

    expect(mergeLoadedLikesByPostId({}, ['post-1'], null)).toEqual({ 'post-1': null });
    expect(mergeLoadedLikesByPostId({}, ['post-1', 'post-2'], { 'post-1': 3, 'post-2': Number.NaN })).toEqual({
      'post-1': 3,
      'post-2': 0,
    });
  });

  it('validates trackable post ids', () => {
    expect(isTrackablePostId('post-123')).toBe(true);
    expect(isTrackablePostId('a')).toBe(false);
    expect(isTrackablePostId('Post_123')).toBe(false);
  });
});
