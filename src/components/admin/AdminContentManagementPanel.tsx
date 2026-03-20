'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Nav from 'react-bootstrap/Nav';
import Spinner from 'react-bootstrap/Spinner';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import DatePicker, { registerLocale } from 'react-datepicker';
import { enUS } from 'date-fns/locale/en-US';
import { tr } from 'date-fns/locale/tr';
import PaginationBar from '@/components/pagination/PaginationBar';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import AdminMarkdownEditor, { type AdminMarkdownEditorViewport } from '@/components/admin/AdminMarkdownEditor';
import { getDatePickerLocale, toISODateString } from '@/components/common/DateRangePicker';
import FlagIcon from '@/components/common/FlagIcon';
import PostDensityToggle, { type PostDensityMode } from '@/components/common/PostDensityToggle';
import PostCategoryBadge from '@/components/posts/PostCategoryBadge';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import Link from '@/components/common/Link';
import useMediaQuery from '@/hooks/useMediaQuery';
import {
  bulkDeleteAdminComments,
  bulkUpdateAdminCommentStatus,
  createAdminContentCategory,
  createAdminContentTopic,
  deleteAdminComment,
  deleteAdminContentCategory,
  deleteAdminContentPost,
  deleteAdminContentTopic,
  fetchAdminComments,
  fetchAdminContentPost,
  fetchAdminContentCategories,
  fetchAdminContentCategoriesPage,
  fetchAdminContentPosts,
  fetchAdminContentTopics,
  fetchAdminContentTopicsPage,
  isAdminSessionError,
  resolveAdminError,
  updateAdminCommentStatus,
  updateAdminContentCategory,
  updateAdminContentPostContent,
  updateAdminContentPostMetadata,
  updateAdminContentTopic,
  type AdminCommentItem,
  type AdminContentCategoryItem,
  type AdminContentCategoryGroupItem,
  type AdminContentPostGroupItem,
  type AdminContentPostItem,
  type AdminContentTopicItem,
  type AdminContentTopicGroupItem,
} from '@/lib/adminApi';
import { ADMIN_ROUTES, buildAdminContentPostDetailRoute, withAdminLocalePath } from '@/lib/adminRoutes';
import { defaultLocale } from '@/i18n/settings';
import { assetPrefix, LOCALES } from '@/config/constants';
import type { PostCategoryRef } from '@/types/posts';
import 'react-datepicker/dist/react-datepicker.css';

type AdminContentManagementPanelProps = {
  onSessionExpired: () => void;
  formatDate: (value: string) => string;
};

type LocaleFilterValue = 'all' | 'en' | 'tr';
type SourceFilterValue = 'all' | 'blog' | 'medium';
type TopicEditorMode = 'create' | 'update';
type CategoryEditorMode = 'create' | 'update';
type ContentSectionTab = 'posts' | 'topics' | 'categories';
type PostEditorTab = 'metadata' | 'content' | 'comments';
type PostContentViewMode = 'editor' | 'split' | 'preview';
type SupportedContentLocale = 'en' | 'tr';
type CommentStatusFilterValue = 'all' | AdminCommentItem['status'];
const CONTENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,127}$/;
const SUCCESS_MESSAGE_AUTO_HIDE_MS = 3500;
const CONTENT_LOCALES: SupportedContentLocale[] = ['en', 'tr'];
const BOOTSTRAP_THEME_COLORS = new Set([
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'light',
  'dark',
]);

const normalizeLocaleValue = (value: string): LocaleFilterValue =>
  value === 'tr' ? 'tr' : value === 'en' ? 'en' : 'all';

const resolveLocaleLabel = (value: string) => {
  const resolved = value.trim().toLowerCase();
  if (resolved === 'tr') {
    return LOCALES.tr.name;
  }
  if (resolved === 'en') {
    return LOCALES.en.name;
  }
  return value.toUpperCase();
};

const resolveLocaleOptionLabel = (item: { locale: string; name: string }) =>
  `[${item.locale.toUpperCase()}] ${item.name}`;

const toTaxonomyKey = (item: { locale: string; id: string }) => `${item.locale.toLowerCase()}|${item.id.toLowerCase()}`;

const resolveContentSectionTab = (value?: string | null): ContentSectionTab => {
  const resolved = value?.trim().toLowerCase();
  if (resolved === 'topics') {
    return 'topics';
  }
  if (resolved === 'posts') {
    return 'posts';
  }
  return 'categories';
};

const resolveAdminContentThumbnailSrc = (value: string | null) => {
  const resolved = value?.trim() ?? '';
  if (!resolved) {
    return null;
  }
  if (/^https?:\/\//i.test(resolved)) {
    return resolved;
  }

  const normalizedPath = resolved.startsWith('/') ? resolved : `/${resolved}`;
  if (!assetPrefix) {
    return normalizedPath;
  }
  const normalizedPrefix = assetPrefix.endsWith('/') ? assetPrefix.slice(0, -1) : assetPrefix;
  return `${normalizedPrefix}${normalizedPath}`;
};

const resolveAdminContentAccentColor = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'var(--active-color)';
  }
  const lowered = trimmed.toLowerCase();
  if (BOOTSTRAP_THEME_COLORS.has(lowered)) {
    return `var(--bs-${lowered})`;
  }
  return trimmed;
};

const parseISODateInput = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!matched) {
    return null;
  }

  const [, yearRaw, monthRaw, dayRaw] = matched;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

export default function AdminContentManagementPanel({
  onSessionExpired,
  formatDate,
}: Readonly<AdminContentManagementPanelProps>) {
  const { t } = useTranslation(['admin-account', 'admin-common']);

  const [isLoading, setIsLoading] = React.useState(true);
  const [posts, setPosts] = React.useState<AdminContentPostGroupItem[]>([]);
  const [topics, setTopics] = React.useState<AdminContentTopicItem[]>([]);
  const [categories, setCategories] = React.useState<AdminContentCategoryItem[]>([]);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [filterLocale, setFilterLocale] = React.useState<LocaleFilterValue>('all');
  const [filterSource, setFilterSource] = React.useState<SourceFilterValue>('all');
  const [filterQuery, setFilterQuery] = React.useState('');
  const [filterQueryDebounced, setFilterQueryDebounced] = React.useState('');
  const [filterCategoryID, setFilterCategoryID] = React.useState('');
  const [filterTopicID, setFilterTopicID] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [postDensityMode, setPostDensityMode] = React.useState<PostDensityMode>('default');

  const [editingPost, setEditingPost] = React.useState<AdminContentPostItem | null>(null);
  const [postEditorTitle, setPostEditorTitle] = React.useState('');
  const [postEditorSummary, setPostEditorSummary] = React.useState('');
  const [postEditorThumbnail, setPostEditorThumbnail] = React.useState('');
  const [postEditorPublishedDate, setPostEditorPublishedDate] = React.useState('');
  const [postEditorUpdatedDate, setPostEditorUpdatedDate] = React.useState('');
  const [postEditorCategoryID, setPostEditorCategoryID] = React.useState('');
  const [postEditorTopicIDs, setPostEditorTopicIDs] = React.useState<string[]>([]);
  const [postEditorTab, setPostEditorTab] = React.useState<PostEditorTab>('content');
  const [postContentViewMode, setPostContentViewMode] = React.useState<PostContentViewMode>('editor');
  const [postEditorContent, setPostEditorContent] = React.useState('');
  const [postEditorInitialContent, setPostEditorInitialContent] = React.useState('');
  const [isPostContentLoading, setIsPostContentLoading] = React.useState(false);
  const [isPostUpdating, setIsPostUpdating] = React.useState(false);
  const [isPostContentUpdating, setIsPostContentUpdating] = React.useState(false);
  const [pendingPostDelete, setPendingPostDelete] = React.useState<AdminContentPostItem | null>(null);
  const [isPostDeleting, setIsPostDeleting] = React.useState(false);
  const [postComments, setPostComments] = React.useState<AdminCommentItem[]>([]);
  const [isPostCommentsLoading, setIsPostCommentsLoading] = React.useState(false);
  const [postCommentsErrorMessage, setPostCommentsErrorMessage] = React.useState('');
  const [postCommentsSuccessMessage, setPostCommentsSuccessMessage] = React.useState('');
  const [postCommentsStatusFilter, setPostCommentsStatusFilter] = React.useState<CommentStatusFilterValue>('all');
  const [postCommentsFilterQuery, setPostCommentsFilterQuery] = React.useState('');
  const [postCommentsFilterQueryDebounced, setPostCommentsFilterQueryDebounced] = React.useState('');
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

  const [isTopicEditorOpen, setIsTopicEditorOpen] = React.useState(false);
  const [topicEditorMode, setTopicEditorMode] = React.useState<TopicEditorMode>('create');
  const [topicLocale, setTopicLocale] = React.useState<'en' | 'tr'>('en');
  const [topicID, setTopicID] = React.useState('');
  const [topicName, setTopicName] = React.useState('');
  const [topicColor, setTopicColor] = React.useState('');
  const [topicLink, setTopicLink] = React.useState('');
  const [topicFilterLocale, setTopicFilterLocale] = React.useState<LocaleFilterValue>('all');
  const [topicFilterQuery, setTopicFilterQuery] = React.useState('');
  const [topicFilterQueryDebounced, setTopicFilterQueryDebounced] = React.useState('');
  const [topicPage, setTopicPage] = React.useState(1);
  const [topicPageSize, setTopicPageSize] = React.useState(10);
  const [topicListItems, setTopicListItems] = React.useState<AdminContentTopicGroupItem[]>([]);
  const [topicListTotal, setTopicListTotal] = React.useState(0);
  const [isTopicListLoading, setIsTopicListLoading] = React.useState(false);
  const [isTopicSubmitting, setIsTopicSubmitting] = React.useState(false);
  const [pendingTopicDelete, setPendingTopicDelete] = React.useState<AdminContentTopicItem | null>(null);
  const [isTopicDeleting, setIsTopicDeleting] = React.useState(false);

  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = React.useState(false);
  const [categoryEditorMode, setCategoryEditorMode] = React.useState<CategoryEditorMode>('create');
  const [categoryLocale, setCategoryLocale] = React.useState<'en' | 'tr'>('en');
  const [categoryID, setCategoryID] = React.useState('');
  const [categoryName, setCategoryName] = React.useState('');
  const [categoryColor, setCategoryColor] = React.useState('');
  const [categoryIcon, setCategoryIcon] = React.useState('');
  const [categoryLink, setCategoryLink] = React.useState('');
  const [categoryFilterLocale, setCategoryFilterLocale] = React.useState<LocaleFilterValue>('all');
  const [categoryFilterQuery, setCategoryFilterQuery] = React.useState('');
  const [categoryFilterQueryDebounced, setCategoryFilterQueryDebounced] = React.useState('');
  const [categoryPage, setCategoryPage] = React.useState(1);
  const [categoryPageSize, setCategoryPageSize] = React.useState(10);
  const [categoryListItems, setCategoryListItems] = React.useState<AdminContentCategoryGroupItem[]>([]);
  const [categoryListTotal, setCategoryListTotal] = React.useState(0);
  const [isCategoryListLoading, setIsCategoryListLoading] = React.useState(false);
  const [isCategorySubmitting, setIsCategorySubmitting] = React.useState(false);
  const [pendingCategoryDelete, setPendingCategoryDelete] = React.useState<AdminContentCategoryItem | null>(null);
  const [isCategoryDeleting, setIsCategoryDeleting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<ContentSectionTab>('categories');
  const canUsePostGridDensity = useMediaQuery('(min-width: 1200px)');
  const resolvedPostDensityMode: PostDensityMode =
    canUsePostGridDensity || postDensityMode !== 'grid' ? postDensityMode : 'default';
  const router = useRouter();
  const params = useParams<{
    locale?: string | string[];
    postLocale?: string | string[];
    postId?: string | string[];
  }>();
  const routeLocale =
    (Array.isArray(params.locale) ? params.locale[0] : params.locale)?.trim().toLowerCase() || defaultLocale;
  const routePostLocale = (Array.isArray(params.postLocale) ? params.postLocale[0] : params.postLocale)
    ?.trim()
    .toLowerCase();
  const routePostID = (Array.isArray(params.postId) ? params.postId[0] : params.postId)?.trim();
  const isPostDetailRoute = Boolean(routePostLocale && routePostID);
  const currentDatePickerLocale = getDatePickerLocale(params?.locale);
  const datePickerLocaleConfig = currentDatePickerLocale === 'tr' ? tr : enUS;

  const listTopRef = React.useRef<HTMLDivElement | null>(null);
  const splitPreviewRef = React.useRef<HTMLDivElement | null>(null);
  const splitEditorViewportRef = React.useRef<AdminMarkdownEditorViewport | null>(null);
  const postsRequestIDRef = React.useRef(0);
  const postDetailRequestIDRef = React.useRef(0);
  const taxonomyRequestIDRef = React.useRef(0);
  const topicsPageRequestIDRef = React.useRef(0);
  const categoriesPageRequestIDRef = React.useRef(0);
  const postCommentsRequestIDRef = React.useRef(0);
  const postCommentsListTopRef = React.useRef<HTMLDivElement | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const totalPostCommentPages = Math.max(1, Math.ceil(postCommentsTotal / postCommentsPageSize));
  const selectedVisiblePostCommentIDs = React.useMemo(
    () => postComments.filter(item => selectedPostCommentIDs.includes(item.id)).map(item => item.id),
    [postComments, selectedPostCommentIDs],
  );
  const allVisiblePostCommentsSelected =
    postComments.length > 0 && selectedVisiblePostCommentIDs.length === postComments.length;
  const hasSelectedPostComments = selectedPostCommentIDs.length > 0;
  const isBulkPostCommentActionPending = bulkPostCommentActionStatus !== null || isBulkPostCommentDeleting;
  const normalizedTopicID = topicID.trim().toLowerCase();
  const normalizedCategoryID = categoryID.trim().toLowerCase();
  const canSubmitTopic =
    CONTENT_ID_PATTERN.test(normalizedTopicID) && topicName.trim() !== '' && topicColor.trim().toLowerCase() !== '';
  const canSubmitCategory =
    CONTENT_ID_PATTERN.test(normalizedCategoryID) &&
    categoryName.trim() !== '' &&
    categoryColor.trim().toLowerCase() !== '';
  const canSavePostContent =
    editingPost !== null &&
    postEditorContent.trim() !== '' &&
    postEditorContent !== postEditorInitialContent &&
    !isPostContentLoading;
  const canSavePostMetadata = React.useMemo(() => {
    if (!editingPost || isPostContentLoading) {
      return false;
    }
    const currentTitle = editingPost.title.trim();
    const nextTitle = postEditorTitle.trim();
    if (currentTitle !== nextTitle) {
      return true;
    }
    const currentSummary = (editingPost.summary ?? '').trim();
    const nextSummary = postEditorSummary.trim();
    if (currentSummary !== nextSummary) {
      return true;
    }
    const currentThumbnail = (editingPost.thumbnail ?? '').trim();
    const nextThumbnail = postEditorThumbnail.trim();
    if (currentThumbnail !== nextThumbnail) {
      return true;
    }
    const currentPublishedDate = editingPost.publishedDate.trim();
    const nextPublishedDate = postEditorPublishedDate.trim();
    if (currentPublishedDate !== nextPublishedDate) {
      return true;
    }
    const currentUpdatedDate = (editingPost.updatedDate ?? '').trim();
    const nextUpdatedDate = postEditorUpdatedDate.trim();
    if (currentUpdatedDate !== nextUpdatedDate) {
      return true;
    }
    const currentCategory = (editingPost.categoryId ?? '').trim().toLowerCase();
    const nextCategory = postEditorCategoryID.trim().toLowerCase();
    if (currentCategory !== nextCategory) {
      return true;
    }
    const currentTopics = [...(editingPost.topicIds ?? [])].map(item => item.trim().toLowerCase()).sort();
    const nextTopics = [...postEditorTopicIDs].map(item => item.trim().toLowerCase()).sort();
    return currentTopics.join('|') !== nextTopics.join('|');
  }, [
    editingPost,
    isPostContentLoading,
    postEditorCategoryID,
    postEditorPublishedDate,
    postEditorSummary,
    postEditorThumbnail,
    postEditorTitle,
    postEditorTopicIDs,
    postEditorUpdatedDate,
  ]);

  const filteredTopics = React.useMemo(
    () => (filterLocale === 'all' ? topics : topics.filter(item => item.locale === filterLocale)),
    [filterLocale, topics],
  );
  const topicTotal = topicListTotal;
  const topicTabTotalPages = Math.max(1, Math.ceil(topicTotal / topicPageSize));
  const filteredCategories = React.useMemo(
    () => (filterLocale === 'all' ? categories : categories.filter(item => item.locale === filterLocale)),
    [categories, filterLocale],
  );
  const categoryTotal = categoryListTotal;
  const categoryTabTotalPages = Math.max(1, Math.ceil(categoryTotal / categoryPageSize));
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

  const editablePostTopics = React.useMemo(() => {
    if (!editingPost) {
      return [];
    }
    return topics.filter(item => item.locale.toLowerCase() === editingPost.locale.toLowerCase());
  }, [editingPost, topics]);

  const editablePostCategories = React.useMemo(() => {
    if (!editingPost) {
      return [];
    }
    return categories.filter(item => item.locale.toLowerCase() === editingPost.locale.toLowerCase());
  }, [categories, editingPost]);

  const [postLocaleTabs, setPostLocaleTabs] = React.useState<
    Array<{ locale: SupportedContentLocale; available: boolean }>
  >([]);

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

  const postEditorPreviewState = React.useMemo(() => {
    if (!editingPost) {
      return null;
    }

    const localeCode = editingPost.locale.toLowerCase();
    const selectedCategoryID = postEditorCategoryID.trim().toLowerCase();
    const normalizedSource = editingPost.source === 'medium' ? 'medium' : 'blog';
    const sourceIcon: IconProp = normalizedSource === 'medium' ? (['fab', 'medium'] as IconProp) : 'book';
    const thumbnailSrc = resolveAdminContentThumbnailSrc(editingPost.thumbnail);
    const resolvedSummary = editingPost.summary?.trim() ?? '';

    const resolvedCategoryRecord = selectedCategoryID
      ? categoriesByLocaleAndID.get(`${localeCode}|${selectedCategoryID}`)
      : null;
    const resolvedPostCategory: PostCategoryRef | null = resolvedCategoryRecord
      ? {
          id: resolvedCategoryRecord.id,
          name: resolvedCategoryRecord.name,
          color: resolvedCategoryRecord.color,
          icon: resolvedCategoryRecord.icon ?? undefined,
        }
      : null;

    const resolvedTopicBadges =
      postEditorTopicIDs.length > 0
        ? postEditorTopicIDs
            .map(topicID => topicsByLocaleAndID.get(`${localeCode}|${topicID.toLowerCase()}`))
            .filter((topic): topic is AdminContentTopicItem => Boolean(topic))
        : [];

    return {
      localeCode,
      localeLabel: resolveLocaleLabel(localeCode),
      normalizedSource,
      sourceIcon,
      sourceLabel:
        normalizedSource === 'medium'
          ? t('common.searchSource.medium', { ns: 'common' })
          : t('common.searchSource.blog', { ns: 'common' }),
      thumbnailSrc,
      resolvedSummary,
      resolvedPostCategory,
      resolvedTopicBadges,
    };
  }, [categoriesByLocaleAndID, editingPost, postEditorCategoryID, postEditorTopicIDs, t, topicsByLocaleAndID]);

  const scrollToListTop = React.useCallback(() => {
    const target = listTopRef.current;
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const syncSplitPreviewScroll = React.useCallback((viewport: AdminMarkdownEditorViewport) => {
    const preview = splitPreviewRef.current;
    if (!preview) {
      return;
    }

    const editorScrollable = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const progress = editorScrollable > 0 ? viewport.scrollTop / editorScrollable : 0;
    const previewScrollable = Math.max(0, preview.scrollHeight - preview.clientHeight);
    const nextTop = previewScrollable > 0 ? previewScrollable * progress : 0;

    if (Math.abs(preview.scrollTop - nextTop) > 1) {
      preview.scrollTop = nextTop;
    }
  }, []);

  const handleSplitEditorViewportChange = React.useCallback(
    (viewport: AdminMarkdownEditorViewport) => {
      splitEditorViewportRef.current = viewport;
      if (postContentViewMode !== 'split') {
        return;
      }
      syncSplitPreviewScroll(viewport);
    },
    [postContentViewMode, syncSplitPreviewScroll],
  );

  React.useEffect(() => {
    registerLocale('en', enUS);
    registerLocale('tr', tr);
  }, []);

  React.useEffect(() => {
    const timeoutID = globalThis.setTimeout(() => {
      setFilterQueryDebounced(filterQuery.trim());
    }, 220);
    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [filterQuery]);

  React.useEffect(() => {
    const timeoutID = globalThis.setTimeout(() => {
      setTopicFilterQueryDebounced(topicFilterQuery.trim());
    }, 220);
    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [topicFilterQuery]);

  React.useEffect(() => {
    const timeoutID = globalThis.setTimeout(() => {
      setCategoryFilterQueryDebounced(categoryFilterQuery.trim());
    }, 220);
    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [categoryFilterQuery]);

  React.useEffect(() => {
    setPage(1);
  }, [filterCategoryID, filterLocale, filterQueryDebounced, filterSource, filterTopicID]);

  React.useEffect(() => {
    setTopicPage(1);
  }, [topicFilterLocale, topicFilterQueryDebounced]);

  React.useEffect(() => {
    setCategoryPage(1);
  }, [categoryFilterLocale, categoryFilterQueryDebounced]);

  React.useEffect(() => {
    if (topicPage > topicTabTotalPages) {
      setTopicPage(topicTabTotalPages);
    }
  }, [topicPage, topicTabTotalPages]);

  React.useEffect(() => {
    if (categoryPage > categoryTabTotalPages) {
      setCategoryPage(categoryTabTotalPages);
    }
  }, [categoryPage, categoryTabTotalPages]);

  React.useEffect(() => {
    if (postContentViewMode !== 'split') {
      return;
    }

    const viewport = splitEditorViewportRef.current;
    if (!viewport) {
      return;
    }

    const frameID = requestAnimationFrame(() => {
      syncSplitPreviewScroll(viewport);
    });

    return () => {
      cancelAnimationFrame(frameID);
    };
  }, [postContentViewMode, postEditorContent, syncSplitPreviewScroll]);

  React.useEffect(() => {
    if (postContentViewMode !== 'split') {
      return;
    }

    const preview = splitPreviewRef.current;
    if (!preview || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      const viewport = splitEditorViewportRef.current;
      if (!viewport) {
        return;
      }
      syncSplitPreviewScroll(viewport);
    });

    observer.observe(preview);
    return () => {
      observer.disconnect();
    };
  }, [postContentViewMode, syncSplitPreviewScroll]);

  React.useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timeoutID = globalThis.setTimeout(() => {
      setSuccessMessage('');
    }, SUCCESS_MESSAGE_AUTO_HIDE_MS);
    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [successMessage]);

  React.useEffect(() => {
    if (!postCommentsSuccessMessage) {
      return;
    }
    const timeoutID = globalThis.setTimeout(() => {
      setPostCommentsSuccessMessage('');
    }, SUCCESS_MESSAGE_AUTO_HIDE_MS);
    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [postCommentsSuccessMessage]);

  React.useEffect(() => {
    const timeoutID = globalThis.setTimeout(() => {
      setPostCommentsFilterQueryDebounced(postCommentsFilterQuery.trim());
    }, 220);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [postCommentsFilterQuery]);

  React.useEffect(() => {
    setSelectedPostCommentIDs(previous => previous.filter(id => postComments.some(item => item.id === id)));
  }, [postComments]);

  React.useEffect(() => {
    setPostCommentsPage(1);
  }, [postCommentsFilterQueryDebounced, postCommentsStatusFilter, routePostID]);

  React.useEffect(() => {
    const categoryExists =
      filterCategoryID === '' ||
      filteredCategories.some(item => item.id.toLowerCase() === filterCategoryID.toLowerCase());
    if (!categoryExists) {
      setFilterCategoryID('');
    }
  }, [filterCategoryID, filteredCategories]);

  React.useEffect(() => {
    const topicExists =
      filterTopicID === '' || filteredTopics.some(item => item.id.toLowerCase() === filterTopicID.toLowerCase());
    if (!topicExists) {
      setFilterTopicID('');
    }
  }, [filterTopicID, filteredTopics]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncTabFromHash = () => {
      const hashValue = window.location.hash.replace(/^#/, '');
      setActiveTab(resolveContentSectionTab(hashValue));
    };

    syncTabFromHash();
    window.addEventListener('hashchange', syncTabFromHash);
    return () => {
      window.removeEventListener('hashchange', syncTabFromHash);
    };
  }, []);

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
  }, [onSessionExpired, t]);

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
    t,
    topicFilterLocale,
    topicFilterQueryDebounced,
    topicPage,
    topicPageSize,
  ]);

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
    t,
  ]);

  React.useEffect(() => {
    void loadTaxonomies();
  }, [loadTaxonomies]);

  React.useEffect(() => {
    if (isPostDetailRoute) {
      return;
    }
    void loadPosts();
  }, [isPostDetailRoute, loadPosts]);

  React.useEffect(() => {
    void loadTopicsPage();
  }, [loadTopicsPage]);

  React.useEffect(() => {
    void loadCategoriesPage();
  }, [loadCategoriesPage]);

  const loadPostDetail = React.useCallback(
    async (options: { locale: string; id: string }) => {
      const requestID = postDetailRequestIDRef.current + 1;
      postDetailRequestIDRef.current = requestID;

      const normalizedLocale = options.locale.trim().toLowerCase();
      const normalizedID = options.id.trim();
      if (!normalizedLocale || !normalizedID) {
        setEditingPost(null);
        setPostLocaleTabs([]);
        setPostEditorTitle('');
        setPostEditorSummary('');
        setPostEditorThumbnail('');
        setPostEditorPublishedDate('');
        setPostEditorUpdatedDate('');
        setPostEditorCategoryID('');
        setPostEditorTopicIDs([]);
        setPostContentViewMode('editor');
        setPostEditorContent('');
        setPostEditorInitialContent('');
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
        return;
      }

      setEditingPost(null);
      setPostLocaleTabs([]);
      setPostEditorTitle('');
      setPostEditorSummary('');
      setPostEditorThumbnail('');
      setPostEditorPublishedDate('');
      setPostEditorUpdatedDate('');
      setPostEditorCategoryID('');
      setPostEditorTopicIDs([]);
      setPostContentViewMode('editor');
      setPostEditorContent('');
      setPostEditorInitialContent('');
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
      setPostEditorTab('content');
      setIsPostContentLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        const detail = await fetchAdminContentPost({
          locale: normalizedLocale,
          id: normalizedID,
        });

        if (requestID !== postDetailRequestIDRef.current || !detail) {
          return;
        }

        setEditingPost(detail);
        setPostEditorTitle(detail.title ?? '');
        setPostEditorSummary(detail.summary ?? '');
        setPostEditorThumbnail(detail.thumbnail ?? '');
        setPostEditorPublishedDate(detail.publishedDate ?? '');
        setPostEditorUpdatedDate(detail.updatedDate ?? '');
        setPostEditorCategoryID(detail.categoryId ?? '');
        setPostEditorTopicIDs(detail.topicIds ?? []);
        const resolvedContent = detail.content ?? '';
        setPostEditorContent(resolvedContent);
        setPostEditorInitialContent(resolvedContent);
        setPostEditorTab(detail.source === 'blog' ? 'content' : 'metadata');

        const currentLocale = normalizedLocale === 'tr' ? 'tr' : 'en';
        const nextLocaleTabs = CONTENT_LOCALES.map(locale => ({
          locale,
          available: locale === currentLocale,
        }));
        const alternateLocales = CONTENT_LOCALES.filter(locale => locale !== currentLocale);
        const alternateResults = await Promise.all(
          alternateLocales.map(async locale => {
            try {
              const alternateDetail = await fetchAdminContentPost({
                locale,
                id: normalizedID,
              });
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
    [onSessionExpired, t],
  );

  React.useEffect(() => {
    if (!isPostDetailRoute) {
      setEditingPost(null);
      setPostLocaleTabs([]);
      setPostEditorTitle('');
      setPostEditorSummary('');
      setPostEditorThumbnail('');
      setPostEditorPublishedDate('');
      setPostEditorUpdatedDate('');
      setPostEditorCategoryID('');
      setPostEditorTopicIDs([]);
      setPostContentViewMode('editor');
      setPostEditorContent('');
      setPostEditorInitialContent('');
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
      setIsPostContentLoading(false);
      return;
    }

    void loadPostDetail({
      locale: routePostLocale ?? '',
      id: routePostID ?? '',
    });
  }, [isPostDetailRoute, loadPostDetail, routePostID, routePostLocale]);

  const handlePostTopicToggle = React.useCallback((topicID: string, checked: boolean) => {
    setPostEditorTopicIDs(previous => {
      const normalizedID = topicID.trim().toLowerCase();
      if (!normalizedID) {
        return previous;
      }
      if (checked) {
        if (previous.includes(normalizedID)) {
          return previous;
        }
        return [...previous, normalizedID];
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
        categoryId: postEditorCategoryID || null,
        topicIds: postEditorTopicIDs,
      });
      setEditingPost(updated);
      setPostEditorTitle(updated.title ?? '');
      setPostEditorSummary(updated.summary ?? '');
      setPostEditorThumbnail(updated.thumbnail ?? '');
      setPostEditorPublishedDate(updated.publishedDate ?? '');
      setPostEditorUpdatedDate(updated.updatedDate ?? '');
      setPostEditorCategoryID(updated.categoryId ?? '');
      setPostEditorTopicIDs(updated.topicIds ?? []);
      await loadPosts();
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
    canSavePostMetadata,
    editingPost,
    isPostUpdating,
    loadPosts,
    onSessionExpired,
    postEditorCategoryID,
    postEditorPublishedDate,
    postEditorSummary,
    postEditorThumbnail,
    postEditorTitle,
    postEditorTopicIDs,
    postEditorUpdatedDate,
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

      const nextTotal = Math.max(total - 1, 0);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      const nextPage = Math.min(page, nextTotalPages);
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await loadPosts();
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
  }, [isPostDeleting, loadPosts, onSessionExpired, page, pageSize, pendingPostDelete, t, total]);

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

      const resolvedContent = updated.content ?? '';
      setEditingPost(updated);
      setPostEditorContent(resolvedContent);
      setPostEditorInitialContent(resolvedContent);
      await loadPosts();
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
  }, [editingPost, isPostContentLoading, isPostContentUpdating, loadPosts, onSessionExpired, postEditorContent, t]);

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
  }, [resetTopicEditor]);

  const handleOpenUpdateTopic = React.useCallback((item: AdminContentTopicItem) => {
    setTopicEditorMode('update');
    setTopicLocale(item.locale === 'tr' ? 'tr' : 'en');
    setTopicID(item.id);
    setTopicName(item.name);
    setTopicColor(item.color);
    setTopicLink(item.link ?? '');
    setIsTopicEditorOpen(true);
    setErrorMessage('');
    setSuccessMessage('');
  }, []);

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
    [handleOpenUpdateTopic, topics, topicsByLocaleAndID],
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
      await Promise.all([loadTaxonomies(), loadPosts(), loadTopicsPage()]);
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
    loadPosts,
    loadTopicsPage,
    loadTaxonomies,
    onSessionExpired,
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
      await Promise.all([loadTaxonomies(), loadPosts(), loadTopicsPage()]);
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
  }, [isTopicDeleting, loadPosts, loadTaxonomies, loadTopicsPage, onSessionExpired, pendingTopicDelete, t]);

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
  }, [resetCategoryEditor]);

  const handleOpenUpdateCategory = React.useCallback((item: AdminContentCategoryItem) => {
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
  }, []);

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
    [categories, categoriesByLocaleAndID, handleOpenUpdateCategory],
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
      await Promise.all([loadTaxonomies(), loadPosts(), loadCategoriesPage()]);
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
    loadPosts,
    loadCategoriesPage,
    loadTaxonomies,
    onSessionExpired,
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
      await Promise.all([loadTaxonomies(), loadPosts(), loadCategoriesPage()]);
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
  }, [isCategoryDeleting, loadPosts, loadTaxonomies, loadCategoriesPage, onSessionExpired, pendingCategoryDelete, t]);

  const handleTabSelect = React.useCallback((nextKey: string | null) => {
    const resolvedTab = resolveContentSectionTab(nextKey);
    setActiveTab(resolvedTab);

    if (typeof window === 'undefined') {
      return;
    }

    const nextHash = `#${resolvedTab}`;
    if (window.location.hash === nextHash) {
      return;
    }

    const nextURL = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(window.history.state, '', nextURL);
  }, []);

  const handleSwitchPostEditorLocale = React.useCallback(
    (locale: SupportedContentLocale) => {
      if (!editingPost || editingPost.id.trim() === '' || editingPost.locale.trim().toLowerCase() === locale) {
        return;
      }

      router.push(withAdminLocalePath(routeLocale, buildAdminContentPostDetailRoute(locale, editingPost.id)));
    },
    [editingPost, routeLocale, router],
  );

  const showInlinePostFeedback = isPostDetailRoute && Boolean(editingPost);
  const showTopFeedback = !showInlinePostFeedback;
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

  const scrollToPostCommentsListTop = React.useCallback(() => {
    const target = postCommentsListTopRef.current;
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const togglePostCommentSelection = React.useCallback((commentId: string, checked: boolean) => {
    setSelectedPostCommentIDs(previous => {
      if (checked) {
        return previous.includes(commentId) ? previous : [...previous, commentId];
      }
      return previous.filter(id => id !== commentId);
    });
  }, []);

  const toggleVisiblePostCommentsSelection = React.useCallback(() => {
    if (postComments.length === 0) {
      return;
    }

    setSelectedPostCommentIDs(previous => {
      if (allVisiblePostCommentsSelected) {
        return previous.filter(id => !postComments.some(item => item.id === id));
      }

      const next = new Set(previous);
      for (const item of postComments) {
        next.add(item.id);
      }
      return Array.from(next);
    });
  }, [allVisiblePostCommentsSelected, postComments]);

  const loadPostComments = React.useCallback(
    async (options?: { page?: number }) => {
      if (!editingPost || postEditorTab !== 'comments') {
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
      editingPost,
      onSessionExpired,
      postCommentsFilterQueryDebounced,
      postCommentsPage,
      postCommentsPageSize,
      postCommentsStatusFilter,
      postEditorTab,
      t,
    ],
  );

  React.useEffect(() => {
    if (!editingPost || postEditorTab !== 'comments') {
      return;
    }
    void loadPostComments();
  }, [editingPost, loadPostComments, postCommentsPage, postCommentsPageSize, postEditorTab]);

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
        const successKey =
          status === 'APPROVED'
            ? 'adminAccount.comments.success.bulkApproved'
            : status === 'REJECTED'
              ? 'adminAccount.comments.success.bulkRejected'
              : 'adminAccount.comments.success.bulkSpam';
        setPostCommentsSuccessMessage(t(successKey, { ns: 'admin-account', count: successCount }));

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
      loadPostComments,
      onSessionExpired,
      postCommentsPage,
      isBulkPostCommentActionPending,
      t,
      editingPost,
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

      if (nextPage !== postCommentsPage) {
        setPostCommentsPage(nextPage);
      } else {
        setPostComments(remainingItems);
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

  return (
    <>
      <h3 className="admin-dashboard-panel-title mb-3">{t('adminAccount.content.title', { ns: 'admin-account' })}</h3>
      <hr className="admin-section-divider mb-3" />
      <p className="admin-dashboard-panel-copy mb-3">{t('adminAccount.content.copy', { ns: 'admin-account' })}</p>

      {showTopFeedback && errorMessage ? (
        <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
          {errorMessage}
        </Alert>
      ) : null}
      {showTopFeedback && successMessage ? (
        <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
          {successMessage}
        </Alert>
      ) : null}

      <div className="d-grid gap-3">
        <div ref={listTopRef} />
        {isPostDetailRoute ? (
          <div className="card d-block">
            <div className="card-body p-3 p-md-4 w-100 admin-content-post-detail-body">
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
                <div>
                  <h4 className="admin-dashboard-panel-title mb-1">
                    {editingPost?.title ?? t('adminAccount.content.modals.post.title', { ns: 'admin-account' })}
                  </h4>
                  {editingPost ? (
                    <div className="small text-muted">
                      <div>
                        {t('adminAccount.content.modals.post.labels.id', {
                          ns: 'admin-account',
                          value: editingPost.id,
                        })}
                      </div>
                      <div>
                        {t('adminAccount.content.modals.post.labels.locale', {
                          ns: 'admin-account',
                          value: resolveLocaleLabel(editingPost.locale),
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
                <Link href={ADMIN_ROUTES.settings.content} className="btn btn-sm admin-content-back-link">
                  <FontAwesomeIcon icon="arrow-left" className="me-2" />
                  {t('adminAccount.content.actions.backToPosts', { ns: 'admin-account' })}
                </Link>
              </div>

              {editingPost && postLocaleTabs.length > 0 ? (
                <Nav
                  variant="tabs"
                  activeKey={editingPost.locale.trim().toLowerCase()}
                  className="mb-3 admin-content-tabs"
                  onSelect={eventKey => {
                    if (eventKey === 'en' || eventKey === 'tr') {
                      handleSwitchPostEditorLocale(eventKey);
                    }
                  }}
                >
                  {postLocaleTabs.map(item => (
                    <Nav.Item key={`post-editor-${item.locale}`}>
                      <Nav.Link eventKey={item.locale} disabled={!item.available}>
                        <span className="d-inline-flex align-items-center">
                          <FlagIcon
                            code={item.locale}
                            className="flex-shrink-0 me-2"
                            alt={`${resolveLocaleLabel(item.locale)} flag`}
                            width={14}
                            height={14}
                          />
                          <span>{item.locale.toUpperCase()}</span>
                        </span>
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>
              ) : null}

              {isPostContentLoading ? (
                <div className="d-flex align-items-center gap-2 text-muted small py-2">
                  <Spinner animation="border" size="sm" />
                  <span>{t('adminAccount.content.loading.postContent', { ns: 'admin-account' })}</span>
                </div>
              ) : editingPost ? (
                <>
                  <Tabs
                    id="admin-content-post-editor-tabs"
                    activeKey={postEditorTab}
                    onSelect={nextKey => {
                      setPostEditorTab(
                        nextKey === 'comments'
                          ? 'comments'
                          : nextKey === 'content' && editingPost.source === 'blog'
                            ? 'content'
                            : 'metadata',
                      );
                    }}
                    className="mb-3"
                  >
                    <Tab
                      eventKey="metadata"
                      title={
                        <span className="d-inline-flex align-items-center gap-2">
                          <FontAwesomeIcon icon="info-circle" />
                          <span>{t('adminAccount.content.modals.post.tabs.metadata', { ns: 'admin-account' })}</span>
                        </span>
                      }
                    >
                      <div className="admin-content-post-tab-pane pt-3">
                        <Form.Group className="mb-3" controlId="admin-content-post-title">
                          <Form.Label>
                            {t('adminAccount.content.modals.post.metadataFields.title', { ns: 'admin-account' })}
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={postEditorTitle}
                            onChange={event => {
                              setPostEditorTitle(event.currentTarget.value);
                            }}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="admin-content-post-summary">
                          <Form.Label>
                            {t('adminAccount.content.modals.post.metadataFields.summary', { ns: 'admin-account' })}
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            value={postEditorSummary}
                            onChange={event => {
                              setPostEditorSummary(event.currentTarget.value);
                            }}
                          />
                        </Form.Group>

                        <div className="row g-3 mb-3">
                          <div className="col-12 col-lg-6">
                            <Form.Group controlId="admin-content-post-published-date">
                              <Form.Label>
                                {t('adminAccount.content.modals.post.metadataFields.publishedDate', {
                                  ns: 'admin-account',
                                })}
                              </Form.Label>
                              <DatePicker
                                selected={parseISODateInput(postEditorPublishedDate)}
                                onChange={(date: Date | null) => {
                                  setPostEditorPublishedDate(date ? toISODateString(date) : '');
                                }}
                                dateFormat="P"
                                locale={datePickerLocaleConfig}
                                className="form-control"
                                wrapperClassName="d-block"
                                placeholderText={t('adminAccount.content.modals.post.metadataFields.publishedDate', {
                                  ns: 'admin-account',
                                })}
                              />
                            </Form.Group>
                          </div>
                          <div className="col-12 col-lg-6">
                            <Form.Group controlId="admin-content-post-updated-date">
                              <Form.Label>
                                {t('adminAccount.content.modals.post.metadataFields.updatedDate', {
                                  ns: 'admin-account',
                                })}
                              </Form.Label>
                              <DatePicker
                                selected={parseISODateInput(postEditorUpdatedDate)}
                                onChange={(date: Date | null) => {
                                  setPostEditorUpdatedDate(date ? toISODateString(date) : '');
                                }}
                                dateFormat="P"
                                locale={datePickerLocaleConfig}
                                className="form-control"
                                wrapperClassName="d-block"
                                isClearable
                                placeholderText={t('adminAccount.content.modals.post.metadataFields.updatedDate', {
                                  ns: 'admin-account',
                                })}
                              />
                              <Form.Text className="text-muted">
                                {t('adminAccount.content.modals.post.metadataFields.updatedDateHint', {
                                  ns: 'admin-account',
                                })}
                              </Form.Text>
                            </Form.Group>
                          </div>
                        </div>

                        <Form.Group className="mb-3" controlId="admin-content-post-thumbnail">
                          <Form.Label>
                            {t('adminAccount.content.modals.post.metadataFields.thumbnail', { ns: 'admin-account' })}
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={postEditorThumbnail}
                            onChange={event => {
                              setPostEditorThumbnail(event.currentTarget.value);
                            }}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="admin-content-post-category">
                          <Form.Label>
                            {t('adminAccount.content.modals.post.category', { ns: 'admin-account' })}
                          </Form.Label>
                          <Form.Select
                            value={postEditorCategoryID}
                            onChange={event => {
                              setPostEditorCategoryID(event.currentTarget.value);
                            }}
                          >
                            <option value="">
                              {t('adminAccount.content.modals.post.categoryNone', { ns: 'admin-account' })}
                            </option>
                            {editablePostCategories.map(item => (
                              <option key={toTaxonomyKey(item)} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>

                        <Form.Group controlId="admin-content-post-topics">
                          <Form.Label>
                            {t('adminAccount.content.modals.post.topics', { ns: 'admin-account' })}
                          </Form.Label>
                          <div
                            className="border rounded-3 bg-body-tertiary overflow-auto"
                            style={{ maxHeight: '18rem' }}
                          >
                            {editablePostTopics.length === 0 ? (
                              <div className="small text-muted p-3">
                                {t('adminAccount.content.modals.post.topicsEmpty', { ns: 'admin-account' })}
                              </div>
                            ) : (
                              <div className="list-group list-group-flush">
                                {editablePostTopics.map(item => (
                                  <div key={toTaxonomyKey(item)} className="list-group-item bg-transparent py-2">
                                    <Form.Check
                                      type="checkbox"
                                      id={`admin-content-post-topic-${toTaxonomyKey(item)}`}
                                      className="mb-0"
                                      label={item.name}
                                      checked={postEditorTopicIDs.includes(item.id)}
                                      onChange={event => {
                                        handlePostTopicToggle(item.id, event.currentTarget.checked);
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </Form.Group>
                      </div>
                    </Tab>
                    <Tab
                      eventKey="comments"
                      title={
                        <span className="d-inline-flex align-items-center gap-2">
                          <FontAwesomeIcon icon="comments" />
                          <span>{t('adminAccount.content.modals.post.tabs.comments', { ns: 'admin-account' })}</span>
                        </span>
                      }
                    >
                      <div className="admin-content-post-tab-pane pt-3">
                        <div ref={postCommentsListTopRef} />
                        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
                          <div>
                            <h5 className="mb-1">
                              {t('adminAccount.content.modals.post.comments.title', { ns: 'admin-account' })}
                            </h5>
                            <p className="small text-muted mb-0">
                              {t('adminAccount.content.modals.post.comments.copy', { ns: 'admin-account' })}
                            </p>
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <Badge bg="light" text="dark" pill>
                              {t('adminAccount.content.modals.post.comments.total', {
                                ns: 'admin-account',
                                count: postCommentsTotal,
                              })}
                            </Badge>
                            <Form.Group controlId="admin-content-post-comments-status" className="mb-0">
                              <Form.Select
                                size="sm"
                                value={postCommentsStatusFilter}
                                onChange={event => {
                                  setPostCommentsStatusFilter(event.currentTarget.value as CommentStatusFilterValue);
                                  setPostCommentsErrorMessage('');
                                  setPostCommentsSuccessMessage('');
                                }}
                              >
                                <option value="all">
                                  {t('adminAccount.comments.filters.statuses.all', { ns: 'admin-account' })}
                                </option>
                                <option value="PENDING">
                                  {t('adminAccount.comments.filters.statuses.pending', { ns: 'admin-account' })}
                                </option>
                                <option value="APPROVED">
                                  {t('adminAccount.comments.filters.statuses.approved', { ns: 'admin-account' })}
                                </option>
                                <option value="REJECTED">
                                  {t('adminAccount.comments.filters.statuses.rejected', { ns: 'admin-account' })}
                                </option>
                                <option value="SPAM">
                                  {t('adminAccount.comments.filters.statuses.spam', { ns: 'admin-account' })}
                                </option>
                              </Form.Select>
                            </Form.Group>
                          </div>
                        </div>

                        <Form.Group controlId="admin-content-post-comments-query" className="mb-3">
                          <Form.Label className="small fw-semibold mb-1">
                            {t('adminAccount.comments.filters.query', { ns: 'admin-account' })}
                          </Form.Label>
                          <div className="search-bar w-100 d-flex align-items-center">
                            <div className="search-icon">
                              <FontAwesomeIcon icon="search" />
                            </div>
                            <Form.Control
                              type="text"
                              className="search-input form-control"
                              value={postCommentsFilterQuery}
                              onChange={event => {
                                setPostCommentsFilterQuery(event.currentTarget.value);
                                setPostCommentsErrorMessage('');
                                setPostCommentsSuccessMessage('');
                              }}
                              placeholder={t('adminAccount.content.modals.post.comments.queryPlaceholder', {
                                ns: 'admin-account',
                              })}
                            />
                            {postCommentsFilterQuery ? (
                              <button
                                type="button"
                                className="search-clear-btn border-0 bg-transparent"
                                onClick={() => {
                                  setPostCommentsFilterQuery('');
                                  setPostCommentsErrorMessage('');
                                  setPostCommentsSuccessMessage('');
                                }}
                                aria-label={t('adminAccount.comments.filters.query', { ns: 'admin-account' })}
                              >
                                <FontAwesomeIcon icon="times-circle" className="clear-icon" />
                              </button>
                            ) : null}
                          </div>
                        </Form.Group>

                        {postCommentsErrorMessage ? (
                          <Alert variant="danger" className="mb-3 px-3 py-2 lh-base">
                            {postCommentsErrorMessage}
                          </Alert>
                        ) : null}
                        {postCommentsSuccessMessage ? (
                          <Alert variant="success" className="mb-3 px-3 py-2 lh-base">
                            {postCommentsSuccessMessage}
                          </Alert>
                        ) : null}

                        <div className="card shadow-sm d-block">
                          <div className="card-body p-3 w-100">
                            {postComments.length > 0 ? (
                              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={allVisiblePostCommentsSelected ? 'secondary' : 'outline-secondary'}
                                    disabled={isPostCommentsLoading || isBulkPostCommentActionPending}
                                    onClick={toggleVisiblePostCommentsSelection}
                                  >
                                    <FontAwesomeIcon
                                      icon={allVisiblePostCommentsSelected ? 'check-circle' : 'circle'}
                                      className="me-2"
                                    />
                                    {t('adminAccount.comments.bulk.selectAll', { ns: 'admin-account' })}
                                  </Button>
                                  {hasSelectedPostComments ? (
                                    <>
                                      <Badge bg="light" text="dark" pill>
                                        {t('adminAccount.comments.bulk.selected', {
                                          ns: 'admin-account',
                                          count: selectedPostCommentIDs.length,
                                        })}
                                      </Badge>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="danger"
                                        disabled={isBulkPostCommentActionPending}
                                        onClick={() => {
                                          setSelectedPostCommentIDs([]);
                                        }}
                                      >
                                        <FontAwesomeIcon icon="trash" className="me-2" />
                                        {t('adminAccount.comments.bulk.clearSelection', { ns: 'admin-account' })}
                                      </Button>
                                    </>
                                  ) : null}
                                </div>
                                {hasSelectedPostComments ? (
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="success"
                                      disabled={isBulkPostCommentActionPending}
                                      onClick={() => {
                                        void handleBulkPostCommentStatusUpdate('APPROVED');
                                      }}
                                    >
                                      {bulkPostCommentActionStatus === 'APPROVED' ? (
                                        <span className="d-inline-flex align-items-center gap-2">
                                          <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            className="me-2 flex-shrink-0 admin-action-spinner"
                                            aria-hidden="true"
                                          />
                                          <span>
                                            {t('adminAccount.comments.actions.updating', { ns: 'admin-account' })}
                                          </span>
                                        </span>
                                      ) : (
                                        <>
                                          <FontAwesomeIcon icon="check" className="me-2" />
                                          {t('adminAccount.comments.actions.approve', { ns: 'admin-account' })}
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      className="admin-newsletter-action admin-newsletter-action--secondary"
                                      disabled={isBulkPostCommentActionPending}
                                      onClick={() => {
                                        void handleBulkPostCommentStatusUpdate('REJECTED');
                                      }}
                                    >
                                      {bulkPostCommentActionStatus === 'REJECTED' ? (
                                        <span className="d-inline-flex align-items-center gap-2">
                                          <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            className="me-2 flex-shrink-0 admin-action-spinner"
                                            aria-hidden="true"
                                          />
                                          <span>
                                            {t('adminAccount.comments.actions.updating', { ns: 'admin-account' })}
                                          </span>
                                        </span>
                                      ) : (
                                        <>
                                          <FontAwesomeIcon icon="times-circle" className="me-2" />
                                          {t('adminAccount.comments.actions.reject', { ns: 'admin-account' })}
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="danger"
                                      className="admin-newsletter-action admin-newsletter-action--danger"
                                      disabled={isBulkPostCommentActionPending}
                                      onClick={() => {
                                        void handleBulkPostCommentStatusUpdate('SPAM');
                                      }}
                                    >
                                      {bulkPostCommentActionStatus === 'SPAM' ? (
                                        <span className="d-inline-flex align-items-center gap-2">
                                          <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            className="me-2 flex-shrink-0 admin-action-spinner"
                                            aria-hidden="true"
                                          />
                                          <span>
                                            {t('adminAccount.comments.actions.updating', { ns: 'admin-account' })}
                                          </span>
                                        </span>
                                      ) : (
                                        <>
                                          <FontAwesomeIcon icon="shield-halved" className="me-2" />
                                          {t('adminAccount.comments.actions.spam', { ns: 'admin-account' })}
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="danger"
                                      disabled={isBulkPostCommentActionPending}
                                      onClick={() => {
                                        setPendingBulkPostCommentDeleteIDs(selectedPostCommentIDs);
                                      }}
                                    >
                                      {isBulkPostCommentDeleting ? (
                                        <span className="d-inline-flex align-items-center gap-2">
                                          <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            className="me-2 flex-shrink-0 admin-action-spinner"
                                            aria-hidden="true"
                                          />
                                          <span>
                                            {t('adminAccount.comments.actions.deleting', { ns: 'admin-account' })}
                                          </span>
                                        </span>
                                      ) : (
                                        <>
                                          <FontAwesomeIcon icon="trash" className="me-2" />
                                          {t('adminAccount.comments.actions.delete', { ns: 'admin-account' })}
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                            {isPostCommentsLoading ? (
                              <AdminLoadingState
                                className="admin-loading-stack"
                                ariaLabel={t('adminAccount.comments.loading', { ns: 'admin-account' })}
                              />
                            ) : postCommentsTotal === 0 ? (
                              <p className="small text-muted mb-0">
                                {t('adminAccount.content.modals.post.comments.empty', { ns: 'admin-account' })}
                              </p>
                            ) : (
                              <div className="d-grid gap-3">
                                {postComments.map(item => {
                                  const isActionPending = postCommentActionID === item.id;
                                  const isDeletePending = deletingPostCommentID === item.id;
                                  const isApprovePending = isActionPending && postCommentActionStatus === 'APPROVED';
                                  const isRejectPending = isActionPending && postCommentActionStatus === 'REJECTED';
                                  const isSpamPending = isActionPending && postCommentActionStatus === 'SPAM';
                                  const statusLabel = t(
                                    `adminAccount.comments.filters.statuses.${item.status.toLowerCase()}`,
                                    { ns: 'admin-account' },
                                  );

                                  return (
                                    <div
                                      key={item.id}
                                      className={`admin-newsletter-campaign-card admin-comments-card admin-comments-card--${item.status.toLowerCase()}`}
                                    >
                                      <div className="d-flex align-items-start gap-3">
                                        <Form.Check
                                          type="checkbox"
                                          className="mt-1"
                                          aria-label={item.authorName}
                                          checked={selectedPostCommentIDs.includes(item.id)}
                                          disabled={
                                            isActionPending || isDeletePending || isBulkPostCommentActionPending
                                          }
                                          onChange={event => {
                                            togglePostCommentSelection(item.id, event.currentTarget.checked);
                                          }}
                                        />
                                        <div className="d-grid gap-2 flex-grow-1">
                                          <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <strong className="text-break">{item.authorName}</strong>
                                            <span
                                              className={`badge text-bg-${resolveCommentStatusVariant(item.status)}`}
                                            >
                                              {statusLabel}
                                            </span>
                                            <span className="badge text-bg-light">
                                              {item.parentId
                                                ? t('adminAccount.comments.list.replyLabel', { ns: 'admin-account' })
                                                : t('adminAccount.comments.list.rootLabel', { ns: 'admin-account' })}
                                            </span>
                                          </div>
                                          <div className="small text-muted d-flex align-items-center gap-2 flex-wrap">
                                            <span className="d-inline-flex align-items-center gap-2">
                                              <FontAwesomeIcon icon="envelope" className="text-muted" />
                                              <span>{item.authorEmail}</span>
                                            </span>
                                            <span className="d-inline-flex align-items-center gap-2">
                                              <FontAwesomeIcon icon="calendar-alt" className="text-muted" />
                                              <span>
                                                {t('adminAccount.comments.list.submittedAt', {
                                                  ns: 'admin-account',
                                                  value: formatDate(item.createdAt),
                                                })}
                                              </span>
                                            </span>
                                            {item.updatedAt && item.updatedAt !== item.createdAt ? (
                                              <span className="d-inline-flex align-items-center gap-2">
                                                <FontAwesomeIcon icon="clock" className="text-muted" />
                                                <span>
                                                  {t('adminAccount.comments.list.updatedAt', {
                                                    ns: 'admin-account',
                                                    value: formatDate(item.updatedAt),
                                                  })}
                                                </span>
                                              </span>
                                            ) : null}
                                          </div>
                                        </div>
                                      </div>

                                      <p className="mb-0 mt-3 text-break">{item.content}</p>

                                      <div className="row g-2 mt-3">
                                        <div className="col-12 col-md-auto">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="success"
                                            className="w-100"
                                            disabled={
                                              isActionPending ||
                                              isDeletePending ||
                                              isBulkPostCommentActionPending ||
                                              item.status === 'APPROVED'
                                            }
                                            onClick={() => {
                                              void handlePostCommentStatusUpdate(item.id, 'APPROVED');
                                            }}
                                          >
                                            {isApprovePending ? (
                                              <span className="d-inline-flex align-items-center gap-2">
                                                <Spinner
                                                  as="span"
                                                  animation="border"
                                                  size="sm"
                                                  className="me-2 flex-shrink-0 admin-action-spinner"
                                                  aria-hidden="true"
                                                />
                                                <span>
                                                  {t('adminAccount.comments.actions.updating', {
                                                    ns: 'admin-account',
                                                  })}
                                                </span>
                                              </span>
                                            ) : (
                                              <>
                                                <FontAwesomeIcon icon="check" className="me-2" />
                                                {t('adminAccount.comments.actions.approve', { ns: 'admin-account' })}
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                        <div className="col-12 col-md-auto">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            className="w-100 admin-newsletter-action admin-newsletter-action--secondary"
                                            disabled={
                                              isActionPending ||
                                              isDeletePending ||
                                              isBulkPostCommentActionPending ||
                                              item.status === 'REJECTED'
                                            }
                                            onClick={() => {
                                              void handlePostCommentStatusUpdate(item.id, 'REJECTED');
                                            }}
                                          >
                                            {!isRejectPending ? (
                                              <FontAwesomeIcon icon="times-circle" className="me-2" />
                                            ) : null}
                                            {isRejectPending ? (
                                              <span className="d-inline-flex align-items-center gap-2">
                                                <Spinner
                                                  as="span"
                                                  animation="border"
                                                  size="sm"
                                                  className="me-2 flex-shrink-0 admin-action-spinner"
                                                  aria-hidden="true"
                                                />
                                                <span>
                                                  {t('adminAccount.comments.actions.updating', {
                                                    ns: 'admin-account',
                                                  })}
                                                </span>
                                              </span>
                                            ) : (
                                              t('adminAccount.comments.actions.reject', { ns: 'admin-account' })
                                            )}
                                          </Button>
                                        </div>
                                        <div className="col-12 col-md-auto">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="danger"
                                            className="w-100 admin-newsletter-action admin-newsletter-action--danger"
                                            disabled={
                                              isActionPending ||
                                              isDeletePending ||
                                              isBulkPostCommentActionPending ||
                                              item.status === 'SPAM'
                                            }
                                            onClick={() => {
                                              void handlePostCommentStatusUpdate(item.id, 'SPAM');
                                            }}
                                          >
                                            {!isSpamPending ? (
                                              <FontAwesomeIcon icon="shield-halved" className="me-2" />
                                            ) : null}
                                            {isSpamPending ? (
                                              <span className="d-inline-flex align-items-center gap-2">
                                                <Spinner
                                                  as="span"
                                                  animation="border"
                                                  size="sm"
                                                  className="me-2 flex-shrink-0 admin-action-spinner"
                                                  aria-hidden="true"
                                                />
                                                <span>
                                                  {t('adminAccount.comments.actions.updating', {
                                                    ns: 'admin-account',
                                                  })}
                                                </span>
                                              </span>
                                            ) : (
                                              t('adminAccount.comments.actions.spam', { ns: 'admin-account' })
                                            )}
                                          </Button>
                                        </div>
                                        <div className="col-12 col-md-auto">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="danger"
                                            className="w-100"
                                            disabled={
                                              isActionPending || isDeletePending || isBulkPostCommentActionPending
                                            }
                                            onClick={() => {
                                              setPendingPostCommentDelete(item);
                                            }}
                                          >
                                            {isDeletePending ? (
                                              <span className="d-inline-flex align-items-center gap-2">
                                                <Spinner
                                                  as="span"
                                                  animation="border"
                                                  size="sm"
                                                  className="me-2 flex-shrink-0 admin-action-spinner"
                                                  aria-hidden="true"
                                                />
                                                <span>
                                                  {t('adminAccount.comments.actions.deleting', {
                                                    ns: 'admin-account',
                                                  })}
                                                </span>
                                              </span>
                                            ) : (
                                              <>
                                                <FontAwesomeIcon icon="trash" className="me-2" />
                                                {t('adminAccount.comments.actions.delete', { ns: 'admin-account' })}
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {!isPostCommentsLoading && postCommentsTotal > 0 ? (
                            <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
                              <PaginationBar
                                className="border-0 rounded-0 px-2 px-md-3 py-0 bg-transparent shadow-none"
                                currentPage={postCommentsPage}
                                totalPages={totalPostCommentPages}
                                totalResults={postCommentsTotal}
                                size={postCommentsPageSize}
                                onPageChange={nextPage => {
                                  setPostCommentsPage(nextPage);
                                  scrollToPostCommentsListTop();
                                }}
                                onSizeChange={size => {
                                  setPostCommentsPageSize(size);
                                  setPostCommentsPage(1);
                                  scrollToPostCommentsListTop();
                                }}
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Tab>
                    {editingPost.source === 'blog' ? (
                      <Tab
                        eventKey="content"
                        title={
                          <span className="d-inline-flex align-items-center gap-2">
                            <FontAwesomeIcon icon="code" />
                            <span>{t('adminAccount.content.modals.post.tabs.content', { ns: 'admin-account' })}</span>
                          </span>
                        }
                      >
                        <div className="admin-content-post-tab-pane pt-3">
                          {postEditorPreviewState ? (
                            <article className="post-detail-section mt-0 mb-3">
                              {postEditorPreviewState.resolvedPostCategory ? (
                                <div className="post-detail-category-row text-start">
                                  <PostCategoryBadge
                                    category={postEditorPreviewState.resolvedPostCategory}
                                    className="post-category-link--truncated"
                                    linked={false}
                                  />
                                </div>
                              ) : null}

                              <h2 className="post-detail-title fw-bold text-center">{editingPost.title}</h2>

                              <div className="post-detail-meta">
                                <div className="post-detail-meta-item">
                                  <span className="post-detail-meta-icon" aria-hidden="true">
                                    <FontAwesomeIcon icon="calendar-alt" />
                                  </span>
                                  <div className="post-detail-meta-content">
                                    <span className="post-detail-meta-label">
                                      {t('adminAccount.content.modals.post.meta.published', { ns: 'admin-account' })}
                                    </span>
                                    <span className="post-detail-meta-value">{editingPost.publishedDate}</span>
                                  </div>
                                </div>

                                <div className="post-detail-meta-item">
                                  <span className="post-detail-meta-icon" aria-hidden="true">
                                    <FontAwesomeIcon icon="clock" />
                                  </span>
                                  <div className="post-detail-meta-content">
                                    <span className="post-detail-meta-label">
                                      {t('adminAccount.content.modals.post.meta.updated', { ns: 'admin-account' })}
                                    </span>
                                    <span className="post-detail-meta-value">
                                      {editingPost.updatedDate || editingPost.publishedDate}
                                    </span>
                                  </div>
                                </div>

                                <div className="post-detail-meta-item">
                                  <span className="post-detail-meta-icon" aria-hidden="true">
                                    <FontAwesomeIcon icon={postEditorPreviewState.sourceIcon} />
                                  </span>
                                  <div className="post-detail-meta-content">
                                    <span className="post-detail-meta-label">
                                      {t('adminAccount.content.filters.source', { ns: 'admin-account' })}
                                    </span>
                                    <span className="post-detail-meta-value">{postEditorPreviewState.sourceLabel}</span>
                                  </div>
                                </div>
                              </div>

                              {postEditorPreviewState.resolvedTopicBadges.length > 0 ? (
                                <div className="post-detail-topics d-flex justify-content-center flex-wrap">
                                  {postEditorPreviewState.resolvedTopicBadges.map(topic => (
                                    <Badge
                                      key={`${editingPost.id}-${topic.id}`}
                                      bg={topic.color}
                                      className={`badge-${topic.color}`}
                                    >
                                      {topic.name}
                                    </Badge>
                                  ))}
                                </div>
                              ) : null}

                              <div className="post-hero-image">
                                <div className="ratio ratio-16x9 rounded-3 overflow-hidden border">
                                  {postEditorPreviewState.thumbnailSrc ? (
                                    <Image
                                      src={postEditorPreviewState.thumbnailSrc}
                                      alt={editingPost.title}
                                      fill
                                      sizes="(max-width: 1200px) 100vw, 1040px"
                                      className="object-fit-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted bg-body-tertiary">
                                      <FontAwesomeIcon icon="camera" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {postEditorPreviewState.resolvedSummary ? (
                                <p className="post-summary-text mt-3 mb-0">{postEditorPreviewState.resolvedSummary}</p>
                              ) : null}
                            </article>
                          ) : null}

                          <div className="d-flex justify-content-end mb-3">
                            <div
                              className="post-density-control"
                              aria-label={t('adminAccount.content.modals.post.previewTitle', { ns: 'admin-account' })}
                            >
                              <div
                                className="btn-group post-density-toggle"
                                role="group"
                                aria-label={t('adminAccount.content.modals.post.previewTitle', { ns: 'admin-account' })}
                              >
                                <button
                                  type="button"
                                  className={`btn${postContentViewMode === 'editor' ? ' is-active' : ''}`}
                                  aria-pressed={postContentViewMode === 'editor'}
                                  aria-label={t('adminAccount.content.modals.post.modes.editor', {
                                    ns: 'admin-account',
                                  })}
                                  title={t('adminAccount.content.modals.post.modes.editor', { ns: 'admin-account' })}
                                  onClick={() => setPostContentViewMode('editor')}
                                >
                                  <span className="post-density-toggle-icon" aria-hidden="true">
                                    <FontAwesomeIcon icon="code" className="fa-fw" />
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  className={`btn${postContentViewMode === 'split' ? ' is-active' : ''}`}
                                  aria-pressed={postContentViewMode === 'split'}
                                  aria-label={t('adminAccount.content.modals.post.modes.split', {
                                    ns: 'admin-account',
                                  })}
                                  title={t('adminAccount.content.modals.post.modes.split', { ns: 'admin-account' })}
                                  onClick={() => setPostContentViewMode('split')}
                                >
                                  <span className="post-density-toggle-icon" aria-hidden="true">
                                    <FontAwesomeIcon icon="table-cells" className="fa-fw" />
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  className={`btn${postContentViewMode === 'preview' ? ' is-active' : ''}`}
                                  aria-pressed={postContentViewMode === 'preview'}
                                  aria-label={t('adminAccount.content.modals.post.modes.preview', {
                                    ns: 'admin-account',
                                  })}
                                  title={t('adminAccount.content.modals.post.modes.preview', { ns: 'admin-account' })}
                                  onClick={() => setPostContentViewMode('preview')}
                                >
                                  <span className="post-density-toggle-icon" aria-hidden="true">
                                    <FontAwesomeIcon icon="eye" className="fa-fw" />
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {postContentViewMode === 'editor' ? (
                            <AdminMarkdownEditor
                              id="admin-content-post-content-editor"
                              label={t('adminAccount.content.modals.post.contentLabel', { ns: 'admin-account' })}
                              hint={t('adminAccount.content.modals.post.contentHint', { ns: 'admin-account' })}
                              value={postEditorContent}
                              rows={18}
                              onChange={setPostEditorContent}
                            />
                          ) : postContentViewMode === 'split' ? (
                            <div className="row g-3 admin-content-post-split-row">
                              <div className="col-12 col-xl-6 admin-content-post-split-col">
                                <AdminMarkdownEditor
                                  id="admin-content-post-content-editor-split"
                                  label={t('adminAccount.content.modals.post.contentLabel', { ns: 'admin-account' })}
                                  hint={t('adminAccount.content.modals.post.contentHint', { ns: 'admin-account' })}
                                  value={postEditorContent}
                                  rows={18}
                                  className="admin-content-post-split-editor"
                                  onViewportChange={handleSplitEditorViewportChange}
                                  onChange={setPostEditorContent}
                                />
                              </div>
                              <div className="col-12 col-xl-6 admin-content-post-split-col">
                                <Form.Label className="d-block mb-2">
                                  {t('adminAccount.content.modals.post.modes.preview', { ns: 'admin-account' })}
                                </Form.Label>
                                <div
                                  ref={splitPreviewRef}
                                  className="admin-post-content-preview admin-post-content-preview--split"
                                >
                                  {postEditorContent.trim() ? (
                                    <article className="post-article admin-post-content-preview-markdown mt-0">
                                      <MarkdownRenderer content={postEditorContent} />
                                    </article>
                                  ) : (
                                    <div className="border rounded-3 p-3 bg-body-tertiary d-flex align-items-center h-100">
                                      <p className="small text-muted mb-0">
                                        {t('adminAccount.content.modals.post.previewEmpty', { ns: 'admin-account' })}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3">
                              <Form.Label className="d-block mb-2">
                                {t('adminAccount.content.modals.post.modes.preview', { ns: 'admin-account' })}
                              </Form.Label>
                              <div className="admin-post-content-preview admin-post-content-preview--boxed">
                                {postEditorContent.trim() ? (
                                  <article className="post-article admin-post-content-preview-markdown mt-0">
                                    <MarkdownRenderer content={postEditorContent} />
                                  </article>
                                ) : (
                                  <div className="p-1 d-flex align-items-center">
                                    <p className="small text-muted mb-0">
                                      {t('adminAccount.content.modals.post.previewEmpty', { ns: 'admin-account' })}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </Tab>
                    ) : null}
                  </Tabs>

                  {showInlinePostFeedback && errorMessage ? (
                    <Alert variant="danger" className="mt-3 mb-0 px-3 py-2 lh-base">
                      {errorMessage}
                    </Alert>
                  ) : null}
                  {showInlinePostFeedback && successMessage ? (
                    <Alert variant="success" className="mt-3 mb-0 px-3 py-2 lh-base">
                      {successMessage}
                    </Alert>
                  ) : null}

                  <div className="admin-content-post-actions d-flex flex-wrap gap-2 pt-3">
                    {postEditorTab === 'comments' ? null : postEditorTab === 'metadata' ||
                      editingPost.source !== 'blog' ? (
                      <Button
                        type="button"
                        variant="primary"
                        disabled={!canSavePostMetadata || isPostUpdating}
                        onClick={handleUpdatePostMetadata}
                      >
                        {isPostUpdating ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              className="me-2 flex-shrink-0"
                              aria-hidden="true"
                            />
                            <span>{t('adminAccount.content.actions.updating', { ns: 'admin-account' })}</span>
                          </span>
                        ) : (
                          <>
                            <FontAwesomeIcon icon="save" className="me-2" />
                            {t('adminAccount.content.actions.updatePost', { ns: 'admin-account' })}
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        disabled={!canSavePostContent || isPostContentUpdating}
                        onClick={handleUpdatePostContent}
                      >
                        {isPostContentUpdating ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              className="me-2 flex-shrink-0"
                              aria-hidden="true"
                            />
                            <span>{t('adminAccount.content.actions.updating', { ns: 'admin-account' })}</span>
                          </span>
                        ) : (
                          <>
                            <FontAwesomeIcon icon="save" className="me-2" />
                            {t('adminAccount.content.actions.updatePostContent', { ns: 'admin-account' })}
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        setPendingPostDelete(editingPost);
                      }}
                    >
                      <FontAwesomeIcon icon="trash" className="me-2" />
                      {t('adminAccount.content.actions.deletePost', { ns: 'admin-account' })}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="small text-muted mb-0">
                  {t('adminAccount.content.modals.post.empty', { ns: 'admin-account' })}
                </p>
              )}
            </div>
          </div>
        ) : (
          <Tabs
            id="admin-content-tabs"
            activeKey={activeTab}
            onSelect={handleTabSelect}
            className="mb-3 admin-content-tabs"
            mountOnEnter
          >
            <Tab
              eventKey="categories"
              title={
                <>
                  <FontAwesomeIcon icon="table-cells" className="me-2" />
                  {t('adminAccount.content.tabs.categories', { ns: 'admin-account' })}
                </>
              }
            >
              <div className="pt-3">
                <div className="card d-block">
                  <div className="card-body p-3 p-md-4 w-100">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h4 className="admin-dashboard-panel-title mb-0">
                        {t('adminAccount.content.categories.title', { ns: 'admin-account' })}
                      </h4>
                      <Button type="button" size="sm" variant="primary" onClick={handleOpenCreateCategory}>
                        <FontAwesomeIcon icon="plus" className="me-2" />
                        {t('adminAccount.content.actions.create', { ns: 'admin-account' })}
                      </Button>
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-lg-4">
                        <Form.Group controlId="admin-content-categories-filter-locale">
                          <Form.Label className="small fw-semibold mb-1">
                            {t('adminAccount.content.filters.locale', { ns: 'admin-account' })}
                          </Form.Label>
                          <Form.Select
                            value={categoryFilterLocale}
                            onChange={event => {
                              setCategoryFilterLocale(event.currentTarget.value as LocaleFilterValue);
                            }}
                          >
                            <option value="all">
                              {t('adminAccount.content.filters.locales.all', { ns: 'admin-account' })}
                            </option>
                            <option value="en">
                              {t('adminAccount.content.filters.locales.en', { ns: 'admin-account' })}
                            </option>
                            <option value="tr">
                              {t('adminAccount.content.filters.locales.tr', { ns: 'admin-account' })}
                            </option>
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-12 col-lg-8">
                        <Form.Group controlId="admin-content-categories-filter-query">
                          <Form.Label className="small fw-semibold mb-1">
                            {t('adminAccount.content.filters.query', { ns: 'admin-account' })}
                          </Form.Label>
                          <div className="search-bar w-100 d-flex align-items-center">
                            <div className="search-icon">
                              <FontAwesomeIcon icon="search" />
                            </div>
                            <Form.Control
                              type="text"
                              className="search-input form-control"
                              value={categoryFilterQuery}
                              onChange={event => {
                                setCategoryFilterQuery(event.currentTarget.value);
                              }}
                              placeholder={t('adminAccount.content.filters.queryPlaceholder', { ns: 'admin-account' })}
                            />
                            {categoryFilterQuery ? (
                              <button
                                type="button"
                                className="search-clear-btn border-0 bg-transparent"
                                onClick={() => {
                                  setCategoryFilterQuery('');
                                }}
                                aria-label={t('adminAccount.content.filters.query', { ns: 'admin-account' })}
                              >
                                <FontAwesomeIcon icon="times-circle" className="clear-icon" />
                              </button>
                            ) : null}
                          </div>
                        </Form.Group>
                      </div>
                    </div>
                    {isCategoryListLoading ? (
                      <AdminLoadingState
                        className="admin-loading-stack"
                        ariaLabel={t('adminAccount.content.loading.taxonomy', { ns: 'admin-account' })}
                      />
                    ) : categoryTotal === 0 ? (
                      <p className="small text-muted mb-0">
                        {t('adminAccount.content.empty.categories', { ns: 'admin-account' })}
                      </p>
                    ) : (
                      <div className="post-list-results post-list-results--editorial">
                        {categoryListItems.map(group => {
                          const item = group.preferred;
                          const accentColor = resolveAdminContentAccentColor(item.color);
                          return (
                            <div
                              key={group.id.toLowerCase()}
                              className="post-card d-flex align-items-center post-summary-card admin-account-card admin-content-category-card"
                              style={
                                {
                                  '--topic-accent': accentColor,
                                } as React.CSSProperties
                              }
                            >
                              <div className="post-card-content flex-grow-1">
                                <div className="post-summary-title-row">
                                  <h4 className="fw-bold post-summary-title fs-4 mb-0 text-break">{item.name}</h4>
                                </div>

                                <p className="post-summary-meta mb-2">
                                  <span className="text-muted d-flex align-items-center">
                                    <FontAwesomeIcon icon="tags" className="me-2" />
                                    {item.id}
                                  </span>
                                  <span className="text-muted d-flex align-items-center">
                                    <FontAwesomeIcon icon="palette" className="me-2" />
                                    {t('adminAccount.content.list.colorValue', {
                                      ns: 'admin-account',
                                      value: item.color,
                                    })}
                                  </span>
                                  {item.icon ? (
                                    <span className="text-muted d-flex align-items-center">
                                      <FontAwesomeIcon icon="tag" className="me-2" />
                                      {t('adminAccount.content.list.iconValue', {
                                        ns: 'admin-account',
                                        value: item.icon,
                                      })}
                                    </span>
                                  ) : null}
                                </p>

                                {item.updatedAt ? (
                                  <div className="post-summary-date text-muted d-flex align-items-center mb-3">
                                    <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                                    {t('adminAccount.content.list.updatedAt', {
                                      ns: 'admin-account',
                                      value: formatDate(item.updatedAt),
                                    })}
                                  </div>
                                ) : null}

                                <div className="post-summary-thumbnail">
                                  <div className="ratio ratio-16x9 rounded-3 overflow-hidden border">
                                    <div
                                      className="w-100 h-100 d-flex align-items-end p-3"
                                      style={{
                                        background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 90%, var(--main-bg) 10%) 0%, color-mix(in srgb, ${accentColor} 58%, var(--main-bg) 42%) 100%)`,
                                      }}
                                    >
                                      <div className="w-100 d-flex align-items-center justify-content-between gap-2">
                                        <span className="badge rounded-pill text-bg-dark">{item.id}</span>
                                        <span className="badge border border-light-subtle text-bg-light text-dark">
                                          {t('adminAccount.content.categories.title', { ns: 'admin-account' })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="post-summary-cta d-flex flex-wrap gap-2 mt-3">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleOpenUpdateCategory(item)}
                                  >
                                    <FontAwesomeIcon icon="save" className="me-2" />
                                    {t('adminAccount.content.actions.update', { ns: 'admin-account' })}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="danger"
                                    onClick={() => {
                                      setPendingCategoryDelete(item);
                                    }}
                                  >
                                    <FontAwesomeIcon icon="trash" className="me-2" />
                                    {t('adminAccount.content.actions.delete', { ns: 'admin-account' })}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {!isCategoryListLoading && categoryTotal > 0 ? (
                    <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
                      <PaginationBar
                        className="border-0 rounded-0 px-2 px-md-3 py-0 bg-transparent shadow-none"
                        currentPage={categoryPage}
                        totalPages={categoryTabTotalPages}
                        totalResults={categoryTotal}
                        size={categoryPageSize}
                        onPageChange={nextPage => {
                          setCategoryPage(nextPage);
                          scrollToListTop();
                        }}
                        onSizeChange={size => {
                          setCategoryPageSize(size);
                          setCategoryPage(1);
                          scrollToListTop();
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </Tab>

            <Tab
              eventKey="topics"
              title={
                <>
                  <FontAwesomeIcon icon="tags" className="me-2" />
                  {t('adminAccount.content.tabs.topics', { ns: 'admin-account' })}
                </>
              }
            >
              <div className="pt-3">
                <div className="card d-block">
                  <div className="card-body p-3 p-md-4 w-100">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h4 className="admin-dashboard-panel-title mb-0">
                        {t('adminAccount.content.topics.title', { ns: 'admin-account' })}
                      </h4>
                      <Button type="button" size="sm" variant="primary" onClick={handleOpenCreateTopic}>
                        <FontAwesomeIcon icon="plus" className="me-2" />
                        {t('adminAccount.content.actions.create', { ns: 'admin-account' })}
                      </Button>
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-lg-4">
                        <Form.Group controlId="admin-content-topics-filter-locale">
                          <Form.Label className="small fw-semibold mb-1">
                            {t('adminAccount.content.filters.locale', { ns: 'admin-account' })}
                          </Form.Label>
                          <Form.Select
                            value={topicFilterLocale}
                            onChange={event => {
                              setTopicFilterLocale(event.currentTarget.value as LocaleFilterValue);
                            }}
                          >
                            <option value="all">
                              {t('adminAccount.content.filters.locales.all', { ns: 'admin-account' })}
                            </option>
                            <option value="en">
                              {t('adminAccount.content.filters.locales.en', { ns: 'admin-account' })}
                            </option>
                            <option value="tr">
                              {t('adminAccount.content.filters.locales.tr', { ns: 'admin-account' })}
                            </option>
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-12 col-lg-8">
                        <Form.Group controlId="admin-content-topics-filter-query">
                          <Form.Label className="small fw-semibold mb-1">
                            {t('adminAccount.content.filters.query', { ns: 'admin-account' })}
                          </Form.Label>
                          <div className="search-bar w-100 d-flex align-items-center">
                            <div className="search-icon">
                              <FontAwesomeIcon icon="search" />
                            </div>
                            <Form.Control
                              type="text"
                              className="search-input form-control"
                              value={topicFilterQuery}
                              onChange={event => {
                                setTopicFilterQuery(event.currentTarget.value);
                              }}
                              placeholder={t('adminAccount.content.filters.queryPlaceholder', { ns: 'admin-account' })}
                            />
                            {topicFilterQuery ? (
                              <button
                                type="button"
                                className="search-clear-btn border-0 bg-transparent"
                                onClick={() => {
                                  setTopicFilterQuery('');
                                }}
                                aria-label={t('adminAccount.content.filters.query', { ns: 'admin-account' })}
                              >
                                <FontAwesomeIcon icon="times-circle" className="clear-icon" />
                              </button>
                            ) : null}
                          </div>
                        </Form.Group>
                      </div>
                    </div>
                    {isTopicListLoading ? (
                      <AdminLoadingState
                        className="admin-loading-stack"
                        ariaLabel={t('adminAccount.content.loading.taxonomy', { ns: 'admin-account' })}
                      />
                    ) : topicTotal === 0 ? (
                      <p className="small text-muted mb-0">
                        {t('adminAccount.content.empty.topics', { ns: 'admin-account' })}
                      </p>
                    ) : (
                      <div className="post-list-results post-list-results--editorial">
                        {topicListItems.map(group => {
                          const item = group.preferred;
                          const accentColor = resolveAdminContentAccentColor(item.color);
                          return (
                            <div
                              key={group.id.toLowerCase()}
                              className="post-card d-flex align-items-center post-summary-card admin-account-card admin-content-topic-card"
                              style={
                                {
                                  '--topic-accent': accentColor,
                                } as React.CSSProperties
                              }
                            >
                              <div className="post-card-content flex-grow-1">
                                <div className="post-summary-title-row">
                                  <h4 className="fw-bold post-summary-title fs-4 mb-0 text-break">{item.name}</h4>
                                </div>

                                <p className="post-summary-meta mb-2">
                                  <span className="text-muted d-flex align-items-center">
                                    <FontAwesomeIcon icon="tags" className="me-2" />
                                    {item.id}
                                  </span>
                                  <span className="text-muted d-flex align-items-center">
                                    <FontAwesomeIcon icon="palette" className="me-2" />
                                    {t('adminAccount.content.list.colorValue', {
                                      ns: 'admin-account',
                                      value: item.color,
                                    })}
                                  </span>
                                </p>
                                {item.updatedAt ? (
                                  <div className="post-summary-date text-muted d-flex align-items-center mb-3">
                                    <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                                    {t('adminAccount.content.list.updatedAt', {
                                      ns: 'admin-account',
                                      value: formatDate(item.updatedAt),
                                    })}
                                  </div>
                                ) : null}

                                <div className="post-summary-thumbnail">
                                  <div className="ratio ratio-16x9 rounded-3 overflow-hidden border">
                                    <div
                                      className="w-100 h-100 d-flex align-items-end p-3"
                                      style={{
                                        background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 90%, var(--main-bg) 10%) 0%, color-mix(in srgb, ${accentColor} 58%, var(--main-bg) 42%) 100%)`,
                                      }}
                                    >
                                      <div className="w-100 d-flex align-items-center justify-content-between gap-2">
                                        <span className="badge rounded-pill text-bg-dark">{item.id}</span>
                                        <span className="badge border border-light-subtle text-bg-light text-dark">
                                          {t('adminAccount.content.topics.title', { ns: 'admin-account' })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="post-summary-cta d-flex flex-wrap gap-2 mt-3">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleOpenUpdateTopic(item)}
                                  >
                                    <FontAwesomeIcon icon="save" className="me-2" />
                                    {t('adminAccount.content.actions.update', { ns: 'admin-account' })}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="danger"
                                    onClick={() => {
                                      setPendingTopicDelete(item);
                                    }}
                                  >
                                    <FontAwesomeIcon icon="trash" className="me-2" />
                                    {t('adminAccount.content.actions.delete', { ns: 'admin-account' })}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {!isTopicListLoading && topicTotal > 0 ? (
                    <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
                      <PaginationBar
                        className="border-0 rounded-0 px-2 px-md-3 py-0 bg-transparent shadow-none"
                        currentPage={topicPage}
                        totalPages={topicTabTotalPages}
                        totalResults={topicTotal}
                        size={topicPageSize}
                        onPageChange={nextPage => {
                          setTopicPage(nextPage);
                          scrollToListTop();
                        }}
                        onSizeChange={size => {
                          setTopicPageSize(size);
                          setTopicPage(1);
                          scrollToListTop();
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </Tab>

            <Tab
              eventKey="posts"
              title={
                <>
                  <FontAwesomeIcon icon="book" className="me-2" />
                  {t('adminAccount.content.tabs.posts', { ns: 'admin-account' })}
                </>
              }
            >
              <div className="d-grid gap-3 pt-3">
                <div className="card d-block">
                  <div className="card-body p-3 w-100">
                    <div className="row g-3">
                      <div className="col-12 col-lg-6 col-xl-2">
                        <Form.Group controlId="admin-content-filter-locale">
                          <Form.Label className="small fw-semibold mb-1">
                            {t('adminAccount.content.filters.locale', { ns: 'admin-account' })}
                          </Form.Label>
                          <Form.Select
                            value={filterLocale}
                            onChange={event => {
                              setFilterLocale(event.currentTarget.value as LocaleFilterValue);
                            }}
                          >
                            <option value="all">
                              {t('adminAccount.content.filters.locales.all', { ns: 'admin-account' })}
                            </option>
                            <option value="en">
                              {t('adminAccount.content.filters.locales.en', { ns: 'admin-account' })}
                            </option>
                            <option value="tr">
                              {t('adminAccount.content.filters.locales.tr', { ns: 'admin-account' })}
                            </option>
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-12 col-lg-6 col-xl-2">
                        <Form.Group controlId="admin-content-filter-source">
                          <Form.Label className="small fw-semibold mb-1">
                            {t('adminAccount.content.filters.source', { ns: 'admin-account' })}
                          </Form.Label>
                          <Form.Select
                            value={filterSource}
                            onChange={event => {
                              setFilterSource(event.currentTarget.value as SourceFilterValue);
                            }}
                          >
                            <option value="all">
                              {t('adminAccount.content.filters.sources.all', { ns: 'admin-account' })}
                            </option>
                            <option value="blog">{t('common.searchSource.blog', { ns: 'common' })}</option>
                            <option value="medium">{t('common.searchSource.medium', { ns: 'common' })}</option>
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-12 col-lg-6 col-xl-3">
                        <Form.Group controlId="admin-content-filter-category">
                          <Form.Label className="small fw-semibold mb-1">
                            {t('adminAccount.content.filters.category', { ns: 'admin-account' })}
                          </Form.Label>
                          <Form.Select
                            value={filterCategoryID}
                            onChange={event => {
                              setFilterCategoryID(event.currentTarget.value);
                            }}
                          >
                            <option value="">
                              {t('adminAccount.content.filters.categories.all', { ns: 'admin-account' })}
                            </option>
                            {filteredCategories.map(item => (
                              <option key={toTaxonomyKey(item)} value={item.id}>
                                {resolveLocaleOptionLabel(item)}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-12 col-lg-6 col-xl-3">
                        <Form.Group controlId="admin-content-filter-topic">
                          <Form.Label className="small fw-semibold mb-1">
                            {t('adminAccount.content.filters.topic', { ns: 'admin-account' })}
                          </Form.Label>
                          <Form.Select
                            value={filterTopicID}
                            onChange={event => {
                              setFilterTopicID(event.currentTarget.value);
                            }}
                          >
                            <option value="">
                              {t('adminAccount.content.filters.topics.all', { ns: 'admin-account' })}
                            </option>
                            {filteredTopics.map(item => (
                              <option key={toTaxonomyKey(item)} value={item.id}>
                                {resolveLocaleOptionLabel(item)}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                    </div>
                    <div className="row g-3 mt-0">
                      <div className="col-12">
                        <Form.Group controlId="admin-content-filter-query">
                          <Form.Label className="small fw-semibold mb-1">
                            {t('adminAccount.content.filters.query', { ns: 'admin-account' })}
                          </Form.Label>
                          <div className="search-bar w-100 d-flex align-items-center">
                            <div className="search-icon">
                              <FontAwesomeIcon icon="search" />
                            </div>
                            <Form.Control
                              type="text"
                              className="search-input form-control"
                              value={filterQuery}
                              onChange={event => {
                                setFilterQuery(event.currentTarget.value);
                              }}
                              placeholder={t('adminAccount.content.filters.queryPlaceholder', { ns: 'admin-account' })}
                            />
                            {filterQuery ? (
                              <button
                                type="button"
                                className="search-clear-btn border-0 bg-transparent"
                                onClick={() => {
                                  setFilterQuery('');
                                }}
                                aria-label={t('adminAccount.content.filters.query', { ns: 'admin-account' })}
                              >
                                <FontAwesomeIcon icon="times-circle" className="clear-icon" />
                              </button>
                            ) : null}
                          </div>
                        </Form.Group>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                      <PostDensityToggle
                        value={resolvedPostDensityMode}
                        onChange={mode =>
                          setPostDensityMode(!canUsePostGridDensity && mode === 'grid' ? 'default' : mode)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="card d-block">
                  <div className="card-body p-3 w-100">
                    {isLoading ? (
                      <div className="admin-account-sessions-loading">
                        <AdminLoadingState
                          className="admin-loading-stack"
                          ariaLabel={t('adminAccount.content.loading.posts', { ns: 'admin-account' })}
                        />
                      </div>
                    ) : total === 0 ? (
                      <p className="small text-muted mb-0">
                        {t('adminAccount.content.empty.posts', { ns: 'admin-account' })}
                      </p>
                    ) : (
                      <div className={`post-list-results post-list-results--${resolvedPostDensityMode}`}>
                        {posts.map(group => {
                          const item = group.preferred;
                          const localeCode = item.locale.toLowerCase();
                          const thumbnailSrc = resolveAdminContentThumbnailSrc(item.thumbnail);
                          const resolvedSummary = item.summary?.trim() ?? '';
                          const normalizedSource = item.source === 'medium' ? 'medium' : 'blog';
                          const sourceLabel =
                            normalizedSource === 'medium'
                              ? t('common.searchSource.medium', { ns: 'common' })
                              : t('common.searchSource.blog', { ns: 'common' });
                          const sourceIcon: IconProp =
                            normalizedSource === 'medium' ? (['fab', 'medium'] as IconProp) : 'book';
                          const canEditPostContent = normalizedSource === 'blog';
                          const isListMode = resolvedPostDensityMode === 'editorial';
                          const normalizedCategoryName = item.categoryName?.trim().toLowerCase() ?? '';
                          const shouldShowCategoryBadge =
                            normalizedCategoryName !== '' &&
                            normalizedCategoryName !== 'all category' &&
                            normalizedCategoryName !== 'all categories' &&
                            normalizedCategoryName !== 'tüm kategoriler';
                          const resolvedCategoryRecord =
                            item.categoryId && item.categoryId.trim()
                              ? categoriesByLocaleAndID.get(`${localeCode}|${item.categoryId.toLowerCase()}`)
                              : null;
                          const resolvedPostCategory: PostCategoryRef | null = resolvedCategoryRecord
                            ? {
                                id: resolvedCategoryRecord.id,
                                name: resolvedCategoryRecord.name,
                                color: resolvedCategoryRecord.color,
                                icon: resolvedCategoryRecord.icon ?? undefined,
                              }
                            : null;
                          const resolvedTopicBadges =
                            item.topicIds.length > 0
                              ? item.topicIds
                                  .map(topicID => topicsByLocaleAndID.get(`${localeCode}|${topicID.toLowerCase()}`))
                                  .filter((topic): topic is AdminContentTopicItem => Boolean(topic))
                              : [];
                          return (
                            <div
                              key={`${group.source.toLowerCase()}-${group.id.toLowerCase()}`}
                              className="post-card d-flex align-items-center post-summary-card"
                            >
                              <div className="post-card-content flex-grow-1">
                                <div className="post-summary-title-row">
                                  {shouldShowCategoryBadge && resolvedPostCategory ? (
                                    <PostCategoryBadge
                                      category={resolvedPostCategory}
                                      className="post-category-link--truncated"
                                      linked={false}
                                    />
                                  ) : null}
                                  <h4 className="fw-bold post-summary-title fs-4 mb-0 text-break">
                                    {canEditPostContent ? (
                                      <Link
                                        href={buildAdminContentPostDetailRoute(item.locale, item.id)}
                                        locale={item.locale.toLowerCase()}
                                        className="link"
                                      >
                                        {item.title}
                                      </Link>
                                    ) : (
                                      item.title
                                    )}
                                  </h4>
                                  <div className="d-flex flex-wrap align-items-center gap-3 text-muted">
                                    <span className="d-inline-flex align-items-center">
                                      <FontAwesomeIcon icon={sourceIcon} className="me-2" />
                                      {sourceLabel}
                                    </span>
                                    <span className="small d-inline-flex align-items-center text-break">
                                      <FontAwesomeIcon icon="tags" className="me-2" />
                                      {item.id}
                                    </span>
                                  </div>
                                </div>

                                <p className="post-summary-meta mb-2">
                                  <span className="text-muted d-flex align-items-center">
                                    <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                                    {formatDate(item.publishedDate)}
                                  </span>
                                  {item.updatedDate ? (
                                    <span
                                      className={`text-muted d-flex align-items-center${isListMode ? '' : ' w-100'}`}
                                    >
                                      <FontAwesomeIcon icon="clock" className="me-2" />
                                      {t('adminAccount.content.list.updatedAt', {
                                        ns: 'admin-account',
                                        value: item.updatedDate,
                                      })}
                                    </span>
                                  ) : null}
                                </p>

                                {resolvedTopicBadges.length > 0 || item.topicNames.length > 0 ? (
                                  <div className="post-summary-topics">
                                    {resolvedTopicBadges.length > 0
                                      ? resolvedTopicBadges.map(topic => (
                                          <Badge
                                            key={`${item.id}-${topic.id}`}
                                            bg={topic.color}
                                            className={`badge-${topic.color}`}
                                          >
                                            {topic.name}
                                          </Badge>
                                        ))
                                      : item.topicNames.map(topic => (
                                          <Badge key={`${item.id}-${topic}`} bg="secondary">
                                            {topic}
                                          </Badge>
                                        ))}
                                  </div>
                                ) : null}

                                <div className="post-summary-thumbnail">
                                  <div className="ratio ratio-16x9 rounded-3 overflow-hidden border">
                                    {thumbnailSrc ? (
                                      <Image
                                        src={thumbnailSrc}
                                        alt={item.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-fit-cover"
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted bg-body-tertiary">
                                        <FontAwesomeIcon icon="camera" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {resolvedSummary ? (
                                  <p className="post-summary-text small text-muted mb-2">{resolvedSummary}</p>
                                ) : null}

                                <div className="post-summary-cta d-flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="danger"
                                    onClick={() => {
                                      setPendingPostDelete(item);
                                    }}
                                  >
                                    <FontAwesomeIcon icon="trash" className="me-2" />
                                    {t('adminAccount.content.actions.deletePost', { ns: 'admin-account' })}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {!isLoading && total > 0 ? (
                    <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
                      <PaginationBar
                        className="border-0 rounded-0 px-2 px-md-3 py-0 bg-transparent shadow-none"
                        currentPage={page}
                        totalPages={totalPages}
                        totalResults={total}
                        size={pageSize}
                        onPageChange={nextPage => {
                          setPage(nextPage);
                          scrollToListTop();
                        }}
                        onSizeChange={size => {
                          setPageSize(size);
                          setPage(1);
                          scrollToListTop();
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </Tab>
          </Tabs>
        )}
      </div>

      <Modal
        show={pendingPostDelete !== null}
        onHide={() => {
          if (isPostDeleting) {
            return;
          }
          setPendingPostDelete(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('adminAccount.content.modals.deletePost.title', { ns: 'admin-account' })}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-0">
            {t('adminAccount.content.modals.deletePost.copy', {
              ns: 'admin-account',
              id: pendingPostDelete?.id ?? '',
            })}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={isPostDeleting}
            onClick={() => {
              setPendingPostDelete(null);
            }}
          >
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!pendingPostDelete || isPostDeleting}
            onClick={handleDeletePost}
          >
            {isPostDeleting ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
                <span>{t('adminAccount.content.actions.deleting', { ns: 'admin-account' })}</span>
              </span>
            ) : (
              <>
                <FontAwesomeIcon icon="trash" className="me-2" />
                {t('adminAccount.content.actions.deletePost', { ns: 'admin-account' })}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={pendingBulkPostCommentDeleteIDs.length > 0}
        onHide={() => {
          if (isBulkPostCommentDeleting) {
            return;
          }
          setPendingBulkPostCommentDeleteIDs([]);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('adminAccount.comments.bulk.deleteConfirmTitle', { ns: 'admin-account' })}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-0">
            {t('adminAccount.comments.bulk.deleteConfirmCopy', {
              ns: 'admin-account',
              count: pendingBulkPostCommentDeleteIDs.length,
            })}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={isBulkPostCommentDeleting}
            onClick={() => {
              setPendingBulkPostCommentDeleteIDs([]);
            }}
          >
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pendingBulkPostCommentDeleteIDs.length === 0 || isBulkPostCommentDeleting}
            onClick={handleBulkDeletePostCommentSubmit}
          >
            {isBulkPostCommentDeleting ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
                <span>{t('adminAccount.comments.actions.deleting', { ns: 'admin-account' })}</span>
              </span>
            ) : (
              <>
                <FontAwesomeIcon icon="trash" className="me-2" />
                {t('adminAccount.comments.actions.delete', { ns: 'admin-account' })}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={pendingPostCommentDelete !== null}
        onHide={() => {
          if (deletingPostCommentID) {
            return;
          }
          setPendingPostCommentDelete(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('adminAccount.comments.deleteConfirm.title', { ns: 'admin-account' })}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-3">
            {t('adminAccount.comments.deleteConfirm.copy', {
              ns: 'admin-account',
              author: pendingPostCommentDelete?.authorName ?? '',
            })}
          </p>
          <dl className="row gy-2 mb-0 small">
            <dt className="col-sm-3 text-muted">
              {t('adminAccount.comments.deleteConfirm.labels.author', { ns: 'admin-account' })}
            </dt>
            <dd className="col-sm-9 mb-0 text-break">{pendingPostCommentDelete?.authorName ?? ''}</dd>
            <dt className="col-sm-3 text-muted">
              {t('adminAccount.comments.deleteConfirm.labels.email', { ns: 'admin-account' })}
            </dt>
            <dd className="col-sm-9 mb-0 text-break">{pendingPostCommentDelete?.authorEmail ?? ''}</dd>
            <dt className="col-sm-3 text-muted">
              {t('adminAccount.comments.deleteConfirm.labels.post', { ns: 'admin-account' })}
            </dt>
            <dd className="col-sm-9 mb-0 text-break">
              {pendingPostCommentDelete?.postTitle ?? pendingPostCommentDelete?.postId ?? ''}
            </dd>
          </dl>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={deletingPostCommentID !== ''}
            onClick={() => {
              setPendingPostCommentDelete(null);
            }}
          >
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!pendingPostCommentDelete || deletingPostCommentID !== ''}
            onClick={handleDeletePostCommentSubmit}
          >
            {deletingPostCommentID ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
                <span>{t('adminAccount.comments.actions.deleting', { ns: 'admin-account' })}</span>
              </span>
            ) : (
              <>
                <FontAwesomeIcon icon="trash" className="me-2" />
                {t('adminAccount.comments.actions.delete', { ns: 'admin-account' })}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={isTopicEditorOpen}
        onHide={() => {
          if (isTopicSubmitting) {
            return;
          }
          setIsTopicEditorOpen(false);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {topicEditorMode === 'create'
              ? t('adminAccount.content.modals.topic.createTitle', { ns: 'admin-account' })
              : t('adminAccount.content.modals.topic.updateTitle', { ns: 'admin-account' })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {topicLocaleTabs.length > 0 ? (
            <Nav
              variant="tabs"
              activeKey={topicLocale}
              className="mb-3 admin-content-tabs"
              onSelect={eventKey => {
                if (eventKey === 'en' || eventKey === 'tr') {
                  handleSwitchTopicEditorLocale(eventKey);
                }
              }}
            >
              {topicLocaleTabs.map(item => (
                <Nav.Item key={`topic-editor-${item.locale}`}>
                  <Nav.Link eventKey={item.locale}>
                    <span className="d-inline-flex align-items-center">
                      <FlagIcon
                        code={item.locale}
                        className="flex-shrink-0 me-2"
                        alt={`${resolveLocaleLabel(item.locale)} flag`}
                        width={14}
                        height={14}
                      />
                      <span>{item.locale.toUpperCase()}</span>
                    </span>
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          ) : null}
          <div className="row g-2">
            {topicLocaleTabs.length === 0 ? (
              <div className="col-12 col-sm-4">
                <Form.Group controlId="admin-content-topic-locale">
                  <Form.Label>{t('adminAccount.content.modals.topic.locale', { ns: 'admin-account' })}</Form.Label>
                  <Form.Select
                    value={topicLocale}
                    disabled={topicEditorMode === 'update'}
                    onChange={event => {
                      setTopicLocale(event.currentTarget.value === 'tr' ? 'tr' : 'en');
                    }}
                  >
                    <option value="en">{t('adminAccount.content.filters.locales.en', { ns: 'admin-account' })}</option>
                    <option value="tr">{t('adminAccount.content.filters.locales.tr', { ns: 'admin-account' })}</option>
                  </Form.Select>
                </Form.Group>
              </div>
            ) : null}
            <div className={`col-12 ${topicLocaleTabs.length === 0 ? 'col-sm-8' : ''}`}>
              <Form.Group controlId="admin-content-topic-id">
                <Form.Label>{t('adminAccount.content.modals.topic.id', { ns: 'admin-account' })}</Form.Label>
                <Form.Control
                  type="text"
                  value={topicID}
                  disabled={topicEditorMode === 'update'}
                  onChange={event => {
                    setTopicID(event.currentTarget.value);
                  }}
                />
                {normalizedTopicID !== '' && !CONTENT_ID_PATTERN.test(normalizedTopicID) ? (
                  <Form.Text className="text-danger">
                    {t('adminAccount.content.validation.id', { ns: 'admin-account' })}
                  </Form.Text>
                ) : null}
              </Form.Group>
            </div>
            <div className="col-12">
              <Form.Group controlId="admin-content-topic-name">
                <Form.Label>{t('adminAccount.content.modals.topic.name', { ns: 'admin-account' })}</Form.Label>
                <Form.Control
                  type="text"
                  value={topicName}
                  onChange={event => {
                    setTopicName(event.currentTarget.value);
                  }}
                />
              </Form.Group>
            </div>
            <div className="col-12 col-sm-6">
              <Form.Group controlId="admin-content-topic-color">
                <Form.Label>{t('adminAccount.content.modals.topic.color', { ns: 'admin-account' })}</Form.Label>
                <Form.Control
                  type="text"
                  value={topicColor}
                  onChange={event => {
                    setTopicColor(event.currentTarget.value);
                  }}
                />
              </Form.Group>
            </div>
            <div className="col-12 col-sm-6">
              <Form.Group controlId="admin-content-topic-link">
                <Form.Label>{t('adminAccount.content.modals.topic.link', { ns: 'admin-account' })}</Form.Label>
                <Form.Control
                  type="url"
                  value={topicLink}
                  onChange={event => {
                    setTopicLink(event.currentTarget.value);
                  }}
                  placeholder="https://"
                />
              </Form.Group>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={isTopicSubmitting}
            onClick={() => {
              setIsTopicEditorOpen(false);
            }}
          >
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canSubmitTopic || isTopicSubmitting}
            onClick={handleSubmitTopic}
          >
            {isTopicSubmitting ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
                <span>{t('adminAccount.content.actions.saving', { ns: 'admin-account' })}</span>
              </span>
            ) : (
              <>
                <FontAwesomeIcon icon="save" className="me-2" />
                {topicEditorMode === 'create'
                  ? t('adminAccount.content.actions.createTopic', { ns: 'admin-account' })
                  : t('adminAccount.content.actions.update', { ns: 'admin-account' })}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={pendingTopicDelete !== null}
        onHide={() => {
          if (isTopicDeleting) {
            return;
          }
          setPendingTopicDelete(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('adminAccount.content.modals.deleteTopic.title', { ns: 'admin-account' })}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-0">
            {t('adminAccount.content.modals.deleteTopic.copy', {
              ns: 'admin-account',
              id: pendingTopicDelete?.id ?? '',
            })}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={isTopicDeleting}
            onClick={() => {
              setPendingTopicDelete(null);
            }}
          >
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!pendingTopicDelete || isTopicDeleting}
            onClick={handleDeleteTopic}
          >
            {isTopicDeleting ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
                <span>{t('adminAccount.content.actions.deleting', { ns: 'admin-account' })}</span>
              </span>
            ) : (
              <>
                <FontAwesomeIcon icon="trash" className="me-2" />
                {t('adminAccount.content.actions.delete', { ns: 'admin-account' })}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={isCategoryEditorOpen}
        onHide={() => {
          if (isCategorySubmitting) {
            return;
          }
          setIsCategoryEditorOpen(false);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {categoryEditorMode === 'create'
              ? t('adminAccount.content.modals.category.createTitle', { ns: 'admin-account' })
              : t('adminAccount.content.modals.category.updateTitle', { ns: 'admin-account' })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {categoryLocaleTabs.length > 0 ? (
            <Nav
              variant="tabs"
              activeKey={categoryLocale}
              className="mb-3 admin-content-tabs"
              onSelect={eventKey => {
                if (eventKey === 'en' || eventKey === 'tr') {
                  handleSwitchCategoryEditorLocale(eventKey);
                }
              }}
            >
              {categoryLocaleTabs.map(item => (
                <Nav.Item key={`category-editor-${item.locale}`}>
                  <Nav.Link eventKey={item.locale}>
                    <span className="d-inline-flex align-items-center">
                      <FlagIcon
                        code={item.locale}
                        className="flex-shrink-0 me-2"
                        alt={`${resolveLocaleLabel(item.locale)} flag`}
                        width={14}
                        height={14}
                      />
                      <span>{item.locale.toUpperCase()}</span>
                    </span>
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          ) : null}
          <div className="row g-2">
            {categoryLocaleTabs.length === 0 ? (
              <div className="col-12 col-sm-4">
                <Form.Group controlId="admin-content-category-locale">
                  <Form.Label>{t('adminAccount.content.modals.category.locale', { ns: 'admin-account' })}</Form.Label>
                  <Form.Select
                    value={categoryLocale}
                    disabled={categoryEditorMode === 'update'}
                    onChange={event => {
                      setCategoryLocale(event.currentTarget.value === 'tr' ? 'tr' : 'en');
                    }}
                  >
                    <option value="en">{t('adminAccount.content.filters.locales.en', { ns: 'admin-account' })}</option>
                    <option value="tr">{t('adminAccount.content.filters.locales.tr', { ns: 'admin-account' })}</option>
                  </Form.Select>
                </Form.Group>
              </div>
            ) : null}
            <div className={`col-12 ${categoryLocaleTabs.length === 0 ? 'col-sm-8' : ''}`}>
              <Form.Group controlId="admin-content-category-id">
                <Form.Label>{t('adminAccount.content.modals.category.id', { ns: 'admin-account' })}</Form.Label>
                <Form.Control
                  type="text"
                  value={categoryID}
                  disabled={categoryEditorMode === 'update'}
                  onChange={event => {
                    setCategoryID(event.currentTarget.value);
                  }}
                />
                {normalizedCategoryID !== '' && !CONTENT_ID_PATTERN.test(normalizedCategoryID) ? (
                  <Form.Text className="text-danger">
                    {t('adminAccount.content.validation.id', { ns: 'admin-account' })}
                  </Form.Text>
                ) : null}
              </Form.Group>
            </div>
            <div className="col-12">
              <Form.Group controlId="admin-content-category-name">
                <Form.Label>{t('adminAccount.content.modals.category.name', { ns: 'admin-account' })}</Form.Label>
                <Form.Control
                  type="text"
                  value={categoryName}
                  onChange={event => {
                    setCategoryName(event.currentTarget.value);
                  }}
                />
              </Form.Group>
            </div>
            <div className="col-12 col-sm-6">
              <Form.Group controlId="admin-content-category-color">
                <Form.Label>{t('adminAccount.content.modals.category.color', { ns: 'admin-account' })}</Form.Label>
                <Form.Control
                  type="text"
                  value={categoryColor}
                  onChange={event => {
                    setCategoryColor(event.currentTarget.value);
                  }}
                />
              </Form.Group>
            </div>
            <div className="col-12 col-sm-6">
              <Form.Group controlId="admin-content-category-icon">
                <Form.Label>{t('adminAccount.content.modals.category.icon', { ns: 'admin-account' })}</Form.Label>
                <Form.Control
                  type="text"
                  value={categoryIcon}
                  onChange={event => {
                    setCategoryIcon(event.currentTarget.value);
                  }}
                />
              </Form.Group>
            </div>
            <div className="col-12">
              <Form.Group controlId="admin-content-category-link">
                <Form.Label>{t('adminAccount.content.modals.category.link', { ns: 'admin-account' })}</Form.Label>
                <Form.Control
                  type="url"
                  value={categoryLink}
                  onChange={event => {
                    setCategoryLink(event.currentTarget.value);
                  }}
                  placeholder="https://"
                />
              </Form.Group>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={isCategorySubmitting}
            onClick={() => {
              setIsCategoryEditorOpen(false);
            }}
          >
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canSubmitCategory || isCategorySubmitting}
            onClick={handleSubmitCategory}
          >
            {isCategorySubmitting ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
                <span>{t('adminAccount.content.actions.saving', { ns: 'admin-account' })}</span>
              </span>
            ) : (
              <>
                <FontAwesomeIcon icon="save" className="me-2" />
                {categoryEditorMode === 'create'
                  ? t('adminAccount.content.actions.createCategory', { ns: 'admin-account' })
                  : t('adminAccount.content.actions.update', { ns: 'admin-account' })}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={pendingCategoryDelete !== null}
        onHide={() => {
          if (isCategoryDeleting) {
            return;
          }
          setPendingCategoryDelete(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('adminAccount.content.modals.deleteCategory.title', { ns: 'admin-account' })}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-0">
            {t('adminAccount.content.modals.deleteCategory.copy', {
              ns: 'admin-account',
              id: pendingCategoryDelete?.id ?? '',
            })}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={isCategoryDeleting}
            onClick={() => {
              setPendingCategoryDelete(null);
            }}
          >
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!pendingCategoryDelete || isCategoryDeleting}
            onClick={handleDeleteCategory}
          >
            {isCategoryDeleting ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
                <span>{t('adminAccount.content.actions.deleting', { ns: 'admin-account' })}</span>
              </span>
            ) : (
              <>
                <FontAwesomeIcon icon="trash" className="me-2" />
                {t('adminAccount.content.actions.delete', { ns: 'admin-account' })}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
