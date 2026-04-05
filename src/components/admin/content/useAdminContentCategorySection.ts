'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import useDebounce from '@/hooks/useDebounce';
import {
  createAdminContentCategory,
  deleteAdminContentCategory,
  fetchAdminContentCategoriesPage,
  isAdminSessionError,
  resolveAdminError,
  updateAdminContentCategory,
  type AdminContentCategoryGroupItem,
  type AdminContentCategoryItem,
} from '@/lib/adminApi';
import {
  CONTENT_ID_PATTERN,
  CONTENT_LOCALES,
  FILTER_QUERY_DEBOUNCE_MS,
  normalizeLocaleValue,
  type CategoryEditorMode,
  type LocaleFilterValue,
  type SupportedContentLocale,
} from './adminContentTaxonomyShared';

type UseAdminContentCategorySectionParams = {
  filterLocale: LocaleFilterValue;
  preferredContentLocale: SupportedContentLocale;
  categories: AdminContentCategoryItem[];
  categoriesByLocaleAndID: Map<string, AdminContentCategoryItem>;
  onSessionExpired: () => void;
  t: TFunction;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>;
  reloadPosts: () => Promise<void>;
  loadTaxonomies: () => Promise<void>;
  loadFilterTaxonomyOptions: () => Promise<void>;
};

export function useAdminContentCategorySection({
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
}: UseAdminContentCategorySectionParams) {
  const [categoryFilterLocale, setCategoryFilterLocale] = React.useState<LocaleFilterValue>('all');
  const [categoryFilterQuery, setCategoryFilterQuery] = React.useState('');
  const [categoryPage, setCategoryPage] = React.useState(1);
  const [categoryPageSize, setCategoryPageSize] = React.useState(10);
  const [categoryListItems, setCategoryListItems] = React.useState<AdminContentCategoryGroupItem[]>([]);
  const [categoryListTotal, setCategoryListTotal] = React.useState(0);
  const [isCategoryListLoading, setIsCategoryListLoading] = React.useState(false);
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = React.useState(false);
  const [categoryEditorMode, setCategoryEditorMode] = React.useState<CategoryEditorMode>('create');
  const [categoryLocale, setCategoryLocale] = React.useState<SupportedContentLocale>('en');
  const [categoryID, setCategoryID] = React.useState('');
  const [categoryName, setCategoryName] = React.useState('');
  const [categoryColor, setCategoryColor] = React.useState('');
  const [categoryIcon, setCategoryIcon] = React.useState('');
  const [categoryLink, setCategoryLink] = React.useState('');
  const [isCategorySubmitting, setIsCategorySubmitting] = React.useState(false);
  const [pendingCategoryDelete, setPendingCategoryDelete] = React.useState<AdminContentCategoryItem | null>(null);
  const [isCategoryDeleting, setIsCategoryDeleting] = React.useState(false);

  const categoriesPageRequestIDRef = React.useRef(0);
  const categoryFilterQueryDebounced = useDebounce(categoryFilterQuery.trim(), FILTER_QUERY_DEBOUNCE_MS);
  const normalizedCategoryID = categoryID.trim().toLowerCase();
  const canSubmitCategory =
    CONTENT_ID_PATTERN.test(normalizedCategoryID) &&
    categoryName.trim() !== '' &&
    categoryColor.trim().toLowerCase() !== '';

  const categoryLocaleTabs = React.useMemo(
    () =>
      categoryID.trim()
        ? (CONTENT_LOCALES.map(locale => ({
            locale,
            available: categoriesByLocaleAndID.has(`${locale}|${categoryID.trim().toLowerCase()}`),
          })) as Array<{ locale: SupportedContentLocale; available: boolean }>)
        : [],
    [categoriesByLocaleAndID, categoryID],
  );

  const categoryTotalPages = Math.max(1, Math.ceil(categoryListTotal / categoryPageSize));

  React.useEffect(() => {
    setCategoryPage(1);
  }, [categoryFilterLocale, categoryFilterQueryDebounced]);

  React.useEffect(() => {
    if (categoryPage > categoryTotalPages) {
      setCategoryPage(categoryTotalPages);
    }
  }, [categoryPage, categoryTotalPages]);

  const loadCategoriesPage = React.useCallback(async () => {
    const requestID = categoriesPageRequestIDRef.current + 1;
    categoriesPageRequestIDRef.current = requestID;
    setIsCategoryListLoading(true);

    try {
      const payload = await fetchAdminContentCategoriesPage({
        locale: categoryFilterLocale === 'all' ? undefined : categoryFilterLocale,
        preferredLocale: preferredContentLocale,
        query: categoryFilterQueryDebounced,
        page: categoryPage,
        size: categoryPageSize,
      });
      if (requestID !== categoriesPageRequestIDRef.current) {
        return;
      }

      setCategoryListItems(payload.items ?? []);
      setCategoryListTotal(payload.total);

      const resolvedPage = payload.page > 0 ? payload.page : 1;
      if (resolvedPage !== categoryPage) {
        setCategoryPage(resolvedPage);
      }
      if (payload.size > 0 && payload.size !== categoryPageSize) {
        setCategoryPageSize(payload.size);
      }

      setErrorMessage('');
    } catch (error) {
      if (requestID !== categoriesPageRequestIDRef.current) {
        return;
      }
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessage(resolvedError.message || t('adminAccount.content.errors.taxonomyLoad', { ns: 'admin-account' }));
      setCategoryListItems([]);
      setCategoryListTotal(0);
    } finally {
      if (requestID === categoriesPageRequestIDRef.current) {
        setIsCategoryListLoading(false);
      }
    }
  }, [
    categoryFilterLocale,
    categoryFilterQueryDebounced,
    categoryPage,
    categoryPageSize,
    onSessionExpired,
    preferredContentLocale,
    setErrorMessage,
    t,
  ]);

  React.useEffect(() => {
    void loadCategoriesPage();
  }, [loadCategoriesPage]);

  const resetCategoryEditor = React.useCallback(() => {
    setCategoryEditorMode('create');
    setCategoryLocale(normalizeLocaleValue(filterLocale) === 'tr' ? 'tr' : 'en');
    setCategoryID('');
    setCategoryName('');
    setCategoryColor('');
    setCategoryIcon('');
    setCategoryLink('');
  }, [filterLocale]);

  const handleOpenCreateCategory = React.useCallback(() => {
    resetCategoryEditor();
    setIsCategoryEditorOpen(true);
    setErrorMessage('');
    setSuccessMessage('');
  }, [resetCategoryEditor, setErrorMessage, setSuccessMessage]);

  const handleOpenUpdateCategory = React.useCallback(
    (item: AdminContentCategoryItem) => {
      setCategoryEditorMode('update');
      setCategoryLocale(item.locale === 'tr' ? 'tr' : 'en');
      setCategoryID(item.id);
      setCategoryName(item.name);
      setCategoryColor(item.color);
      setCategoryIcon(item.icon ?? '');
      setCategoryLink(item.link ?? '');
      setIsCategoryEditorOpen(true);
      setErrorMessage('');
      setSuccessMessage('');
    },
    [setErrorMessage, setSuccessMessage],
  );

  const handleOpenCategoryByLocale = React.useCallback(
    (id: string, locale: SupportedContentLocale) => {
      const idKey = id.trim().toLowerCase();
      const exact = categoriesByLocaleAndID.get(`${locale}|${idKey}`);
      if (exact) {
        handleOpenUpdateCategory(exact);
        return;
      }
      const base =
        categoriesByLocaleAndID.get(`en|${idKey}`) ??
        categoriesByLocaleAndID.get(`tr|${idKey}`) ??
        categories.find(item => item.id.toLowerCase() === idKey) ??
        null;
      setCategoryEditorMode('create');
      setCategoryLocale(locale);
      setCategoryID(idKey);
      setCategoryName(base?.name ?? '');
      setCategoryColor(base?.color ?? '');
      setCategoryIcon(base?.icon ?? '');
      setCategoryLink(base?.link ?? '');
      setIsCategoryEditorOpen(true);
      setErrorMessage('');
      setSuccessMessage('');
    },
    [categories, categoriesByLocaleAndID, handleOpenUpdateCategory, setErrorMessage, setSuccessMessage],
  );

  const handleSubmitCategory = React.useCallback(async () => {
    if (!canSubmitCategory || isCategorySubmitting) {
      return;
    }

    setIsCategorySubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const payload = {
        locale: categoryLocale,
        id: categoryID,
        name: categoryName,
        color: categoryColor,
        icon: categoryIcon,
        link: categoryLink,
      };
      if (categoryEditorMode === 'create') {
        await createAdminContentCategory(payload);
      } else {
        await updateAdminContentCategory(payload);
      }

      setIsCategoryEditorOpen(false);
      await Promise.all([loadTaxonomies(), loadFilterTaxonomyOptions(), reloadPosts(), loadCategoriesPage()]);
      setSuccessMessage(
        t(
          categoryEditorMode === 'create'
            ? 'adminAccount.content.success.categoryCreated'
            : 'adminAccount.content.success.categoryUpdated',
          {
            ns: 'admin-account',
            id: categoryID.trim().toLowerCase(),
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
            categoryEditorMode === 'create'
              ? 'adminAccount.content.errors.categoryCreate'
              : 'adminAccount.content.errors.categoryUpdate',
            { ns: 'admin-account' },
          ),
      );
    } finally {
      setIsCategorySubmitting(false);
    }
  }, [
    canSubmitCategory,
    categoryColor,
    categoryEditorMode,
    categoryID,
    categoryIcon,
    categoryLink,
    categoryLocale,
    categoryName,
    isCategorySubmitting,
    loadCategoriesPage,
    loadFilterTaxonomyOptions,
    loadTaxonomies,
    onSessionExpired,
    reloadPosts,
    setErrorMessage,
    setSuccessMessage,
    t,
  ]);

  const handleSwitchCategoryEditorLocale = React.useCallback(
    (locale: SupportedContentLocale) => {
      const resolvedID = categoryID.trim();
      if (!resolvedID || isCategorySubmitting) {
        return;
      }
      handleOpenCategoryByLocale(resolvedID, locale);
    },
    [categoryID, handleOpenCategoryByLocale, isCategorySubmitting],
  );

  const handleDeleteCategory = React.useCallback(async () => {
    if (!pendingCategoryDelete || isCategoryDeleting) {
      return;
    }

    setIsCategoryDeleting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const deleted = await deleteAdminContentCategory({
        locale: pendingCategoryDelete.locale,
        id: pendingCategoryDelete.id,
      });
      if (!deleted) {
        throw new Error(t('adminAccount.content.errors.categoryDelete', { ns: 'admin-account' }));
      }
      setPendingCategoryDelete(null);
      await Promise.all([loadTaxonomies(), loadFilterTaxonomyOptions(), reloadPosts(), loadCategoriesPage()]);
      setSuccessMessage(
        t('adminAccount.content.success.categoryDeleted', {
          ns: 'admin-account',
          id: pendingCategoryDelete.id,
        }),
      );
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessage(
        resolvedError.message || t('adminAccount.content.errors.categoryDelete', { ns: 'admin-account' }),
      );
    } finally {
      setIsCategoryDeleting(false);
    }
  }, [
    isCategoryDeleting,
    loadCategoriesPage,
    loadFilterTaxonomyOptions,
    loadTaxonomies,
    onSessionExpired,
    pendingCategoryDelete,
    reloadPosts,
    setErrorMessage,
    setSuccessMessage,
    t,
  ]);

  return {
    categoryFilterLocale,
    setCategoryFilterLocale,
    categoryFilterQuery,
    setCategoryFilterQuery,
    categoryPage,
    setCategoryPage,
    categoryPageSize,
    setCategoryPageSize,
    categoryListItems,
    categoryListTotal,
    categoryTotalPages,
    isCategoryListLoading,
    isCategoryEditorOpen,
    setIsCategoryEditorOpen,
    categoryEditorMode,
    categoryLocale,
    setCategoryLocale,
    categoryID,
    setCategoryID,
    categoryName,
    setCategoryName,
    categoryColor,
    setCategoryColor,
    categoryIcon,
    setCategoryIcon,
    categoryLink,
    setCategoryLink,
    normalizedCategoryID,
    canSubmitCategory,
    categoryLocaleTabs,
    isCategorySubmitting,
    pendingCategoryDelete,
    setPendingCategoryDelete,
    isCategoryDeleting,
    handleOpenCreateCategory,
    handleOpenUpdateCategory,
    handleSwitchCategoryEditorLocale,
    handleSubmitCategory,
    handleDeleteCategory,
  };
}
