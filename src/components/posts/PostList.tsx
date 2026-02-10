import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PostSummary, Topic } from '@/types/posts';
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
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const lastSyncedRouteRef = useRef<string>('');
  const { query, sortOrder, selectedTopics, dateRange, readingTimeRange, page, pageSize } = useAppSelector(
    state => state.postsQuery,
  );
  const debouncedSearchQuery = useDebounce(query, 500);

  useEffect(() => {
    const routePageValue = searchParams.get('page');
    const parsedPage = Number.parseInt(routePageValue ?? '', 10);
    const routePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const routeSizeValue = searchParams.get('size');
    const parsedSize = Number.parseInt(routeSizeValue ?? '', 10);
    const routeSize = Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : 5;

    const routeQuery = searchParams.get('q') ?? '';
    const routeKey = `${pathname}|${routePage}|${routeSize}|${routeQuery}`;
    if (lastSyncedRouteRef.current === routeKey) {
      return;
    }
    lastSyncedRouteRef.current = routeKey;

    // URL is the source of truth for pagination/search state.
    dispatch(setQuery(routeQuery));
    dispatch(setPageSize(routeSize));
    dispatch(setPage(routePage));
  }, [dispatch, pathname, searchParams]);

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

    const currentWindow = globalThis.window;
    const prefersReducedMotion =
      typeof currentWindow !== 'undefined' &&
      typeof currentWindow.matchMedia === 'function' &&
      currentWindow.matchMedia('(prefers-reduced-motion: reduce)').matches;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      dispatch(setPage(newPage));
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      params.set('size', String(pageSize));
      const nextQuery = params.toString();
      router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      scrollToListStart();
    },
    [dispatch, pageSize, pathname, router, scrollToListStart, searchParams],
  );

  const handleSizeChange = useCallback(
    (size: number) => {
      dispatch(setPageSize(size));
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', '1');
      params.set('size', String(size));
      const nextQuery = params.toString();
      router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      scrollToListStart();
    },
    [dispatch, pathname, router, scrollToListStart, searchParams],
  );

  return (
    <section className="mt-5">
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
    </section>
  );
}
