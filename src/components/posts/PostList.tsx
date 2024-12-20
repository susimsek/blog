import React, { useState } from 'react';
import { PostSummary, Topic } from '@/types/posts';
import { Container } from 'react-bootstrap';
import SearchBar from '@/components/search/SearchBar';
import PaginationBar from '@/components/pagination/PaginationBar';
import PostCard from '@/components/posts/PostSummary';
import { SortDropdown } from '@/components/common/SortDropdown';
import { TopicsDropdown } from '@/components/common/TopicsDropdown';
import { useTranslation } from 'next-i18next';

interface PostListProps {
  posts: PostSummary[];
  topics?: Topic[];
  noPostsFoundMessage?: string;
}

export default function PostList({ posts, topics = [], noPostsFoundMessage }: Readonly<PostListProps>) {
  const { t } = useTranslation(['post', 'common']);
  const [postsPerPage, setPostsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const filterPosts = (): PostSummary[] =>
    posts.filter(
      post =>
        (post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.summary.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (!selectedTopic || (post.topics && post.topics.some(topic => topic.id === selectedTopic))),
    );

  const sortPosts = (posts: PostSummary[]): PostSummary[] =>
    [...posts].sort((a, b) =>
      sortOrder === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

  const getFilteredAndSortedPosts = (): PostSummary[] => sortPosts(filterPosts());

  const filteredAndSortedPosts = getFilteredAndSortedPosts();

  // Paginated posts
  const paginatedPosts = filteredAndSortedPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  return (
    <Container className="mt-5" style={{ maxWidth: '800px' }}>
      <div className="d-flex flex-wrap align-items-center mb-4">
        <div className="flex-grow-1 me-2 mb-2">
          <SearchBar query={searchQuery} onChange={setSearchQuery} />
        </div>
        <SortDropdown
          sortOrder={sortOrder}
          onChange={newSortOrder => {
            setSortOrder(newSortOrder);
            setCurrentPage(1);
          }}
        />
        {topics.length > 0 && (
          <TopicsDropdown
            topics={topics}
            selectedTopic={selectedTopic}
            onTopicChange={newTopic => {
              setSelectedTopic(newTopic);
              setCurrentPage(1);
            }}
          />
        )}
      </div>
      {paginatedPosts.length > 0 ? (
        paginatedPosts.map(post => <PostCard key={post.id} post={post} />)
      ) : (
        <p className="text-center text-muted">{noPostsFoundMessage ?? t('post.noPostsFound')}</p>
      )}
      <PaginationBar
        currentPage={currentPage}
        totalPages={Math.ceil(filteredAndSortedPosts.length / postsPerPage)}
        size={postsPerPage}
        onPageChange={setCurrentPage}
        onSizeChange={size => {
          setPostsPerPage(size);
          setCurrentPage(1);
        }}
        totalResults={filteredAndSortedPosts.length}
      />
    </Container>
  );
}
