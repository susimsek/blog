import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useParams, useSearchParams } from 'next/navigation';
import { PostSummary } from '@/types/posts';
import PaginationBar from '@/components/pagination/PaginationBar';
import PostCard from '@/components/posts/PostSummary';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PostFilters } from './PostFilters';
import useMediaQuery from '@/hooks/useMediaQuery';
import { useAppDispatch, useAppSelector } from '@/config/store';
import {
  setCategoryFilter,
  setDateRange,
  setReadingTimeRange,
  setSelectedTopics,
  setSortOrder,
} from '@/reducers/postsQuery';
import type { CategoryFilter, DateRange, ReadingTimeRange, SortOrder, SourceFilter } from '@/reducers/postsQuery';
import { fetchPostCommentCounts, fetchPostLikes } from '@/lib/contentApi';
import i18nextConfig from '@/i18n/settings';
import type { PostDensityMode } from '@/components/common/PostDensityToggle';
import type { Topic } from '@/types/posts';

interface PostListProps {
  posts: PostSummary[];
  topics?: Topic[];
  noPostsFoundMessage?: string;
  highlightQuery?: string;
  showLikes?: boolean;
}

const TRACKABLE_POST_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,127}$/;
const DATE_QUERY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MANAGED_FILTER_QUERY_KEYS = ['sort', 'topics', 'category', 'startDate', 'endDate', 'readingTime', 'source'];

export const isTrackablePostId = (postId: string) => TRACKABLE_POST_ID_PATTERN.test(postId);

export const normalizeDateQueryValue = (value: string | null) => {
  const normalizedValue = value?.trim() ?? '';
  return DATE_QUERY_PATTERN.test(normalizedValue) ? normalizedValue : undefined;
};

export const parseTopicsQueryValue = (value: string | null) =>
  (value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

export const serializeTopicsQueryValue = (topicIds: ReadonlyArray<string>) => topicIds.join(',');

export const parseSortOrderQueryValue = (value: string | null): SortOrder => (value === 'asc' ? 'asc' : 'desc');

export const parseReadingTimeQueryValue = (value: string | null): ReadingTimeRange => {
  if (value === '3-7' || value === '8-12' || value === '15+') {
    return value;
  }
  return 'any';
};

export const parseSourceQueryValue = (value: string | null): SourceFilter => {
  if (value === 'blog' || value === 'medium' || value === 'all') {
    return value;
  }
  return 'all';
};

type ParsedPostListQueryState = {
  sortOrder: SortOrder;
  selectedTopics: string[];
  categoryFilter: CategoryFilter;
  dateRange: DateRange;
  readingTimeRange: ReadingTimeRange;
  sourceFilter: SourceFilter;
};

export const parsePostListQueryState = (
  searchParams: URLSearchParams,
  availableTopicIds: ReadonlySet<string>,
): ParsedPostListQueryState => {
  const selectedTopics = parseTopicsQueryValue(searchParams.get('topics')).filter(topicId => availableTopicIds.has(topicId));
  const categoryFilterValue = searchParams.get('category')?.trim().toLowerCase() ?? '';
  const startDate = normalizeDateQueryValue(searchParams.get('startDate'));
  const endDate = normalizeDateQueryValue(searchParams.get('endDate'));

  return {
    sortOrder: parseSortOrderQueryValue(searchParams.get('sort')),
    selectedTopics,
    categoryFilter: categoryFilterValue ? categoryFilterValue : 'all',
    dateRange: {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    },
    readingTimeRange: parseReadingTimeQueryValue(searchParams.get('readingTime')),
    sourceFilter: parseSourceQueryValue(searchParams.get('source')),
  };
};

export const buildManagedSearchParams = (
  currentSearchParams: URLSearchParams,
  state: {
    sortOrder: SortOrder;
    selectedTopics: ReadonlyArray<string>;
    categoryFilter: CategoryFilter;
    dateRange: DateRange;
    readingTimeRange: ReadingTimeRange;
    sourceFilter: SourceFilter;
    page?: number;
    size: number;
  },
) => {
  const nextParams = new URLSearchParams(currentSearchParams.toString());

  for (const key of MANAGED_FILTER_QUERY_KEYS) {
    nextParams.delete(key);
  }

  if (state.sortOrder !== 'desc') {
    nextParams.set('sort', state.sortOrder);
  }
  if (state.selectedTopics.length > 0) {
    nextParams.set('topics', serializeTopicsQueryValue(state.selectedTopics));
  }
  if (state.categoryFilter !== 'all') {
    nextParams.set('category', state.categoryFilter);
  }
  if (state.dateRange.startDate) {
    nextParams.set('startDate', state.dateRange.startDate);
  }
  if (state.dateRange.endDate) {
    nextParams.set('endDate', state.dateRange.endDate);
  }
  if (state.readingTimeRange !== 'any') {
    nextParams.set('readingTime', state.readingTimeRange);
  }
  if (state.sourceFilter !== 'all') {
    nextParams.set('source', state.sourceFilter);
  }

  nextParams.set('page', String(state.page ?? 1));
  nextParams.set('size', String(state.size));

  return nextParams;
};

export const resolveEffectiveSourceFilter = (
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

export const matchesReadingTimeRange = (readingTimeMin: number, readingTimeRange: ReadingTimeRange) => {
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

export const matchesSearchQuery = (post: PostSummary, normalizedQuery: string) => {
  if (normalizedQuery.length === 0) {
    return true;
  }

  const searchArea = `${post.title} ${post.summary} ${post.searchText}`.toLowerCase();
  return searchArea.includes(normalizedQuery);
};

export const matchesSelectedTopics = (post: PostSummary, selectedTopics: readonly string[]) => {
  if (selectedTopics.length === 0) {
    return true;
  }

  const postTopicIds = new Set((post.topics ?? []).map(topic => topic.id));
  return selectedTopics.every(topicId => postTopicIds.has(topicId));
};

export const matchesCategoryFilter = (post: PostSummary, categoryFilter: string) => {
  if (categoryFilter === 'all') {
    return true;
  }

  const postCategoryId = typeof post.category?.id === 'string' ? post.category.id.trim().toLowerCase() : '';
  return postCategoryId === categoryFilter;
};

export const matchesSourceFilter = (post: PostSummary, effectiveSourceFilter: SourceFilter) => {
  const postSource = post.source ?? 'blog';
  return effectiveSourceFilter === 'all' || postSource === effectiveSourceFilter;
};

export const matchesPublishedDateRange = (post: PostSummary, startDateMs: number | null, endDateMs: number | null) => {
  const postDateMs = new Date(post.publishedDate).getTime();

  if (startDateMs !== null && Number.isFinite(startDateMs) && postDateMs < startDateMs) {
    return false;
  }

  if (endDateMs !== null && Number.isFinite(endDateMs) && postDateMs > endDateMs) {
    return false;
  }

  return true;
};

export const matchesPostListFilters = (post: PostSummary, criteria: Readonly<PostListFilterCriteria>) => {
  if (criteria.scopedIdSet && !criteria.scopedIdSet.has(post.id)) {
    return false;
  }

  if (!matchesSearchQuery(post, criteria.normalizedQuery)) {
    return false;
  }

  if (!matchesSelectedTopics(post, criteria.selectedTopics)) {
    return false;
  }

  if (!matchesCategoryFilter(post, criteria.categoryFilter)) {
    return false;
  }

  if (!matchesSourceFilter(post, criteria.effectiveSourceFilter)) {
    return false;
  }

  if (!matchesPublishedDateRange(post, criteria.startDateMs, criteria.endDateMs)) {
    return false;
  }

  return matchesReadingTimeRange(post.readingTimeMin, criteria.readingTimeRange);
};

export const sortPostsByPublishedDate = (left: PostSummary, right: PostSummary, sortOrder: SortOrder) => {
  const leftDate = new Date(left.publishedDate).getTime();
  const rightDate = new Date(right.publishedDate).getTime();
  return sortOrder === 'asc' ? leftDate - rightDate : rightDate - leftDate;
};

export const filterAndSortPosts = (
  posts: ReadonlyArray<PostSummary>,
  criteria: Readonly<PostListFilterCriteria>,
  sortOrder: SortOrder,
) =>
  posts
    .filter(post => matchesPostListFilters(post, criteria))
    .sort((left, right) => sortPostsByPublishedDate(left, right, sortOrder));

export const mergeLoadedLikesByPostId = (
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

export const mergeLoadedCommentCountsByPostId = (
  previous: Readonly<Record<string, number | null>>,
  pendingCommentPostIds: ReadonlyArray<string>,
  loadedCommentCounts: Record<string, number> | null,
) => {
  const next = { ...previous };
  for (const postId of pendingCommentPostIds) {
    if (loadedCommentCounts === null) {
      next[postId] = null;
      continue;
    }

    const comments = loadedCommentCounts[postId];
    next[postId] = typeof comments === 'number' && Number.isFinite(comments) ? comments : 0;
  }
  return next;
};

export default function PostList({
  posts,
  topics = [],
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
  const [commentCountsByPostId, setCommentCountsByPostId] = useState<Record<string, number | null>>({});
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
  const dispatch = useAppDispatch();
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const { sortOrder, selectedTopics, categoryFilter, dateRange, readingTimeRange, locale } = useAppSelector(
    state => state.postsQuery,
  );
  const currentLocale = locale ?? routeLocale ?? i18nextConfig.i18n.defaultLocale;
  const availableTopicIds = useMemo(() => new Set(topics.map(topic => topic.id)), [topics]);
  const parsedQueryState = useMemo(
    () => parsePostListQueryState(searchParams, availableTopicIds),
    [availableTopicIds, searchParams],
  );
  const effectiveSortOrder = searchParams.has('sort') ? parsedQueryState.sortOrder : sortOrder;
  const effectiveSelectedTopics = searchParams.has('topics') ? parsedQueryState.selectedTopics : selectedTopics;
  const effectiveCategoryFilter = searchParams.has('category') ? parsedQueryState.categoryFilter : categoryFilter;
  const effectiveDateRange =
    searchParams.has('startDate') || searchParams.has('endDate') ? parsedQueryState.dateRange : dateRange;
  const effectiveReadingTimeRange = searchParams.has('readingTime')
    ? parsedQueryState.readingTimeRange
    : readingTimeRange;
  const effectiveSourceFilter = resolveEffectiveSourceFilter(
    isSearchRoute,
    isMediumRoute,
    isHomeRoute,
    parsedQueryState.sourceFilter,
  );
  const effectiveSearchQuery = isSearchRoute ? routeQuery : '';
  const scopedPostIds = useMemo(() => posts.map(post => post.id), [posts]);

  useEffect(() => {
    dispatch(setSortOrder(parsedQueryState.sortOrder));
    dispatch(setSelectedTopics(parsedQueryState.selectedTopics));
    dispatch(setCategoryFilter(parsedQueryState.categoryFilter));
    dispatch(setDateRange(parsedQueryState.dateRange));
    dispatch(setReadingTimeRange(parsedQueryState.readingTimeRange));
  }, [
    dispatch,
    parsedQueryState.categoryFilter,
    parsedQueryState.dateRange,
    parsedQueryState.readingTimeRange,
    parsedQueryState.selectedTopics,
    parsedQueryState.sortOrder,
  ]);

  const filteredPosts = useMemo(() => {
    const criteria: PostListFilterCriteria = {
      normalizedQuery: effectiveSearchQuery.trim().toLowerCase(),
      startDateMs: effectiveDateRange.startDate ? new Date(effectiveDateRange.startDate).getTime() : null,
      endDateMs: effectiveDateRange.endDate ? new Date(effectiveDateRange.endDate).getTime() : null,
      scopedIdSet: shouldUseScope ? new Set(scopedPostIds) : null,
      selectedTopics: effectiveSelectedTopics,
      categoryFilter: effectiveCategoryFilter,
      effectiveSourceFilter,
      readingTimeRange: effectiveReadingTimeRange,
    };

    return filterAndSortPosts(posts, criteria, effectiveSortOrder);
  }, [
    effectiveCategoryFilter,
    effectiveDateRange.endDate,
    effectiveDateRange.startDate,
    effectiveSearchQuery,
    effectiveSelectedTopics,
    effectiveSourceFilter,
    effectiveReadingTimeRange,
    effectiveSortOrder,
    posts,
    scopedPostIds,
    shouldUseScope,
  ]);

  const totalResults = filteredPosts.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalResults / routeSize)), [routeSize, totalResults]);
  const resolvedPage = Math.min(routePage, totalPages);
  const renderedPosts = useMemo(() => {
    const startIndex = Math.max(0, (resolvedPage - 1) * routeSize);
    return filteredPosts.slice(startIndex, startIndex + routeSize);
  }, [filteredPosts, resolvedPage, routeSize]);

  useEffect(() => {
    if (routePage <= totalPages) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(totalPages));
    params.set('size', String(routeSize));
    const nextQuery = params.toString();
    const nextSearch = nextQuery ? `?${nextQuery}` : '';
    router.push(nextSearch ? `${pathname}${nextSearch}` : pathname, { scroll: false });
  }, [pathname, routePage, routeSize, router, searchParams, totalPages]);

  const pendingLikePostIds = useMemo(() => {
    if (!showLikes) {
      return [];
    }
    return renderedPosts
      .map(post => post.id)
      .filter(postId => isTrackablePostId(postId) && likesByPostId[postId] === undefined);
  }, [likesByPostId, renderedPosts, showLikes]);

  const pendingCommentPostIds = useMemo(
    () =>
      renderedPosts
        .map(post => post.id)
        .filter(postId => isTrackablePostId(postId) && commentCountsByPostId[postId] === undefined),
    [commentCountsByPostId, renderedPosts],
  );

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

  useEffect(() => {
    if (pendingCommentPostIds.length === 0) {
      return;
    }

    let isMounted = true;

    const loadCommentCounts = async () => {
      const loadedCommentCounts = await fetchPostCommentCounts(currentLocale, pendingCommentPostIds);

      if (!isMounted) {
        return;
      }

      setCommentCountsByPostId(previous =>
        mergeLoadedCommentCountsByPostId(previous, pendingCommentPostIds, loadedCommentCounts),
      );
    };

    void loadCommentCounts();

    return () => {
      isMounted = false;
    };
  }, [currentLocale, pendingCommentPostIds]);

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

  const pushManagedSearchParams = useCallback(
    (nextParams: URLSearchParams) => {
      const nextQuery = nextParams.toString();
      const nextSearch = nextQuery ? `?${nextQuery}` : '';
      router.push(nextSearch ? `${pathname}${nextSearch}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const updateFilterUrl = useCallback(
    (overrides: Partial<Parameters<typeof buildManagedSearchParams>[1]>) => {
      const nextParams = buildManagedSearchParams(searchParams, {
        sortOrder: effectiveSortOrder,
        selectedTopics: effectiveSelectedTopics,
        categoryFilter: effectiveCategoryFilter,
        dateRange: effectiveDateRange,
        readingTimeRange: effectiveReadingTimeRange,
        sourceFilter: parsedQueryState.sourceFilter,
        size: routeSize,
        page: 1,
        ...overrides,
      });
      pushManagedSearchParams(nextParams);
    },
    [
      effectiveCategoryFilter,
      effectiveDateRange,
      effectiveReadingTimeRange,
      effectiveSelectedTopics,
      parsedQueryState.sourceFilter,
      pushManagedSearchParams,
      routeSize,
      searchParams,
      effectiveSortOrder,
    ],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = buildManagedSearchParams(searchParams, {
        sortOrder: effectiveSortOrder,
        selectedTopics: effectiveSelectedTopics,
        categoryFilter: effectiveCategoryFilter,
        dateRange: effectiveDateRange,
        readingTimeRange: effectiveReadingTimeRange,
        sourceFilter: parsedQueryState.sourceFilter,
        page: newPage,
        size: routeSize,
      });
      pushManagedSearchParams(params);
      scrollToListStart();
    },
    [
      effectiveCategoryFilter,
      effectiveDateRange,
      effectiveReadingTimeRange,
      effectiveSelectedTopics,
      effectiveSortOrder,
      parsedQueryState.sourceFilter,
      pushManagedSearchParams,
      routeSize,
      scrollToListStart,
      searchParams,
    ],
  );

  const handleSizeChange = useCallback(
    (size: number) => {
      const params = buildManagedSearchParams(searchParams, {
        sortOrder: effectiveSortOrder,
        selectedTopics: effectiveSelectedTopics,
        categoryFilter: effectiveCategoryFilter,
        dateRange: effectiveDateRange,
        readingTimeRange: effectiveReadingTimeRange,
        sourceFilter: parsedQueryState.sourceFilter,
        page: 1,
        size,
      });
      pushManagedSearchParams(params);
      scrollToListStart();
    },
    [
      effectiveCategoryFilter,
      effectiveDateRange,
      effectiveReadingTimeRange,
      effectiveSelectedTopics,
      effectiveSortOrder,
      parsedQueryState.sourceFilter,
      pushManagedSearchParams,
      scrollToListStart,
      searchParams,
    ],
  );

  const handleSourceFilterChange = useCallback(
    (nextSource: SourceFilter) => {
      const params = buildManagedSearchParams(searchParams, {
        sortOrder: effectiveSortOrder,
        selectedTopics: effectiveSelectedTopics,
        categoryFilter: effectiveCategoryFilter,
        dateRange: effectiveDateRange,
        readingTimeRange: effectiveReadingTimeRange,
        sourceFilter: nextSource,
        page: 1,
        size: routeSize,
      });
      pushManagedSearchParams(params);
      scrollToListStart();
    },
    [
      effectiveCategoryFilter,
      effectiveDateRange,
      effectiveReadingTimeRange,
      effectiveSelectedTopics,
      effectiveSortOrder,
      pushManagedSearchParams,
      routeSize,
      scrollToListStart,
      searchParams,
    ],
  );

  return (
    <section className="post-list-section">
      <div ref={listTopRef} />
      <div className="post-list-layout">
        <div className="post-list-content-col">
          <div className="post-list-filters-inline">
            <PostFilters
              topics={topics}
              sourceFilter={parsedQueryState.sourceFilter}
              showSourceFilter={showSourceFilter}
              showCategoryFilter={showCategoryFilter}
              densityMode={resolvedDensityMode}
              onDensityModeChange={mode => setDensityMode(!canUseGridDensity && mode === 'grid' ? 'default' : mode)}
              onSourceFilterChange={handleSourceFilterChange}
              onSortOrderChange={value => {
                dispatch(setSortOrder(value));
                updateFilterUrl({ sortOrder: value });
              }}
              onTopicsChange={value => {
                dispatch(setSelectedTopics(value));
                updateFilterUrl({ selectedTopics: value });
              }}
              onCategoryFilterChange={value => {
                dispatch(setCategoryFilter(value));
                updateFilterUrl({ categoryFilter: value });
              }}
              onDateRangeChange={value => {
                dispatch(setDateRange(value));
                updateFilterUrl({ dateRange: value });
              }}
              onReadingTimeRangeChange={value => {
                dispatch(setReadingTimeRange(value));
                updateFilterUrl({ readingTimeRange: value });
              }}
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
                  showComments
                  commentCount={commentCountsByPostId[post.id] ?? null}
                  commentCountLoading={isTrackablePostId(post.id) && commentCountsByPostId[post.id] === undefined}
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
              size={routeSize}
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
