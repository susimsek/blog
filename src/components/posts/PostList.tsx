import React, { useState } from 'react';
import { PostSummary } from '@/types/posts';
import { Container, Dropdown, DropdownButton } from 'react-bootstrap'; // Dropdown import edildi
import SearchBar from '@/components/search/SearchBar';
import PaginationBar from '@/components/pagination/PaginationBar';
import PostCard from '@/components/posts/PostSummary';
import { useTranslation } from 'next-i18next';

interface PostListProps {
  posts: PostSummary[];
  noPostsFoundMessage?: string;
}

export default function PostList({ posts, noPostsFoundMessage }: Readonly<PostListProps>) {
  const { t } = useTranslation(['post', 'common']);
  const [postsPerPage, setPostsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters posts based on the search query
  const filterPosts = (): PostSummary[] =>
    posts.filter(
      post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  // Sort posts based on date and sort order
  const sortPosts = (posts: PostSummary[]): PostSummary[] =>
    [...posts].sort((a, b) =>
      sortOrder === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

  // Combines filtering and sorting
  const getFilteredAndSortedPosts = (): PostSummary[] => sortPosts(filterPosts());

  // Calculates the total number of pages
  const calculateTotalPages = (filteredPosts: PostSummary[]): number => Math.ceil(filteredPosts.length / postsPerPage);

  // Slices the filtered posts for the current page
  const getCurrentPosts = (filteredPosts: PostSummary[]): PostSummary[] =>
    filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  // Event handler for page change
  const handlePageChange = (page: number) => setCurrentPage(page);

  // Event handler for posts per page change
  const handlePostsPerPageChange = (size: number) => {
    setPostsPerPage(size);
    setCurrentPage(1);
  };

  // Event handler for search query change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Event handler for sort order change
  const handleSortOrderChange = (order: 'asc' | 'desc') => {
    setSortOrder(order);
    setCurrentPage(1);
  };

  // Get filtered, sorted, and paginated posts
  const filteredPosts = getFilteredAndSortedPosts();
  const totalPages = calculateTotalPages(filteredPosts);
  const currentPosts = getCurrentPosts(filteredPosts);
  const totalResults = filteredPosts.length;

  return (
    <Container className="mt-5" style={{ maxWidth: '800px' }}>
      {/* Search Bar */}
      <SearchBar query={searchQuery} onChange={handleSearchChange} />

      {/* Sort Dropdown */}
      <div className="d-flex justify-content-start mb-4">
        <DropdownButton
          id="sort-dropdown"
          title={sortOrder === 'asc' ? t('common:common.sort.oldest') : t('common:common.sort.newest')}
          onSelect={(e: string | null) => {
            if (e) handleSortOrderChange(e as 'asc' | 'desc');
          }}
        >
          <Dropdown.Item eventKey="desc">{t('common:common.sort.newest')}</Dropdown.Item>
          <Dropdown.Item eventKey="asc">{t('common:common.sort.oldest')}</Dropdown.Item>
        </DropdownButton>
      </div>

      {/* Post List */}
      {currentPosts.length > 0 ? (
        currentPosts.map(post => <PostCard key={post.id} post={post} />)
      ) : (
        <p className="text-center text-muted">{noPostsFoundMessage ?? t('post.noPostsFound')}</p>
      )}

      {/* Pagination */}
      {filteredPosts.length > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          size={postsPerPage}
          onPageChange={handlePageChange}
          onSizeChange={handlePostsPerPageChange}
          totalResults={totalResults}
        />
      )}
    </Container>
  );
}
