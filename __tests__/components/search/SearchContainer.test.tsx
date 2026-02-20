import React from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import SearchContainer from '@/components/search/SearchContainer';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import { fetchPosts } from '@/lib/contentApi';

const routerPushMock = jest.fn();
const fetchPostsMock = fetchPosts as jest.MockedFunction<typeof fetchPosts>;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

jest.mock('@/lib/contentApi', () => ({
  fetchPosts: jest.fn(),
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
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('SearchContainer', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    routerPushMock.mockReset();
    fetchPostsMock.mockReset();
  });

  it('renders filtered search results and limits to 5 items', async () => {
    fetchPostsMock.mockResolvedValue({
      status: 'success',
      posts,
    } as never);

    renderWithProviders(<SearchContainer />);

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Post' } });

    expect(await screen.findAllByTestId('post-item')).toHaveLength(5);
    expect(screen.getByRole('option', { name: /common.viewAllResults:Post/i })).toBeInTheDocument();
  });

  it('hides results when clicking outside', async () => {
    fetchPostsMock.mockResolvedValue({
      status: 'success',
      posts,
    } as never);

    renderWithProviders(<SearchContainer />);

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Post 1' } });
    expect(await screen.findByText('Post 1')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('Post 1')).not.toBeInTheDocument();
  });

  it('closes results when "view all" link is clicked and preserves encoded query', async () => {
    fetchPostsMock.mockResolvedValue({
      status: 'success',
      posts,
    } as never);

    renderWithProviders(<SearchContainer />);

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Post' } });

    const viewAllLink = await screen.findByRole('option', { name: /common.viewAllResults:Post/i });
    expect(viewAllLink).toHaveAttribute('href', '/search?q=Post');

    fireEvent.click(viewAllLink);

    expect(screen.queryByTestId('post-item')).not.toBeInTheDocument();
  });

  it('does not show results panel for single-character query', () => {
    renderWithProviders(<SearchContainer />);

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'j' } });

    expect(screen.queryByText('common.noResults')).not.toBeInTheDocument();
    expect(screen.queryByTestId('post-item')).not.toBeInTheDocument();
    expect(fetchPostsMock).not.toHaveBeenCalled();
  });

  it('does not show temporary no-results flash when typing second character', async () => {
    fetchPostsMock.mockResolvedValue({
      status: 'success',
      posts: [
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
      ],
    } as never);

    renderWithProviders(<SearchContainer />);

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'ja' } });

    expect(screen.queryByText('common.noResults')).not.toBeInTheDocument();
    expect(await screen.findByText('Java Tips')).toBeInTheDocument();
  });

  it('prioritizes blog results over medium results and keeps medium external links', async () => {
    fetchPostsMock.mockResolvedValue({
      status: 'success',
      posts: [
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
      ],
    } as never);

    renderWithProviders(<SearchContainer />);

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
    fetchPostsMock.mockResolvedValue({
      status: 'success',
      posts,
    } as never);

    renderWithProviders(<SearchContainer />);

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
    fetchPostsMock.mockResolvedValue({
      status: 'success',
      posts,
    } as never);

    renderWithProviders(<SearchContainer />);

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
    fetchPostsMock.mockResolvedValue({
      status: 'success',
      posts,
    } as never);

    renderWithProviders(<SearchContainer />);

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
