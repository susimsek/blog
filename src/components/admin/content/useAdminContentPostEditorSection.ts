'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import {
  deleteAdminContentPost,
  fetchAdminContentCategories,
  fetchAdminContentPost,
  fetchAdminContentPostRevisions,
  fetchAdminContentTopics,
  isAdminSessionError,
  resolveAdminError,
  restoreAdminContentPostRevision,
  updateAdminContentPostContent,
  updateAdminContentPostMetadata,
  type AdminContentCategoryItem,
  type AdminContentPostItem,
  type AdminContentPostRevisionItem,
  type AdminContentTopicItem,
} from '@/lib/adminApi';

type PostEditorTab = 'metadata' | 'content' | 'comments';
type PostContentViewMode = 'editor' | 'split' | 'preview';
type PostSeoPreviewTab = 'openGraph' | 'twitter';
type SupportedContentLocale = 'en' | 'tr';
type AdminContentPostLifecycleStatus = AdminContentPostItem['status'];

const CONTENT_LOCALES: SupportedContentLocale[] = ['en', 'tr'];

type UseAdminContentPostEditorSectionParams = {
  activePostEditorTab: PostEditorTab;
  isPostDetailRoute: boolean;
  routePostLocale?: string;
  routePostID?: string;
  onSessionExpired: () => void;
  t: TFunction;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>;
  reloadPosts: () => Promise<void>;
  totalPosts: number;
  page: number;
  pageSize: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
};

export function useAdminContentPostEditorSection({
  activePostEditorTab,
  isPostDetailRoute,
  routePostLocale,
  routePostID,
  onSessionExpired,
  t,
  setErrorMessage,
  setSuccessMessage,
  reloadPosts,
  totalPosts,
  page,
  pageSize,
  setPage,
}: UseAdminContentPostEditorSectionParams) {
  const [editingPost, setEditingPost] = React.useState<AdminContentPostItem | null>(null);
  const [postLocaleTabs, setPostLocaleTabs] = React.useState<
    Array<{ locale: SupportedContentLocale; available: boolean }>
  >([]);
  const [postEditorTitle, setPostEditorTitle] = React.useState('');
  const [postEditorSummary, setPostEditorSummary] = React.useState('');
  const [postEditorThumbnail, setPostEditorThumbnail] = React.useState('');
  const [postEditorStatus, setPostEditorStatus] = React.useState<AdminContentPostLifecycleStatus>('PUBLISHED');
  const [postEditorScheduledAt, setPostEditorScheduledAt] = React.useState('');
  const [postEditorPublishedDate, setPostEditorPublishedDate] = React.useState('');
  const [postEditorUpdatedDate, setPostEditorUpdatedDate] = React.useState('');
  const [postEditorCategoryID, setPostEditorCategoryID] = React.useState('');
  const [postEditorTopicIDs, setPostEditorTopicIDs] = React.useState<string[]>([]);
  const [postEditorTopicQuery, setPostEditorTopicQuery] = React.useState('');
  const [postEditorTopicOptions, setPostEditorTopicOptions] = React.useState<AdminContentTopicItem[]>([]);
  const [postEditorCategoryOptions, setPostEditorCategoryOptions] = React.useState<AdminContentCategoryItem[]>([]);
  const [postSeoPreviewTab, setPostSeoPreviewTab] = React.useState<PostSeoPreviewTab>('openGraph');
  const [postContentViewMode, setPostContentViewMode] = React.useState<PostContentViewMode>('editor');
  const [postEditorContent, setPostEditorContent] = React.useState('');
  const [postEditorInitialContent, setPostEditorInitialContent] = React.useState('');
  const [isPostContentLoading, setIsPostContentLoading] = React.useState(false);
  const [isPostUpdating, setIsPostUpdating] = React.useState(false);
  const [isPostContentUpdating, setIsPostContentUpdating] = React.useState(false);
  const [pendingPostDelete, setPendingPostDelete] = React.useState<AdminContentPostItem | null>(null);
  const [isPostDeleting, setIsPostDeleting] = React.useState(false);
  const [postRevisions, setPostRevisions] = React.useState<AdminContentPostRevisionItem[]>([]);
  const [postRevisionsPage, setPostRevisionsPage] = React.useState(1);
  const [postRevisionsPageSize, setPostRevisionsPageSize] = React.useState(5);
  const [postRevisionsTotal, setPostRevisionsTotal] = React.useState(0);
  const [isPostRevisionsLoading, setIsPostRevisionsLoading] = React.useState(false);
  const [postRevisionsErrorMessage, setPostRevisionsErrorMessage] = React.useState('');
  const [pendingPostRevisionRestore, setPendingPostRevisionRestore] =
    React.useState<AdminContentPostRevisionItem | null>(null);
  const [isPostRevisionRestoring, setIsPostRevisionRestoring] = React.useState(false);

  const postDetailRequestIDRef = React.useRef(0);
  const postEditorTopicsRequestIDRef = React.useRef(0);
  const postEditorCategoriesRequestIDRef = React.useRef(0);
  const deferredPostEditorTopicQuery = React.useDeferredValue(postEditorTopicQuery);

  const applyPostToEditor = React.useCallback((post: AdminContentPostItem) => {
    setEditingPost(post);
    setPostEditorTitle(post.title ?? '');
    setPostEditorSummary(post.summary ?? '');
    setPostEditorThumbnail(post.thumbnail ?? '');
    setPostEditorStatus(post.status ?? 'PUBLISHED');
    setPostEditorScheduledAt(post.scheduledAt ?? '');
    setPostEditorPublishedDate(post.publishedDate ?? '');
    setPostEditorUpdatedDate(post.updatedDate ?? '');
    setPostEditorCategoryID(post.categoryId ?? '');
    setPostEditorTopicIDs(post.topicIds ?? []);
    setPostEditorTopicQuery('');
    const resolvedContent = post.content ?? '';
    setPostEditorContent(resolvedContent);
    setPostEditorInitialContent(resolvedContent);
  }, []);

  const resetPostDetailEditorState = React.useCallback(() => {
    setEditingPost(null);
    setPostLocaleTabs([]);
    setPostEditorTitle('');
    setPostEditorSummary('');
    setPostEditorThumbnail('');
    setPostEditorStatus('PUBLISHED');
    setPostEditorScheduledAt('');
    setPostEditorPublishedDate('');
    setPostEditorUpdatedDate('');
    setPostEditorCategoryID('');
    setPostEditorTopicIDs([]);
    setPostEditorTopicQuery('');
    setPostEditorTopicOptions([]);
    setPostEditorCategoryOptions([]);
    setPostRevisions([]);
    setPostRevisionsErrorMessage('');
    setPostRevisionsPage(1);
    setPostRevisionsTotal(0);
    setPendingPostRevisionRestore(null);
    setPostContentViewMode('editor');
    setPostEditorContent('');
    setPostEditorInitialContent('');
    setPendingPostDelete(null);
  }, []);

  const canSavePostContent =
    editingPost !== null &&
    postEditorContent.trim() !== '' &&
    postEditorContent !== postEditorInitialContent &&
    !isPostContentLoading;

  const canSavePostMetadata = React.useMemo(() => {
    if (!editingPost || isPostContentLoading) {
      return false;
    }
    if (editingPost.title.trim() !== postEditorTitle.trim()) {
      return true;
    }
    if ((editingPost.summary ?? '').trim() !== postEditorSummary.trim()) {
      return true;
    }
    if ((editingPost.thumbnail ?? '').trim() !== postEditorThumbnail.trim()) {
      return true;
    }
    if (editingPost.publishedDate.trim() !== postEditorPublishedDate.trim()) {
      return true;
    }
    if ((editingPost.updatedDate ?? '').trim() !== postEditorUpdatedDate.trim()) {
      return true;
    }
    if (editingPost.status !== postEditorStatus) {
      return true;
    }
    if ((editingPost.scheduledAt ?? '').trim() !== (postEditorScheduledAt ?? '').trim()) {
      return true;
    }
    if ((editingPost.categoryId ?? '').trim().toLowerCase() !== postEditorCategoryID.trim().toLowerCase()) {
      return true;
    }
    const currentTopics = [...(editingPost.topicIds ?? [])]
      .map(item => item.trim().toLowerCase())
      .sort((left, right) => left.localeCompare(right));
    const nextTopics = [...postEditorTopicIDs]
      .map(item => item.trim().toLowerCase())
      .sort((left, right) => left.localeCompare(right));
    return currentTopics.join('|') !== nextTopics.join('|');
  }, [
    editingPost,
    isPostContentLoading,
    postEditorCategoryID,
    postEditorPublishedDate,
    postEditorScheduledAt,
    postEditorSummary,
    postEditorStatus,
    postEditorThumbnail,
    postEditorTitle,
    postEditorTopicIDs,
    postEditorUpdatedDate,
  ]);

  React.useEffect(() => {
    if (!editingPost) {
      setPostEditorTopicOptions([]);
      return;
    }

    const requestID = postEditorTopicsRequestIDRef.current + 1;
    postEditorTopicsRequestIDRef.current = requestID;

    void (async () => {
      try {
        const nextTopics = await fetchAdminContentTopics(editingPost.locale, deferredPostEditorTopicQuery);
        if (requestID !== postEditorTopicsRequestIDRef.current) {
          return;
        }
        setPostEditorTopicOptions(nextTopics);
      } catch (error) {
        if (requestID !== postEditorTopicsRequestIDRef.current) {
          return;
        }
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setErrorMessage(
          resolvedError.message || t('adminAccount.content.errors.taxonomyLoad', { ns: 'admin-account' }),
        );
      }
    })();
  }, [deferredPostEditorTopicQuery, editingPost, onSessionExpired, setErrorMessage, t]);

  const loadPostEditorCategories = React.useCallback(async () => {
    if (!editingPost) {
      setPostEditorCategoryOptions([]);
      return;
    }

    const requestID = postEditorCategoriesRequestIDRef.current + 1;
    postEditorCategoriesRequestIDRef.current = requestID;

    try {
      const nextCategories = await fetchAdminContentCategories(editingPost.locale);
      if (requestID !== postEditorCategoriesRequestIDRef.current) {
        return;
      }
      setPostEditorCategoryOptions(nextCategories);
    } catch (error) {
      if (requestID !== postEditorCategoriesRequestIDRef.current) {
        return;
      }
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessage(resolvedError.message || t('adminAccount.content.errors.taxonomyLoad', { ns: 'admin-account' }));
    }
  }, [editingPost, onSessionExpired, setErrorMessage, t]);

  React.useEffect(() => {
    void loadPostEditorCategories();
  }, [loadPostEditorCategories]);

  const loadPostDetail = React.useCallback(
    async (options: { locale: string; id: string }) => {
      const requestID = postDetailRequestIDRef.current + 1;
      postDetailRequestIDRef.current = requestID;

      const normalizedLocale = options.locale.trim().toLowerCase();
      const normalizedID = options.id.trim();
      if (!normalizedLocale || !normalizedID) {
        resetPostDetailEditorState();
        return;
      }

      resetPostDetailEditorState();
      setIsPostContentLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        const detail = await fetchAdminContentPost({ locale: normalizedLocale, id: normalizedID });
        if (requestID !== postDetailRequestIDRef.current || !detail) {
          return;
        }

        applyPostToEditor(detail);

        const currentLocale = normalizedLocale === 'tr' ? 'tr' : 'en';
        const nextLocaleTabs = CONTENT_LOCALES.map(locale => ({
          locale,
          available: locale === currentLocale,
        }));
        const alternateLocales = CONTENT_LOCALES.filter(locale => locale !== currentLocale);
        const alternateResults = await Promise.all(
          alternateLocales.map(async locale => {
            try {
              const alternateDetail = await fetchAdminContentPost({ locale, id: normalizedID });
              return { locale, available: Boolean(alternateDetail) } as const;
            } catch (error) {
              if (isAdminSessionError(error)) {
                onSessionExpired();
                return { locale, available: false } as const;
              }
              return { locale, available: false } as const;
            }
          }),
        );
        if (requestID !== postDetailRequestIDRef.current) {
          return;
        }
        setPostLocaleTabs(
          nextLocaleTabs.map(item => alternateResults.find(result => result.locale === item.locale) ?? item),
        );
      } catch (error) {
        if (requestID !== postDetailRequestIDRef.current) {
          return;
        }
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setErrorMessage(resolvedError.message || t('adminAccount.content.errors.postLoad', { ns: 'admin-account' }));
      } finally {
        if (requestID === postDetailRequestIDRef.current) {
          setIsPostContentLoading(false);
        }
      }
    },
    [applyPostToEditor, onSessionExpired, resetPostDetailEditorState, setErrorMessage, setSuccessMessage, t],
  );

  React.useEffect(() => {
    if (!isPostDetailRoute) {
      resetPostDetailEditorState();
      setIsPostContentLoading(false);
      return;
    }

    void loadPostDetail({
      locale: routePostLocale ?? '',
      id: routePostID ?? '',
    });
  }, [isPostDetailRoute, loadPostDetail, resetPostDetailEditorState, routePostID, routePostLocale]);

  const loadPostRevisions = React.useCallback(async () => {
    if (!editingPost || activePostEditorTab !== 'metadata') {
      return;
    }

    setIsPostRevisionsLoading(true);
    setPostRevisionsErrorMessage('');
    try {
      const payload = await fetchAdminContentPostRevisions({
        locale: editingPost.locale,
        id: editingPost.id,
        page: postRevisionsPage,
        size: postRevisionsPageSize,
      });
      setPostRevisions(payload.items ?? []);
      setPostRevisionsTotal(payload.total);
      if (payload.page > 0 && payload.page !== postRevisionsPage) {
        setPostRevisionsPage(payload.page);
      }
      if (payload.size > 0 && payload.size !== postRevisionsPageSize) {
        setPostRevisionsPageSize(payload.size);
      }
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setPostRevisionsErrorMessage(
        resolvedError.message || t('adminAccount.content.errors.postRevisionsLoad', { ns: 'admin-account' }),
      );
      setPostRevisions([]);
      setPostRevisionsTotal(0);
    } finally {
      setIsPostRevisionsLoading(false);
    }
  }, [activePostEditorTab, editingPost, onSessionExpired, postRevisionsPage, postRevisionsPageSize, t]);

  React.useEffect(() => {
    if (!editingPost || activePostEditorTab !== 'metadata') {
      return;
    }
    void loadPostRevisions();
  }, [activePostEditorTab, editingPost, loadPostRevisions]);

  const handlePostTopicToggle = React.useCallback((topicID: string, checked: boolean) => {
    setPostEditorTopicIDs(previous => {
      const normalizedID = topicID.trim().toLowerCase();
      if (!normalizedID) {
        return previous;
      }
      if (checked) {
        return previous.includes(normalizedID) ? previous : [...previous, normalizedID];
      }
      return previous.filter(item => item !== normalizedID);
    });
  }, []);

  const handleUpdatePostMetadata = React.useCallback(async () => {
    if (!editingPost || isPostUpdating || !canSavePostMetadata) {
      return;
    }

    setIsPostUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const updated = await updateAdminContentPostMetadata({
        locale: editingPost.locale,
        id: editingPost.id,
        title: postEditorTitle,
        summary: postEditorSummary,
        thumbnail: postEditorThumbnail,
        publishedDate: postEditorPublishedDate,
        updatedDate: postEditorUpdatedDate,
        status: postEditorStatus,
        scheduledAt: postEditorStatus === 'SCHEDULED' ? postEditorScheduledAt : null,
        categoryId: postEditorCategoryID || null,
        topicIds: postEditorTopicIDs,
      });
      applyPostToEditor(updated);
      await Promise.all([reloadPosts(), loadPostRevisions()]);
      setSuccessMessage(
        t('adminAccount.content.success.postUpdated', {
          ns: 'admin-account',
          id: editingPost.id,
        }),
      );
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessage(resolvedError.message || t('adminAccount.content.errors.postUpdate', { ns: 'admin-account' }));
    } finally {
      setIsPostUpdating(false);
    }
  }, [
    applyPostToEditor,
    canSavePostMetadata,
    editingPost,
    isPostUpdating,
    loadPostRevisions,
    onSessionExpired,
    postEditorCategoryID,
    postEditorPublishedDate,
    postEditorScheduledAt,
    postEditorSummary,
    postEditorStatus,
    postEditorThumbnail,
    postEditorTitle,
    postEditorTopicIDs,
    postEditorUpdatedDate,
    reloadPosts,
    setErrorMessage,
    setSuccessMessage,
    t,
  ]);

  const handleUpdatePostContent = React.useCallback(async () => {
    if (!editingPost || isPostContentUpdating || isPostContentLoading) {
      return;
    }

    setIsPostContentUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const updated = await updateAdminContentPostContent({
        locale: editingPost.locale,
        id: editingPost.id,
        content: postEditorContent,
      });
      applyPostToEditor(updated);
      await Promise.all([reloadPosts(), loadPostRevisions()]);
      setSuccessMessage(
        t('adminAccount.content.success.postContentUpdated', {
          ns: 'admin-account',
          id: editingPost.id,
        }),
      );
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessage(
        resolvedError.message || t('adminAccount.content.errors.postContentUpdate', { ns: 'admin-account' }),
      );
    } finally {
      setIsPostContentUpdating(false);
    }
  }, [
    applyPostToEditor,
    editingPost,
    isPostContentLoading,
    isPostContentUpdating,
    loadPostRevisions,
    onSessionExpired,
    postEditorContent,
    reloadPosts,
    setErrorMessage,
    setSuccessMessage,
    t,
  ]);

  const handleRestorePostRevision = React.useCallback(async () => {
    if (!editingPost || !pendingPostRevisionRestore || isPostRevisionRestoring) {
      return;
    }

    setIsPostRevisionRestoring(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const restored = await restoreAdminContentPostRevision({
        locale: editingPost.locale,
        postId: editingPost.id,
        revisionId: pendingPostRevisionRestore.id,
      });
      applyPostToEditor(restored);
      setPendingPostRevisionRestore(null);
      await Promise.all([reloadPosts(), loadPostRevisions()]);
      setSuccessMessage(
        t('adminAccount.content.success.postRevisionRestored', {
          ns: 'admin-account',
          revision: pendingPostRevisionRestore.revisionNumber,
        }),
      );
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessage(
        resolvedError.message || t('adminAccount.content.errors.postRevisionRestore', { ns: 'admin-account' }),
      );
    } finally {
      setIsPostRevisionRestoring(false);
    }
  }, [
    applyPostToEditor,
    editingPost,
    isPostRevisionRestoring,
    loadPostRevisions,
    onSessionExpired,
    pendingPostRevisionRestore,
    reloadPosts,
    setErrorMessage,
    setSuccessMessage,
    t,
  ]);

  const handleDeletePost = React.useCallback(async () => {
    if (!pendingPostDelete || isPostDeleting) {
      return;
    }

    setIsPostDeleting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const payload = await deleteAdminContentPost({
        locale: pendingPostDelete.locale,
        id: pendingPostDelete.id,
      });
      if (!payload) {
        throw new Error(t('adminAccount.content.errors.postDelete', { ns: 'admin-account' }));
      }
      setPendingPostDelete(null);

      const nextTotal = Math.max(totalPosts - 1, 0);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      const nextPage = Math.min(page, nextTotalPages);
      if (nextPage === page) {
        await reloadPosts();
      } else {
        setPage(nextPage);
      }

      setSuccessMessage(
        t('adminAccount.content.success.postDeleted', {
          ns: 'admin-account',
          id: pendingPostDelete.id,
        }),
      );
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessage(resolvedError.message || t('adminAccount.content.errors.postDelete', { ns: 'admin-account' }));
    } finally {
      setIsPostDeleting(false);
    }
  }, [
    isPostDeleting,
    onSessionExpired,
    page,
    pageSize,
    pendingPostDelete,
    reloadPosts,
    setErrorMessage,
    setPage,
    setSuccessMessage,
    t,
    totalPosts,
  ]);

  return {
    editingPost,
    postLocaleTabs,
    postEditorTitle,
    setPostEditorTitle,
    postEditorSummary,
    setPostEditorSummary,
    postEditorThumbnail,
    setPostEditorThumbnail,
    postEditorStatus,
    setPostEditorStatus,
    postEditorScheduledAt,
    setPostEditorScheduledAt,
    postEditorPublishedDate,
    setPostEditorPublishedDate,
    postEditorUpdatedDate,
    setPostEditorUpdatedDate,
    postEditorCategoryID,
    setPostEditorCategoryID,
    postEditorTopicIDs,
    postEditorTopicQuery,
    setPostEditorTopicQuery,
    postEditorTopicOptions,
    postEditorCategoryOptions,
    postSeoPreviewTab,
    setPostSeoPreviewTab,
    postContentViewMode,
    setPostContentViewMode,
    postEditorContent,
    setPostEditorContent,
    isPostContentLoading,
    isPostUpdating,
    isPostContentUpdating,
    canSavePostMetadata,
    canSavePostContent,
    handlePostTopicToggle,
    handleUpdatePostMetadata,
    handleUpdatePostContent,
    postRevisions,
    postRevisionsPage,
    setPostRevisionsPage,
    postRevisionsPageSize,
    setPostRevisionsPageSize,
    postRevisionsTotal,
    isPostRevisionsLoading,
    postRevisionsErrorMessage,
    pendingPostRevisionRestore,
    setPendingPostRevisionRestore,
    isPostRevisionRestoring,
    handleRestorePostRevision,
    pendingPostDelete,
    setPendingPostDelete,
    isPostDeleting,
    handleDeletePost,
  };
}
