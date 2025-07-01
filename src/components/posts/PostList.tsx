import React, { useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { PostSummary, Topic } from '@/types/posts';
import { Container } from 'react-bootstrap';
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
        <div className="post-card d-flex align-items-center mb-4">
          <div className="post-card-content flex-grow-1 text-center">
            <div className="text-muted px-4 py-2">
              <FontAwesomeIcon icon="exclamation-circle" className="me-2" />
              {noPostsFoundMessage ?? t('post.noPostsFound')}
            </div>
          </div>
        </div>
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
