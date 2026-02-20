import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PostSummary } from '@/types/posts';
import PaginationBar from '@/components/pagination/PaginationBar';
import PostCard from '@/components/posts/PostSummary';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  filterByTopics,
  filterBySource,
  filterByDateRange,
  filterByReadingTime,
  sortPosts,
  searchPostsByRelevance,
} from '@/lib/postFilters';
import { PostFilters } from './PostFilters';
import useDebounce from '@/hooks/useDebounce';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { setPage, setPageSize, setQuery } from '@/reducers/postsQuery';
import { withBasePath } from '@/lib/basePath';

type PostLikesBatchResponse = {
  status?: string;
  likesByPostId?: Record<string, number>;
};

const LIKE_BATCH_REQUEST_TIMEOUT_MS = 8000;

const normalizeApiBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/g, '') ?? '';

const getLikeEndpoints = (apiPath: string) => {
  const prefixedEndpoint = withBasePath(apiPath);
  const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  const endpoints = new Set<string>();

  if (apiBaseUrl) {
    endpoints.add(`${apiBaseUrl}${apiPath}`);
    endpoints.add(`${apiBaseUrl}${prefixedEndpoint}`);
  }

  endpoints.add(prefixedEndpoint);
  endpoints.add(apiPath);
  return [...endpoints];
};

interface PostListProps {
  posts: PostSummary[];
  noPostsFoundMessage?: string;
  highlightQuery?: string;
  showLikes?: boolean;
}

export default function PostList({
  posts,
  noPostsFoundMessage,
  highlightQuery,
  showLikes = false,
}: Readonly<PostListProps>) {
  const { t } = useTranslation(['post', 'common']);
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const isSearchRoute = /(?:^|\/)search(?:\/|$)/.test(pathname);
  const [urlSearch, setUrlSearch] = React.useState('');
  const [likesByPostId, setLikesByPostId] = React.useState<Record<string, number>>({});
  const [loadingLikePostIds, setLoadingLikePostIds] = React.useState<Record<string, boolean>>({});
  const searchParams = useMemo(
    () => new URLSearchParams(urlSearch.startsWith('?') ? urlSearch.slice(1) : urlSearch),
    [urlSearch],
  );
  const dispatch = useAppDispatch();
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const lastSyncedRouteRef = useRef<string>('');
  const {
    query,
    sortOrder,
    selectedTopics,
    sourceFilter,
    dateRange,
    readingTimeRange,
    page,
    pageSize,
    posts: fetchedPosts,
  } = useAppSelector(state => state.postsQuery);
  const debouncedSearchQuery = useDebounce(query, 500);

  const scopedPostIds = useMemo(() => new Set(posts.map(post => post.id)), [posts]);
  const sourcePosts = useMemo(
    () => fetchedPosts.filter(post => scopedPostIds.has(post.id)),
    [fetchedPosts, scopedPostIds],
  );

  useEffect(() => {
    if (typeof globalThis.window === 'undefined') {
      return;
    }

    const syncSearchFromLocation = () => {
      setUrlSearch(globalThis.window.location.search);
    };

    syncSearchFromLocation();
    globalThis.window.addEventListener('popstate', syncSearchFromLocation);

    return () => {
      globalThis.window.removeEventListener('popstate', syncSearchFromLocation);
    };
  }, [pathname]);

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
      sourcePosts.filter(
        post =>
          filterByTopics(post, selectedTopics) &&
          filterBySource(post, isSearchRoute ? sourceFilter : 'all') &&
          filterByDateRange(post, dateRange) &&
          filterByReadingTime(post, readingTimeRange),
      ),
    [sourcePosts, selectedTopics, sourceFilter, dateRange, readingTimeRange, isSearchRoute],
  );

  const sortedPosts = useMemo(() => {
    const query = debouncedSearchQuery.trim();
    if (!query) {
      return sortPosts(filteredPosts, sortOrder);
    }

    const matchedPosts = searchPostsByRelevance(filteredPosts, query);
    return sortPosts(matchedPosts, sortOrder);
  }, [filteredPosts, debouncedSearchQuery, sortOrder]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedPosts.length / pageSize)),
    [sortedPosts.length, pageSize],
  );

  useEffect(() => {
    const normalizedPage = Math.min(Math.max(page, 1), totalPages);
    if (page === normalizedPage) {
      return;
    }

    dispatch(setPage(normalizedPage));
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(normalizedPage));
    params.set('size', String(pageSize));
    const nextQuery = params.toString();
    const nextSearch = nextQuery ? `?${nextQuery}` : '';
    router.push(nextSearch ? `${pathname}${nextSearch}` : pathname, { scroll: false });
  }, [dispatch, page, pageSize, pathname, router, searchParams, totalPages]);

  const paginatedPosts = useMemo(
    () => sortedPosts.slice((page - 1) * pageSize, page * pageSize),
    [sortedPosts, page, pageSize],
  );

  const pendingLikePostIds = useMemo(() => {
    if (!showLikes) {
      return [];
    }

    return paginatedPosts.map(post => post.id).filter(postId => likesByPostId[postId] === undefined);
  }, [likesByPostId, paginatedPosts, showLikes]);

  useEffect(() => {
    if (!showLikes || pendingLikePostIds.length === 0) {
      return;
    }

    let isMounted = true;

    const loadLikes = async () => {
      setLoadingLikePostIds(previous => {
        const next = { ...previous };
        pendingLikePostIds.forEach(postId => {
          next[postId] = true;
        });
        return next;
      });

      const postIdsParam = encodeURIComponent(pendingLikePostIds.join(','));
      const endpoints = getLikeEndpoints(`/api/post-likes?postIds=${postIdsParam}`);
      let loadedLikes: Record<string, number> | null = null;

      for (const endpoint of endpoints) {
        const controller = new AbortController();
        const timeoutID = globalThis.setTimeout(() => controller.abort(), LIKE_BATCH_REQUEST_TIMEOUT_MS);

        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          });
          const payload = (await response.json().catch(() => null)) as PostLikesBatchResponse | null;
          if (!response.ok || payload?.status !== 'success' || !payload.likesByPostId) {
            continue;
          }

          const normalizedLikes = Object.entries(payload.likesByPostId).reduce<Record<string, number>>(
            (result, [postId, likes]) => {
              if (typeof likes !== 'number' || Number.isNaN(likes)) {
                return result;
              }

              result[postId] = Math.max(0, Math.trunc(likes));
              return result;
            },
            {},
          );

          loadedLikes = normalizedLikes;
          break;
        } catch {
          // Try next endpoint candidate.
        } finally {
          globalThis.clearTimeout(timeoutID);
        }
      }

      if (!isMounted) {
        return;
      }

      if (loadedLikes) {
        setLikesByPostId(previous => ({ ...previous, ...loadedLikes }));
      }

      setLoadingLikePostIds(previous => {
        const next = { ...previous };
        pendingLikePostIds.forEach(postId => {
          delete next[postId];
        });
        return next;
      });
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
      setUrlSearch(nextSearch);
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
      setUrlSearch(nextSearch);
      router.push(nextSearch ? `${pathname}${nextSearch}` : pathname, { scroll: false });
      scrollToListStart();
    },
    [dispatch, pathname, router, scrollToListStart, searchParams],
  );

  return (
    <section className="post-list-section">
      <div ref={listTopRef} />
      <PostFilters showSourceFilter={isSearchRoute} />
      {paginatedPosts.length > 0 ? (
        paginatedPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            highlightQuery={highlightQuery?.trim() ? highlightQuery : undefined}
            showSource={isSearchRoute}
            showLikes={showLikes}
            likeCount={likesByPostId[post.id] ?? null}
            likeCountLoading={showLikes && likesByPostId[post.id] === undefined && Boolean(loadingLikePostIds[post.id])}
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
      {sortedPosts.length > 0 && (
        <PaginationBar
          currentPage={page}
          totalPages={totalPages}
          size={pageSize}
          onPageChange={handlePageChange}
          onSizeChange={handleSizeChange}
          totalResults={sortedPosts.length}
        />
      )}
    </section>
  );
}
