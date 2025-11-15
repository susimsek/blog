import React from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import SearchContainer from '@/components/search/SearchContainer';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { setPosts } from '@/reducers/postsQuery';

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => (options?.query ? `${key}:${options.query}` : key),
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

jest.mock('@/hooks/useDebounce', () => jest.fn((value: string) => value));

jest.mock('@/components/search/SearchBar', () => ({
  __esModule: true,
  default: ({ query, onChange }: { query: string; onChange: (value: string) => void }) => (
    <input
      data-testid="search-input"
      value={query}
      placeholder="common.searchBar.placeholder"
      onChange={event => onChange(event.target.value)}
    />
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
    date: '2024-05-01',
    thumbnail: null,
    topics: [],
    readingTime: '1 min',
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filtered search results and limits to 5 items', () => {
    const { store } = renderWithProviders(<SearchContainer />);
    act(() => {
      store.dispatch(setPosts(posts));
    });

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Post' } });

    expect(screen.getAllByTestId('post-item')).toHaveLength(5);
    expect(screen.getByRole('link', { name: /common.viewAllResults:Post/i })).toBeInTheDocument();
  });

  it('hides results when clicking outside', () => {
    const { store } = renderWithProviders(<SearchContainer />);
    act(() => {
      store.dispatch(setPosts(posts));
    });

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Post 1' } });
    expect(screen.getByText('Post 1')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('Post 1')).not.toBeInTheDocument();
  });

  it('closes results when "view all" link is clicked and preserves encoded query', () => {
    const { store } = renderWithProviders(<SearchContainer />);
    act(() => {
      store.dispatch(setPosts(posts));
    });

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Post' } });

    const viewAllLink = screen.getByRole('link', { name: /common.viewAllResults:Post/i });
    expect(viewAllLink).toHaveAttribute('href', '/search?q=Post');

    fireEvent.click(viewAllLink);

    expect(screen.queryByTestId('post-item')).not.toBeInTheDocument();
  });
});
