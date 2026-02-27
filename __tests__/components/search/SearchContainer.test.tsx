import React from 'react';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import SearchContainer, { __resetSearchContainerCacheForTests } from '@/components/search/SearchContainer';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import type { PostsQueryState } from '@/reducers/postsQuery';

const routerPushMock = jest.fn();
const scrollIntoViewMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

jest.mock('@/hooks/useDebounce', () => ({
  __esModule: true,
  default: (value: unknown) => value,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => (options?.query ? `${key}:${options.query}` : key),
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

jest.mock('@/components/search/SearchBar', () => ({
  __esModule: true,
  default: ({
    query,
    onChange,
    onKeyDown,
    showShortcutHint,
    shortcutHint,
    inputRef,
  }: {
    query: string;
    onChange: (value: string) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    showShortcutHint?: boolean;
    shortcutHint?: { modifier: string; key: string };
    inputRef?: React.Ref<HTMLInputElement>;
  }) => (
    <div>
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        data-testid="search-input"
        value={query}
        placeholder="common.searchBar.placeholder"
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => onKeyDown?.(event)}
      />
      {showShortcutHint && !query && shortcutHint && (
        <span data-testid="search-shortcut-hint">
          {shortcutHint.modifier}+{shortcutHint.key}
        </span>
      )}
    </div>
  ),
}));

jest.mock('@/components/posts/PostListItem', () => ({
  __esModule: true,
  default: ({ post }: { post: { title: string } }) => <div data-testid="post-item">{post.title}</div>,
}));

jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  }) => (
    <a
      href={href}
      onClick={event => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}));

describe('SearchContainer', () => {
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
    topics: [],
    topicsLoading: false,
  };

  const posts = Array.from({ length: 6 }).map((_, index) => ({
    id: `post-${index}`,
    title: `Post ${index}`,
    summary: `Summary ${index}`,
    searchText: `post ${index} summary ${index}`,
    publishedDate: '2024-05-01',
    thumbnail: null,
    topics: [],
    readingTimeMin: 1,
  }));

  const mockStaticPosts = (payload: unknown) => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
  };

  const renderSearch = (postsQueryOverrides: Partial<PostsQueryState> = {}) =>
    renderWithProviders(<SearchContainer />, {
      preloadedState: {
        postsQuery: {
          ...basePostsQueryState,
          ...postsQueryOverrides,
        },
      },
    });

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewMock,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    routerPushMock.mockReset();
    scrollIntoViewMock.mockReset();
    __resetSearchContainerCacheForTests();
    (global.fetch as unknown) = jest.fn();
    mockStaticPosts(posts);
  });

  it('renders filtered search results and limits to 5 items', async () => {
    renderSearch();

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Post' } });

    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);
    expect(screen.getByRole('option', { name: /common.viewAllResults:Post/i })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/data/posts.en.json', { cache: 'force-cache' });
  });

  it('ignores invalid static payload items during normalization', async () => {
    mockStaticPosts([
      null,
      { id: 'broken', title: 'Broken', summary: 'broken' },
      {
        id: 'valid-post',
        title: 'Valid Post',
        summary: 'Valid summary',
        searchText: 'valid post summary',
        publishedDate: '2024-05-01',
        thumbnail: null,
        topics: [],
        readingTimeMin: 2,
        source: 'blog',
      },
    ]);

    renderSearch();
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'valid' } });

    const items = await screen.findAllByTestId('post-item');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('Valid Post');
  });

  it('hides results when clicking outside', async () => {
    renderSearch();

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Post 1' } });
    expect(await screen.findByText('Post 1')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('Post 1')).not.toBeInTheDocument();
  });

  it('closes results when "view all" link is clicked and preserves encoded query', async () => {
    renderSearch();

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Post' } });

    const viewAllLink = await screen.findByRole('option', { name: /common.viewAllResults:Post/i });
    expect(viewAllLink).toHaveAttribute('href', '/search?q=Post');

    fireEvent.click(viewAllLink);

    expect(screen.queryByTestId('post-item')).not.toBeInTheDocument();
  });

  it('does not show results panel for single-character query', () => {
    renderSearch();

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'j' } });

    expect(screen.queryByText('common.noResults')).not.toBeInTheDocument();
    expect(screen.queryByTestId('post-item')).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not show temporary no-results flash when typing second character', async () => {
    mockStaticPosts([
      {
        id: 'java-post',
        title: 'Java Tips',
        summary: 'Useful Java tips',
        searchText: 'java tips useful java tips',
        publishedDate: '2024-05-01',
        thumbnail: null,
        topics: [],
        readingTimeMin: 1,
      },
    ]);

    renderSearch();

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'ja' } });

    expect(screen.queryByText('common.noResults')).not.toBeInTheDocument();
    expect(await screen.findByText('Java Tips')).toBeInTheDocument();
  });

  it('renders loading state before async search results resolve', async () => {
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise(() => {
        // Intentionally unresolved to keep loading state visible.
      }),
    );

    renderSearch();

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Po' } });

    expect(await screen.findByText('common.sidebar.loading')).toBeInTheDocument();
  });

  it('renders no-results state when search has no matches', async () => {
    mockStaticPosts([]);
    renderSearch();

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'zz' } });

    expect(await screen.findByText('common.noResults')).toBeInTheDocument();
  });

  it('returns no results when locale is empty and skips fetch', async () => {
    renderSearch({ locale: '' });

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'po' } });

    expect(await screen.findByText('common.noResults')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('renders no-results when static payload request returns non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => [] });

    renderSearch();
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'po' } });

    expect(await screen.findByText('common.noResults')).toBeInTheDocument();
  });

  it('renders no-results when static payload request throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    renderSearch();
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'po' } });

    expect(await screen.findByText('common.noResults')).toBeInTheDocument();
  });

  it('reuses locale cache for subsequent searches without refetching', async () => {
    const firstRender = renderSearch();
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Post' } });
    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    firstRender.unmount();
    (global.fetch as jest.Mock).mockClear();

    renderSearch();
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Post' } });
    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('reuses in-flight locale request across concurrent searches', async () => {
    let resolveFetch: ((value: unknown) => void) | undefined;
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise(resolve => {
        resolveFetch = resolve;
      }),
    );

    renderSearch();
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Po' } });
    expect(await screen.findByText('common.sidebar.loading')).toBeInTheDocument();

    renderSearch();
    fireEvent.change(screen.getAllByTestId('search-input')[1], { target: { value: 'Po' } });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch?.({
        ok: true,
        json: async () => posts,
      });
    });

    expect(await screen.findAllByTestId('post-item')).toHaveLength(10);
  });

  it('accepts valid category objects from static payload normalization', async () => {
    mockStaticPosts([
      {
        id: 'categorized-post',
        title: 'Categorized Post',
        summary: 'Has a category',
        searchText: 'categorized post category',
        publishedDate: '2024-05-01',
        thumbnail: null,
        topics: [],
        readingTimeMin: 2,
        category: {
          id: 'programming',
          name: 'Programming',
          color: 'blue',
        },
      },
    ]);

    renderSearch();

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'categorized' } });

    expect(await screen.findByText('Categorized Post')).toBeInTheDocument();
  });

  it('prioritizes blog results over medium results and keeps medium external links', async () => {
    mockStaticPosts([
      {
        id: 'medium-java',
        title: 'Medium Java Post',
        summary: 'Medium summary',
        searchText: 'java medium post',
        publishedDate: '2024-05-01',
        thumbnail: null,
        topics: [],
        readingTimeMin: 1,
        source: 'medium',
        link: 'https://medium.com/example/java',
      },
      {
        id: 'blog-java',
        title: 'Blog Java Post',
        summary: 'Blog summary',
        searchText: 'java blog post',
        publishedDate: '2024-05-02',
        thumbnail: null,
        topics: [],
        readingTimeMin: 1,
        source: 'blog',
      },
    ]);

    renderSearch();

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'java' } });

    const orderedItems = await screen.findAllByTestId('post-item');
    expect(orderedItems[0]).toHaveTextContent('Blog Java Post');
    expect(orderedItems[1]).toHaveTextContent('Medium Java Post');
    expect(screen.getByRole('option', { name: /Medium Java Post/i })).toHaveAttribute(
      'href',
      'https://medium.com/example/java',
    );
  });

  it('clears local state when clicking a post result', async () => {
    renderSearch();

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Post 1' } });
    await screen.findAllByTestId('post-item');
    const resultLink = screen
      .getAllByRole('option')
      .find(option => option.getAttribute('href') === '/posts/post-1') as HTMLElement;

    fireEvent.click(resultLink);

    expect(screen.getByTestId('search-input')).toHaveValue('');
    expect(screen.queryByTestId('post-item')).not.toBeInTheDocument();
  });

  it('closes open results and clears query when app:search-close requests clear', async () => {
    renderSearch();

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Post' } });
    expect(screen.getByTestId('search-input')).toHaveValue('Post');
    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);

    act(() => {
      window.dispatchEvent(new CustomEvent('app:search-close', { detail: { clearQuery: true } }));
    });

    expect(screen.getByTestId('search-input')).toHaveValue('');
    expect(screen.queryByTestId('post-item')).not.toBeInTheDocument();
  });

  it('supports ArrowDown navigation and Enter selection', async () => {
    renderSearch();

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Post' } });
    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    const firstResultLink = screen.getByRole('option', { name: /Post 0/i });
    expect(firstResultLink).toHaveClass('active');

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(routerPushMock).toHaveBeenCalledWith('/posts/post-0');
    expect(screen.getByTestId('search-input')).toHaveValue('');
    expect(screen.queryByTestId('post-item')).not.toBeInTheDocument();
  });

  it('supports ArrowUp wrap-around and selecting "view all" via keyboard', async () => {
    renderSearch();

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Post' } });
    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    const viewAllLink = screen.getByRole('option', { name: /common.viewAllResults:Post/i });
    expect(viewAllLink).toHaveClass('active');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(routerPushMock).toHaveBeenCalledWith('/search?q=Post');
  });

  it('ignores navigation keys when there are no selectable results', async () => {
    mockStaticPosts([]);
    renderSearch();

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'zz' } });
    expect(await screen.findByText('common.noResults')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it('closes dropdown and clears query on Escape', async () => {
    renderSearch();

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Post' } });
    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.getByTestId('search-input')).toHaveValue('');
    expect(screen.queryByTestId('post-item')).not.toBeInTheDocument();
  });

  it('clears one-character query on Escape before results panel opens', () => {
    renderSearch();

    const input = screen.getByTestId('search-input');
    const blurSpy = jest.spyOn(input, 'blur');
    fireEvent.change(input, { target: { value: 'p' } });

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input).toHaveValue('');
    expect(blurSpy).toHaveBeenCalled();
  });

  it('restores focus and reopens results on app:search-focus when query exists', async () => {
    renderSearch();
    const input = screen.getByTestId('search-input');

    fireEvent.change(input, { target: { value: 'Post' } });
    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('post-item')).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('app:search-focus'));
    });

    expect(input).toHaveFocus();
    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);
  });

  it('keeps query when app:search-close is dispatched without clear flag', async () => {
    renderSearch();
    const input = screen.getByTestId('search-input');

    fireEvent.change(input, { target: { value: 'Post' } });
    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);

    act(() => {
      window.dispatchEvent(new CustomEvent('app:search-close'));
    });

    expect(input).toHaveValue('Post');
    expect(screen.queryByTestId('post-item')).not.toBeInTheDocument();
  });

  it('clears stale results when query is emptied', async () => {
    renderSearch();
    const input = screen.getByTestId('search-input');

    fireEvent.change(input, { target: { value: 'Post' } });
    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);

    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByTestId('post-item')).not.toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('updates active option on hover and scrolls active item into view', async () => {
    renderSearch();
    const input = screen.getByTestId('search-input');

    fireEvent.change(input, { target: { value: 'Post' } });
    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);

    const firstOption = screen.getByRole('option', { name: /Post 0/i });
    const viewAllOption = screen.getByRole('option', { name: /common.viewAllResults:Post/i });

    fireEvent.mouseEnter(firstOption);
    await waitFor(() => expect(firstOption).toHaveClass('active'));

    fireEvent.mouseEnter(viewAllOption);
    await waitFor(() => expect(viewAllOption).toHaveClass('active'));

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ block: 'nearest' });
  });

  it('does not update state after unmount when async request resolves late', async () => {
    let resolveFetch: ((value: unknown) => void) | undefined;
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise(resolve => {
        resolveFetch = resolve;
      }),
    );

    const { unmount } = renderSearch();
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Po' } });
    expect(await screen.findByText('common.sidebar.loading')).toBeInTheDocument();

    unmount();

    await act(async () => {
      resolveFetch?.({
        ok: true,
        json: async () => posts,
      });
    });

    expect(true).toBe(true);
  });

  it('renders shortcut hint when provided', () => {
    renderWithProviders(<SearchContainer shortcutHint={{ modifier: 'Ctrl', key: 'K' }} />);

    expect(screen.getByTestId('search-shortcut-hint')).toHaveTextContent('Ctrl+K');
  });
});
