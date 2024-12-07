import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PostList from '@/components/posts/PostList';
import { PostSummary } from '@/types/posts';
import { mockPostSummaries } from '../../__mocks__/mockPostData';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => key),
  })),
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
    size,
    onPageChange,
    onSizeChange,
  }: {
    currentPage: number;
    totalPages: number;
    size: number;
    onPageChange: (page: number) => void;
    onSizeChange: (size: number) => void;
  }) => (
    <div data-testid="pagination-bar">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        Previous
      </button>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Next
      </button>
      <select value={size} onChange={e => onSizeChange(Number(e.target.value))}>
        <option value={5}>5</option>
        <option value={10}>10</option>
      </select>
    </div>
  ),
}));

jest.mock('@/components/posts/PostSummary', () => ({
  __esModule: true,
  default: ({ post }: { post: PostSummary }) => (
    <div data-testid="post-card">
      <h2>{post.title}</h2>
      <p>{post.summary}</p>
    </div>
  ),
}));

describe('PostList Component', () => {
  it('renders all components correctly', () => {
    render(<PostList posts={mockPostSummaries} />);

    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByText('common:common.sort.newest')).toBeInTheDocument();
    expect(screen.getAllByTestId('post-card')).toHaveLength(5);
    expect(screen.getByTestId('pagination-bar')).toBeInTheDocument();
  });

  it('filters posts based on search query', () => {
    render(<PostList posts={mockPostSummaries} />);
    const searchBar = screen.getByTestId('search-bar');
    fireEvent.change(searchBar, { target: { value: 'Post 3' } });

    expect(screen.getByText('Post 3')).toBeInTheDocument();
    expect(screen.queryByText('Post 1')).not.toBeInTheDocument();
  });

  it('sorts posts based on selected order', () => {
    render(<PostList posts={mockPostSummaries} />);
    const sortButton = screen.getByText('common:common.sort.newest');
    fireEvent.click(sortButton);

    const oldestSortOption = screen.getByText('common:common.sort.oldest');
    fireEvent.click(oldestSortOption);

    const posts = screen.getAllByTestId('post-card');
    expect(posts[0]).toHaveTextContent('Post 6');
    expect(posts[4]).toHaveTextContent('Post 2');
  });

  it('changes posts per page and handles pagination correctly', () => {
    render(<PostList posts={mockPostSummaries} />);
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    const postsOnPage = screen.getAllByTestId('post-card');
    expect(postsOnPage[0]).toHaveTextContent('Post 6');

    const sizeSelector = screen.getByRole('combobox');
    fireEvent.change(sizeSelector, { target: { value: '10' } });

    expect(screen.getAllByTestId('post-card')).toHaveLength(6);
  });

  it('displays "no posts found" message when no posts match', () => {
    render(<PostList posts={mockPostSummaries} />);
    const searchBar = screen.getByTestId('search-bar');
    fireEvent.change(searchBar, { target: { value: 'Nonexistent Post' } });

    expect(screen.getByText('post.noPostsFound')).toBeInTheDocument();
  });

  it('handles empty posts gracefully', () => {
    render(<PostList posts={[]} />);
    expect(screen.getByText('post.noPostsFound')).toBeInTheDocument();
  });
});
