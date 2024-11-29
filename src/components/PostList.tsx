import React, { useState } from 'react';
import { Post } from '@/types/posts';
import { Container } from 'react-bootstrap';
import PostCard from '@/components/PostCard';
import PaginationBar from '@/components/PaginationBar';

export default function PostList({ posts }: { posts: Post[] }) {
  const [postsPerPage, setPostsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(posts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = posts.slice(startIndex, startIndex + postsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePostsPerPageChange = (size: number) => {
    setPostsPerPage(size);
    setCurrentPage(1);
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '700px' }}>
      {currentPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        size={postsPerPage}
        onPageChange={handlePageChange}
        onSizeChange={handlePostsPerPageChange}
      />
    </Container>
  );
}
