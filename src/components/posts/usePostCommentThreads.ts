'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import { fetchComments } from '@/lib/commentsApi';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import type { CommentThread } from '@/types/comments';

const SUCCESS_MESSAGE_AUTO_HIDE_MS = 3500;

type UsePostCommentThreadsParams = {
  postId: string;
  skipInitialFetch: boolean;
  initialLoading: boolean;
  initialStatus?: string;
  initialThreads?: CommentThread[];
  initialTotal?: number;
  t: TFunction<'post'>;
};

export function usePostCommentThreads({
  postId,
  skipInitialFetch,
  initialLoading,
  initialStatus,
  initialThreads,
  initialTotal,
  t,
}: UsePostCommentThreadsParams) {
  const [threads, setThreads] = React.useState<CommentThread[]>(initialThreads ?? []);
  const [total, setTotal] = React.useState(initialTotal ?? 0);
  const [isLoading, setIsLoading] = React.useState(skipInitialFetch ? initialLoading : true);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [activeReplyID, setActiveReplyID] = React.useState<string | null>(null);
  const [replySuccessMessage, setReplySuccessMessage] = React.useState<{ parentId: string; message: string } | null>(
    null,
  );
  const [expandedReplyThreadIDs, setExpandedReplyThreadIDs] = React.useState<string[]>([]);

  const loadComments = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await fetchComments(postId);
      if (!result || (result.status && !['success', 'not-found'].includes(result.status))) {
        setErrorMessage(t('post.comments.errors.load'));
        return;
      }

      setThreads(result?.threads ?? []);
      setTotal(result?.total ?? 0);
    } finally {
      setIsLoading(false);
    }
  }, [postId, t]);

  React.useEffect(() => {
    if (!skipInitialFetch) {
      return;
    }

    if (initialLoading) {
      setIsLoading(true);
      setErrorMessage('');
      return;
    }

    if (initialStatus && !['success', 'not-found'].includes(initialStatus)) {
      setThreads([]);
      setTotal(0);
      setErrorMessage(t('post.comments.errors.load'));
      setIsLoading(false);
      return;
    }

    setThreads(initialThreads ?? []);
    setTotal(initialTotal ?? 0);
    setErrorMessage('');
    setIsLoading(false);
  }, [initialLoading, initialStatus, initialThreads, initialTotal, skipInitialFetch, t]);

  React.useEffect(() => {
    if (skipInitialFetch) {
      return;
    }

    void loadComments();
  }, [loadComments, skipInitialFetch]);

  useAutoClearValue(successMessage, setSuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS);
  useAutoClearValue(replySuccessMessage, setReplySuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS, {
    nextValue: null,
    isEmpty: value => value === null,
  });

  const handleReplyToggle = React.useCallback((rootID: string) => {
    setReplySuccessMessage(null);
    setActiveReplyID(current => (current === rootID ? null : rootID));
  }, []);

  const handleReplyThreadToggle = React.useCallback((rootID: string) => {
    setExpandedReplyThreadIDs(previous =>
      previous.includes(rootID) ? previous.filter(id => id !== rootID) : [...previous, rootID],
    );
  }, []);

  const handleSubmitted = React.useCallback(
    async (result: { status?: string; moderationStatus?: string }, options?: { parentId?: string }) => {
      const successText =
        result.moderationStatus === 'approved'
          ? t('post.comments.success.approved')
          : t('post.comments.success.pending');

      if (options?.parentId) {
        const parentId = options.parentId;
        setReplySuccessMessage({
          parentId,
          message: successText,
        });
        setExpandedReplyThreadIDs(previous => (previous.includes(parentId) ? previous : [...previous, parentId]));
        setSuccessMessage('');
      } else {
        setSuccessMessage(successText);
        setReplySuccessMessage(null);
      }

      setActiveReplyID(null);

      if (result.moderationStatus === 'approved') {
        await loadComments();
      }
    },
    [loadComments, t],
  );

  const resetReplyState = React.useCallback(() => {
    setActiveReplyID(null);
    setReplySuccessMessage(null);
  }, []);

  return {
    threads,
    total,
    isLoading,
    errorMessage,
    successMessage,
    activeReplyID,
    replySuccessMessage,
    expandedReplyThreadIDs,
    handleReplyToggle,
    handleReplyThreadToggle,
    handleSubmitted,
    resetReplyState,
  };
}
