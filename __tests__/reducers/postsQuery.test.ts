import postsQueryReducer, {
  resetFilters,
  setDateRange,
  setLocale,
  setPage,
  setPageSize,
  setPosts,
  setQuery,
  setReadingTimeRange,
  setSelectedTopics,
  setSourceFilter,
  setSortOrder,
} from '@/reducers/postsQuery';
import type { PostSummary } from '@/types/posts';

const mockPosts: PostSummary[] = [
  {
    id: '1',
    title: 'Post 1',
    date: '2026-01-01',
    summary: 'Summary',
    searchText: 'post 1 summary',
    thumbnail: null,
    readingTimeMin: 3,
  },
];

describe('postsQuery reducer', () => {
  it('returns the initial state', () => {
    const state = postsQueryReducer(undefined, { type: 'unknown' });
    expect(state.query).toBe('');
    expect(state.sortOrder).toBe('desc');
    expect(state.page).toBe(1);
    expect(state.pageSize).toBe(5);
    expect(state.selectedTopics).toEqual([]);
    expect(state.sourceFilter).toBe('all');
    expect(state.dateRange).toEqual({});
    expect(state.readingTimeRange).toBe('any');
    expect(state.locale).toBeNull();
    expect(state.posts).toEqual([]);
  });

  it('handles all action reducers', () => {
    let state = postsQueryReducer(undefined, setPosts(mockPosts));
    expect(state.posts).toEqual(mockPosts);

    state = postsQueryReducer(state, setQuery('react'));
    expect(state.query).toBe('react');
    expect(state.page).toBe(1);

    state = postsQueryReducer(state, setSortOrder('asc'));
    expect(state.sortOrder).toBe('asc');
    expect(state.page).toBe(1);

    state = postsQueryReducer(state, setPage(3));
    expect(state.page).toBe(3);

    state = postsQueryReducer(state, setPageSize(10));
    expect(state.pageSize).toBe(10);
    expect(state.page).toBe(1);

    state = postsQueryReducer(state, setSelectedTopics(['react', 'nextjs']));
    expect(state.selectedTopics).toEqual(['react', 'nextjs']);
    expect(state.page).toBe(1);

    state = postsQueryReducer(state, setSourceFilter('medium'));
    expect(state.sourceFilter).toBe('medium');
    expect(state.page).toBe(1);

    state = postsQueryReducer(state, setDateRange({ startDate: '2026-01-01', endDate: '2026-01-31' }));
    expect(state.dateRange).toEqual({ startDate: '2026-01-01', endDate: '2026-01-31' });
    expect(state.page).toBe(1);

    state = postsQueryReducer(state, setReadingTimeRange('15+'));
    expect(state.readingTimeRange).toBe('15+');
    expect(state.page).toBe(1);

    state = postsQueryReducer(state, setLocale('en'));
    expect(state.locale).toBe('en');

    state = postsQueryReducer(state, resetFilters());
    expect(state.query).toBe('');
    expect(state.selectedTopics).toEqual([]);
    expect(state.sourceFilter).toBe('all');
    expect(state.dateRange).toEqual({});
    expect(state.readingTimeRange).toBe('any');
    expect(state.page).toBe(1);
    expect(state.sortOrder).toBe('desc');
  });
});
