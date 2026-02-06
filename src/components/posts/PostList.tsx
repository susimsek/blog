import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from '@/navigation/router';
import { PostSummary, Topic } from '@/types/posts';
import Container from 'react-bootstrap/Container';
import PaginationBar from '@/components/pagination/PaginationBar';
import PostCard from '@/components/posts/PostSummary';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { filterByQuery, filterByTopics, filterByDateRange, filterByReadingTime, sortPosts } from '@/lib/postFilters';
import { PostFilters } from './PostFilters';
import useDebounce from '@/hooks/useDebounce';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { setPage, setPageSize, setQuery } from '@/reducers/postsQuery';

interface PostListProps {
  posts: PostSummary[];
  topics?: Topic[];
  noPostsFoundMessage?: string;
  searchEnabled?: boolean;
  highlightQuery?: string;
}

export default function PostList({
  posts,
  topics = [],
  noPostsFoundMessage,
  searchEnabled = true,
  highlightQuery,
}: Readonly<PostListProps>) {
  const { t } = useTranslation(['post', 'common']);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const { query, sortOrder, selectedTopics, dateRange, readingTimeRange, page, pageSize } = useAppSelector(
    state => state.postsQuery,
  );
  const debouncedSearchQuery = useDebounce(query, 500);

  const toSingleQueryValue = (value: string | string[] | undefined): string | undefined => {
    return Array.isArray(value) ? value[0] : value;
  };

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const routePageValue = toSingleQueryValue(router.query.page);
    const parsedPage = Number.parseInt(routePageValue ?? '', 10);
    const routePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const routeSizeValue = toSingleQueryValue(router.query.size);
    const parsedSize = Number.parseInt(routeSizeValue ?? '', 10);
    const routeSize = Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : 5;

    const routeQuery = toSingleQueryValue(router.query.q) ?? '';

    const queryChanged = routeQuery !== query;
    const sizeChanged = routeSize !== pageSize;
    const pageChanged = routePage !== page;

    if (queryChanged) {
      dispatch(setQuery(routeQuery));
    }

    if (sizeChanged) {
      dispatch(setPageSize(routeSize));
    }

    // Keep URL as the source of truth for active page.
    if (queryChanged || sizeChanged || pageChanged) {
      dispatch(setPage(routePage));
    }
  }, [router.isReady, router.query.page, router.query.size, router.query.q, query, page, pageSize, dispatch]);

  const filteredPosts = useMemo(
    () =>
      posts.filter(
        post =>
          filterByQuery(post, debouncedSearchQuery) &&
          filterByTopics(post, selectedTopics) &&
          filterByDateRange(post, dateRange) &&
          filterByReadingTime(post, readingTimeRange),
      ),
    [posts, debouncedSearchQuery, selectedTopics, dateRange, readingTimeRange],
  );

  const sortedPosts = useMemo(() => sortPosts(filteredPosts, sortOrder), [filteredPosts, sortOrder]);

  const paginatedPosts = useMemo(
    () => sortedPosts.slice((page - 1) * pageSize, page * pageSize),
    [sortedPosts, page, pageSize],
  );

  const scrollToListStart = useCallback(() => {
    const target = listTopRef.current;
    if (!target) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      dispatch(setPage(newPage));
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, page: newPage, size: pageSize },
        },
        undefined,
        { shallow: true },
      );
      scrollToListStart();
    },
    [router, pageSize, dispatch, scrollToListStart],
  );

  const handleSizeChange = useCallback(
    (size: number) => {
      dispatch(setPageSize(size));
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, page: 1, size },
        },
        undefined,
        { shallow: true },
      );
      scrollToListStart();
    },
    [router, dispatch, scrollToListStart],
  );

  return (
    <Container className="mt-5" style={{ maxWidth: '800px' }}>
      <div ref={listTopRef} />
      <PostFilters topics={topics} searchEnabled={searchEnabled} />
      {paginatedPosts.length > 0 ? (
        paginatedPosts.map(post => (
          <PostCard key={post.id} post={post} highlightQuery={highlightQuery?.trim() ? highlightQuery : undefined} />
        ))
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
          currentPage={page}
          totalPages={Math.ceil(sortedPosts.length / pageSize)}
          size={pageSize}
          onPageChange={handlePageChange}
          onSizeChange={handleSizeChange}
          totalResults={sortedPosts.length}
        />
      )}
    </Container>
  );
}
