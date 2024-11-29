import React, { useState } from 'react';
import { Post } from '@/types/posts';
import { Container } from 'react-bootstrap';
import PostCard from '@/components/PostCard';
import PaginationBar from '@/components/PaginationBar';

export default function PostList({ posts }: { posts: Post[] }) {
  const [postsPerPage, setPostsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const getPagedPostsData = (page: number, size: number) => {
    const totalPages = Math.ceil(posts.length / size);
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const pagedPosts = posts.slice(startIndex, endIndex);
    return { pagedPosts, totalPages };
  };

  const { pagedPosts: currentPosts, totalPages } = getPagedPostsData(currentPage, postsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page); // Sayfa değişikliği
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
