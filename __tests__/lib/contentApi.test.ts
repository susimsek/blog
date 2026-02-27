import { fetchPost, fetchPostLikes, fetchPosts, incrementPostHit, incrementPostLike } from '@/lib/contentApi';
import {
  IncrementPostHitDocument,
  IncrementPostLikeDocument,
  PostDocument,
  PostsDocument,
} from '@/graphql/generated/graphql';
import { mutateGraphQL, queryGraphQL } from '@/lib/graphql/apolloClient';

jest.mock('@/lib/graphql/apolloClient', () => ({
  mutateGraphQL: jest.fn(),
  queryGraphQL: jest.fn(),
}));

const queryGraphQLMock = queryGraphQL as jest.Mock;
const mutateGraphQLMock = mutateGraphQL as jest.Mock;

describe('contentApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null for blank locale and id inputs', async () => {
    await expect(fetchPosts('   ')).resolves.toBeNull();
    await expect(fetchPost('en', '   ')).resolves.toBeNull();

    expect(queryGraphQLMock).not.toHaveBeenCalled();
  });

  it('maps posts payload and sanitizes engagement metrics', async () => {
    queryGraphQLMock.mockResolvedValue({
      posts: {
        status: 'success',
        locale: 'en',
        total: 2,
        page: 1,
        size: 5,
        sort: 'DESC',
        engagement: [
          { postId: ' first ', likes: 4.7, hits: 11.2 },
          { postId: 'second', likes: Number.NaN, hits: -3 },
          { postId: '   ', likes: 9, hits: 9 },
        ],
        nodes: [
          {
            id: 'post-1',
            title: 'Post 1',
            readingTime: 6,
            url: '/posts/post-1',
          },
          null,
        ],
      },
    });

    await expect(
      fetchPosts(
        ' en ',
        {
          page: 2,
          size: 10,
          sort: 'desc',
          scopeIds: [' first ', ' ', 'second'],
        },
        { timeoutMs: 1200 },
      ),
    ).resolves.toEqual({
      status: 'success',
      locale: 'en',
      posts: [
        {
          id: 'post-1',
          title: 'Post 1',
          readingTime: 6,
          readingTimeMin: 6,
          url: '/posts/post-1',
          link: '/posts/post-1',
        },
        null,
      ],
      likesByPostId: { first: 4 },
      hitsByPostId: { first: 11, second: 0 },
      total: 2,
      page: 1,
      size: 5,
      sort: 'DESC',
    });

    expect(queryGraphQLMock).toHaveBeenCalledWith(
      PostsDocument,
      {
        locale: 'en',
        input: {
          page: 2,
          size: 10,
          sort: 'DESC',
          scopeIds: ['first', 'second'],
        },
      },
      { timeoutMs: 1200 },
    );
  });

  it('returns null when posts payload is missing', async () => {
    queryGraphQLMock.mockResolvedValue({});

    await expect(fetchPosts('en')).resolves.toBeNull();
  });

  it('maps a post payload and trims invalid metrics', async () => {
    queryGraphQLMock.mockResolvedValue({
      post: {
        status: 'success',
        locale: 'tr',
        node: {
          id: 'post-2',
          title: 'Post 2',
          readingTime: 9,
          url: '/posts/post-2',
        },
        engagement: {
          likes: 8.9,
          hits: -4.2,
        },
      },
    });

    await expect(fetchPost(' tr ', ' post-2 ')).resolves.toEqual({
      status: 'success',
      locale: 'tr',
      post: {
        id: 'post-2',
        title: 'Post 2',
        readingTime: 9,
        readingTimeMin: 9,
        url: '/posts/post-2',
        link: '/posts/post-2',
      },
      likes: 8,
      hits: 0,
    });

    expect(queryGraphQLMock).toHaveBeenCalledWith(
      PostDocument,
      {
        locale: 'tr',
        id: 'post-2',
      },
      {},
    );
  });

  it('returns null when a post payload is missing', async () => {
    queryGraphQLMock.mockResolvedValue({ post: null });

    await expect(fetchPost('en', 'post-1')).resolves.toBeNull();
  });

  it('returns likes for requested post ids and skips invalid numbers', async () => {
    queryGraphQLMock.mockResolvedValue({
      posts: {
        status: 'success',
        engagement: [
          { postId: 'post-1', likes: 11.4, hits: 0 },
          { postId: 'post-2', likes: Number.NaN, hits: 0 },
          { postId: 'post-3', likes: -2, hits: 0 },
        ],
        nodes: [],
      },
    });

    await expect(fetchPostLikes('en', ['post-1', 'post-2', 'post-3'])).resolves.toEqual({
      'post-1': 11,
      'post-3': 0,
    });

    expect(queryGraphQLMock).toHaveBeenCalledWith(
      PostsDocument,
      {
        locale: 'en',
        input: {
          page: 1,
          size: 3,
          scopeIds: ['post-1', 'post-2', 'post-3'],
        },
      },
      {},
    );
  });

  it('returns an empty map for empty post ids and null for invalid responses', async () => {
    await expect(fetchPostLikes('en', [])).resolves.toEqual({});

    queryGraphQLMock.mockResolvedValue({
      posts: {
        status: 'failed',
      },
    });

    await expect(fetchPostLikes('en', ['post-1'])).resolves.toBeNull();
  });

  it('increments post metrics only for successful numeric payloads', async () => {
    mutateGraphQLMock
      .mockResolvedValueOnce({
        incrementPostLike: {
          status: 'success',
          likes: 3.8,
        },
      })
      .mockResolvedValueOnce({
        incrementPostHit: {
          status: 'success',
          hits: -7.3,
        },
      })
      .mockResolvedValueOnce({
        incrementPostLike: {
          status: 'failed',
          likes: 9,
        },
      })
      .mockResolvedValueOnce({
        incrementPostHit: {
          status: 'success',
          hits: Number.NaN,
        },
      });

    await expect(incrementPostLike('post-1')).resolves.toBe(3);
    await expect(incrementPostHit('post-1')).resolves.toBe(0);
    await expect(incrementPostLike('post-2')).resolves.toBeNull();
    await expect(incrementPostHit('post-2')).resolves.toBeNull();

    expect(mutateGraphQLMock).toHaveBeenNthCalledWith(1, IncrementPostLikeDocument, { postId: 'post-1' }, {});
    expect(mutateGraphQLMock).toHaveBeenNthCalledWith(2, IncrementPostHitDocument, { postId: 'post-1' }, {});
  });
});
