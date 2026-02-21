import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import PostList from '@/components/posts/PostList';
import { mockPostSummaries, mockTopics } from '@tests/__mocks__/mockPostData';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import type { PostsQueryState } from '@/reducers/postsQuery';

const useRouterMock = jest.fn();
const usePathnameMock = jest.fn();
const useSearchParamsMock = jest.fn();
const fetchPostLikesMock = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => key),
  })),
}));

jest.mock('@/hooks/useDebounce', () => jest.fn((value: string) => value));

jest.mock('@/lib/contentApi', () => ({
  fetchPostLikes: (...args: unknown[]) => fetchPostLikesMock(...args),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => useRouterMock(),
  usePathname: () => usePathnameMock(),
  useParams: () => ({ locale: 'en' }),
  useSearchParams: () => useSearchParamsMock(),
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
  default: ({ post }: { post: { title: string; summary: string } }) => (
    <div data-testid="post-card">
      <h2>{post.title}</h2>
      <p>{post.summary}</p>
    </div>
  ),
}));

jest.mock('@/components/common/SortDropdown', () => ({
  __esModule: true,
  SortDropdown: ({ onChange }: { onChange: (order: string) => void }) => (
    <div data-testid="sort-dropdown">
      <button onClick={() => onChange('asc')}>Sort Ascending</button>
      <button onClick={() => onChange('desc')}>Sort Descending</button>
    </div>
  ),
}));

jest.mock('@/components/common/SourceDropdown', () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (source: string) => void }) => (
    <div data-testid="source-dropdown">
      <button onClick={() => onChange('all')}>Source All</button>
      <button onClick={() => onChange('blog')}>Source Blog</button>
      <button onClick={() => onChange('medium')}>Source Medium</button>
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
  const scrollIntoViewMock = jest.fn();
  let pushMock: jest.Mock;
  const basePostsQueryState: PostsQueryState = {
    query: '',
    sortOrder: 'desc',
    page: 1,
    pageSize: 5,
    selectedTopics: [],
    sourceFilter: 'all',
    dateRange: {},
    readingTimeRange: 'any',
    locale: 'en',
    posts: mockPostSummaries,
    topics: mockTopics,
    topicsLoading: false,
  };

  const buildPreloadedState = (overrides: Partial<PostsQueryState> = {}) => ({
    postsQuery: {
      ...basePostsQueryState,
      ...overrides,
    },
  });

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewMock,
    });
  });

  beforeEach(() => {
    scrollIntoViewMock.mockClear();
    pushMock = jest.fn();
    useRouterMock.mockReturnValue({ push: pushMock });
    usePathnameMock.mockReturnValue('/');
    window.history.replaceState({}, '', '/');
    useSearchParamsMock.mockImplementation(() => new URLSearchParams(window.location.search));
    fetchPostLikesMock.mockResolvedValue({});
  });
  it('renders all components correctly', async () => {
    renderWithProviders(<PostList posts={mockPostSummaries} />, { preloadedState: buildPreloadedState() });

    await waitFor(() => expect(screen.getAllByTestId('post-card')).toHaveLength(5));
    expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('topics-dropdown')).toBeInTheDocument();
    expect(screen.queryByTestId('source-dropdown')).not.toBeInTheDocument();
    expect(screen.getByTestId('pagination-bar')).toBeInTheDocument();
  });

  it('handles topics dropdown absence gracefully', () => {
    renderWithProviders(<PostList posts={mockPostSummaries} />, {
      preloadedState: buildPreloadedState({ topics: [] }),
    });

    expect(screen.queryByTestId('topics-dropdown')).not.toBeInTheDocument();
  });

  it('filters posts based on route query', async () => {
    usePathnameMock.mockReturnValue('/search');
    window.history.replaceState({}, '', '/?q=Post%203');
    renderWithProviders(<PostList posts={mockPostSummaries} />, {
      preloadedState: buildPreloadedState({ topics: [] }),
    });

    await waitFor(() => expect(screen.getByText('Post 3')).toBeInTheDocument());
  });

  it('ignores route query on non-search routes', async () => {
    usePathnameMock.mockReturnValue('/en');
    window.history.replaceState({}, '', '/en?q=Post%203');
    renderWithProviders(<PostList posts={mockPostSummaries} />, {
      preloadedState: buildPreloadedState({ topics: [] }),
    });

    await waitFor(() => expect(screen.getAllByTestId('post-card')).toHaveLength(5));
  });

  it('filters posts by topic', async () => {
    renderWithProviders(<PostList posts={mockPostSummaries} />, { preloadedState: buildPreloadedState() });
    await waitFor(() => expect(screen.getByText('Post 1')).toBeInTheDocument());
    const reactTopic = screen.getByText('React');
    fireEvent.click(reactTopic);

    await waitFor(() => {
      expect(screen.getByText('Post 1')).toBeInTheDocument();
      expect(screen.queryByText('Post 2')).not.toBeInTheDocument();
    });
  });

  it('filters posts by source filter', async () => {
    usePathnameMock.mockReturnValue('/search');
    const mixedPosts = [
      { ...mockPostSummaries[0], id: 'blog-1', title: 'Blog Post', source: 'blog' as const },
      { ...mockPostSummaries[1], id: 'medium-1', title: 'Medium Post', source: 'medium' as const },
    ];

    renderWithProviders(<PostList posts={mixedPosts} />, {
      preloadedState: buildPreloadedState({ topics: [], posts: mixedPosts, sourceFilter: 'all' }),
    });

    await waitFor(() => expect(screen.getByText('Blog Post')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Source Medium'));

    await waitFor(() => {
      expect(screen.queryByText('Blog Post')).not.toBeInTheDocument();
      expect(screen.getByText('Medium Post')).toBeInTheDocument();
    });
  });

  it('ignores source filter on non-search routes', async () => {
    const mixedPosts = [
      { ...mockPostSummaries[0], id: 'blog-1', title: 'Blog Post', source: 'blog' as const },
      { ...mockPostSummaries[1], id: 'medium-1', title: 'Medium Post', source: 'medium' as const },
    ];

    renderWithProviders(<PostList posts={mixedPosts} />, {
      preloadedState: buildPreloadedState({ topics: [], posts: mixedPosts, sourceFilter: 'medium' }),
    });

    await waitFor(() => expect(screen.getByText('Blog Post')).toBeInTheDocument());
    expect(screen.queryByTestId('source-dropdown')).not.toBeInTheDocument();
    expect(screen.getByText('Blog Post')).toBeInTheDocument();
    expect(screen.queryByText('Medium Post')).not.toBeInTheDocument();
  });

  it('sorts posts in ascending order', async () => {
    renderWithProviders(<PostList posts={mockPostSummaries} />, {
      preloadedState: buildPreloadedState({ topics: [] }),
    });
    await waitFor(() => expect(screen.getAllByTestId('post-card')).toHaveLength(5));
    const sortAscending = screen.getByText('Sort Ascending');
    fireEvent.click(sortAscending);

    await waitFor(() => {
      const posts = screen.getAllByTestId('post-card');
      expect(posts[0]).toHaveTextContent('Post 6');
      expect(posts[4]).toHaveTextContent('Post 2');
    });
  });

  it('returns all posts when route query is empty', async () => {
    renderWithProviders(<PostList posts={mockPostSummaries} />, {
      preloadedState: buildPreloadedState({ topics: [] }),
    });

    await waitFor(() => expect(screen.getAllByTestId('post-card')).toHaveLength(5));
  });

  it('handles empty posts gracefully', async () => {
    renderWithProviders(<PostList posts={[]} />, { preloadedState: buildPreloadedState({ posts: [], topics: [] }) });
    await waitFor(() => expect(screen.getByText('post.noPostsFound')).toBeInTheDocument());
  });

  it('resets pagination when sort order is changed', async () => {
    renderWithProviders(<PostList posts={mockPostSummaries} />, {
      preloadedState: buildPreloadedState({ topics: [] }),
    });
    await waitFor(() => expect(screen.getByText('Post 1')).toBeInTheDocument());
    const sortAscending = screen.getByText('Sort Ascending');
    fireEvent.click(sortAscending);

    await waitFor(() => {
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });
  });

  it('keeps active page from route query when q is empty', async () => {
    window.history.replaceState({}, '', '/?page=2&size=5');

    renderWithProviders(<PostList posts={mockPostSummaries} />, { preloadedState: buildPreloadedState() });

    await waitFor(() => {
      expect(screen.getByLabelText('Previous')).not.toBeDisabled();
    });
  });

  it('scrolls list start into view when page changes', async () => {
    renderWithProviders(<PostList posts={mockPostSummaries} />, { preloadedState: buildPreloadedState() });

    await waitFor(() => expect(screen.getByLabelText('Next')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Next'));

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });

  it('applies sort order even when search query exists', async () => {
    window.history.replaceState({}, '', '/?q=post&page=1&size=5');

    renderWithProviders(<PostList posts={mockPostSummaries} />, {
      preloadedState: buildPreloadedState({ topics: [] }),
    });

    await waitFor(() => expect(screen.getAllByTestId('post-card')).toHaveLength(5));
    fireEvent.click(screen.getByText('Sort Ascending'));

    await waitFor(() => {
      const posts = screen.getAllByTestId('post-card');
      expect(posts[0]).toHaveTextContent('Post 6');
      expect(posts[4]).toHaveTextContent('Post 2');
    });
  });

  it('normalizes out-of-range route page and updates url', async () => {
    window.history.replaceState({}, '', '/?q=post&page=3&size=5');

    renderWithProviders(<PostList posts={mockPostSummaries} />, {
      preloadedState: buildPreloadedState({ topics: [] }),
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/?q=post&page=2&size=5', { scroll: false });
    });

    expect(screen.getAllByTestId('post-card')).toHaveLength(1);
    expect(screen.getByText('Post 6')).toBeInTheDocument();
  });
});
