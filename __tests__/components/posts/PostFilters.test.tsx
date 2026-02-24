import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import type { PostsQueryState } from '@/reducers/postsQuery';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import { registerDynamicMock, registerDynamicMockSequence } from '@tests/utils/dynamicMockRegistry';

let PostFilters: typeof import('@/components/posts/PostFilters').PostFilters;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/components/common/TopicsDropdown', () => ({
  __esModule: true,
  TopicsDropdown: jest.fn(
    ({
      topics,
      onTopicsChange,
    }: {
      topics: Array<{ id: string; name: string }>;
      onTopicsChange: (topicIds: string[]) => void;
    }) => (
      <div data-testid="topics-dropdown">
        {topics.map(topic => (
          <button key={topic.id} onClick={() => onTopicsChange([topic.id])}>
            {topic.name}
          </button>
        ))}
      </div>
    ),
  ),
}));

jest.mock('@/components/common/DateRangePicker', () => ({
  __esModule: true,
  default: jest.fn(({ onRangeChange }) => (
    <button onClick={() => onRangeChange({ startDate: '2024-01-01', endDate: '2024-01-31' })} data-testid="date-picker">
      Date Range
    </button>
  )),
}));

jest.mock('@/components/common/SortDropdown', () => ({
  __esModule: true,
  SortDropdown: jest.fn(({ onChange }) => (
    <button onClick={() => onChange('desc')} data-testid="sort-dropdown">
      Sort by
    </button>
  )),
}));

jest.mock('@/components/common/SourceDropdown', () => ({
  __esModule: true,
  default: jest.fn(({ onChange }) => (
    <button onClick={() => onChange('medium')} data-testid="source-dropdown">
      Source
    </button>
  )),
}));

describe('PostFilters Component', () => {
  const basePostsQueryState: PostsQueryState = {
    query: '',
    sortOrder: 'desc',
    page: 1,
    pageSize: 5,
    selectedTopics: [],
    categoryFilter: 'all',
    sourceFilter: 'all',
    dateRange: {},
    readingTimeRange: 'any',
    locale: 'en',
    posts: [],
    topics: [
      { id: '1', name: 'Topic 1', color: 'red' },
      { id: '2', name: 'Topic 2', color: 'blue' },
    ],
    topicsLoading: false,
  };

  const buildPreloadedState = (overrides: Partial<PostsQueryState> = {}) => ({
    postsQuery: {
      ...basePostsQueryState,
      ...overrides,
    },
  });

  beforeAll(() => {
    const dateRangePicker = jest.requireMock('@/components/common/DateRangePicker');
    registerDynamicMock('DateRangePicker', dateRangePicker);
    registerDynamicMock('@/components/common/DateRangePicker', dateRangePicker);
    registerDynamicMockSequence([dateRangePicker]);
    PostFilters = require('@/components/posts/PostFilters').PostFilters;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders all mocked components', async () => {
    renderWithProviders(<PostFilters showSourceFilter />, { preloadedState: buildPreloadedState() });

    expect(screen.getByTestId('topics-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('source-dropdown')).toBeInTheDocument();
    expect(await screen.findByTestId('date-picker')).toBeInTheDocument();
    expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
  });

  test('calls onTopicsChange when a topic is clicked', () => {
    const { store } = renderWithProviders(<PostFilters showSourceFilter />, { preloadedState: buildPreloadedState() });

    const topicButton = screen.getByText('Topic 1');
    fireEvent.click(topicButton);

    expect(store.getState().postsQuery.selectedTopics).toEqual(['1']);
  });

  test('calls onDateRangeChange when date range button is clicked', async () => {
    const { store } = renderWithProviders(<PostFilters showSourceFilter />, { preloadedState: buildPreloadedState() });

    const datePickerButton = await screen.findByTestId('date-picker');
    fireEvent.click(datePickerButton);

    expect(store.getState().postsQuery.dateRange).toEqual({ startDate: '2024-01-01', endDate: '2024-01-31' });
  });

  test('calls onSourceFilterChange when source filter button is clicked', () => {
    const { store } = renderWithProviders(<PostFilters showSourceFilter />, { preloadedState: buildPreloadedState() });

    fireEvent.click(screen.getByTestId('source-dropdown'));

    expect(store.getState().postsQuery.sourceFilter).toBe('medium');
  });

  test('calls onSortChange when sort dropdown button is clicked', () => {
    const { store } = renderWithProviders(<PostFilters showSourceFilter />, { preloadedState: buildPreloadedState() });

    const sortButton = screen.getByTestId('sort-dropdown');
    fireEvent.click(sortButton);

    expect(store.getState().postsQuery.sortOrder).toBe('desc');
  });

  test('does not render TopicsDropdown when topics are empty', () => {
    renderWithProviders(<PostFilters showSourceFilter />, { preloadedState: buildPreloadedState({ topics: [] }) });

    expect(screen.queryByTestId('topics-dropdown')).not.toBeInTheDocument();
  });

  test('does not render SourceDropdown when source filter is disabled', () => {
    renderWithProviders(<PostFilters showSourceFilter={false} />, { preloadedState: buildPreloadedState() });

    expect(screen.queryByTestId('source-dropdown')).not.toBeInTheDocument();
  });
});
