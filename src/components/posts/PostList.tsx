import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useParams, useSearchParams } from 'next/navigation';
import { PostSummary } from '@/types/posts';
import PaginationBar from '@/components/pagination/PaginationBar';
import PostCard from '@/components/posts/PostSummary';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PostFilters } from './PostFilters';
import useDebounce from '@/hooks/useDebounce';
import useMediaQuery from '@/hooks/useMediaQuery';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { clearNonSearchFilters, setPage, setPageSize, setQuery, setSourceFilter } from '@/reducers/postsQuery';
import type { ReadingTimeRange, SortOrder, SourceFilter } from '@/reducers/postsQuery';
import { fetchPostLikes } from '@/lib/contentApi';
import i18nextConfig from '@/i18n/settings';
import type { PostDensityMode } from '@/components/common/PostDensityToggle';

interface PostListProps {
  posts: PostSummary[];
  noPostsFoundMessage?: string;
  highlightQuery?: string;
  showLikes?: boolean;
}

const TRACKABLE_POST_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,127}$/;

const isTrackablePostId = (postId: string) => TRACKABLE_POST_ID_PATTERN.test(postId);

const resolveEffectiveSourceFilter = (
  isSearchRoute: boolean,
  isMediumRoute: boolean,
  isHomeRoute: boolean,
  sourceFilter: SourceFilter,
): SourceFilter => {
  if (isSearchRoute) {
    return sourceFilter;
  }
  if (isMediumRoute) {
    return 'medium';
  }
  if (isHomeRoute) {
    return 'blog';
  }
  return 'all';
};

type PostListFilterCriteria = {
  normalizedQuery: string;
  selectedTopics: readonly string[];
  categoryFilter: string;
  effectiveSourceFilter: SourceFilter;
  startDateMs: number | null;
  endDateMs: number | null;
  readingTimeRange: ReadingTimeRange;
  scopedIdSet: Set<string> | null;
};

const matchesReadingTimeRange = (readingTimeMin: number, readingTimeRange: ReadingTimeRange) => {
  if (readingTimeRange === '3-7') {
    return readingTimeMin >= 3 && readingTimeMin <= 7;
  }
  if (readingTimeRange === '8-12') {
    return readingTimeMin >= 8 && readingTimeMin <= 12;
  }
  if (readingTimeRange === '15+') {
    return readingTimeMin >= 15;
  }
  return true;
};

const matchesPostListFilters = (post: PostSummary, criteria: Readonly<PostListFilterCriteria>) => {
  if (criteria.scopedIdSet && !criteria.scopedIdSet.has(post.id)) {
    return false;
  }

  if (criteria.normalizedQuery.length > 0) {
    const searchArea = `${post.title} ${post.summary} ${post.searchText}`.toLowerCase();
    if (!searchArea.includes(criteria.normalizedQuery)) {
      return false;
    }
  }

  if (criteria.selectedTopics.length > 0) {
    const postTopicIds = new Set((post.topics ?? []).map(topic => topic.id));
    if (!criteria.selectedTopics.every(topicId => postTopicIds.has(topicId))) {
      return false;
    }
  }

  if (criteria.categoryFilter !== 'all') {
    const postCategoryId = typeof post.category?.id === 'string' ? post.category.id.trim().toLowerCase() : '';
    if (postCategoryId !== criteria.categoryFilter) {
      return false;
    }
  }

  const postSource = post.source ?? 'blog';
  if (criteria.effectiveSourceFilter !== 'all' && postSource !== criteria.effectiveSourceFilter) {
    return false;
  }

  const postDateMs = new Date(post.publishedDate).getTime();
  if (criteria.startDateMs !== null && Number.isFinite(criteria.startDateMs) && postDateMs < criteria.startDateMs) {
    return false;
  }
  if (criteria.endDateMs !== null && Number.isFinite(criteria.endDateMs) && postDateMs > criteria.endDateMs) {
    return false;
  }

  return matchesReadingTimeRange(post.readingTimeMin, criteria.readingTimeRange);
};

const sortPostsByPublishedDate = (left: PostSummary, right: PostSummary, sortOrder: SortOrder) => {
  const leftDate = new Date(left.publishedDate).getTime();
  const rightDate = new Date(right.publishedDate).getTime();
  return sortOrder === 'asc' ? leftDate - rightDate : rightDate - leftDate;
};

const filterAndSortPosts = (
  posts: ReadonlyArray<PostSummary>,
  criteria: Readonly<PostListFilterCriteria>,
  sortOrder: SortOrder,
) =>
  posts
    .filter(post => matchesPostListFilters(post, criteria))
    .sort((left, right) => sortPostsByPublishedDate(left, right, sortOrder));

const mergeLoadedLikesByPostId = (
  previous: Readonly<Record<string, number | null>>,
  pendingLikePostIds: ReadonlyArray<string>,
  loadedLikes: Record<string, number> | null,
) => {
  const next = { ...previous };
  for (const postId of pendingLikePostIds) {
    if (loadedLikes === null) {
      next[postId] = null;
      continue;
    }

    const likes = loadedLikes[postId];
    next[postId] = typeof likes === 'number' && Number.isFinite(likes) ? likes : 0;
  }
  return next;
};

export default function PostList({
  posts,
  noPostsFoundMessage,
  highlightQuery,
  showLikes = false,
}: Readonly<PostListProps>) {
  const { t } = useTranslation(['post', 'common']);
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const routeParams = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(routeParams?.locale) ? routeParams?.locale[0] : routeParams?.locale;
  const isSearchRoute = /(?:^|\/)search(?:\/|$)/.test(pathname);
  const isMediumRoute = /(?:^|\/)medium(?:\/|$)/.test(pathname);
  const isHomeRoute = /^\/(?:[a-z]{2})?$/.test(pathname);
  const isCategoryRoute = /(?:^|\/)categories(?:\/|$)/.test(pathname);
  const shouldUseScope = /(?:^|\/)topics(?:\/|$)/.test(pathname);
  const showSourceFilter = isSearchRoute;
  const showCategoryFilter = !isCategoryRoute;
  const routeSearchParams = useSearchParams();
  const routeSearchParamsString = routeSearchParams?.toString() ?? '';
  const [likesByPostId, setLikesByPostId] = useState<Record<string, number | null>>({});
  const [densityMode, setDensityMode] = useState<PostDensityMode>('default');
  const canUseGridDensity = useMediaQuery('(min-width: 1200px)');
  const resolvedDensityMode: PostDensityMode = canUseGridDensity || densityMode !== 'grid' ? densityMode : 'default';
  const searchParams = useMemo(() => new URLSearchParams(routeSearchParamsString), [routeSearchParamsString]);
  const routePage = useMemo(() => {
    const routePageValue = searchParams.get('page');
    const parsedPage = Number.parseInt(routePageValue ?? '', 10);
    return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  }, [searchParams]);
  const routeSize = useMemo(() => {
    const routeSizeValue = searchParams.get('size');
    const parsedSize = Number.parseInt(routeSizeValue ?? '', 10);
    return Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : 5;
  }, [searchParams]);
  const routeQuery = useMemo(() => searchParams.get('q') ?? '', [searchParams]);
  const routeSource = useMemo(() => {
    const routeSourceValue = searchParams.get('source');
    return routeSourceValue === 'blog' || routeSourceValue === 'medium' || routeSourceValue === 'all'
      ? routeSourceValue
      : 'all';
  }, [searchParams]);
  const dispatch = useAppDispatch();
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const lastSyncedRouteRef = useRef<string>('');
  const routeSyncPendingRef = useRef(false);
  const lastFilterResetPathRef = useRef<string>('');
  const {
    query,
    sortOrder,
    selectedTopics,
    categoryFilter,
    sourceFilter,
    dateRange,
    readingTimeRange,
    page,
    pageSize,
    locale,
  } = useAppSelector(state => state.postsQuery);
  const currentLocale = locale ?? routeLocale ?? i18nextConfig.i18n.defaultLocale;
  const effectiveSourceFilter = resolveEffectiveSourceFilter(isSearchRoute, isMediumRoute, isHomeRoute, sourceFilter);
  const debouncedSearchQuery = useDebounce(query, 500);
  const scopedPostIds = useMemo(() => posts.map(post => post.id), [posts]);

  useEffect(() => {
    const routeKey = `${pathname}|${routePage}|${routeSize}|${routeQuery}|${routeSource}`;
    if (lastSyncedRouteRef.current === routeKey) {
      return;
    }
    lastSyncedRouteRef.current = routeKey;
    routeSyncPendingRef.current = true;

    const shouldSyncSource = isSearchRoute && sourceFilter !== routeSource;
    const shouldSyncQuery = query !== routeQuery;
    const shouldSyncPageSize = pageSize !== routeSize;
    const shouldSyncPage = page !== routePage || shouldSyncSource || shouldSyncQuery || shouldSyncPageSize;

    if (shouldSyncSource) {
      dispatch(setSourceFilter(routeSource));
    }

    if (shouldSyncQuery) {
      dispatch(setQuery(routeQuery));
    }

    if (shouldSyncPageSize) {
      dispatch(setPageSize(routeSize));
    }

    if (shouldSyncPage) {
      dispatch(setPage(routePage));
    }
  }, [
    dispatch,
    isSearchRoute,
    page,
    pageSize,
    pathname,
    query,
    routePage,
    routeQuery,
    routeSize,
    routeSource,
    sourceFilter,
  ]);

  useEffect(() => {
    if (!routeSyncPendingRef.current) {
      return;
    }

    const isSourceSynced = !isSearchRoute || sourceFilter === routeSource;
    if (query === routeQuery && page === routePage && pageSize === routeSize && isSourceSynced) {
      routeSyncPendingRef.current = false;
    }
  }, [isSearchRoute, page, pageSize, query, routePage, routeQuery, routeSize, routeSource, sourceFilter]);

  useEffect(() => {
    if (isSearchRoute || pathname === lastFilterResetPathRef.current) {
      return;
    }

    const hasStaleFilters =
      selectedTopics.length > 0 ||
      categoryFilter !== 'all' ||
      typeof dateRange.startDate === 'string' ||
      typeof dateRange.endDate === 'string' ||
      readingTimeRange !== 'any';
    if (!hasStaleFilters) {
      lastFilterResetPathRef.current = pathname;
      return;
    }

    lastFilterResetPathRef.current = pathname;
    dispatch(clearNonSearchFilters());
  }, [
    dateRange.endDate,
    dateRange.startDate,
    categoryFilter,
    dispatch,
    isSearchRoute,
    pathname,
    readingTimeRange,
    selectedTopics.length,
  ]);

  useEffect(() => {
    if (!isSearchRoute) {
      return;
    }

    const currentSource = searchParams.get('source');
    const normalizedCurrentSource =
      currentSource === 'blog' || currentSource === 'medium' || currentSource === 'all' ? currentSource : 'all';

    if (normalizedCurrentSource === sourceFilter) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (sourceFilter === 'all') {
      params.delete('source');
    } else {
      params.set('source', sourceFilter);
    }
    params.set('page', '1');
    params.set('size', String(pageSize));
    const nextQuery = params.toString();
    const nextSearch = nextQuery ? `?${nextQuery}` : '';
    router.push(nextSearch ? `${pathname}${nextSearch}` : pathname, { scroll: false });
  }, [isSearchRoute, pageSize, pathname, router, searchParams, sourceFilter]);

  const filteredPosts = useMemo(() => {
    const criteria: PostListFilterCriteria = {
      normalizedQuery: isSearchRoute ? debouncedSearchQuery.trim().toLowerCase() : '',
      startDateMs: dateRange.startDate ? new Date(dateRange.startDate).getTime() : null,
      endDateMs: dateRange.endDate ? new Date(dateRange.endDate).getTime() : null,
      scopedIdSet: shouldUseScope ? new Set(scopedPostIds) : null,
      selectedTopics,
      categoryFilter,
      effectiveSourceFilter,
      readingTimeRange,
    };

    return filterAndSortPosts(posts, criteria, sortOrder);
  }, [
    dateRange.endDate,
    dateRange.startDate,
    debouncedSearchQuery,
    effectiveSourceFilter,
    isSearchRoute,
    posts,
    categoryFilter,
    readingTimeRange,
    scopedPostIds,
    selectedTopics,
    shouldUseScope,
    sortOrder,
  ]);

  const totalResults = filteredPosts.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalResults / pageSize)), [pageSize, totalResults]);
  const resolvedPage = Math.min(page, totalPages);
  const renderedPosts = useMemo(() => {
    const startIndex = Math.max(0, (resolvedPage - 1) * pageSize);
    return filteredPosts.slice(startIndex, startIndex + pageSize);
  }, [filteredPosts, pageSize, resolvedPage]);

  useEffect(() => {
    if (routeSyncPendingRef.current || page <= totalPages) {
      return;
    }

    dispatch(setPage(totalPages));
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(totalPages));
    params.set('size', String(pageSize));
    const nextQuery = params.toString();
    const nextSearch = nextQuery ? `?${nextQuery}` : '';
    router.push(nextSearch ? `${pathname}${nextSearch}` : pathname, { scroll: false });
  }, [dispatch, page, pageSize, pathname, router, searchParams, totalPages]);

  const pendingLikePostIds = useMemo(() => {
    if (!showLikes) {
      return [];
    }
    return renderedPosts
      .map(post => post.id)
      .filter(postId => isTrackablePostId(postId) && likesByPostId[postId] === undefined);
  }, [likesByPostId, renderedPosts, showLikes]);

  useEffect(() => {
    if (!showLikes || pendingLikePostIds.length === 0) {
      return;
    }

    let isMounted = true;

    const loadLikes = async () => {
      const loadedLikes = await fetchPostLikes(currentLocale, pendingLikePostIds);

      if (!isMounted) {
        return;
      }

      setLikesByPostId(previous => {
        return mergeLoadedLikesByPostId(previous, pendingLikePostIds, loadedLikes);
      });
    };

    void loadLikes();

    return () => {
      isMounted = false;
    };
  }, [currentLocale, pendingLikePostIds, showLikes]);

  const scrollToListStart = useCallback(() => {
    const target = listTopRef.current;
    if (!target) {
      return;
    }

    const currentWindow = globalThis.window;
    const prefersReducedMotion = currentWindow?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

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
      const nextSearch = nextQuery ? `?${nextQuery}` : '';
      router.push(nextSearch ? `${pathname}${nextSearch}` : pathname, { scroll: false });
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
      const nextSearch = nextQuery ? `?${nextQuery}` : '';
      router.push(nextSearch ? `${pathname}${nextSearch}` : pathname, { scroll: false });
      scrollToListStart();
    },
    [dispatch, pathname, router, scrollToListStart, searchParams],
  );

  return (
    <section className="post-list-section">
      <div ref={listTopRef} />
      <div className="post-list-layout">
        <div className="post-list-content-col">
          <div className="post-list-filters-inline">
            <PostFilters
              showSourceFilter={showSourceFilter}
              showCategoryFilter={showCategoryFilter}
              densityMode={resolvedDensityMode}
              onDensityModeChange={mode => setDensityMode(!canUseGridDensity && mode === 'grid' ? 'default' : mode)}
            />
          </div>
          {renderedPosts.length > 0 ? (
            <div className={`post-list-results post-list-results--${resolvedDensityMode}`}>
              {renderedPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  highlightQuery={highlightQuery?.trim() ? highlightQuery : undefined}
                  showSource={isSearchRoute}
                  showLikes={showLikes}
                  likeCount={likesByPostId[post.id] ?? null}
                  likeCountLoading={showLikes && isTrackablePostId(post.id) && likesByPostId[post.id] === undefined}
                />
              ))}
            </div>
          ) : (
            <div className="post-card d-flex align-items-center post-list-empty">
              <div className="post-card-content flex-grow-1 text-center">
                <div className="text-muted px-4 py-2">
                  <FontAwesomeIcon icon="exclamation-circle" className="me-2" />
                  {noPostsFoundMessage ?? t('post.noPostsFound')}
                </div>
              </div>
            </div>
          )}
          {totalResults > 0 && (
            <PaginationBar
              currentPage={resolvedPage}
              totalPages={totalPages}
              size={pageSize}
              onPageChange={handlePageChange}
              onSizeChange={handleSizeChange}
              totalResults={totalResults}
            />
          )}
        </div>
      </div>
    </section>
  );
}
