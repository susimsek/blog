'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import {
  fetchAdminContentCategories,
  fetchAdminContentCategoriesPage,
  fetchAdminContentTopics,
  fetchAdminContentTopicsPage,
  isAdminSessionError,
  resolveAdminError,
  type AdminContentCategoryItem,
  type AdminContentTopicItem,
} from '@/lib/adminApi';
import { type LocaleFilterValue, type SupportedContentLocale } from './adminContentTaxonomyShared';
import { useAdminContentCategorySection } from './useAdminContentCategorySection';
import { useAdminContentTopicSection } from './useAdminContentTopicSection';

type UseAdminContentTaxonomySectionParams = {
  filterLocale: LocaleFilterValue;
  currentDatePickerLocale: string;
  routeLocale: string;
  onSessionExpired: () => void;
  t: TFunction;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>;
  reloadPosts: () => Promise<void>;
};

export function useAdminContentTaxonomySection({
  filterLocale,
  currentDatePickerLocale,
  routeLocale,
  onSessionExpired,
  t,
  setErrorMessage,
  setSuccessMessage,
  reloadPosts,
}: UseAdminContentTaxonomySectionParams) {
  const [topics, setTopics] = React.useState<AdminContentTopicItem[]>([]);
  const [categories, setCategories] = React.useState<AdminContentCategoryItem[]>([]);
  const [filterTopicOptions, setFilterTopicOptions] = React.useState<AdminContentTopicItem[]>([]);
  const [filterCategoryOptions, setFilterCategoryOptions] = React.useState<AdminContentCategoryItem[]>([]);

  const taxonomyRequestIDRef = React.useRef(0);
  const filterTaxonomyRequestIDRef = React.useRef(0);

  const preferredContentLocale: SupportedContentLocale = React.useMemo(() => {
    if (filterLocale === 'tr') {
      return 'tr';
    }
    if (filterLocale === 'en') {
      return 'en';
    }
    return currentDatePickerLocale === 'tr' ? 'tr' : 'en';
  }, [currentDatePickerLocale, filterLocale]);

  const categoriesByLocaleAndID = React.useMemo(() => {
    const indexed = new Map<string, AdminContentCategoryItem>();
    for (const item of categories) {
      indexed.set(`${item.locale.toLowerCase()}|${item.id.toLowerCase()}`, item);
    }
    return indexed;
  }, [categories]);

  const topicsByLocaleAndID = React.useMemo(() => {
    const indexed = new Map<string, AdminContentTopicItem>();
    for (const item of topics) {
      indexed.set(`${item.locale.toLowerCase()}|${item.id.toLowerCase()}`, item);
    }
    return indexed;
  }, [topics]);

  const loadTaxonomies = React.useCallback(async () => {
    const requestID = taxonomyRequestIDRef.current + 1;
    taxonomyRequestIDRef.current = requestID;

    try {
      const [nextTopics, nextCategories] = await Promise.all([
        fetchAdminContentTopics(),
        fetchAdminContentCategories(),
      ]);
      if (requestID !== taxonomyRequestIDRef.current) {
        return;
      }
      setTopics(nextTopics);
      setCategories(nextCategories);
      setErrorMessage('');
    } catch (error) {
      if (requestID !== taxonomyRequestIDRef.current) {
        return;
      }
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessage(resolvedError.message || t('adminAccount.content.errors.taxonomyLoad', { ns: 'admin-account' }));
    }
  }, [onSessionExpired, setErrorMessage, t]);

  const loadFilterTaxonomyOptions = React.useCallback(async () => {
    const requestID = filterTaxonomyRequestIDRef.current + 1;
    filterTaxonomyRequestIDRef.current = requestID;

    try {
      const resolvedLocale = filterLocale === 'all' ? undefined : filterLocale;
      const [nextTopics, nextCategories] = await Promise.all([
        fetchAdminContentTopicsPage({
          locale: resolvedLocale,
          preferredLocale: routeLocale,
          page: 1,
          size: 500,
        }),
        fetchAdminContentCategoriesPage({
          locale: resolvedLocale,
          preferredLocale: routeLocale,
          page: 1,
          size: 500,
        }),
      ]);
      if (requestID !== filterTaxonomyRequestIDRef.current) {
        return;
      }
      setFilterTopicOptions(nextTopics.items.map(item => item.preferred).filter(Boolean));
      setFilterCategoryOptions(nextCategories.items.map(item => item.preferred).filter(Boolean));
    } catch (error) {
      if (requestID !== filterTaxonomyRequestIDRef.current) {
        return;
      }
      if (isAdminSessionError(error)) {
        onSessionExpired();
      }
    }
  }, [filterLocale, onSessionExpired, routeLocale]);

  React.useEffect(() => {
    void loadTaxonomies();
  }, [loadTaxonomies]);

  React.useEffect(() => {
    void loadFilterTaxonomyOptions();
  }, [loadFilterTaxonomyOptions]);

  const topicSection = useAdminContentTopicSection({
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
  });

  const categorySection = useAdminContentCategorySection({
    filterLocale,
    preferredContentLocale,
    categories,
    categoriesByLocaleAndID,
    onSessionExpired,
    t,
    setErrorMessage,
    setSuccessMessage,
    reloadPosts,
    loadTaxonomies,
    loadFilterTaxonomyOptions,
  });

  return {
    preferredContentLocale,
    topicsByLocaleAndID,
    categoriesByLocaleAndID,
    filterTopicOptions,
    filterCategoryOptions,
    ...topicSection,
    ...categorySection,
  };
}
