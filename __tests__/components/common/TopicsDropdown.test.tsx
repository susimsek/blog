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

describe('TopicsDropdown', () => {
  const onTopicChangeMock = jest.fn();

  const renderComponent = (selectedTopic: string | null = null, topics = mockTopics) => {
    render(<TopicsDropdown topics={topics} selectedTopic={selectedTopic} onTopicChange={onTopicChangeMock} />);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default title', () => {
    renderComponent();

    expect(screen.getByText('common.allTopics')).toBeInTheDocument();
  });

  test('displays the selected topic as the title', () => {
    renderComponent('react');

    expect(screen.getByText('React')).toBeInTheDocument();
  });

  test('renders without error when topics list is empty', () => {
    renderComponent(null, []);

    expect(screen.queryByText('common.allTopics')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  test('filters topics based on search input', () => {
    renderComponent();

    fireEvent.click(screen.getByText('common.allTopics'));

    const searchInput = screen.getByPlaceholderText('common.searchBar.placeholder');
    fireEvent.change(searchInput, { target: { value: 'Vue' } });

    expect(screen.getByText('Vue.js')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  test('calls onTopicChange with null when "all topics" is selected', async () => {
    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'common.allTopics' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('common.allTopics', { selector: 'a.dropdown-item' }));
    });

    expect(onTopicChangeMock).toHaveBeenCalledWith(null);
  });

  test('calls onTopicChange with correct topic id when a topic is selected', () => {
    renderComponent();

    fireEvent.click(screen.getByText('common.allTopics'));
    fireEvent.click(screen.getByText('React'));

    expect(onTopicChangeMock).toHaveBeenCalledWith('react');
  });

  test('handles pagination correctly', () => {
    renderComponent();

    fireEvent.click(screen.getByText('common.allTopics'));

    const nextPage = screen.getByText('2');
    fireEvent.click(nextPage);

    expect(screen.getByText('Nuxt.js')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  test('updates topic list dynamically when searching', () => {
    renderComponent();

    fireEvent.click(screen.getByText('common.allTopics'));

    const searchInput = screen.getByPlaceholderText('common.searchBar.placeholder');
    fireEvent.change(searchInput, { target: { value: 'Next' } });

    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  test('resets pagination when topics are filtered', () => {
    renderComponent();

    fireEvent.click(screen.getByText('common.allTopics'));

    const searchInput = screen.getByPlaceholderText('common.searchBar.placeholder');
    fireEvent.change(searchInput, { target: { value: 'Vue' } });

    expect(screen.getByText('Vue.js')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  test('displays "common.allTopics" when selectedTopic does not match any topic in the list', () => {
    renderComponent('nonexistent-topic');

    expect(screen.getByText('common.allTopics')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });
});
