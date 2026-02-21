import React from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import SearchContainer, { __resetSearchContainerCacheForTests } from '@/components/search/SearchContainer';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import type { PostsQueryState } from '@/reducers/postsQuery';

const routerPushMock = jest.fn();

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

  const renderSearch = () =>
    renderWithProviders(<SearchContainer />, {
      preloadedState: {
        postsQuery: basePostsQueryState,
      },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    routerPushMock.mockReset();
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

  it('closes dropdown and clears query on Escape', async () => {
    renderSearch();

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Post' } });
    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.getByTestId('search-input')).toHaveValue('');
    expect(screen.queryByTestId('post-item')).not.toBeInTheDocument();
  });

  it('renders shortcut hint when provided', () => {
    renderWithProviders(<SearchContainer shortcutHint={{ modifier: 'Ctrl', key: 'K' }} />);

    expect(screen.getByTestId('search-shortcut-hint')).toHaveTextContent('Ctrl+K');
  });
});
