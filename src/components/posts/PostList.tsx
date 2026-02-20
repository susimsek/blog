import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useParams, useSearchParams } from 'next/navigation';
import { PostSummary } from '@/types/posts';
import PaginationBar from '@/components/pagination/PaginationBar';
import PostCard from '@/components/posts/PostSummary';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PostFilters } from './PostFilters';
import useDebounce from '@/hooks/useDebounce';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { setPage, setPageSize, setQuery, setSourceFilter } from '@/reducers/postsQuery';
import { fetchPostLikes, fetchPosts } from '@/lib/contentApi';
import { defaultLocale } from '@/i18n/settings';

interface PostListProps {
  posts: PostSummary[];
  noPostsFoundMessage?: string;
  highlightQuery?: string;
  showLikes?: boolean;
}

const normalizeServerPosts = (posts: ReadonlyArray<unknown>): PostSummary[] =>
  posts.flatMap(post => {
    if (!post || typeof post !== 'object') {
      return [];
    }

    const candidate = post as Partial<PostSummary>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.title !== 'string' ||
      typeof candidate.publishedDate !== 'string' ||
      typeof candidate.summary !== 'string' ||
      typeof candidate.readingTimeMin !== 'number' ||
      !Number.isFinite(candidate.readingTimeMin) ||
      candidate.readingTimeMin <= 0 ||
      (candidate.updatedDate !== undefined && typeof candidate.updatedDate !== 'string') ||
      typeof candidate.searchText !== 'string' ||
      (candidate.thumbnail !== null && typeof candidate.thumbnail !== 'string') ||
      (candidate.topics !== undefined && !Array.isArray(candidate.topics)) ||
      (candidate.source !== undefined && candidate.source !== 'blog' && candidate.source !== 'medium')
    ) {
      return [];
    }

    return [
      {
        id: candidate.id,
        title: candidate.title,
        publishedDate: candidate.publishedDate,
        ...(typeof candidate.updatedDate === 'string' ? { updatedDate: candidate.updatedDate } : {}),
        summary: candidate.summary,
        thumbnail: candidate.thumbnail,
        topics: candidate.topics,
        readingTimeMin: candidate.readingTimeMin,
        searchText: candidate.searchText,
        source: candidate.source === 'medium' ? 'medium' : 'blog',
        ...(typeof candidate.link === 'string' ? { link: candidate.link } : {}),
      },
    ];
  });

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
  const currentLocale = routeLocale ?? defaultLocale;
  const isSearchRoute = /(?:^|\/)search(?:\/|$)/.test(pathname);
  const isMediumRoute = /(?:^|\/)medium(?:\/|$)/.test(pathname);
  const isHomeRoute = /^\/(?:[a-z]{2})?$/.test(pathname);
  const shouldUseScope = /(?:^|\/)topics(?:\/|$)/.test(pathname);
  const showSourceFilter = isSearchRoute;
  const routeSearchParams = useSearchParams();
  const routeSearchParamsString = routeSearchParams?.toString() ?? '';
  const [likesByPostId, setLikesByPostId] = useState<Record<string, number>>({});
  const [serverPosts, setServerPosts] = useState<PostSummary[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const searchParams = useMemo(() => new URLSearchParams(routeSearchParamsString), [routeSearchParamsString]);
  const dispatch = useAppDispatch();
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const lastSyncedRouteRef = useRef<string>('');
  const { query, sortOrder, selectedTopics, sourceFilter, dateRange, readingTimeRange, page, pageSize } =
    useAppSelector(state => state.postsQuery);
  const effectiveSourceFilter = isSearchRoute ? sourceFilter : isMediumRoute ? 'medium' : isHomeRoute ? 'blog' : 'all';
  const debouncedSearchQuery = useDebounce(query, 500);
  const scopedPostIds = useMemo(() => posts.map(post => post.id), [posts]);

  useEffect(() => {
    const routePageValue = searchParams.get('page');
    const parsedPage = Number.parseInt(routePageValue ?? '', 10);
    const routePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const routeSizeValue = searchParams.get('size');
    const parsedSize = Number.parseInt(routeSizeValue ?? '', 10);
    const routeSize = Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : 5;

    const routeQuery = searchParams.get('q') ?? '';
    const routeSourceValue = searchParams.get('source');
    const routeSource =
      routeSourceValue === 'blog' || routeSourceValue === 'medium' || routeSourceValue === 'all'
        ? routeSourceValue
        : 'all';
    const routeKey = `${pathname}|${routePage}|${routeSize}|${routeQuery}|${routeSource}`;
    if (lastSyncedRouteRef.current === routeKey) {
      return;
    }
    lastSyncedRouteRef.current = routeKey;

    dispatch(setQuery(routeQuery));
    dispatch(setPageSize(routeSize));
    dispatch(setPage(routePage));
    if (isSearchRoute) {
      dispatch(setSourceFilter(routeSource));
    }
  }, [dispatch, isSearchRoute, pathname, searchParams]);

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

  useEffect(() => {
    const controller = new AbortController();

    const loadPosts = async () => {
      setIsLoadingPosts(true);
      const payload = await fetchPosts(
        currentLocale,
        {
          q: debouncedSearchQuery.trim() || undefined,
          page,
          size: pageSize,
          sort: sortOrder,
          topics: selectedTopics,
          source: effectiveSourceFilter,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          readingTime: readingTimeRange,
          scopeIds: shouldUseScope ? scopedPostIds : undefined,
        },
        { signal: controller.signal },
      );

      if (controller.signal.aborted) {
        return;
      }

      if (!payload || payload.status !== 'success') {
        setServerPosts([]);
        setTotalResults(0);
        setIsLoadingPosts(false);
        return;
      }

      const normalizedPosts = Array.isArray(payload.posts) ? normalizeServerPosts(payload.posts) : [];
      const resolvedTotal =
        typeof payload.total === 'number' && Number.isFinite(payload.total) && payload.total >= 0
          ? Math.trunc(payload.total)
          : normalizedPosts.length;
      const resolvedPage =
        typeof payload.page === 'number' && Number.isFinite(payload.page) && payload.page > 0
          ? Math.trunc(payload.page)
          : page;

      setServerPosts(normalizedPosts);
      setTotalResults(resolvedTotal);
      setIsLoadingPosts(false);

      if (resolvedPage !== page) {
        dispatch(setPage(resolvedPage));
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(resolvedPage));
        params.set('size', String(pageSize));
        const nextQuery = params.toString();
        const nextSearch = nextQuery ? `?${nextQuery}` : '';
        router.push(nextSearch ? `${pathname}${nextSearch}` : pathname, { scroll: false });
      }
    };

    void loadPosts();

    return () => {
      controller.abort();
    };
  }, [
    currentLocale,
    dateRange.endDate,
    dateRange.startDate,
    debouncedSearchQuery,
    dispatch,
    effectiveSourceFilter,
    isSearchRoute,
    page,
    pageSize,
    pathname,
    readingTimeRange,
    router,
    scopedPostIds,
    searchParams,
    selectedTopics,
    shouldUseScope,
    sortOrder,
    sourceFilter,
  ]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalResults / pageSize)), [totalResults, pageSize]);

  const pendingLikePostIds = useMemo(() => {
    if (!showLikes) {
      return [];
    }
    return serverPosts.map(post => post.id).filter(postId => likesByPostId[postId] === undefined);
  }, [likesByPostId, serverPosts, showLikes]);

  useEffect(() => {
    if (!showLikes || pendingLikePostIds.length === 0) {
      return;
    }

    let isMounted = true;

    const loadLikes = async () => {
      const loadedLikes = await fetchPostLikes(pendingLikePostIds);

      if (!isMounted) {
        return;
      }

      if (loadedLikes) {
        setLikesByPostId(previous => ({ ...previous, ...loadedLikes }));
      }
    };

    void loadLikes();

    return () => {
      isMounted = false;
    };
  }, [pendingLikePostIds, showLikes]);

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
      <PostFilters showSourceFilter={showSourceFilter} />
      {isLoadingPosts ? (
        <div className="post-card d-flex align-items-center post-list-empty">
          <div className="post-card-content flex-grow-1 text-center text-muted px-4 py-4">
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            <span className="visually-hidden">{t('post.like.loading')}</span>
          </div>
        </div>
      ) : serverPosts.length > 0 ? (
        serverPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            highlightQuery={highlightQuery?.trim() ? highlightQuery : undefined}
            showSource={isSearchRoute}
            showLikes={showLikes}
            likeCount={likesByPostId[post.id] ?? null}
            likeCountLoading={showLikes && likesByPostId[post.id] === undefined}
          />
        ))
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
          currentPage={page}
          totalPages={totalPages}
          size={pageSize}
          onPageChange={handlePageChange}
          onSizeChange={handleSizeChange}
          totalResults={totalResults}
        />
      )}
    </section>
  );
}
