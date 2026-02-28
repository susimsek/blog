import {
  IncrementPostHitDocument,
  IncrementPostLikeDocument,
  PostDocument,
  PostMetricStatus,
  PostsDocument,
  PostsQueryInput,
  SortOrder,
} from '@/graphql/generated/graphql';
import { mutateGraphQL, queryGraphQL } from '@/lib/graphql/apolloClient';
import {
  fromContentQueryStatus,
  fromGraphQLLocale,
  fromGraphQLSortOrder,
  fromPostMetricStatus,
  toGraphQLLocale,
} from '@/lib/graphql/enumMappers';

type ContentApiOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type FetchPostsParams = {
  page?: number;
  size?: number;
  sort?: 'asc' | 'desc';
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
};

type PostResponse = {
  status?: string;
  locale?: string;
  post?: unknown;
  likes?: number;
  hits?: number;
};

type ContentLikeResponse = {
  status?: string;
  likes?: number;
  hits?: number;
};

type EngagementMetric = {
  postId: string;
  likes: number;
  hits: number;
};

const mapSortOrder = (value: FetchPostsParams['sort']) => {
  if (value === 'asc') {
    return SortOrder.Asc;
  }
  if (value === 'desc') {
    return SortOrder.Desc;
  }
  return undefined;
};

const mapEngagementToRecords = (metrics: ReadonlyArray<EngagementMetric>) =>
  metrics.reduce<{
    likesByPostId: Record<string, number>;
    hitsByPostId: Record<string, number>;
  }>(
    (result, metric) => {
      if (typeof metric.postId !== 'string' || metric.postId.trim() === '') {
        return result;
      }

      const postId = metric.postId.trim();
      if (typeof metric.likes === 'number' && Number.isFinite(metric.likes)) {
        result.likesByPostId[postId] = Math.max(0, Math.trunc(metric.likes));
      }
      if (typeof metric.hits === 'number' && Number.isFinite(metric.hits)) {
        result.hitsByPostId[postId] = Math.max(0, Math.trunc(metric.hits));
      }

      return result;
    },
    {
      likesByPostId: {},
      hitsByPostId: {},
    },
  );

const normalizeGraphQLPosts = (posts: unknown[] | undefined): unknown[] =>
  (posts ?? []).map(post => {
    if (!post || typeof post !== 'object') {
      return post;
    }

    const candidate = post as Record<string, unknown>;
    const normalized = { ...candidate };

    if (typeof candidate.readingTime === 'number' && !('readingTimeMin' in normalized)) {
      normalized.readingTimeMin = candidate.readingTime;
    }
    if (typeof candidate.url === 'string' && !('link' in normalized)) {
      normalized.link = candidate.url;
    }

    return normalized;
  });

const buildPostsQueryInput = (params: FetchPostsParams): PostsQueryInput | undefined => {
  const input: PostsQueryInput = {};
  let hasInput = false;

  if (typeof params.page === 'number' && Number.isFinite(params.page) && params.page > 0) {
    input.page = Math.trunc(params.page);
    hasInput = true;
  }
  if (typeof params.size === 'number' && Number.isFinite(params.size) && params.size > 0) {
    input.size = Math.trunc(params.size);
    hasInput = true;
  }

  const sortOrder = mapSortOrder(params.sort);
  if (sortOrder) {
    input.sort = sortOrder;
    hasInput = true;
  }

  if (Array.isArray(params.scopeIds) && params.scopeIds.length > 0) {
    input.scopeIds = params.scopeIds.map(postId => postId.trim()).filter(postId => postId.length > 0);
    if (input.scopeIds.length > 0) {
      hasInput = true;
    }
  }

  return hasInput ? input : undefined;
};

export const fetchPosts = async (
  locale: string,
  params: FetchPostsParams = {},
  options: ContentApiOptions = {},
): Promise<PostsResponse | null> => {
  const normalizedLocale = locale.trim();
  const graphQLLocale = toGraphQLLocale(normalizedLocale);
  if (!graphQLLocale) {
    return null;
  }

  const result = await queryGraphQL(
    PostsDocument,
    {
      locale: graphQLLocale,
      input: buildPostsQueryInput(params),
    },
    options,
  );

  const payload = result?.posts;
  if (!payload) {
    return null;
  }

  return {
    ...(fromContentQueryStatus(payload.status) ? { status: fromContentQueryStatus(payload.status) } : {}),
    ...(fromGraphQLLocale(payload.locale) ? { locale: fromGraphQLLocale(payload.locale) } : {}),
    posts: normalizeGraphQLPosts(payload.nodes),
    ...mapEngagementToRecords(payload.engagement ?? []),
    total: payload.total,
    page: payload.page,
    size: payload.size,
    ...(fromGraphQLSortOrder(payload.sort) ? { sort: fromGraphQLSortOrder(payload.sort) } : {}),
  };
};

export const fetchPost = async (
  locale: string,
  id: string,
  options: ContentApiOptions = {},
): Promise<PostResponse | null> => {
  const normalizedLocale = locale.trim();
  const normalizedID = id.trim();
  const graphQLLocale = toGraphQLLocale(normalizedLocale);
  if (!graphQLLocale || normalizedID.length === 0) {
    return null;
  }

  const result = await queryGraphQL(
    PostDocument,
    {
      locale: graphQLLocale,
      id: normalizedID,
    },
    options,
  );

  const payload = result?.post;
  if (!payload) {
    return null;
  }

  const normalizedPost = payload.node ? normalizeGraphQLPosts([payload.node])[0] : null;
  const likes = payload.engagement?.likes;
  const hits = payload.engagement?.hits;

  return {
    ...(fromContentQueryStatus(payload.status) ? { status: fromContentQueryStatus(payload.status) } : {}),
    ...(fromGraphQLLocale(payload.locale) ? { locale: fromGraphQLLocale(payload.locale) } : {}),
    post: normalizedPost,
    ...(typeof likes === 'number' && Number.isFinite(likes) ? { likes: Math.max(0, Math.trunc(likes)) } : {}),
    ...(typeof hits === 'number' && Number.isFinite(hits) ? { hits: Math.max(0, Math.trunc(hits)) } : {}),
  };
};

export const fetchPostLikes = async (
  locale: string,
  postIds: string[],
  options: ContentApiOptions = {},
): Promise<Record<string, number> | null> => {
  if (postIds.length === 0) {
    return {};
  }

  const payload = await fetchPosts(
    locale,
    {
      page: 1,
      size: Math.max(1, postIds.length),
      scopeIds: postIds,
    },
    options,
  );

  if (payload?.status !== 'success' || !payload.likesByPostId) {
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
  const payload = await mutateGraphQL(IncrementPostLikeDocument, { postId }, options);
  const result = payload?.incrementPostLike as ContentLikeResponse | undefined;

  if (
    fromPostMetricStatus((result as { status?: PostMetricStatus } | undefined)?.status) !== 'success' ||
    typeof result?.likes !== 'number' ||
    Number.isNaN(result.likes)
  ) {
    return null;
  }

  return Math.max(0, Math.trunc(result.likes));
};

export const incrementPostHit = async (postId: string, options: ContentApiOptions = {}): Promise<number | null> => {
  const payload = await mutateGraphQL(IncrementPostHitDocument, { postId }, options);
  const result = payload?.incrementPostHit as ContentLikeResponse | undefined;

  if (
    fromPostMetricStatus((result as { status?: PostMetricStatus } | undefined)?.status) !== 'success' ||
    typeof result?.hits !== 'number' ||
    Number.isNaN(result.hits)
  ) {
    return null;
  }

  return Math.max(0, Math.trunc(result.hits));
};
