import { CommentModerationStatus, CommentMutationStatus, CommentQueryStatus } from '@/graphql/generated/graphql';
import { addComment, fetchComments, normalizeCommentItem, normalizeCommentThreads } from '@/lib/commentsApi';
import { mutateGraphQL, queryGraphQL } from '@/lib/graphql/apolloClient';

jest.mock('@/lib/graphql/apolloClient', () => ({
  queryGraphQL: jest.fn(),
  mutateGraphQL: jest.fn(),
}));

const mockedQueryGraphQL = jest.mocked(queryGraphQL);
const mockedMutateGraphQL = jest.mocked(mutateGraphQL);

describe('commentsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes comment query payloads into app threads', async () => {
    mockedQueryGraphQL.mockResolvedValue({
      comments: {
        status: CommentQueryStatus.Success,
        postId: 'alpha-post',
        total: 2,
        threads: [
          {
            root: {
              id: 'root-1',
              parentId: null,
              authorName: 'Alice',
              avatarUrl: 'https://example.com/alice.png',
              content: 'Root comment',
              createdAt: '2026-03-14T10:00:00.000Z',
            },
            replies: [
              {
                id: 'reply-1',
                parentId: 'root-1',
                authorName: 'Bob',
                avatarUrl: 'https://example.com/bob.png',
                content: 'Reply comment',
                createdAt: '2026-03-14T10:05:00.000Z',
              },
            ],
          },
        ],
      },
    });

    await expect(fetchComments(' alpha-post ')).resolves.toEqual({
      status: 'success',
      postId: 'alpha-post',
      total: 2,
      threads: [
        {
          root: {
            id: 'root-1',
            authorName: 'Alice',
            avatarUrl: 'https://example.com/alice.png',
            content: 'Root comment',
            createdAt: '2026-03-14T10:00:00.000Z',
          },
          replies: [
            {
              id: 'reply-1',
              parentId: 'root-1',
              authorName: 'Bob',
              avatarUrl: 'https://example.com/bob.png',
              content: 'Reply comment',
              createdAt: '2026-03-14T10:05:00.000Z',
            },
          ],
        },
      ],
    });
  });

  it('returns null for invalid read inputs', async () => {
    await expect(fetchComments('   ')).resolves.toBeNull();
    expect(mockedQueryGraphQL).not.toHaveBeenCalled();
  });

  it('returns null when the comments query payload is empty', async () => {
    mockedQueryGraphQL.mockResolvedValue({});

    await expect(fetchComments('alpha-post')).resolves.toBeNull();
  });

  it('normalizes add comment mutation payloads', async () => {
    mockedMutateGraphQL.mockResolvedValue({
      addComment: {
        status: CommentMutationStatus.Success,
        postId: 'alpha-post',
        moderationStatus: CommentModerationStatus.Pending,
      },
    });

    await expect(
      addComment({
        postId: ' alpha-post ',
        parentId: ' root-1 ',
        authorName: 'Alice',
        authorEmail: 'alice@example.com',
        content: 'Hello',
      }),
    ).resolves.toEqual({
      status: 'success',
      postId: 'alpha-post',
      moderationStatus: 'pending',
    });

    expect(mockedMutateGraphQL).toHaveBeenCalledWith(
      expect.anything(),
      {
        input: {
          postId: 'alpha-post',
          parentId: 'root-1',
          authorName: 'Alice',
          authorEmail: 'alice@example.com',
          content: 'Hello',
        },
      },
      {},
    );
  });

  it('returns null for invalid mutation inputs', async () => {
    await expect(
      addComment({
        postId: '   ',
        authorName: 'Alice',
        authorEmail: 'alice@example.com',
        content: 'Hello',
      }),
    ).resolves.toBeNull();

    expect(mockedMutateGraphQL).toHaveBeenCalledTimes(0);
  });

  it('ignores non-string enum-like payload values safely', async () => {
    mockedMutateGraphQL.mockResolvedValue({
      addComment: {
        status: undefined,
        postId: 'alpha-post',
        moderationStatus: undefined,
      },
    });

    await expect(
      addComment({
        postId: 'alpha-post',
        authorName: 'Alice',
        authorEmail: 'alice@example.com',
        content: 'Hello',
      }),
    ).resolves.toEqual({
      postId: 'alpha-post',
    });
  });

  it('returns null when the add comment payload is empty', async () => {
    mockedMutateGraphQL.mockResolvedValue({});

    await expect(
      addComment({
        postId: 'alpha-post',
        authorName: 'Alice',
        authorEmail: 'alice@example.com',
        content: 'Hello',
      }),
    ).resolves.toBeNull();
  });

  it('normalizes comment items and threads by trimming optional fields', () => {
    expect(normalizeCommentItem(null)).toBeUndefined();

    expect(
      normalizeCommentItem({
        id: 'root-1',
        parentId: ' root-parent ',
        authorName: 'Alice',
        avatarUrl: ' https://example.com/avatar.png ',
        content: 'Hello',
        createdAt: '2026-03-14T10:00:00.000Z',
      }),
    ).toEqual({
      id: 'root-1',
      parentId: 'root-parent',
      authorName: 'Alice',
      avatarUrl: 'https://example.com/avatar.png',
      content: 'Hello',
      createdAt: '2026-03-14T10:00:00.000Z',
    });

    expect(
      normalizeCommentThreads([
        {
          root: {
            id: 'root-1',
            parentId: '   ',
            authorName: 'Alice',
            avatarUrl: '   ',
            content: 'Root',
            createdAt: '2026-03-14T10:00:00.000Z',
          },
          replies: [
            {
              id: 'reply-1',
              parentId: ' root-1 ',
              authorName: 'Bob',
              avatarUrl: null,
              content: 'Reply',
              createdAt: '2026-03-14T10:05:00.000Z',
            },
          ],
        },
      ]),
    ).toEqual([
      {
        root: {
          id: 'root-1',
          authorName: 'Alice',
          content: 'Root',
          createdAt: '2026-03-14T10:00:00.000Z',
        },
        replies: [
          {
            id: 'reply-1',
            parentId: 'root-1',
            authorName: 'Bob',
            content: 'Reply',
            createdAt: '2026-03-14T10:05:00.000Z',
          },
        ],
      },
    ]);
  });
});
