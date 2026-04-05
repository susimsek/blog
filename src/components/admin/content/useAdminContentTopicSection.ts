'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import useDebounce from '@/hooks/useDebounce';
import {
  createAdminContentTopic,
  deleteAdminContentTopic,
  fetchAdminContentTopicsPage,
  isAdminSessionError,
  resolveAdminError,
  updateAdminContentTopic,
  type AdminContentTopicGroupItem,
  type AdminContentTopicItem,
} from '@/lib/adminApi';
import {
  CONTENT_ID_PATTERN,
  CONTENT_LOCALES,
  FILTER_QUERY_DEBOUNCE_MS,
  normalizeLocaleValue,
  type LocaleFilterValue,
  type SupportedContentLocale,
  type TopicEditorMode,
} from './adminContentTaxonomyShared';

type UseAdminContentTopicSectionParams = {
  filterLocale: LocaleFilterValue;
  preferredContentLocale: SupportedContentLocale;
  topics: AdminContentTopicItem[];
  topicsByLocaleAndID: Map<string, AdminContentTopicItem>;
  onSessionExpired: () => void;
  t: TFunction;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>;
  reloadPosts: () => Promise<void>;
  loadTaxonomies: () => Promise<void>;
  loadFilterTaxonomyOptions: () => Promise<void>;
};

export function useAdminContentTopicSection({
  filterLocale,
  preferredContentLocale,
  topics,
  topicsByLocaleAndID,
  onSessionExpired,
  t,
  setErrorMessage,
  setSuccessMessage,
  reloadPosts,
  loadTaxonomies,
  loadFilterTaxonomyOptions,
}: UseAdminContentTopicSectionParams) {
  const [topicFilterLocale, setTopicFilterLocale] = React.useState<LocaleFilterValue>('all');
  const [topicFilterQuery, setTopicFilterQuery] = React.useState('');
  const [topicPage, setTopicPage] = React.useState(1);
  const [topicPageSize, setTopicPageSize] = React.useState(10);
  const [topicListItems, setTopicListItems] = React.useState<AdminContentTopicGroupItem[]>([]);
  const [topicListTotal, setTopicListTotal] = React.useState(0);
  const [isTopicListLoading, setIsTopicListLoading] = React.useState(false);
  const [isTopicEditorOpen, setIsTopicEditorOpen] = React.useState(false);
  const [topicEditorMode, setTopicEditorMode] = React.useState<TopicEditorMode>('create');
  const [topicLocale, setTopicLocale] = React.useState<SupportedContentLocale>('en');
  const [topicID, setTopicID] = React.useState('');
  const [topicName, setTopicName] = React.useState('');
  const [topicColor, setTopicColor] = React.useState('');
  const [topicLink, setTopicLink] = React.useState('');
  const [isTopicSubmitting, setIsTopicSubmitting] = React.useState(false);
  const [pendingTopicDelete, setPendingTopicDelete] = React.useState<AdminContentTopicItem | null>(null);
  const [isTopicDeleting, setIsTopicDeleting] = React.useState(false);

  const topicsPageRequestIDRef = React.useRef(0);
  const topicFilterQueryDebounced = useDebounce(topicFilterQuery.trim(), FILTER_QUERY_DEBOUNCE_MS);
  const normalizedTopicID = topicID.trim().toLowerCase();
  const canSubmitTopic =
    CONTENT_ID_PATTERN.test(normalizedTopicID) && topicName.trim() !== '' && topicColor.trim().toLowerCase() !== '';

  const topicLocaleTabs = React.useMemo(
    () =>
      topicID.trim()
        ? (CONTENT_LOCALES.map(locale => ({
            locale,
            available: topicsByLocaleAndID.has(`${locale}|${topicID.trim().toLowerCase()}`),
          })) as Array<{ locale: SupportedContentLocale; available: boolean }>)
        : [],
    [topicID, topicsByLocaleAndID],
  );

  const topicTotalPages = Math.max(1, Math.ceil(topicListTotal / topicPageSize));

  React.useEffect(() => {
    setTopicPage(1);
  }, [topicFilterLocale, topicFilterQueryDebounced]);

  React.useEffect(() => {
    if (topicPage > topicTotalPages) {
      setTopicPage(topicTotalPages);
    }
  }, [topicPage, topicTotalPages]);

  const loadTopicsPage = React.useCallback(async () => {
    const requestID = topicsPageRequestIDRef.current + 1;
    topicsPageRequestIDRef.current = requestID;
    setIsTopicListLoading(true);

    try {
      const payload = await fetchAdminContentTopicsPage({
        locale: topicFilterLocale === 'all' ? undefined : topicFilterLocale,
        preferredLocale: preferredContentLocale,
        query: topicFilterQueryDebounced,
        page: topicPage,
        size: topicPageSize,
      });
      if (requestID !== topicsPageRequestIDRef.current) {
        return;
      }

      setTopicListItems(payload.items ?? []);
      setTopicListTotal(payload.total);

      const resolvedPage = payload.page > 0 ? payload.page : 1;
      if (resolvedPage !== topicPage) {
        setTopicPage(resolvedPage);
      }
      if (payload.size > 0 && payload.size !== topicPageSize) {
        setTopicPageSize(payload.size);
      }

      setErrorMessage('');
    } catch (error) {
      if (requestID !== topicsPageRequestIDRef.current) {
        return;
      }
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessage(resolvedError.message || t('adminAccount.content.errors.taxonomyLoad', { ns: 'admin-account' }));
      setTopicListItems([]);
      setTopicListTotal(0);
    } finally {
      if (requestID === topicsPageRequestIDRef.current) {
        setIsTopicListLoading(false);
      }
    }
  }, [
    onSessionExpired,
    preferredContentLocale,
    setErrorMessage,
    t,
    topicFilterLocale,
    topicFilterQueryDebounced,
    topicPage,
    topicPageSize,
  ]);

  React.useEffect(() => {
    void loadTopicsPage();
  }, [loadTopicsPage]);

  const resetTopicEditor = React.useCallback(() => {
    setTopicEditorMode('create');
    setTopicLocale(normalizeLocaleValue(filterLocale) === 'tr' ? 'tr' : 'en');
    setTopicID('');
    setTopicName('');
    setTopicColor('');
    setTopicLink('');
  }, [filterLocale]);

  const handleOpenCreateTopic = React.useCallback(() => {
    resetTopicEditor();
    setIsTopicEditorOpen(true);
    setErrorMessage('');
    setSuccessMessage('');
  }, [resetTopicEditor, setErrorMessage, setSuccessMessage]);

  const handleOpenUpdateTopic = React.useCallback(
    (item: AdminContentTopicItem) => {
      setTopicEditorMode('update');
      setTopicLocale(item.locale === 'tr' ? 'tr' : 'en');
      setTopicID(item.id);
      setTopicName(item.name);
      setTopicColor(item.color);
      setTopicLink(item.link ?? '');
      setIsTopicEditorOpen(true);
      setErrorMessage('');
      setSuccessMessage('');
    },
    [setErrorMessage, setSuccessMessage],
  );

  const handleOpenTopicByLocale = React.useCallback(
    (id: string, locale: SupportedContentLocale) => {
      const idKey = id.trim().toLowerCase();
      const exact = topicsByLocaleAndID.get(`${locale}|${idKey}`);
      if (exact) {
        handleOpenUpdateTopic(exact);
        return;
      }
      const base =
        topicsByLocaleAndID.get(`en|${idKey}`) ??
        topicsByLocaleAndID.get(`tr|${idKey}`) ??
        topics.find(item => item.id.toLowerCase() === idKey) ??
        null;
      setTopicEditorMode('create');
      setTopicLocale(locale);
      setTopicID(idKey);
      setTopicName(base?.name ?? '');
      setTopicColor(base?.color ?? '');
      setTopicLink(base?.link ?? '');
      setIsTopicEditorOpen(true);
      setErrorMessage('');
      setSuccessMessage('');
    },
    [handleOpenUpdateTopic, setErrorMessage, setSuccessMessage, topics, topicsByLocaleAndID],
  );

  const handleSubmitTopic = React.useCallback(async () => {
    if (!canSubmitTopic || isTopicSubmitting) {
      return;
    }

    setIsTopicSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const payload = {
        locale: topicLocale,
        id: topicID,
        name: topicName,
        color: topicColor,
        link: topicLink,
      };
      if (topicEditorMode === 'create') {
        await createAdminContentTopic(payload);
      } else {
        await updateAdminContentTopic(payload);
      }

      setIsTopicEditorOpen(false);
      await Promise.all([loadTaxonomies(), loadFilterTaxonomyOptions(), reloadPosts(), loadTopicsPage()]);
      setSuccessMessage(
        t(
          topicEditorMode === 'create'
            ? 'adminAccount.content.success.topicCreated'
            : 'adminAccount.content.success.topicUpdated',
          {
            ns: 'admin-account',
            id: topicID.trim().toLowerCase(),
          },
        ),
      );
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessage(
        resolvedError.message ||
          t(
            topicEditorMode === 'create'
              ? 'adminAccount.content.errors.topicCreate'
              : 'adminAccount.content.errors.topicUpdate',
            { ns: 'admin-account' },
          ),
      );
    } finally {
      setIsTopicSubmitting(false);
    }
  }, [
    canSubmitTopic,
    isTopicSubmitting,
    loadFilterTaxonomyOptions,
    loadTopicsPage,
    loadTaxonomies,
    onSessionExpired,
    reloadPosts,
    setErrorMessage,
    setSuccessMessage,
    t,
    topicColor,
    topicEditorMode,
    topicID,
    topicLink,
    topicLocale,
    topicName,
  ]);

  const handleSwitchTopicEditorLocale = React.useCallback(
    (locale: SupportedContentLocale) => {
      const resolvedID = topicID.trim();
      if (!resolvedID || isTopicSubmitting) {
        return;
      }
      handleOpenTopicByLocale(resolvedID, locale);
    },
    [handleOpenTopicByLocale, isTopicSubmitting, topicID],
  );

  const handleDeleteTopic = React.useCallback(async () => {
    if (!pendingTopicDelete || isTopicDeleting) {
      return;
    }

    setIsTopicDeleting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const deleted = await deleteAdminContentTopic({
        locale: pendingTopicDelete.locale,
        id: pendingTopicDelete.id,
      });
      if (!deleted) {
        throw new Error(t('adminAccount.content.errors.topicDelete', { ns: 'admin-account' }));
      }
      setPendingTopicDelete(null);
      await Promise.all([loadTaxonomies(), loadFilterTaxonomyOptions(), reloadPosts(), loadTopicsPage()]);
      setSuccessMessage(
        t('adminAccount.content.success.topicDeleted', {
          ns: 'admin-account',
          id: pendingTopicDelete.id,
        }),
      );
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessage(resolvedError.message || t('adminAccount.content.errors.topicDelete', { ns: 'admin-account' }));
    } finally {
      setIsTopicDeleting(false);
    }
  }, [
    isTopicDeleting,
    loadFilterTaxonomyOptions,
    loadTaxonomies,
    loadTopicsPage,
    onSessionExpired,
    pendingTopicDelete,
    reloadPosts,
    setErrorMessage,
    setSuccessMessage,
    t,
  ]);

  return {
    topicFilterLocale,
    setTopicFilterLocale,
    topicFilterQuery,
    setTopicFilterQuery,
    topicPage,
    setTopicPage,
    topicPageSize,
    setTopicPageSize,
    topicListItems,
    topicListTotal,
    topicTotalPages,
    isTopicListLoading,
    isTopicEditorOpen,
    setIsTopicEditorOpen,
    topicEditorMode,
    topicLocale,
    setTopicLocale,
    topicID,
    setTopicID,
    topicName,
    setTopicName,
    topicColor,
    setTopicColor,
    topicLink,
    setTopicLink,
    normalizedTopicID,
    canSubmitTopic,
    topicLocaleTabs,
    isTopicSubmitting,
    pendingTopicDelete,
    setPendingTopicDelete,
    isTopicDeleting,
    handleOpenCreateTopic,
    handleOpenUpdateTopic,
    handleSwitchTopicEditorLocale,
    handleSubmitTopic,
    handleDeleteTopic,
  };
}
