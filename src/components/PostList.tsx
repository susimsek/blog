import React, { useState } from 'react';
import { Post } from '@/types/posts';
import { Container } from 'react-bootstrap';
import SearchBar from './SearchBar';
import PaginationBar from './PaginationBar';
import PostCard from '@/components/PostCard';

export default function PostList({ posts }: { posts: Post[] }) {
  const [postsPerPage, setPostsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = posts.filter(
    post =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const currentPosts = filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handlePostsPerPageChange = (size: number) => {
    setPostsPerPage(size);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '700px' }}>
      <SearchBar query={searchQuery} onChange={handleSearchChange} />

      {currentPosts.length > 0 ? (
        currentPosts.map(post => <PostCard key={post.id} post={post} />)
      ) : (
        <p className="text-center text-muted">No posts found.</p>
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
