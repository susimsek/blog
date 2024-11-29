import React, { useState } from 'react';
import { Post } from '@/types/posts';
import { Container, Form } from 'react-bootstrap';
import PostCard from '@/components/PostCard';
import PaginationBar from '@/components/PaginationBar';

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
  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePostsPerPageChange = (size: number) => {
    setPostsPerPage(size);
    setCurrentPage(1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '700px' }}>
      <Form.Group className="mb-4">
        <Form.Control
          type="text"
          placeholder="Search posts by title or summary..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </Form.Group>

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
