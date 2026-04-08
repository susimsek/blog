'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import { type PostDensityMode } from '@/components/common/PostDensityToggle';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import useDebounce from '@/hooks/useDebounce';
import {
  fetchAdminContentPosts,
  isAdminSessionError,
  resolveAdminError,
  type AdminContentPostGroupItem,
} from '@/lib/adminApi';

type LocaleFilterValue = 'all' | 'en' | 'tr';
type SourceFilterValue = 'all' | 'blog' | 'medium';
type SupportedContentLocale = 'en' | 'tr';

const SUCCESS_MESSAGE_AUTO_HIDE_MS = 3500;
const FILTER_QUERY_DEBOUNCE_MS = 220;

type UseAdminContentPostsBrowserSectionParams = {
  currentDatePickerLocale: string;
  isPostDetailRoute: boolean;
  onSessionExpired: () => void;
  t: TFunction;
};

export function useAdminContentPostsBrowserSection({
  currentDatePickerLocale,
  isPostDetailRoute,
  onSessionExpired,
  t,
}: UseAdminContentPostsBrowserSectionParams) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<AdminContentPostGroupItem[]>([]);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [filterLocale, setFilterLocale] = React.useState<LocaleFilterValue>('all');
  const [filterSource, setFilterSource] = React.useState<SourceFilterValue>('all');
  const [filterQuery, setFilterQuery] = React.useState('');
  const [filterCategoryID, setFilterCategoryID] = React.useState('');
  const [filterTopicID, setFilterTopicID] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [postDensityMode, setPostDensityMode] = React.useState<PostDensityMode>('default');
  const [mediaDensityMode, setMediaDensityMode] = React.useState<PostDensityMode>('default');

  const postsRequestIDRef = React.useRef(0);
  const reloadPostsRef = React.useRef<() => Promise<void>>(async () => {});
  const filterQueryDebounced = useDebounce(filterQuery.trim(), FILTER_QUERY_DEBOUNCE_MS);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const preferredContentLocale: SupportedContentLocale = React.useMemo(() => {
    if (filterLocale === 'tr') {
      return 'tr';
    }
    if (filterLocale === 'en') {
      return 'en';
    }
    return currentDatePickerLocale === 'tr' ? 'tr' : 'en';
  }, [currentDatePickerLocale, filterLocale]);

  useAutoClearValue(successMessage, setSuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS);

  React.useEffect(() => {
    setPage(1);
  }, [filterCategoryID, filterLocale, filterQueryDebounced, filterSource, filterTopicID]);

  const loadPosts = React.useCallback(async () => {
    const requestID = postsRequestIDRef.current + 1;
    postsRequestIDRef.current = requestID;
    setIsLoading(true);

    try {
      const payload = await fetchAdminContentPosts({
        locale: filterLocale === 'all' ? undefined : filterLocale,
        preferredLocale: preferredContentLocale,
        source: filterSource === 'all' ? undefined : filterSource,
        query: filterQueryDebounced,
        categoryId: filterCategoryID || undefined,
        topicId: filterTopicID || undefined,
        page,
        size: pageSize,
      });
      if (requestID !== postsRequestIDRef.current) {
        return;
      }

      setPosts(payload.items ?? []);
      setTotal(payload.total);

      const resolvedPage = payload.page > 0 ? payload.page : 1;
      if (resolvedPage !== page) {
        setPage(resolvedPage);
      }
      if (payload.size > 0 && payload.size !== pageSize) {
        setPageSize(payload.size);
      }

      setErrorMessage('');
    } catch (error) {
      if (requestID !== postsRequestIDRef.current) {
        return;
      }
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessage(resolvedError.message || t('adminAccount.content.errors.postLoad', { ns: 'admin-account' }));
      setPosts([]);
      setTotal(0);
    } finally {
      if (requestID === postsRequestIDRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    filterCategoryID,
    filterLocale,
    filterQueryDebounced,
    filterSource,
    filterTopicID,
    onSessionExpired,
    page,
    pageSize,
    preferredContentLocale,
    t,
  ]);

  React.useEffect(() => {
    reloadPostsRef.current = loadPosts;
  }, [loadPosts]);

  React.useEffect(() => {
    if (isPostDetailRoute) {
      return;
    }
    void loadPosts();
  }, [isPostDetailRoute, loadPosts]);

  return {
    preferredContentLocale,
    isLoading,
    posts,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    filterLocale,
    setFilterLocale,
    filterSource,
    setFilterSource,
    filterQuery,
    setFilterQuery,
    filterCategoryID,
    setFilterCategoryID,
    filterTopicID,
    setFilterTopicID,
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
    postDensityMode,
    setPostDensityMode,
    mediaDensityMode,
    setMediaDensityMode,
    reloadPosts: React.useCallback(() => reloadPostsRef.current(), []),
  };
}
