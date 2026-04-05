'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import useDebounce from '@/hooks/useDebounce';
import {
  bulkDeleteAdminComments,
  bulkUpdateAdminCommentStatus,
  deleteAdminComment,
  fetchAdminComments,
  isAdminSessionError,
  resolveAdminError,
  updateAdminCommentStatus,
  type AdminCommentItem,
  type AdminContentPostItem,
} from '@/lib/adminApi';

type PostEditorTab = 'metadata' | 'content' | 'comments';
type CommentStatusFilterValue = 'all' | AdminCommentItem['status'];

const SUCCESS_MESSAGE_AUTO_HIDE_MS = 3500;
const FILTER_QUERY_DEBOUNCE_MS = 220;

const syncSelectedIDsWithItems =
  <T extends { id: string }>(items: T[]) =>
  (previous: string[]) =>
    previous.filter(id => items.some(item => item.id === id));

const toggleSingleSelection = (itemID: string, checked: boolean) => (previous: string[]) => {
  if (checked) {
    return previous.includes(itemID) ? previous : [...previous, itemID];
  }

  return previous.filter(id => id !== itemID);
};

const toggleVisibleSelection =
  <T extends { id: string }>(items: T[], allVisibleSelected: boolean) =>
  (previous: string[]) => {
    if (allVisibleSelected) {
      return previous.filter(id => !items.some(item => item.id === id));
    }

    const next = new Set(previous);
    for (const item of items) {
      next.add(item.id);
    }
    return Array.from(next);
  };

const resolveBulkCommentSuccessKey = (status: AdminCommentItem['status']) => {
  if (status === 'APPROVED') {
    return 'adminAccount.comments.success.bulkApproved';
  }
  if (status === 'REJECTED') {
    return 'adminAccount.comments.success.bulkRejected';
  }

  return 'adminAccount.comments.success.bulkSpam';
};

type UseAdminContentPostCommentsSectionParams = {
  editingPost: AdminContentPostItem | null;
  activePostEditorTab: PostEditorTab;
  routePostID?: string;
  onSessionExpired: () => void;
  t: TFunction;
};

export function useAdminContentPostCommentsSection({
  editingPost,
  activePostEditorTab,
  routePostID,
  onSessionExpired,
  t,
}: UseAdminContentPostCommentsSectionParams) {
  const [postComments, setPostComments] = React.useState<AdminCommentItem[]>([]);
  const [isPostCommentsLoading, setIsPostCommentsLoading] = React.useState(false);
  const [postCommentsErrorMessage, setPostCommentsErrorMessage] = React.useState('');
  const [postCommentsSuccessMessage, setPostCommentsSuccessMessage] = React.useState('');
  const [postCommentsStatusFilter, setPostCommentsStatusFilter] = React.useState<CommentStatusFilterValue>('all');
  const [postCommentsFilterQuery, setPostCommentsFilterQuery] = React.useState('');
  const [postCommentsPage, setPostCommentsPage] = React.useState(1);
  const [postCommentsPageSize, setPostCommentsPageSize] = React.useState(5);
  const [postCommentsTotal, setPostCommentsTotal] = React.useState(0);
  const [selectedPostCommentIDs, setSelectedPostCommentIDs] = React.useState<string[]>([]);
  const [postCommentActionID, setPostCommentActionID] = React.useState('');
  const [postCommentActionStatus, setPostCommentActionStatus] = React.useState<AdminCommentItem['status'] | null>(null);
  const [deletingPostCommentID, setDeletingPostCommentID] = React.useState('');
  const [pendingPostCommentDelete, setPendingPostCommentDelete] = React.useState<AdminCommentItem | null>(null);
  const [bulkPostCommentActionStatus, setBulkPostCommentActionStatus] = React.useState<
    AdminCommentItem['status'] | null
  >(null);
  const [pendingBulkPostCommentDeleteIDs, setPendingBulkPostCommentDeleteIDs] = React.useState<string[]>([]);
  const [isBulkPostCommentDeleting, setIsBulkPostCommentDeleting] = React.useState(false);

  const postCommentsRequestIDRef = React.useRef(0);
  const postCommentsFilterQueryDebounced = useDebounce(postCommentsFilterQuery.trim(), FILTER_QUERY_DEBOUNCE_MS);

  const selectedVisiblePostCommentIDs = React.useMemo(
    () => postComments.filter(item => selectedPostCommentIDs.includes(item.id)).map(item => item.id),
    [postComments, selectedPostCommentIDs],
  );
  const allVisiblePostCommentsSelected =
    postComments.length > 0 && selectedVisiblePostCommentIDs.length === postComments.length;
  const hasSelectedPostComments = selectedPostCommentIDs.length > 0;
  const isBulkPostCommentActionPending = bulkPostCommentActionStatus !== null || isBulkPostCommentDeleting;
  const totalPostCommentPages = Math.max(1, Math.ceil(postCommentsTotal / postCommentsPageSize));

  const resetPostCommentsState = React.useCallback(() => {
    setPostComments([]);
    setPostCommentsErrorMessage('');
    setPostCommentsSuccessMessage('');
    setSelectedPostCommentIDs([]);
    setPostCommentActionID('');
    setPostCommentActionStatus(null);
    setDeletingPostCommentID('');
    setBulkPostCommentActionStatus(null);
    setPendingBulkPostCommentDeleteIDs([]);
    setIsBulkPostCommentDeleting(false);
    setPostCommentsPage(1);
    setPostCommentsTotal(0);
    setPendingPostCommentDelete(null);
  }, []);

  useAutoClearValue(postCommentsSuccessMessage, setPostCommentsSuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS);

  React.useEffect(() => {
    setSelectedPostCommentIDs(syncSelectedIDsWithItems(postComments));
  }, [postComments]);

  React.useEffect(() => {
    setPostCommentsPage(1);
  }, [postCommentsFilterQueryDebounced, postCommentsStatusFilter, routePostID]);

  React.useEffect(() => {
    if (editingPost) {
      return;
    }
    resetPostCommentsState();
  }, [editingPost, resetPostCommentsState]);

  const loadPostComments = React.useCallback(
    async (options?: { page?: number }) => {
      if (!editingPost || activePostEditorTab !== 'comments') {
        return [];
      }

      const requestedPage = options?.page && options.page > 0 ? options.page : postCommentsPage;
      const requestID = postCommentsRequestIDRef.current + 1;
      postCommentsRequestIDRef.current = requestID;
      setIsPostCommentsLoading(true);
      setPostCommentsErrorMessage('');

      try {
        const payload = await fetchAdminComments({
          postId: editingPost.id,
          status: postCommentsStatusFilter === 'all' ? undefined : postCommentsStatusFilter,
          query: postCommentsFilterQueryDebounced,
          page: requestedPage,
          size: postCommentsPageSize,
        });

        if (requestID !== postCommentsRequestIDRef.current) {
          return [];
        }

        const items = payload.items ?? [];
        setPostComments(items);
        setPostCommentsTotal(payload.total ?? 0);

        const resolvedPage = payload.page > 0 ? payload.page : requestedPage;
        if (resolvedPage !== postCommentsPage) {
          setPostCommentsPage(resolvedPage);
        }
        if (payload.size > 0 && payload.size !== postCommentsPageSize) {
          setPostCommentsPageSize(payload.size);
        }

        return items;
      } catch (error) {
        if (requestID !== postCommentsRequestIDRef.current) {
          return [];
        }
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return [];
        }
        const resolvedError = resolveAdminError(error);
        setPostCommentsErrorMessage(
          resolvedError.message || t('adminAccount.comments.errors.load', { ns: 'admin-account' }),
        );
        return [];
      } finally {
        if (requestID === postCommentsRequestIDRef.current) {
          setIsPostCommentsLoading(false);
        }
      }
    },
    [
      activePostEditorTab,
      editingPost,
      onSessionExpired,
      postCommentsFilterQueryDebounced,
      postCommentsPage,
      postCommentsPageSize,
      postCommentsStatusFilter,
      t,
    ],
  );

  React.useEffect(() => {
    if (!editingPost || activePostEditorTab !== 'comments') {
      return;
    }
    void loadPostComments();
  }, [activePostEditorTab, editingPost, loadPostComments, postCommentsPage, postCommentsPageSize]);

  const togglePostCommentSelection = React.useCallback((commentId: string, checked: boolean) => {
    setSelectedPostCommentIDs(toggleSingleSelection(commentId, checked));
  }, []);

  const toggleVisiblePostCommentsSelection = React.useCallback(() => {
    if (postComments.length === 0) {
      return;
    }
    setSelectedPostCommentIDs(toggleVisibleSelection(postComments, allVisiblePostCommentsSelected));
  }, [allVisiblePostCommentsSelected, postComments]);

  const handleBulkPostCommentStatusUpdate = React.useCallback(
    async (status: AdminCommentItem['status']) => {
      if (!hasSelectedPostComments || deletingPostCommentID || postCommentActionID || isBulkPostCommentDeleting) {
        return;
      }

      setBulkPostCommentActionStatus(status);
      setPostCommentsErrorMessage('');
      setPostCommentsSuccessMessage('');

      try {
        const successCount = await bulkUpdateAdminCommentStatus({
          commentIds: selectedPostCommentIDs,
          status,
        });
        if (successCount === 0) {
          throw new Error(t('adminAccount.comments.errors.bulkStatusUpdate', { ns: 'admin-account' }));
        }

        const refreshedItems = await loadPostComments();
        if (refreshedItems.length === 0 && postCommentsPage > 1) {
          setPostCommentsPage(previous => Math.max(1, previous - 1));
        }

        setSelectedPostCommentIDs([]);
        setPostCommentsSuccessMessage(
          t(resolveBulkCommentSuccessKey(status), { ns: 'admin-account', count: successCount }),
        );

        if (successCount !== selectedPostCommentIDs.length) {
          setPostCommentsErrorMessage(
            t('adminAccount.comments.errors.bulkStatusUpdatePartial', { ns: 'admin-account' }),
          );
        }
      } catch (error) {
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setPostCommentsErrorMessage(
          resolvedError.message || t('adminAccount.comments.errors.bulkStatusUpdate', { ns: 'admin-account' }),
        );
      } finally {
        setBulkPostCommentActionStatus(null);
      }
    },
    [
      deletingPostCommentID,
      hasSelectedPostComments,
      isBulkPostCommentDeleting,
      loadPostComments,
      onSessionExpired,
      postCommentActionID,
      postCommentsPage,
      selectedPostCommentIDs,
      t,
    ],
  );

  const handleBulkDeletePostCommentSubmit = React.useCallback(async () => {
    if (
      pendingBulkPostCommentDeleteIDs.length === 0 ||
      deletingPostCommentID ||
      postCommentActionID ||
      isBulkPostCommentDeleting
    ) {
      return;
    }

    setIsBulkPostCommentDeleting(true);
    setPostCommentsErrorMessage('');
    setPostCommentsSuccessMessage('');

    try {
      const successCount = await bulkDeleteAdminComments({
        commentIds: pendingBulkPostCommentDeleteIDs,
      });
      if (successCount === 0) {
        throw new Error(t('adminAccount.comments.errors.bulkDelete', { ns: 'admin-account' }));
      }

      const refreshedItems = await loadPostComments();
      if (refreshedItems.length === 0 && postCommentsPage > 1) {
        setPostCommentsPage(previous => Math.max(1, previous - 1));
      }

      setPendingBulkPostCommentDeleteIDs([]);
      setSelectedPostCommentIDs([]);
      setPostCommentsSuccessMessage(
        t('adminAccount.comments.success.bulkDeleted', { ns: 'admin-account', count: successCount }),
      );

      if (successCount !== pendingBulkPostCommentDeleteIDs.length) {
        setPostCommentsErrorMessage(t('adminAccount.comments.errors.bulkDeletePartial', { ns: 'admin-account' }));
      }
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setPostCommentsErrorMessage(
        resolvedError.message || t('adminAccount.comments.errors.bulkDelete', { ns: 'admin-account' }),
      );
    } finally {
      setIsBulkPostCommentDeleting(false);
    }
  }, [
    deletingPostCommentID,
    isBulkPostCommentDeleting,
    loadPostComments,
    onSessionExpired,
    pendingBulkPostCommentDeleteIDs,
    postCommentActionID,
    postCommentsPage,
    t,
  ]);

  const handlePostCommentStatusUpdate = React.useCallback(
    async (commentId: string, status: AdminCommentItem['status']) => {
      if (!editingPost || deletingPostCommentID || isBulkPostCommentActionPending) {
        return;
      }

      setPostCommentActionID(commentId);
      setPostCommentActionStatus(status);
      setPostCommentsErrorMessage('');
      setPostCommentsSuccessMessage('');

      try {
        const updatedComment = await updateAdminCommentStatus({ commentId, status });
        const refreshedItems = await loadPostComments();

        if (refreshedItems.length === 0 && postCommentsPage > 1) {
          setPostCommentsPage(previous => Math.max(1, previous - 1));
        }

        setPostCommentsSuccessMessage(
          t(`adminAccount.comments.success.${status.toLowerCase()}`, {
            ns: 'admin-account',
            author: updatedComment.authorName,
          }),
        );
      } catch (error) {
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setPostCommentsErrorMessage(
          resolvedError.message || t('adminAccount.comments.errors.statusUpdate', { ns: 'admin-account' }),
        );
      } finally {
        setPostCommentActionID('');
        setPostCommentActionStatus(null);
      }
    },
    [
      deletingPostCommentID,
      editingPost,
      isBulkPostCommentActionPending,
      loadPostComments,
      onSessionExpired,
      postCommentsPage,
      t,
    ],
  );

  const handleDeletePostCommentSubmit = React.useCallback(async () => {
    const item = pendingPostCommentDelete;
    if (!item || deletingPostCommentID || postCommentActionID || isBulkPostCommentActionPending) {
      return;
    }

    setDeletingPostCommentID(item.id);
    setPostCommentsErrorMessage('');
    setPostCommentsSuccessMessage('');

    try {
      const deleted = await deleteAdminComment({ commentId: item.id });
      if (!deleted) {
        throw new Error(t('adminAccount.comments.errors.delete', { ns: 'admin-account' }));
      }

      const remainingItems = postComments.filter(candidate => candidate.id !== item.id);
      const nextTotal = Math.max(0, postCommentsTotal - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / postCommentsPageSize));
      const nextPage = Math.min(postCommentsPage, nextTotalPages);

      if (nextPage === postCommentsPage) {
        setPostComments(remainingItems);
      } else {
        setPostCommentsPage(nextPage);
      }

      setPostCommentsTotal(nextTotal);
      setPendingPostCommentDelete(null);
      setPostCommentsSuccessMessage(
        t('adminAccount.comments.success.deleted', {
          ns: 'admin-account',
          author: item.authorName,
        }),
      );
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setPostCommentsErrorMessage(
        resolvedError.message || t('adminAccount.comments.errors.delete', { ns: 'admin-account' }),
      );
    } finally {
      setDeletingPostCommentID('');
    }
  }, [
    deletingPostCommentID,
    isBulkPostCommentActionPending,
    onSessionExpired,
    pendingPostCommentDelete,
    postCommentActionID,
    postComments,
    postCommentsPage,
    postCommentsPageSize,
    postCommentsTotal,
    t,
  ]);

  return {
    postComments,
    isPostCommentsLoading,
    postCommentsErrorMessage,
    setPostCommentsErrorMessage,
    postCommentsSuccessMessage,
    setPostCommentsSuccessMessage,
    postCommentsStatusFilter,
    setPostCommentsStatusFilter,
    postCommentsFilterQuery,
    setPostCommentsFilterQuery,
    postCommentsPage,
    setPostCommentsPage,
    postCommentsPageSize,
    setPostCommentsPageSize,
    postCommentsTotal,
    totalPostCommentPages,
    selectedPostCommentIDs,
    setSelectedPostCommentIDs,
    postCommentActionID,
    postCommentActionStatus,
    deletingPostCommentID,
    pendingPostCommentDelete,
    setPendingPostCommentDelete,
    bulkPostCommentActionStatus,
    pendingBulkPostCommentDeleteIDs,
    setPendingBulkPostCommentDeleteIDs,
    isBulkPostCommentDeleting,
    allVisiblePostCommentsSelected,
    hasSelectedPostComments,
    isBulkPostCommentActionPending,
    togglePostCommentSelection,
    toggleVisiblePostCommentsSelection,
    handleBulkPostCommentStatusUpdate,
    handleBulkDeletePostCommentSubmit,
    handlePostCommentStatusUpdate,
    handleDeletePostCommentSubmit,
    resetPostCommentsState,
  };
}
