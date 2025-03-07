import React, { useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { PostSummary, Topic } from '@/types/posts';
import { Alert, Container } from 'react-bootstrap';
import PaginationBar from '@/components/pagination/PaginationBar';
import PostCard from '@/components/posts/PostSummary';
import { useTranslation } from 'next-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { filterByQuery, filterByTopics, filterByDateRange, sortPosts } from '@/lib/postFilters';
import { PostFilters } from './PostFilters';
import useDebounce from '@/hooks/useDebounce';

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
  const router = useRouter();

  const currentPage = Number(router.query.page) || 1;
  const postsPerPage = Number(router.query.size) || 5;

  const [searchQuery, setSearchQuery] = React.useState((router.query.q as string) || '');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [selectedTopics, setSelectedTopics] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState<{ startDate?: string; endDate?: string }>({});

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Filtreleme işlemleri
  const filteredPosts = useMemo(
    () =>
      posts.filter(
        post =>
          filterByQuery(post, debouncedSearchQuery) &&
          filterByTopics(post, selectedTopics) &&
          filterByDateRange(post, dateRange),
      ),
    [posts, debouncedSearchQuery, selectedTopics, dateRange],
  );

  const sortedPosts = useMemo(() => sortPosts(filteredPosts, sortOrder), [filteredPosts, sortOrder]);

  const paginatedPosts = useMemo(
    () => sortedPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage),
    [sortedPosts, currentPage, postsPerPage],
  );

  // Sayfa değiştirme işlemi
  const handlePageChange = useCallback(
    (newPage: number) => {
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, page: newPage, size: postsPerPage },
        },
        undefined,
        { shallow: true },
      );
    },
    [router, postsPerPage],
  );

  // Sayfa boyutunu değiştirme işlemi
  const handleSizeChange = useCallback(
    (size: number) => {
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, page: 1, size },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  return (
    <Container className="mt-5" style={{ maxWidth: '800px' }}>
      <PostFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        selectedTopics={selectedTopics}
        onTopicsChange={setSelectedTopics}
        onDateRangeChange={setDateRange}
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
          onPageChange={handlePageChange}
          onSizeChange={handleSizeChange}
          totalResults={sortedPosts.length}
        />
      )}
    </Container>
  );
}
