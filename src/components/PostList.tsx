// components/PostList.tsx
import React, { useState } from 'react';
import { PostSummary } from '@/types/posts';
import { Container } from 'react-bootstrap';
import SearchBar from './SearchBar';
import PaginationBar from './PaginationBar';
import PostCard from '@/components/PostCard';
import { useTranslation } from 'next-i18next';

export default function PostList({ posts }: { posts: PostSummary[] }) {
  const { t } = useTranslation('post');
  const [postsPerPage, setPostsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters posts based on the search query
  const filterPosts = (): PostSummary[] =>
    posts.filter(
      post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchQuery.toLowerCase()),
    );

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

  // Get filtered and paginated posts
  const filteredPosts = filterPosts();
  const totalPages = calculateTotalPages(filteredPosts);
  const currentPosts = getCurrentPosts(filteredPosts);

  return (
    <Container className="mt-5" style={{ maxWidth: '700px' }}>
      <SearchBar query={searchQuery} onChange={handleSearchChange} />

      {currentPosts.length > 0 ? (
        currentPosts.map(post => <PostCard key={post.id} post={post} />)
      ) : (
        <p className="text-center text-muted">{t('post.noPostsFound')}</p>
      )}

      {filteredPosts.length > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          size={postsPerPage}
          onPageChange={handlePageChange}
          onSizeChange={handlePostsPerPageChange}
        />
      )}
    </Container>
  );
}
