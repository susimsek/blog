import React, { useState } from 'react';
import { PostSummary, Topic } from '@/types/posts';
import { Alert, Container } from 'react-bootstrap';
import SearchBar from '@/components/search/SearchBar';
import PaginationBar from '@/components/pagination/PaginationBar';
import PostCard from '@/components/posts/PostSummary';
import { SortDropdown } from '@/components/common/SortDropdown';
import { TopicsDropdown } from '@/components/common/TopicsDropdown';
import { useTranslation } from 'next-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const filterPosts = (): PostSummary[] =>
    posts.filter(
      post =>
        (post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.summary.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedTopics.length === 0 || post.topics?.some(topic => selectedTopics.includes(topic.id))),
    );

  const sortPosts = (posts: PostSummary[]): PostSummary[] =>
    [...posts].sort((a, b) =>
      sortOrder === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

  const getFilteredAndSortedPosts = (): PostSummary[] => sortPosts(filterPosts());

  const filteredAndSortedPosts = getFilteredAndSortedPosts();

  const paginatedPosts = filteredAndSortedPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  return (
    <Container className="mt-5" style={{ maxWidth: '800px' }}>
      <div className="d-flex flex-wrap align-items-center mb-3">
        <div className="flex-grow-1 mb-4">
          <SearchBar query={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="d-flex flex-column flex-md-row align-items-stretch w-100 w-md-auto" style={{ gap: '10px' }}>
          {topics.length > 0 && (
            <TopicsDropdown
              topics={topics}
              selectedTopics={selectedTopics}
              onTopicsChange={newTopics => {
                setSelectedTopics(newTopics);
                setCurrentPage(1);
              }}
            />
          )}
          <SortDropdown
            sortOrder={sortOrder}
            onChange={newSortOrder => {
              setSortOrder(newSortOrder);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
      {paginatedPosts.length > 0 ? (
        paginatedPosts.map(post => <PostCard key={post.id} post={post} />)
      ) : (
        <Alert variant="info" className="mb-0 d-flex align-items-center justify-content-center py-3">
          <FontAwesomeIcon icon="exclamation-circle" className="me-2" size="lg" />
          {noPostsFoundMessage ?? t('post.noPostsFound')}
        </Alert>
      )}
      {filteredAndSortedPosts.length > 0 && (
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
      )}
    </Container>
  );
}
