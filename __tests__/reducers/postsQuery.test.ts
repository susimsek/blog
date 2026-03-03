import postsQueryReducer, {
  clearNonSearchFilters,
  resetFilters,
  setCategoryFilter,
  setDateRange,
  setLocale,
  setReadingTimeRange,
  setSelectedTopics,
  setSortOrder,
} from '@/reducers/postsQuery';

describe('postsQuery reducer', () => {
  it('returns the initial state', () => {
    const state = postsQueryReducer(undefined, { type: 'unknown' });
    expect(state.sortOrder).toBe('desc');
    expect(state.selectedTopics).toEqual([]);
    expect(state.dateRange).toEqual({});
    expect(state.readingTimeRange).toBe('any');
    expect(state.locale).toBeNull();
  });

  it('handles all action reducers', () => {
    let state = postsQueryReducer(undefined, setSortOrder('asc'));

    expect(state.sortOrder).toBe('asc');

    state = postsQueryReducer(state, setSelectedTopics(['react', 'nextjs']));
    expect(state.selectedTopics).toEqual(['react', 'nextjs']);

    state = postsQueryReducer(state, setCategoryFilter('frontend'));
    expect(state.categoryFilter).toBe('frontend');

    state = postsQueryReducer(state, setDateRange({ startDate: '2026-01-01', endDate: '2026-01-31' }));
    expect(state.dateRange).toEqual({ startDate: '2026-01-01', endDate: '2026-01-31' });

    state = postsQueryReducer(state, setReadingTimeRange('15+'));
    expect(state.readingTimeRange).toBe('15+');

    state = postsQueryReducer(state, setLocale('en'));
    expect(state.locale).toBe('en');

    state = postsQueryReducer(state, resetFilters());
    expect(state.selectedTopics).toEqual([]);
    expect(state.dateRange).toEqual({});
    expect(state.readingTimeRange).toBe('any');
    expect(state.sortOrder).toBe('desc');
  });

  it('clears non-search filters without touching locale', () => {
    let state = postsQueryReducer(undefined, setLocale('en'));
    state = postsQueryReducer(state, setSelectedTopics(['frontend']));
    state = postsQueryReducer(state, setCategoryFilter('frontend'));
    state = postsQueryReducer(state, setDateRange({ startDate: '2026-02-01' }));
    state = postsQueryReducer(state, setReadingTimeRange('8-12'));

    state = postsQueryReducer(state, clearNonSearchFilters());

    expect(state.locale).toBe('en');
    expect(state.selectedTopics).toEqual([]);
    expect(state.categoryFilter).toBe('all');
    expect(state.dateRange).toEqual({});
    expect(state.readingTimeRange).toBe('any');
  });
});
