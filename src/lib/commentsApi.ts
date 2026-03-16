import { AddCommentDocument, CommentsDocument } from '@/graphql/generated/graphql';
import { mutateGraphQL, queryGraphQL } from '@/lib/graphql/apolloClient';
import {
  fromCommentModerationStatus,
  fromCommentMutationStatus,
  fromCommentQueryStatus,
} from '@/lib/graphql/enumMappers';
import type { CommentThread as AppCommentThread } from '@/types/comments';

type CommentApiOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type FetchCommentsResult = {
  status?: string;
  postId?: string;
  total: number;
  threads: AppCommentThread[];
};

export type AddCommentResult = {
  status?: string;
  postId?: string;
  moderationStatus?: string;
};

export const normalizeCommentThreads = (
  threads:
    | ReadonlyArray<{
        root: {
          id: string;
          parentId?: string | null;
          authorName: string;
          avatarUrl?: string | null;
          content: string;
          createdAt: string;
        };
        replies: ReadonlyArray<{
          id: string;
          parentId?: string | null;
          authorName: string;
          avatarUrl?: string | null;
          content: string;
          createdAt: string;
        }>;
      }>
    | null
    | undefined,
): AppCommentThread[] =>
  (threads ?? []).map(thread => ({
    root: {
      id: thread.root.id,
      ...(typeof thread.root.parentId === 'string' && thread.root.parentId.trim() !== ''
        ? { parentId: thread.root.parentId.trim() }
        : {}),
      authorName: thread.root.authorName,
      ...(typeof thread.root.avatarUrl === 'string' && thread.root.avatarUrl.trim() !== ''
        ? { avatarUrl: thread.root.avatarUrl.trim() }
        : {}),
      content: thread.root.content,
      createdAt: thread.root.createdAt,
    },
    replies: (thread.replies ?? []).map(reply => ({
      id: reply.id,
      ...(typeof reply.parentId === 'string' && reply.parentId.trim() !== ''
        ? { parentId: reply.parentId.trim() }
        : {}),
      authorName: reply.authorName,
      ...(typeof reply.avatarUrl === 'string' && reply.avatarUrl.trim() !== ''
        ? { avatarUrl: reply.avatarUrl.trim() }
        : {}),
      content: reply.content,
      createdAt: reply.createdAt,
    })),
  }));

export const fetchComments = async (
  postId: string,
  options: CommentApiOptions = {},
): Promise<FetchCommentsResult | null> => {
  const normalizedPostID = postId.trim();
  if (normalizedPostID === '') {
    return null;
  }

  const payload = await queryGraphQL(
    CommentsDocument,
    {
      postId: normalizedPostID,
    },
    options,
  );

  const result = payload?.comments;
  if (!result) {
    return null;
  }

  return {
    ...(fromCommentQueryStatus(result.status) ? { status: fromCommentQueryStatus(result.status) } : {}),
    ...(typeof result.postId === 'string' ? { postId: result.postId.trim() } : {}),
    total: typeof result.total === 'number' ? Math.max(0, Math.trunc(result.total)) : 0,
    threads: normalizeCommentThreads(result.threads),
  };
};

export const addComment = async (
  input: {
    postId: string;
    parentId?: string;
    authorName: string;
    authorEmail: string;
    content: string;
  },
  options: CommentApiOptions = {},
): Promise<AddCommentResult | null> => {
  if (input.postId.trim() === '') {
    return null;
  }

  const payload = await mutateGraphQL(
    AddCommentDocument,
    {
      input: {
        postId: input.postId.trim(),
        ...(input.parentId?.trim() ? { parentId: input.parentId.trim() } : {}),
        authorName: input.authorName,
        authorEmail: input.authorEmail,
        content: input.content,
      },
    },
    options,
  );

  const result = payload?.addComment;
  if (!result) {
    return null;
  }

  return {
    ...(fromCommentMutationStatus(result.status) ? { status: fromCommentMutationStatus(result.status) } : {}),
    ...(typeof result.postId === 'string' ? { postId: result.postId.trim() } : {}),
    ...(fromCommentModerationStatus(result.moderationStatus)
      ? { moderationStatus: fromCommentModerationStatus(result.moderationStatus) }
      : {}),
  };
};
