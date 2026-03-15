import {
  CommentModerationStatus,
  CommentMutationStatus,
  CommentQueryStatus,
  Locale,
} from '@/graphql/generated/graphql';
import { addComment, fetchComments } from '@/lib/commentsApi';
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
        locale: Locale.En,
        postId: 'alpha-post',
        total: 2,
        threads: [
          {
            root: {
              id: 'root-1',
              parentId: null,
              authorName: 'Alice',
              content: 'Root comment',
              createdAt: '2026-03-14T10:00:00.000Z',
            },
            replies: [
              {
                id: 'reply-1',
                parentId: 'root-1',
                authorName: 'Bob',
                content: 'Reply comment',
                createdAt: '2026-03-14T10:05:00.000Z',
              },
            ],
          },
        ],
      },
    });

    await expect(fetchComments('en', ' alpha-post ')).resolves.toEqual({
      status: 'success',
      locale: 'en',
      postId: 'alpha-post',
      total: 2,
      threads: [
        {
          root: {
            id: 'root-1',
            authorName: 'Alice',
            content: 'Root comment',
            createdAt: '2026-03-14T10:00:00.000Z',
          },
          replies: [
            {
              id: 'reply-1',
              parentId: 'root-1',
              authorName: 'Bob',
              content: 'Reply comment',
              createdAt: '2026-03-14T10:05:00.000Z',
            },
          ],
        },
      ],
    });
  });

  it('returns null for invalid read inputs', async () => {
    await expect(fetchComments('de', 'alpha-post')).resolves.toBeNull();
    await expect(fetchComments('en', '   ')).resolves.toBeNull();
    expect(mockedQueryGraphQL).not.toHaveBeenCalled();
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
        locale: 'en',
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
          locale: Locale.En,
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
        locale: 'de',
        postId: 'alpha-post',
        authorName: 'Alice',
        authorEmail: 'alice@example.com',
        content: 'Hello',
      }),
    ).resolves.toBeNull();

    await expect(
      addComment({
        locale: 'en',
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
        locale: 'en',
        postId: 'alpha-post',
        authorName: 'Alice',
        authorEmail: 'alice@example.com',
        content: 'Hello',
      }),
    ).resolves.toEqual({
      postId: 'alpha-post',
    });
  });
});
