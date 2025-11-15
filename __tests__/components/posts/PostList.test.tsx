import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import PostList from '@/components/posts/PostList';
import { mockPostSummaries, mockTopics } from '../../__mocks__/mockPostData';
import { useRouter } from 'next/router';
import { renderWithProviders } from '../../utils/renderWithProviders';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => key),
  })),
}));

jest.mock('@/hooks/useDebounce', () => jest.fn((value: string) => value));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/search/SearchBar', () => ({
  __esModule: true,
  default: ({ query, onChange }: { query: string; onChange: (query: string) => void }) => (
    <input placeholder="search" value={query} onChange={e => onChange(e.target.value)} data-testid="search-bar" />
  ),
}));

jest.mock('@/components/pagination/PaginationBar', () => ({
  __esModule: true,
  default: ({
    currentPage,
    totalPages,
    onPageChange,
    onSizeChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onSizeChange: (size: number) => void;
  }) => (
    <div data-testid="pagination-bar">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous">
        Previous
      </button>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next">
        Next
      </button>
      <select data-testid="page-size-select" onChange={e => onSizeChange(Number(e.target.value))}>
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="20">20</option>
      </select>
    </div>
  ),
}));

jest.mock('@/components/posts/PostSummary', () => ({
  __esModule: true,
  default: ({ post }: { post: any }) => (
    <div data-testid="post-card">
      <h2>{post.title}</h2>
      <p>{post.summary}</p>
    </div>
  ),
}));

jest.mock('@/components/common/SortDropdown', () => ({
  __esModule: true,
  SortDropdown: ({ sortOrder, onChange }: { sortOrder: string; onChange: (order: string) => void }) => (
    <div data-testid="sort-dropdown">
      <button onClick={() => onChange('asc')}>Sort Ascending</button>
      <button onClick={() => onChange('desc')}>Sort Descending</button>
    </div>
  ),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>,
}));

jest.mock('@/components/common/TopicsDropdown', () => ({
  __esModule: true,
  TopicsDropdown: ({
    topics,
    selectedTopics,
    onTopicsChange,
  }: {
    topics: { id: string; name: string; color: string }[];
    selectedTopics: string[];
    onTopicsChange: (topicIds: string[]) => void;
  }) => (
    <div data-testid="topics-dropdown">
      <button onClick={() => onTopicsChange([])}>All Topics</button>
      {topics.map(topic => (
        <button
          key={topic.id}
          style={{ color: topic.color }}
          onClick={() => {
            const newSelectedTopics = selectedTopics.includes(topic.id)
              ? selectedTopics.filter(id => id !== topic.id)
              : [...selectedTopics, topic.id];
            onTopicsChange(newSelectedTopics);
          }}
        >
          {selectedTopics.includes(topic.id) ? `✓ ${topic.name}` : topic.name}
        </button>
      ))}
      {topics.length === 0 && <div data-testid="no-topics">No topics available</div>}
    </div>
  ),
}));

describe('PostList Component', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      query: {},
      push: jest.fn(),
      pathname: '/',
      isReady: true,
    });
  });
  it('renders all components correctly', () => {
    renderWithProviders(<PostList posts={mockPostSummaries} topics={mockTopics} />);

    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('topics-dropdown')).toBeInTheDocument();
    expect(screen.getAllByTestId('post-card')).toHaveLength(5);
    expect(screen.getByTestId('pagination-bar')).toBeInTheDocument();
  });

  it('handles topics dropdown absence gracefully', () => {
    renderWithProviders(<PostList posts={mockPostSummaries} />);

    expect(screen.queryByTestId('topics-dropdown')).not.toBeInTheDocument();
  });

  it('filters posts based on search query', () => {
    renderWithProviders(<PostList posts={mockPostSummaries} topics={[]} />);
    const searchBar = screen.getByTestId('search-bar');
    fireEvent.change(searchBar, { target: { value: 'Post 3' } });

    expect(screen.getByText('Post 3')).toBeInTheDocument();
  });

  it('filters posts by topic', () => {
    renderWithProviders(<PostList posts={mockPostSummaries} topics={mockTopics} />);
    const reactTopic = screen.getByText('React');
    fireEvent.click(reactTopic);

    expect(screen.getByText('Post 1')).toBeInTheDocument();
    expect(screen.queryByText('Post 2')).not.toBeInTheDocument();
  });

  it('sorts posts in ascending order', () => {
    renderWithProviders(<PostList posts={mockPostSummaries} topics={[]} />);
    const sortAscending = screen.getByText('Sort Ascending');
    fireEvent.click(sortAscending);

    const posts = screen.getAllByTestId('post-card');
    expect(posts[0]).toHaveTextContent('Post 6');
    expect(posts[4]).toHaveTextContent('Post 2');
  });

  it('returns all posts when search query is empty', () => {
    renderWithProviders(<PostList posts={mockPostSummaries} topics={[]} />);
    const searchBar = screen.getByTestId('search-bar');
    fireEvent.change(searchBar, { target: { value: '' } });

    expect(screen.getAllByTestId('post-card')).toHaveLength(5);
  });

  it('handles empty posts gracefully', () => {
    renderWithProviders(<PostList posts={[]} topics={[]} />);
    expect(screen.getByText('post.noPostsFound')).toBeInTheDocument();
  });

  it('resets pagination when sort order is changed', () => {
    renderWithProviders(<PostList posts={mockPostSummaries} topics={[]} />);
    const sortAscending = screen.getByText('Sort Ascending');
    fireEvent.click(sortAscending);

    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });
});
