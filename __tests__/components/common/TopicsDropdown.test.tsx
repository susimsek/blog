import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TopicsDropdown } from '@/components/common/TopicsDropdown';
import { Topic } from '@/types/posts';

jest.mock('next-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>,
}));

const mockTopics: Topic[] = [
  { id: 'react', name: 'React', color: 'blue' },
  { id: 'vue', name: 'Vue.js', color: 'green' },
  { id: 'angular', name: 'Angular', color: 'red' },
  { id: 'svelte', name: 'Svelte', color: 'orange' },
  { id: 'nextjs', name: 'Next.js', color: 'purple' },
  { id: 'nuxt', name: 'Nuxt.js', color: 'pink' },
];

jest.mock('@/components/search/SearchBar', () => ({
  __esModule: true,
  default: ({ query, onChange }: { query: string; onChange: (query: string) => void }) => (
    <div>
      <input
        data-testid="search-bar-input"
        type="text"
        value={query}
        onChange={e => onChange(e.target.value)}
        placeholder="common.searchBar.placeholder"
      />
    </div>
  ),
}));

jest.mock('@/components/pagination/Paginator', () => ({
  __esModule: true,
  default: ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => (
    <div data-testid="paginator">
      <button data-testid="paginator-prev" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
        Prev
      </button>
      <span data-testid="paginator-current">{currentPage}</span>
      <button
        data-testid="paginator-next"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  ),
}));

describe('TopicsDropdown', () => {
  const onTopicsChangeMock = jest.fn();

  const renderComponent = (selectedTopics: string[] = [], topics = mockTopics) => {
    render(<TopicsDropdown topics={topics} selectedTopics={selectedTopics} onTopicsChange={onTopicsChangeMock} />);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default title', () => {
    renderComponent();
    expect(screen.getByText('topic:topic.allTopics')).toBeInTheDocument();
  });

  test('displays selected topics as the title', () => {
    renderComponent(['react', 'vue']);
    expect(screen.getByText('React, Vue.js')).toBeInTheDocument();
  });

  test('renders without error when topics list is empty', () => {
    renderComponent([], []);
    expect(screen.getByText('topic:topic.allTopics')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  test('filters topics based on search input', () => {
    renderComponent();
    fireEvent.click(screen.getByText('topic:topic.allTopics'));

    const searchInput = screen.getByPlaceholderText('common.searchBar.placeholder');
    fireEvent.change(searchInput, { target: { value: 'Vue' } });

    expect(screen.getByText('Vue.js')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  test('calls onTopicsChange with an empty array when "all topics" is selected', () => {
    renderComponent(['react', 'vue']);

    fireEvent.click(screen.getByRole('button', { name: 'React, Vue.js' }));

    fireEvent.click(screen.getByText('topic:topic.allTopics'));

    expect(onTopicsChangeMock).toHaveBeenCalledWith([]);
  });

  test('handles pagination correctly', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('topic:topic.allTopics'));

    expect(screen.getByText('1')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('paginator-next'));
    });

    expect(screen.getByText('Nuxt.js')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('paginator-prev'));
    });

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.queryByText('Nuxt.js')).not.toBeInTheDocument();
  });

  test('updates topic list dynamically when searching', () => {
    renderComponent();
    fireEvent.click(screen.getByText('topic:topic.allTopics'));

    const searchInput = screen.getByPlaceholderText('common.searchBar.placeholder');
    fireEvent.change(searchInput, { target: { value: 'Next' } });

    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  test('resets pagination when topics are filtered', () => {
    renderComponent();
    fireEvent.click(screen.getByText('topic:topic.allTopics'));

    const searchInput = screen.getByPlaceholderText('common.searchBar.placeholder');
    fireEvent.change(searchInput, { target: { value: 'Vue' } });

    expect(screen.getByText('Vue.js')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  test('displays a message when no topics are found', () => {
    renderComponent([], []);
    fireEvent.click(screen.getByText('topic:topic.allTopics'));

    expect(screen.getByText('topic:topic.noTopicFound')).toBeInTheDocument();
  });
});
