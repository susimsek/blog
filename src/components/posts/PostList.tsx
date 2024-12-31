import React, { useState, useMemo, useCallback } from 'react';
import { PostSummary, Topic } from '@/types/posts';
import { Alert, Container } from 'react-bootstrap';
import PaginationBar from '@/components/pagination/PaginationBar';
import PostCard from '@/components/posts/PostSummary';
import { useTranslation } from 'next-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { filterByQuery, filterByTopics, filterByDateRange, sortPosts } from '@/lib/postFilters';
import { PostFilters } from './PostFilters';

interface PostListProps {
  posts: PostSummary[];
  topics?: Topic[];
  noPostsFoundMessage?: string;
  searchEnabled?: boolean;
}

export default function PostList({
  posts,
  topics = [],
  noPostsFoundMessage,
  searchEnabled = true,
}: Readonly<PostListProps>) {
  const { t } = useTranslation(['post', 'common']);
  const [postsPerPage, setPostsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});

  const filteredPosts = useMemo(
    () =>
      posts.filter(
        post =>
          filterByQuery(post, searchQuery) &&
          filterByTopics(post, selectedTopics) &&
          filterByDateRange(post, dateRange),
      ),
    [posts, searchQuery, selectedTopics, dateRange],
  );

  const sortedPosts = useMemo(() => sortPosts(filteredPosts, sortOrder), [filteredPosts, sortOrder]);

  const paginatedPosts = useMemo(
    () => sortedPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage),
    [sortedPosts, currentPage, postsPerPage],
  );

  const handleSortChange = useCallback((newSortOrder: 'asc' | 'desc') => {
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  }, []);

  const handleTopicsChange = useCallback((newTopics: string[]) => {
    setSelectedTopics(newTopics);
    setCurrentPage(1);
  }, []);

  const handleSizeChange = useCallback((size: number) => {
    setPostsPerPage(size);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback((dates: { startDate?: string; endDate?: string }) => {
    setDateRange(dates);
    setCurrentPage(1);
  }, []);

  return (
    <Container className="mt-5" style={{ maxWidth: '800px' }}>
      <PostFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        selectedTopics={selectedTopics}
        onTopicsChange={handleTopicsChange}
        onDateRangeChange={handleDateRangeChange}
        topics={topics}
        searchEnabled={searchEnabled}
      />
      {paginatedPosts.length > 0 ? (
        paginatedPosts.map(post => <PostCard key={post.id} post={post} />)
      ) : (
        <Alert variant="warning" className="mb-0 d-flex align-items-center justify-content-center py-3">
          <FontAwesomeIcon icon="exclamation-circle" className="me-2" size="lg" />
          {noPostsFoundMessage ?? t('post.noPostsFound')}
        </Alert>
      )}
      {sortedPosts.length > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={Math.ceil(sortedPosts.length / postsPerPage)}
          size={postsPerPage}
          onPageChange={setCurrentPage}
          onSizeChange={handleSizeChange}
          totalResults={sortedPosts.length}
        />
      )}
    </Container>
  );
}
