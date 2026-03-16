import {
  AddCommentDocument,
  CommentEventDocument,
  type CommentEventSubscription,
  type CommentEventSubscriptionVariables,
  CommentsDocument,
} from '@/graphql/generated/graphql';
import { getGraphQLEndpoint, mutateGraphQL, queryGraphQL } from '@/lib/graphql/apolloClient';
import {
  fromCommentEventType,
  fromCommentModerationStatus,
  fromCommentMutationStatus,
  fromCommentQueryStatus,
} from '@/lib/graphql/enumMappers';
import { subscribeGraphQL } from '@/lib/graphql/subscriptions';
import type {
  CommentEvent as AppCommentEvent,
  CommentItem as AppCommentItem,
  CommentThread as AppCommentThread,
} from '@/types/comments';

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

export type CommentEventResult = AppCommentEvent;

export const normalizeCommentItem = (
  item:
    | {
        id: string;
        parentId?: string | null;
        authorName: string;
        avatarUrl?: string | null;
        content: string;
        createdAt: string;
      }
    | null
    | undefined,
): AppCommentItem | undefined => {
  if (!item) {
    return undefined;
  }

  return {
    id: item.id,
    ...(typeof item.parentId === 'string' && item.parentId.trim() !== '' ? { parentId: item.parentId.trim() } : {}),
    authorName: item.authorName,
    ...(typeof item.avatarUrl === 'string' && item.avatarUrl.trim() !== '' ? { avatarUrl: item.avatarUrl.trim() } : {}),
    content: item.content,
    createdAt: item.createdAt,
  };
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
    root: normalizeCommentItem(thread.root)!,
    replies: (thread.replies ?? []).map(reply => normalizeCommentItem(reply)!).filter(Boolean),
  }));

const normalizeCommentEvent = (
  event:
    | {
        type: unknown;
        postId: string;
        commentId: string;
        parentId?: string | null;
        status?: unknown;
        total?: number | null;
        comment?: {
          id: string;
          parentId?: string | null;
          authorName: string;
          avatarUrl?: string | null;
          content: string;
          createdAt: string;
        } | null;
      }
    | null
    | undefined,
): CommentEventResult | null => {
  if (!event) {
    return null;
  }

  const type = fromCommentEventType(typeof event.type === 'string' ? (event.type as never) : null);
  if (!type) {
    return null;
  }

  return {
    type: type as CommentEventResult['type'],
    postId: event.postId.trim(),
    commentId: event.commentId.trim(),
    ...(typeof event.parentId === 'string' && event.parentId.trim() !== '' ? { parentId: event.parentId.trim() } : {}),
    ...(fromCommentModerationStatus(typeof event.status === 'string' ? (event.status as never) : null)
      ? { status: fromCommentModerationStatus(typeof event.status === 'string' ? (event.status as never) : null) }
      : {}),
    ...(typeof event.total === 'number' ? { total: Math.max(0, Math.trunc(event.total)) } : {}),
    ...(normalizeCommentItem(event.comment) ? { comment: normalizeCommentItem(event.comment) } : {}),
  };
};

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

export const subscribeToCommentEvents = (
  postId: string,
  callbacks: {
    next: (event: CommentEventResult) => void;
    error?: (error: unknown) => void;
    complete?: () => void;
    connected?: (reconnected: boolean) => void;
  },
) =>
  subscribeGraphQL<CommentEventSubscription, CommentEventSubscriptionVariables>(
    getGraphQLEndpoint(),
    CommentEventDocument,
    { postId: postId.trim() },
    {
      next(payload) {
        const event = normalizeCommentEvent(payload.commentEvent);
        if (event) {
          callbacks.next(event);
        }
      },
      error: callbacks.error,
      complete: callbacks.complete,
      connected: callbacks.connected,
    },
  );
