import { withBasePath } from '@/lib/basePath';

type ContentApiOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type FetchPostsParams = {
  q?: string;
  page?: number;
  size?: number;
  sort?: 'asc' | 'desc';
  topics?: string[];
  source?: 'all' | 'blog' | 'medium';
  startDate?: string;
  endDate?: string;
  readingTime?: 'any' | '3-7' | '8-12' | '15+';
  scopeIds?: string[];
};

type PostsResponse = {
  status?: string;
  locale?: string;
  posts?: unknown[];
  likesByPostId?: Record<string, number>;
  hitsByPostId?: Record<string, number>;
  total?: number;
  page?: number;
  size?: number;
  sort?: string;
  query?: string;
};

type TopicsResponse = {
  status?: string;
  topics?: unknown[];
};

type ContentLikeResponse = {
  status?: string;
  likes?: number;
  likesByPostId?: Record<string, number>;
  hits?: number;
  hitsByPostId?: Record<string, number>;
};

const DEFAULT_REQUEST_TIMEOUT_MS = 8000;
const CONTENT_API_PATH = '/api/posts';
const TOPICS_API_PATH = '/api/topics';

const normalizeApiBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/g, '') ?? '';

const getContentEndpoints = (apiPath: string) => {
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

const fetchFromEndpoints = async <TResponse>(
  endpoints: string[],
  init: RequestInit,
  options: ContentApiOptions,
): Promise<TResponse | null> => {
  for (const endpoint of endpoints) {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    let removeAbortListener: (() => void) | undefined;
    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        const onAbort = () => controller.abort();
        options.signal.addEventListener('abort', onAbort, { once: true });
        removeAbortListener = () => options.signal?.removeEventListener('abort', onAbort);
      }
    }

    try {
      const response = await fetch(endpoint, {
        ...init,
        signal: controller.signal,
      });
      if (!response.ok) {
        continue;
      }
      const payload = (await response.json().catch(() => null)) as TResponse | null;
      if (!payload) {
        continue;
      }
      return payload;
    } catch {
      // Try next endpoint candidate.
    } finally {
      globalThis.clearTimeout(timeoutId);
      removeAbortListener?.();
    }
  }

  return null;
};

export const fetchPosts = async (
  locale: string,
  params: FetchPostsParams = {},
  options: ContentApiOptions = {},
): Promise<PostsResponse | null> => {
  const queryParams = new URLSearchParams({ locale });
  if (typeof params.q === 'string' && params.q.trim().length > 0) {
    queryParams.set('q', params.q.trim());
  }
  if (typeof params.page === 'number' && Number.isFinite(params.page) && params.page > 0) {
    queryParams.set('page', String(Math.trunc(params.page)));
  }
  if (typeof params.size === 'number' && Number.isFinite(params.size) && params.size > 0) {
    queryParams.set('size', String(Math.trunc(params.size)));
  }
  if (params.sort === 'asc' || params.sort === 'desc') {
    queryParams.set('sort', params.sort);
  }
  if (Array.isArray(params.topics) && params.topics.length > 0) {
    queryParams.set('topics', params.topics.join(','));
  }
  if (params.source === 'all' || params.source === 'blog' || params.source === 'medium') {
    queryParams.set('source', params.source);
  }
  if (typeof params.startDate === 'string' && params.startDate.trim().length > 0) {
    queryParams.set('startDate', params.startDate.trim());
  }
  if (typeof params.endDate === 'string' && params.endDate.trim().length > 0) {
    queryParams.set('endDate', params.endDate.trim());
  }
  if (
    params.readingTime === 'any' ||
    params.readingTime === '3-7' ||
    params.readingTime === '8-12' ||
    params.readingTime === '15+'
  ) {
    queryParams.set('readingTime', params.readingTime);
  }
  if (Array.isArray(params.scopeIds) && params.scopeIds.length > 0) {
    queryParams.set('scopeIds', params.scopeIds.join(','));
  }

  const query = queryParams.toString();
  const endpoints = getContentEndpoints(`${CONTENT_API_PATH}?${query}`);
  return fetchFromEndpoints<PostsResponse>(
    endpoints,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    },
    options,
  );
};

export const fetchTopics = async (locale: string, options: ContentApiOptions = {}): Promise<TopicsResponse | null> => {
  const query = new URLSearchParams({ locale }).toString();
  const endpoints = getContentEndpoints(`${TOPICS_API_PATH}?${query}`);
  return fetchFromEndpoints<TopicsResponse>(
    endpoints,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    },
    options,
  );
};

export const fetchPostLikes = async (
  postIds: string[],
  options: ContentApiOptions = {},
): Promise<Record<string, number> | null> => {
  if (postIds.length === 0) {
    return {};
  }

  const query = new URLSearchParams({ postIds: postIds.join(',') }).toString();
  const endpoints = getContentEndpoints(`${CONTENT_API_PATH}?${query}`);
  const payload = await fetchFromEndpoints<ContentLikeResponse>(
    endpoints,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    },
    options,
  );

  if (!payload || payload.status !== 'success' || !payload.likesByPostId) {
    return null;
  }

  return Object.entries(payload.likesByPostId).reduce<Record<string, number>>((result, [postId, likes]) => {
    if (typeof likes !== 'number' || Number.isNaN(likes)) {
      return result;
    }
    result[postId] = Math.max(0, Math.trunc(likes));
    return result;
  }, {});
};

export const incrementPostLike = async (postId: string, options: ContentApiOptions = {}): Promise<number | null> => {
  const endpoints = getContentEndpoints(CONTENT_API_PATH);
  const payload = await fetchFromEndpoints<ContentLikeResponse>(
    endpoints,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ postId }),
    },
    options,
  );

  if (!payload || payload.status !== 'success' || typeof payload.likes !== 'number' || Number.isNaN(payload.likes)) {
    return null;
  }

  return Math.max(0, Math.trunc(payload.likes));
};

export const incrementPostHit = async (postId: string, options: ContentApiOptions = {}): Promise<number | null> => {
  const endpoints = getContentEndpoints(CONTENT_API_PATH);
  const payload = await fetchFromEndpoints<ContentLikeResponse>(
    endpoints,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ postId, action: 'hit' }),
    },
    options,
  );

  if (!payload || payload.status !== 'success' || typeof payload.hits !== 'number' || Number.isNaN(payload.hits)) {
    return null;
  }

  return Math.max(0, Math.trunc(payload.hits));
};
