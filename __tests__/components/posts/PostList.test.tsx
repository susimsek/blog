import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import PostList from '@/components/posts/PostList';
import { mockPostSummaries, mockTopics } from '@tests/__mocks__/mockPostData';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import type { PostsQueryState } from '@/reducers/postsQuery';

const useRouterMock = jest.fn();
const usePathnameMock = jest.fn();
const useSearchParamsMock = jest.fn();
const useMediaQueryMock = jest.fn();
const fetchPostLikesMock = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => key),
  })),
}));

jest.mock('@/hooks/useDebounce', () => jest.fn((value: string) => value));
jest.mock('@/hooks/useMediaQuery', () => jest.fn((...args: unknown[]) => useMediaQueryMock(...args)));

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
  default: ({
    post,
    likeCount,
    likeCountLoading,
    highlightQuery,
    showSource,
  }: {
    post: { title: string; summary: string };
    likeCount?: number | null;
    likeCountLoading?: boolean;
    highlightQuery?: string;
    showSource?: boolean;
  }) => (
    <div
      data-testid="post-card"
      data-like-count={likeCount === null || likeCount === undefined ? 'null' : String(likeCount)}
      data-like-loading={String(Boolean(likeCountLoading))}
      data-highlight-query={highlightQuery ?? ''}
      data-show-source={String(Boolean(showSource))}
    >
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
    categoryFilter: 'all',
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
    useMediaQueryMock.mockReturnValue(true);
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
    expect(pushMock).toHaveBeenCalledWith('/search?source=medium&page=1&size=5', { scroll: false });
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

  it('removes source param from url when source filter is reset to all', async () => {
    usePathnameMock.mockReturnValue('/search');
    window.history.replaceState({}, '', '/search?source=blog&page=2&size=5');

    renderWithProviders(<PostList posts={mockPostSummaries} />, {
      preloadedState: buildPreloadedState({ sourceFilter: 'blog' }),
    });

    await waitFor(() => expect(screen.getByText('Source All')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Source All'));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/search?page=1&size=5', { scroll: false });
    });
  });

  it('loads likes for trackable post ids and normalizes invalid values', async () => {
    const likePosts = [
      { ...mockPostSummaries[0], id: 'blog-post-1', title: 'Trackable One' },
      { ...mockPostSummaries[1], id: 'Bad_ID', title: 'Untrackable Id' },
      { ...mockPostSummaries[2], id: 'blog-post-2', title: 'Trackable Two' },
    ];
    fetchPostLikesMock.mockResolvedValue({
      'blog-post-1': 7,
      'blog-post-2': 'not-a-number',
    });

    renderWithProviders(<PostList posts={likePosts} showLikes />, {
      preloadedState: buildPreloadedState({ posts: likePosts, topics: [] }),
    });

    await waitFor(() => {
      expect(fetchPostLikesMock).toHaveBeenCalledWith('en', ['blog-post-1', 'blog-post-2']);
    });

    const trackableOneCard = screen.getByText('Trackable One').closest('[data-testid="post-card"]');
    const untrackableCard = screen.getByText('Untrackable Id').closest('[data-testid="post-card"]');
    const trackableTwoCard = screen.getByText('Trackable Two').closest('[data-testid="post-card"]');

    await waitFor(() => {
      expect(trackableOneCard).toHaveAttribute('data-like-count', '7');
      expect(trackableOneCard).toHaveAttribute('data-like-loading', 'false');
      expect(trackableTwoCard).toHaveAttribute('data-like-count', '0');
      expect(untrackableCard).toHaveAttribute('data-like-loading', 'false');
    });
  });

  it('marks pending likes as null when likes api returns null', async () => {
    const likePosts = [{ ...mockPostSummaries[0], id: 'blog-post-1', title: 'Trackable One' }];
    fetchPostLikesMock.mockResolvedValue(null);

    renderWithProviders(<PostList posts={likePosts} showLikes />, {
      preloadedState: buildPreloadedState({ posts: likePosts, topics: [] }),
    });

    const card = screen.getByText('Trackable One').closest('[data-testid="post-card"]');
    expect(card).toHaveAttribute('data-like-loading', 'true');

    await waitFor(() => {
      expect(card).toHaveAttribute('data-like-loading', 'false');
      expect(card).toHaveAttribute('data-like-count', 'null');
    });
  });

  it('clears stale non-search filters on non-search routes', async () => {
    usePathnameMock.mockReturnValue('/en/posts');

    const { store } = renderWithProviders(<PostList posts={mockPostSummaries} />, {
      preloadedState: buildPreloadedState({
        selectedTopics: ['react'],
        categoryFilter: 'frontend',
        dateRange: { startDate: '2024-01-01', endDate: '2024-12-31' },
        readingTimeRange: '8-12',
      }),
    });

    await waitFor(() => {
      const state = store.getState().postsQuery;
      expect(state.selectedTopics).toEqual([]);
      expect(state.categoryFilter).toBe('all');
      expect(state.dateRange).toEqual({});
      expect(state.readingTimeRange).toBe('any');
    });
  });

  it('uses auto scroll behavior when reduced motion is preferred', async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;

    renderWithProviders(<PostList posts={mockPostSummaries} />, { preloadedState: buildPreloadedState() });

    await waitFor(() => expect(screen.getByLabelText('Next')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Next'));

    expect(scrollIntoViewMock).toHaveBeenLastCalledWith({ behavior: 'auto', block: 'start' });

    window.matchMedia = originalMatchMedia;
  });

  it('falls back from grid density on small screens', async () => {
    useMediaQueryMock.mockReturnValue(false);

    renderWithProviders(<PostList posts={mockPostSummaries} />, {
      preloadedState: buildPreloadedState({ topics: [] }),
    });

    await waitFor(() => expect(screen.getAllByTestId('post-card')).toHaveLength(5));

    const results = document.querySelector('.post-list-results');
    expect(results).toHaveClass('post-list-results--default');

    fireEvent.click(screen.getByLabelText('common.viewDensity.grid'));
    expect(document.querySelector('.post-list-results')).toHaveClass('post-list-results--default');

    fireEvent.click(screen.getByLabelText('common.viewDensity.editorial'));
    expect(document.querySelector('.post-list-results')).toHaveClass('post-list-results--editorial');
  });
});
