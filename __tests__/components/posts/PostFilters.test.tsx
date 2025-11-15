import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { PostFilters, PostFiltersProps } from '@/components/posts/PostFilters';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';

jest.mock('@/components/search/SearchBar', () => ({
  __esModule: true,
  default: jest.fn(({ query, onChange }) => (
    <input
      data-testid="search-bar"
      placeholder="Search..."
      value={query}
      onChange={e => {
        onChange(e.target.value);
      }}
    />
  )),
}));

jest.mock('@/components/common/TopicsDropdown', () => ({
  __esModule: true,
  TopicsDropdown: jest.fn(({ topics, selectedTopics, onTopicsChange }) => (
    <div data-testid="topics-dropdown">
      {topics.map(topic => (
        <button key={topic.id} onClick={() => onTopicsChange([topic.id])}>
          {topic.name}
        </button>
      ))}
    </div>
  )),
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
  SortDropdown: jest.fn(({ sortOrder, onChange }) => (
    <button onClick={() => onChange('desc')} data-testid="sort-dropdown">
      Sort by
    </button>
  )),
}));

describe('PostFilters Component', () => {
  const defaultProps: PostFiltersProps = {
    topics: [
      { id: '1', name: 'Topic 1', color: 'red' },
      { id: '2', name: 'Topic 2', color: 'blue' },
    ],
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders all mocked components', () => {
    renderWithProviders(<PostFilters {...defaultProps} />);

    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('topics-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
  });

  test('calls onSearchChange when search input changes', () => {
    const { store } = renderWithProviders(<PostFilters {...defaultProps} />);

    const searchInput = screen.getByTestId('search-bar');
    fireEvent.change(searchInput, { target: { value: 'Test query' } });

    expect(store.getState().postsQuery.query).toBe('Test query');
  });

  test('calls onTopicsChange when a topic is clicked', () => {
    const { store } = renderWithProviders(<PostFilters {...defaultProps} />);

    const topicButton = screen.getByText('Topic 1');
    fireEvent.click(topicButton);

    expect(store.getState().postsQuery.selectedTopics).toEqual(['1']);
  });

  test('calls onDateRangeChange when date range button is clicked', () => {
    const { store } = renderWithProviders(<PostFilters {...defaultProps} />);

    const datePickerButton = screen.getByTestId('date-picker');
    fireEvent.click(datePickerButton);

    expect(store.getState().postsQuery.dateRange).toEqual({ startDate: '2024-01-01', endDate: '2024-01-31' });
  });

  test('calls onSortChange when sort dropdown button is clicked', () => {
    const { store } = renderWithProviders(<PostFilters {...defaultProps} />);

    const sortButton = screen.getByTestId('sort-dropdown');
    fireEvent.click(sortButton);

    expect(store.getState().postsQuery.sortOrder).toBe('desc');
  });

  test('does not render TopicsDropdown when topics are empty', () => {
    renderWithProviders(<PostFilters topics={[]} />);

    expect(screen.queryByTestId('topics-dropdown')).not.toBeInTheDocument();
  });
});
