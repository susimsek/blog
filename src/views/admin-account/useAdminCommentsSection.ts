'use client';

import React from 'react';
import useDebounce from '@/hooks/useDebounce';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import {
  bulkDeleteAdminComments,
  bulkUpdateAdminCommentStatus,
  deleteAdminComment,
  fetchAdminComments,
  isAdminSessionError,
  resolveAdminError,
  updateAdminCommentStatus,
  type AdminCommentItem,
} from '@/lib/adminApi';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;

type UseAdminCommentsSectionOptions = {
  isActive: boolean;
  hasAdminUser: boolean;
  t: AdminAccountTranslate;
  onSessionExpired: () => void;
  successMessageAutoHideMs: number;
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

const scrollRefIntoView = (target: HTMLDivElement | null) => {
  if (!target) {
    return;
  }

  const currentWindow = globalThis.window;
  const prefersReducedMotion = currentWindow?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  target.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start',
  });
};

export default function useAdminCommentsSection({
  isActive,
  hasAdminUser,
  t,
  onSessionExpired,
  successMessageAutoHideMs,
}: Readonly<UseAdminCommentsSectionOptions>) {
  const [comments, setComments] = React.useState<AdminCommentItem[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = React.useState(isActive);
  const [commentsErrorMessage, setCommentsErrorMessage] = React.useState('');
  const [commentsSuccessMessage, setCommentsSuccessMessage] = React.useState('');
  const [commentFilterStatus, setCommentFilterStatus] = React.useState<
    'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM'
  >('all');
  const [commentFilterQuery, setCommentFilterQuery] = React.useState('');
  const [commentsPage, setCommentsPage] = React.useState(1);
  const [commentsPageSize, setCommentsPageSize] = React.useState(10);
  const [totalComments, setTotalComments] = React.useState(0);
  const [selectedCommentIDs, setSelectedCommentIDs] = React.useState<string[]>([]);
  const [commentActionID, setCommentActionID] = React.useState('');
  const [commentActionStatus, setCommentActionStatus] = React.useState<AdminCommentItem['status'] | null>(null);
  const [deletingCommentID, setDeletingCommentID] = React.useState('');
  const [pendingCommentDelete, setPendingCommentDelete] = React.useState<AdminCommentItem | null>(null);
  const [bulkCommentActionStatus, setBulkCommentActionStatus] = React.useState<AdminCommentItem['status'] | null>(null);
  const [pendingBulkCommentDeleteIDs, setPendingBulkCommentDeleteIDs] = React.useState<string[]>([]);
  const [isBulkCommentDeleting, setIsBulkCommentDeleting] = React.useState(false);

  const commentsListTopRef = React.useRef<HTMLDivElement | null>(null);
  const commentsRequestIDRef = React.useRef(0);
  const commentFilterQueryDebounced = useDebounce(commentFilterQuery.trim(), 220);

  useAutoClearValue(commentsSuccessMessage, setCommentsSuccessMessage, successMessageAutoHideMs);

  React.useEffect(() => {
    setSelectedCommentIDs(syncSelectedIDsWithItems(comments));
  }, [comments]);

  React.useEffect(() => {
    setCommentsPage(1);
  }, [commentFilterQueryDebounced, commentFilterStatus]);

  const selectedVisibleCommentIDs = React.useMemo(
    () => comments.filter(item => selectedCommentIDs.includes(item.id)).map(item => item.id),
    [comments, selectedCommentIDs],
  );
  const totalCommentPages = Math.max(1, Math.ceil(totalComments / commentsPageSize));
  const allVisibleCommentsSelected = comments.length > 0 && selectedVisibleCommentIDs.length === comments.length;
  const hasSelectedComments = selectedCommentIDs.length > 0;
  const isBulkCommentActionPending = bulkCommentActionStatus !== null || isBulkCommentDeleting;

  const loadAdminComments = React.useCallback(
    async (options?: { page?: number }): Promise<AdminCommentItem[]> => {
      if (!isActive || !hasAdminUser) {
        return [];
      }

      const requestedPage = options?.page && options.page > 0 ? options.page : commentsPage;
      const requestID = commentsRequestIDRef.current + 1;
      commentsRequestIDRef.current = requestID;
      setIsCommentsLoading(true);
      setCommentsErrorMessage('');

      try {
        const payload = await fetchAdminComments({
          status: commentFilterStatus === 'all' ? undefined : commentFilterStatus,
          query: commentFilterQueryDebounced,
          page: requestedPage,
          size: commentsPageSize,
        });

        if (requestID !== commentsRequestIDRef.current) {
          return [];
        }

        const items = payload.items ?? [];
        setComments(items);
        setTotalComments(payload.total ?? 0);

        const resolvedPage = payload.page > 0 ? payload.page : requestedPage;
        if (resolvedPage !== commentsPage) {
          setCommentsPage(resolvedPage);
        }

        if (payload.size > 0 && payload.size !== commentsPageSize) {
          setCommentsPageSize(payload.size);
        }

        return items;
      } catch (error) {
        if (requestID !== commentsRequestIDRef.current) {
          return [];
        }
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return [];
        }
        const resolvedError = resolveAdminError(error);
        setCommentsErrorMessage(
          resolvedError.kind === 'network'
            ? t('adminCommon.errors.network', { ns: 'admin-common' })
            : resolvedError.message || t('adminAccount.comments.errors.load', { ns: 'admin-account' }),
        );
        return [];
      } finally {
        if (requestID === commentsRequestIDRef.current) {
          setIsCommentsLoading(false);
        }
      }
    },
    [
      commentFilterQueryDebounced,
      commentFilterStatus,
      commentsPage,
      commentsPageSize,
      hasAdminUser,
      isActive,
      onSessionExpired,
      t,
    ],
  );

  React.useEffect(() => {
    if (!isActive || !hasAdminUser) {
      return;
    }

    void loadAdminComments();
  }, [commentsPage, commentsPageSize, hasAdminUser, isActive, loadAdminComments]);

  const scrollToCommentsListStart = React.useCallback(() => {
    scrollRefIntoView(commentsListTopRef.current);
  }, []);

  const onCommentFilterStatusChange = React.useCallback(
    (value: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM') => {
      setCommentFilterStatus(value);
      setCommentsErrorMessage('');
      setCommentsSuccessMessage('');
    },
    [],
  );

  const onCommentFilterQueryChange = React.useCallback((value: string) => {
    setCommentFilterQuery(value);
    setCommentsErrorMessage('');
  }, []);

  const onClearCommentFilterQuery = React.useCallback(() => {
    setCommentFilterQuery('');
    setCommentsErrorMessage('');
  }, []);

  const onToggleCommentSelection = React.useCallback((itemID: string, checked: boolean) => {
    setSelectedCommentIDs(toggleSingleSelection(itemID, checked));
  }, []);

  const onToggleVisibleCommentsSelection = React.useCallback(() => {
    if (comments.length === 0) {
      return;
    }

    setSelectedCommentIDs(toggleVisibleSelection(comments, allVisibleCommentsSelected));
  }, [allVisibleCommentsSelected, comments]);

  const onClearSelectedComments = React.useCallback(() => {
    setSelectedCommentIDs([]);
  }, []);

  const resolveCommentStatusVariant = React.useCallback((status: AdminCommentItem['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'secondary';
      case 'SPAM':
        return 'danger';
      default:
        return 'warning';
    }
  }, []);

  const onBulkCommentStatusUpdate = React.useCallback(
    async (status: AdminCommentItem['status']) => {
      if (!hasSelectedComments || deletingCommentID || isBulkCommentDeleting || commentActionID) {
        return;
      }

      setBulkCommentActionStatus(status);
      setCommentsErrorMessage('');
      setCommentsSuccessMessage('');

      try {
        const successCount = await bulkUpdateAdminCommentStatus({
          commentIds: selectedCommentIDs,
          status,
        });
        if (successCount === 0) {
          throw new Error(t('adminAccount.comments.errors.bulkStatusUpdate', { ns: 'admin-account' }));
        }

        const refreshedItems = await loadAdminComments();
        if (refreshedItems.length === 0 && commentsPage > 1) {
          setCommentsPage(previous => Math.max(1, previous - 1));
        }

        setSelectedCommentIDs([]);
        setCommentsSuccessMessage(
          t(resolveBulkCommentSuccessKey(status), { ns: 'admin-account', count: successCount }),
        );

        if (successCount !== selectedCommentIDs.length) {
          setCommentsErrorMessage(t('adminAccount.comments.errors.bulkStatusUpdatePartial', { ns: 'admin-account' }));
        }
      } catch (error) {
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setCommentsErrorMessage(
          resolvedError.kind === 'network'
            ? t('adminCommon.errors.network', { ns: 'admin-common' })
            : resolvedError.message || t('adminAccount.comments.errors.bulkStatusUpdate', { ns: 'admin-account' }),
        );
      } finally {
        setBulkCommentActionStatus(null);
      }
    },
    [
      commentActionID,
      commentsPage,
      deletingCommentID,
      hasSelectedComments,
      isBulkCommentDeleting,
      loadAdminComments,
      onSessionExpired,
      selectedCommentIDs,
      t,
    ],
  );

  const onOpenBulkCommentDelete = React.useCallback(() => {
    setPendingBulkCommentDeleteIDs(selectedCommentIDs);
  }, [selectedCommentIDs]);

  const onCloseBulkCommentDelete = React.useCallback(() => {
    if (isBulkCommentDeleting) {
      return;
    }
    setPendingBulkCommentDeleteIDs([]);
  }, [isBulkCommentDeleting]);

  const onConfirmBulkCommentDelete = React.useCallback(async () => {
    if (pendingBulkCommentDeleteIDs.length === 0 || deletingCommentID || commentActionID || isBulkCommentDeleting) {
      return;
    }

    setIsBulkCommentDeleting(true);
    setCommentsErrorMessage('');
    setCommentsSuccessMessage('');

    try {
      const successCount = await bulkDeleteAdminComments({
        commentIds: pendingBulkCommentDeleteIDs,
      });
      if (successCount === 0) {
        throw new Error(t('adminAccount.comments.errors.bulkDelete', { ns: 'admin-account' }));
      }

      const refreshedItems = await loadAdminComments();
      if (refreshedItems.length === 0 && commentsPage > 1) {
        setCommentsPage(previous => Math.max(1, previous - 1));
      }

      setPendingBulkCommentDeleteIDs([]);
      setSelectedCommentIDs([]);
      setCommentsSuccessMessage(
        t('adminAccount.comments.success.bulkDeleted', { ns: 'admin-account', count: successCount }),
      );

      if (successCount !== pendingBulkCommentDeleteIDs.length) {
        setCommentsErrorMessage(t('adminAccount.comments.errors.bulkDeletePartial', { ns: 'admin-account' }));
      }
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setCommentsErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.comments.errors.bulkDelete', { ns: 'admin-account' }),
      );
    } finally {
      setIsBulkCommentDeleting(false);
    }
  }, [
    commentActionID,
    commentsPage,
    deletingCommentID,
    isBulkCommentDeleting,
    loadAdminComments,
    onSessionExpired,
    pendingBulkCommentDeleteIDs,
    t,
  ]);

  const onCommentStatusUpdate = React.useCallback(
    async (commentId: string, status: AdminCommentItem['status']) => {
      if (deletingCommentID || isBulkCommentActionPending) {
        return;
      }

      setCommentActionID(commentId);
      setCommentActionStatus(status);
      setCommentsErrorMessage('');
      setCommentsSuccessMessage('');

      try {
        const updatedComment = await updateAdminCommentStatus({ commentId, status });
        const refreshedItems = await loadAdminComments();

        if (refreshedItems.length === 0 && commentsPage > 1) {
          setCommentsPage(previous => Math.max(1, previous - 1));
        }

        setCommentsSuccessMessage(
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
        setCommentsErrorMessage(
          resolvedError.kind === 'network'
            ? t('adminCommon.errors.network', { ns: 'admin-common' })
            : resolvedError.message || t('adminAccount.comments.errors.statusUpdate', { ns: 'admin-account' }),
        );
      } finally {
        setCommentActionID('');
        setCommentActionStatus(null);
      }
    },
    [commentsPage, deletingCommentID, isBulkCommentActionPending, loadAdminComments, onSessionExpired, t],
  );

  const onOpenCommentDelete = React.useCallback((item: AdminCommentItem) => {
    setPendingCommentDelete(item);
  }, []);

  const onCloseCommentDelete = React.useCallback(() => {
    if (deletingCommentID) {
      return;
    }
    setPendingCommentDelete(null);
  }, [deletingCommentID]);

  const onConfirmCommentDelete = React.useCallback(async () => {
    const item = pendingCommentDelete;
    if (!item || deletingCommentID || commentActionID || isBulkCommentActionPending) {
      return;
    }

    setDeletingCommentID(item.id);
    setCommentsErrorMessage('');
    setCommentsSuccessMessage('');

    try {
      const deleted = await deleteAdminComment({ commentId: item.id });
      if (!deleted) {
        throw new Error(t('adminAccount.comments.errors.delete', { ns: 'admin-account' }));
      }

      const remainingItems = comments.filter(candidate => candidate.id !== item.id);
      const nextTotal = Math.max(0, totalComments - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / commentsPageSize));
      const nextPage = Math.min(commentsPage, nextTotalPages);

      if (nextPage === commentsPage) {
        setComments(remainingItems);
      } else {
        setCommentsPage(nextPage);
      }

      setTotalComments(nextTotal);
      setPendingCommentDelete(null);
      setCommentsSuccessMessage(
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
      setCommentsErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.comments.errors.delete', { ns: 'admin-account' }),
      );
    } finally {
      setDeletingCommentID('');
    }
  }, [
    commentActionID,
    comments,
    commentsPage,
    commentsPageSize,
    deletingCommentID,
    isBulkCommentActionPending,
    onSessionExpired,
    pendingCommentDelete,
    t,
    totalComments,
  ]);

  const onCommentsPageChange = React.useCallback(
    (page: number) => {
      setCommentsPage(page);
      scrollToCommentsListStart();
    },
    [scrollToCommentsListStart],
  );

  const onCommentsPageSizeChange = React.useCallback(
    (size: number) => {
      setCommentsPageSize(size);
      setCommentsPage(1);
      scrollToCommentsListStart();
    },
    [scrollToCommentsListStart],
  );

  return {
    comments,
    isCommentsLoading,
    commentsErrorMessage,
    commentsSuccessMessage,
    commentsListTopRef,
    commentFilterStatus,
    onCommentFilterStatusChange,
    commentFilterQuery,
    onCommentFilterQueryChange,
    onClearCommentFilterQuery,
    totalComments,
    allVisibleCommentsSelected,
    hasSelectedComments,
    selectedCommentCount: selectedCommentIDs.length,
    isBulkCommentActionPending,
    bulkCommentActionStatus,
    isBulkCommentDeleting,
    onToggleVisibleCommentsSelection,
    onClearSelectedComments,
    onBulkCommentStatusUpdate,
    onOpenBulkCommentDelete,
    selectedCommentIDs,
    onToggleCommentSelection,
    resolveCommentStatusVariant,
    commentActionID,
    commentActionStatus,
    deletingCommentID,
    onCommentStatusUpdate,
    onOpenCommentDelete,
    commentsPage,
    totalCommentPages,
    commentsPageSize,
    onCommentsPageChange,
    onCommentsPageSizeChange,
    pendingBulkCommentDeleteCount: pendingBulkCommentDeleteIDs.length,
    onCloseBulkCommentDelete,
    onConfirmBulkCommentDelete,
    pendingCommentDelete,
    onCloseCommentDelete,
    onConfirmCommentDelete,
  };
}
