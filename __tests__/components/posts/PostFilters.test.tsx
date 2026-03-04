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

jest.mock('@/components/common/CategoryDropdown', () => ({
  __esModule: true,
  default: jest.fn(({ onChange }) => (
    <button onClick={() => onChange('programming')} data-testid="category-dropdown">
      Category
    </button>
  )),
}));

jest.mock('@/components/common/ReadingTimeDropdown', () => ({
  __esModule: true,
  default: jest.fn(({ onChange }) => (
    <button onClick={() => onChange('short')} data-testid="reading-time-dropdown">
      Reading Time
    </button>
  )),
}));

jest.mock('@/components/common/PostDensityToggle', () => ({
  __esModule: true,
  default: jest.fn(({ onChange }) => (
    <button onClick={() => onChange('grid')} data-testid="density-toggle">
      Density
    </button>
  )),
}));

describe('PostFilters Component', () => {
  const basePostsQueryState: PostsQueryState = {
    sortOrder: 'desc',
    selectedTopics: [],
    categoryFilter: 'all',
    dateRange: {},
    readingTimeRange: 'any',
    locale: 'en',
  };
  const topics = [
    { id: '1', name: 'Topic 1', color: 'red' },
    { id: '2', name: 'Topic 2', color: 'blue' },
  ];
  const onSourceFilterChangeMock = jest.fn();

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
    onSourceFilterChangeMock.mockReset();
  });

  test('renders all mocked components', async () => {
    renderWithProviders(
      <PostFilters
        topics={topics}
        showSourceFilter
        sourceFilter="all"
        onSourceFilterChange={onSourceFilterChangeMock}
      />,
      {
        preloadedState: buildPreloadedState(),
      },
    );

    expect(screen.getByTestId('topics-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('source-dropdown')).toBeInTheDocument();
    expect(await screen.findByTestId('date-picker')).toBeInTheDocument();
    expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
  });

  test('calls onTopicsChange when a topic is clicked', () => {
    const { store } = renderWithProviders(
      <PostFilters
        topics={topics}
        showSourceFilter
        sourceFilter="all"
        onSourceFilterChange={onSourceFilterChangeMock}
      />,
      {
        preloadedState: buildPreloadedState(),
      },
    );

    const topicButton = screen.getByText('Topic 1');
    fireEvent.click(topicButton);

    expect(store.getState().postsQuery.selectedTopics).toEqual(['1']);
  });

  test('calls onDateRangeChange when date range button is clicked', async () => {
    const { store } = renderWithProviders(
      <PostFilters
        topics={topics}
        showSourceFilter
        sourceFilter="all"
        onSourceFilterChange={onSourceFilterChangeMock}
      />,
      {
        preloadedState: buildPreloadedState(),
      },
    );

    const datePickerButton = await screen.findByTestId('date-picker');
    fireEvent.click(datePickerButton);

    expect(store.getState().postsQuery.dateRange).toEqual({ startDate: '2024-01-01', endDate: '2024-01-31' });
  });

  test('calls onSourceFilterChange when source filter button is clicked', () => {
    renderWithProviders(
      <PostFilters
        topics={topics}
        showSourceFilter
        sourceFilter="all"
        onSourceFilterChange={onSourceFilterChangeMock}
      />,
      {
        preloadedState: buildPreloadedState(),
      },
    );

    fireEvent.click(screen.getByTestId('source-dropdown'));

    expect(onSourceFilterChangeMock).toHaveBeenCalledWith('medium');
  });

  test('calls onSortChange when sort dropdown button is clicked', () => {
    const { store } = renderWithProviders(
      <PostFilters
        topics={topics}
        showSourceFilter
        sourceFilter="all"
        onSourceFilterChange={onSourceFilterChangeMock}
      />,
      {
        preloadedState: buildPreloadedState(),
      },
    );

    const sortButton = screen.getByTestId('sort-dropdown');
    fireEvent.click(sortButton);

    expect(store.getState().postsQuery.sortOrder).toBe('desc');
  });

  test('does not render TopicsDropdown when topics are empty', () => {
    renderWithProviders(
      <PostFilters topics={[]} showSourceFilter sourceFilter="all" onSourceFilterChange={onSourceFilterChangeMock} />,
      { preloadedState: buildPreloadedState() },
    );

    expect(screen.queryByTestId('topics-dropdown')).not.toBeInTheDocument();
  });

  test('does not render SourceDropdown when source filter is disabled', () => {
    renderWithProviders(
      <PostFilters
        topics={topics}
        showSourceFilter={false}
        sourceFilter="all"
        onSourceFilterChange={onSourceFilterChangeMock}
      />,
      {
        preloadedState: buildPreloadedState(),
      },
    );

    expect(screen.queryByTestId('source-dropdown')).not.toBeInTheDocument();
  });

  test('updates category and reading time filters via dispatch', async () => {
    const { store } = renderWithProviders(
      <PostFilters
        topics={topics}
        showSourceFilter
        sourceFilter="all"
        onSourceFilterChange={onSourceFilterChangeMock}
      />,
      { preloadedState: buildPreloadedState() },
    );

    fireEvent.click(screen.getByTestId('category-dropdown'));
    fireEvent.click(screen.getByTestId('reading-time-dropdown'));

    expect(store.getState().postsQuery.categoryFilter).toBe('programming');
    expect(store.getState().postsQuery.readingTimeRange).toBe('short');
  });

  test('renders density toggle when handler is provided and forwards selected mode', () => {
    const onDensityModeChange = jest.fn();

    renderWithProviders(
      <PostFilters
        topics={topics}
        showSourceFilter
        sourceFilter="all"
        onSourceFilterChange={onSourceFilterChangeMock}
        densityMode="default"
        onDensityModeChange={onDensityModeChange}
      />,
      { preloadedState: buildPreloadedState() },
    );

    fireEvent.click(screen.getByTestId('density-toggle'));
    expect(onDensityModeChange).toHaveBeenCalledWith('grid');
  });

  test('does not render sort slot when sort filter is disabled', () => {
    renderWithProviders(
      <PostFilters
        topics={topics}
        showSourceFilter
        sourceFilter="all"
        onSourceFilterChange={onSourceFilterChangeMock}
        showSortFilter={false}
      />,
      { preloadedState: buildPreloadedState() },
    );

    expect(screen.queryByTestId('sort-dropdown')).not.toBeInTheDocument();
  });
});
