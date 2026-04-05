'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Nav from 'react-bootstrap/Nav';
import Spinner from 'react-bootstrap/Spinner';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { registerLocale } from 'react-datepicker';
import { enUS } from 'date-fns/locale/en-US';
import { tr } from 'date-fns/locale/tr';
import { type AdminMarkdownEditorViewport } from '@/components/admin/AdminMarkdownEditor';
import AdminContentCategoriesTab from '@/components/admin/content/AdminContentCategoriesTab';
import AdminContentBulkPostCommentDeleteModal from '@/components/admin/content/AdminContentBulkPostCommentDeleteModal';
import AdminContentCategoryEditorModal from '@/components/admin/content/AdminContentCategoryEditorModal';
import AdminContentMediaDeleteModal from '@/components/admin/content/AdminContentMediaDeleteModal';
import AdminContentMediaTab from '@/components/admin/content/AdminContentMediaTab';
import AdminContentPostContentTab from '@/components/admin/content/AdminContentPostContentTab';
import AdminContentPostCommentDeleteModal from '@/components/admin/content/AdminContentPostCommentDeleteModal';
import AdminContentPostCommentsTab from '@/components/admin/content/AdminContentPostCommentsTab';
import AdminContentPostDeleteModal from '@/components/admin/content/AdminContentPostDeleteModal';
import AdminContentPostMetadataTab from '@/components/admin/content/AdminContentPostMetadataTab';
import AdminContentPostRevisionRestoreModal from '@/components/admin/content/AdminContentPostRevisionRestoreModal';
import AdminContentPostsTab from '@/components/admin/content/AdminContentPostsTab';
import AdminContentTopicEditorModal from '@/components/admin/content/AdminContentTopicEditorModal';
import AdminContentTopicsTab from '@/components/admin/content/AdminContentTopicsTab';
import { useAdminContentMediaSection } from '@/components/admin/content/useAdminContentMediaSection';
import { useAdminContentPostCommentsSection } from '@/components/admin/content/useAdminContentPostCommentsSection';
import { useAdminContentPostEditorSection } from '@/components/admin/content/useAdminContentPostEditorSection';
import { useAdminContentTaxonomySection } from '@/components/admin/content/useAdminContentTaxonomySection';
import { getDatePickerLocale } from '@/components/common/DateRangePicker';
import FlagIcon from '@/components/common/FlagIcon';
import { type PostDensityMode } from '@/components/common/PostDensityToggle';
import Link from '@/components/common/Link';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import useDebounce from '@/hooks/useDebounce';
import useMediaQuery from '@/hooks/useMediaQuery';
import { assetPrefix, AVATAR_LINK, AUTHOR_NAME, LOCALES, TWITTER_USERNAME } from '@/config/constants';
import { buildLocalizedPath, toAbsoluteSiteUrl } from '@/lib/metadata';
import {
  fetchAdminContentPosts,
  isAdminSessionError,
  resolveAdminError,
  type AdminCommentItem,
  type AdminContentPostGroupItem,
  type AdminContentPostItem,
  type AdminContentTopicItem,
} from '@/lib/adminApi';
import {
  ADMIN_ROUTES,
  buildAdminContentPostDetailHash,
  buildAdminContentPostDetailHref,
  buildAdminContentPostDetailRoute,
  withAdminLocalePath,
} from '@/lib/adminRoutes';
import { defaultLocale } from '@/i18n/settings';
import type { PostCategoryRef } from '@/types/posts';
import 'react-datepicker/dist/react-datepicker.css';

type AdminContentManagementPanelProps = {
  onSessionExpired: () => void;
  formatDate: (value: string) => string;
};

type LocaleFilterValue = 'all' | 'en' | 'tr';
type SourceFilterValue = 'all' | 'blog' | 'medium';
type ContentSectionTab = 'posts' | 'topics' | 'categories' | 'media';
type PostEditorTab = 'metadata' | 'content' | 'comments';
type SupportedContentLocale = 'en' | 'tr';
const CONTENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,127}$/;
const SUCCESS_MESSAGE_AUTO_HIDE_MS = 3500;
const FILTER_QUERY_DEBOUNCE_MS = 220;
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

const toTaxonomyKey = (item: { locale: string; id: string }) => `${item.locale.toLowerCase()}|${item.id.toLowerCase()}`;

const resolvePostEditorTab = (value?: string | null, allowContent = true): PostEditorTab => {
  const normalizedValue = value?.trim().toLowerCase();
  if (normalizedValue === 'comments') {
    return 'comments';
  }
  if (normalizedValue === 'content' && allowContent) {
    return 'content';
  }
  return 'metadata';
};

const resolveContentSectionTab = (value?: string | null): ContentSectionTab => {
  const resolved = value?.trim().toLowerCase();
  if (resolved === 'topics') {
    return 'topics';
  }
  if (resolved === 'posts') {
    return 'posts';
  }
  if (resolved === 'media') {
    return 'media';
  }
  return 'categories';
};

const resolvePostLifecycleBadgeVariant = (status: AdminContentPostItem['status']) => {
  if (status === 'DRAFT') {
    return 'secondary';
  }
  if (status === 'SCHEDULED') {
    return 'warning';
  }
  return 'success';
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

const toDateTimeLocalInputValue = (value: string | null) => {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsed.getDate()}`.padStart(2, '0');
  const hours = `${parsed.getHours()}`.padStart(2, '0');
  const minutes = `${parsed.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const fromDateTimeLocalInputValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

const adminPreviewImageLoader = ({ src }: { src: string }) => src;

const formatMediaSize = (sizeBytes: number, locale: string) => {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return '';
  }
  const numberFormatter = new Intl.NumberFormat(locale);
  if (sizeBytes < 1024) {
    return `${numberFormatter.format(sizeBytes)} B`;
  }
  if (sizeBytes < 1024 * 1024) {
    return `${numberFormatter.format(Math.max(1, Math.round(sizeBytes / 1024)))} KB`;
  }
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(sizeBytes / (1024 * 1024))} MB`;
};

export default function AdminContentManagementPanel({
  // NOSONAR
  onSessionExpired,
  formatDate,
}: Readonly<AdminContentManagementPanelProps>) {
  const { t } = useTranslation(['admin-account', 'admin-common']);
  const router = useRouter();

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
  const [activeTab, setActiveTab] = React.useState<ContentSectionTab>('categories');
  const canUsePostGridDensity = useMediaQuery('(min-width: 1200px)');
  const resolvedPostDensityMode: PostDensityMode =
    canUsePostGridDensity || postDensityMode !== 'grid' ? postDensityMode : 'default';
  const resolvedMediaDensityMode: PostDensityMode =
    canUsePostGridDensity || mediaDensityMode !== 'grid' ? mediaDensityMode : 'default';
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
  const currentDatePickerLocale = getDatePickerLocale(params?.locale);
  const datePickerLocaleConfig = currentDatePickerLocale === 'tr' ? tr : enUS;
  const [postEditorTabKey, setPostEditorTabKey] = React.useState<PostEditorTab>('metadata');
  const isPostDetailRoute = Boolean(routePostLocale && routePostID);

  const listTopRef = React.useRef<HTMLDivElement | null>(null);
  const splitPreviewRef = React.useRef<HTMLDivElement | null>(null);
  const splitEditorViewportRef = React.useRef<AdminMarkdownEditorViewport | null>(null);
  const postsRequestIDRef = React.useRef(0);
  const postCommentsListTopRef = React.useRef<HTMLDivElement | null>(null);
  const reloadPostsRef = React.useRef<() => Promise<void>>(async () => {});

  const requestedPostEditorTab = resolvePostEditorTab(postEditorTabKey);
  const reloadPosts = React.useCallback(() => reloadPostsRef.current(), []);
  const filterQueryDebounced = useDebounce(filterQuery.trim(), FILTER_QUERY_DEBOUNCE_MS);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const adminNumberFormatter = React.useMemo(() => new Intl.NumberFormat(routeLocale), [routeLocale]);
  const adminDateTimeFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(routeLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [routeLocale],
  );

  const {
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
  } = useAdminContentPostEditorSection({
    activePostEditorTab: requestedPostEditorTab,
    isPostDetailRoute,
    routePostLocale,
    routePostID,
    onSessionExpired,
    t,
    setErrorMessage,
    setSuccessMessage,
    reloadPosts,
    totalPosts: total,
    page,
    pageSize,
    setPage,
  });
  const activePostEditorTab = resolvePostEditorTab(
    postEditorTabKey,
    editingPost ? editingPost.source === 'blog' : true,
  );
  const totalPostRevisionPages = Math.max(1, Math.ceil(postRevisionsTotal / postRevisionsPageSize));

  const {
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
  } = useAdminContentPostCommentsSection({
    editingPost,
    activePostEditorTab,
    routePostID,
    onSessionExpired,
    t,
  });

  const {
    preferredContentLocale,
    topicsByLocaleAndID,
    categoriesByLocaleAndID,
    filterTopicOptions,
    filterCategoryOptions,
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
  } = useAdminContentTaxonomySection({
    filterLocale,
    currentDatePickerLocale,
    routeLocale,
    onSessionExpired,
    t,
    setErrorMessage,
    setSuccessMessage,
    reloadPosts,
  });

  const {
    mediaLibraryQuery,
    setMediaLibraryQuery,
    mediaLibraryFilter,
    setMediaLibraryFilter,
    mediaLibrarySort,
    setMediaLibrarySort,
    mediaLibraryItems,
    mediaLibraryPage,
    setMediaLibraryPage,
    mediaLibraryPageSize,
    setMediaLibraryPageSize,
    mediaLibraryTotal,
    totalMediaLibraryPages,
    isMediaLibraryLoading,
    isMediaLibraryUploading,
    mediaLibraryErrorMessage,
    copiedMediaAssetID,
    pendingMediaAssetDelete,
    setPendingMediaAssetDelete,
    isMediaAssetDeleting,
    mediaUploadInputRef,
    handleMediaUpload,
    handleCopyMediaPath,
    handleDeleteMediaAsset,
    openMediaLibraryScreen,
  } = useAdminContentMediaSection({
    activeTab,
    isPostDetailRoute,
    routeLocale,
    onSessionExpired,
    t,
    setSuccessMessage,
    onMediaValueDeleted: value => {
      if (postEditorThumbnail.trim() === value.trim()) {
        setPostEditorThumbnail('');
      }
    },
  });

  const selectedMediaLibraryItem = React.useMemo(
    () =>
      mediaLibraryItems.find(item => item.value.trim() !== '' && item.value.trim() === postEditorThumbnail.trim()) ??
      null,
    [mediaLibraryItems, postEditorThumbnail],
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

  const postEditorSeoPreview = React.useMemo(() => {
    if (!editingPost) {
      return null;
    }

    const localeCode = editingPost.locale.trim().toLowerCase() || defaultLocale;
    const postID = editingPost.id.trim();
    const resolvedTitle = postEditorTitle.trim() || editingPost.title.trim();
    const resolvedDescriptionSource = postEditorSummary.trim() || editingPost.summary?.trim() || '';
    const resolvedDescription =
      resolvedDescriptionSource ||
      t('adminAccount.content.modals.post.seo.placeholderDescription', { ns: 'admin-account' });
    const resolvedImage = postEditorThumbnail.trim() || editingPost.thumbnail?.trim() || AVATAR_LINK;
    const resolvedPreviewImage = postEditorThumbnail.trim() || editingPost.thumbnail?.trim() || '';
    const canonicalPath = buildLocalizedPath(localeCode, `posts/${postID}`);
    const canonicalURL = toAbsoluteSiteUrl(canonicalPath);
    const absoluteImageURL = toAbsoluteSiteUrl(resolvedImage);
    const previewImageSrc = resolvedPreviewImage
      ? (resolveAdminContentThumbnailSrc(resolvedPreviewImage) ?? resolvedPreviewImage)
      : null;

    let domainLabel = canonicalURL;
    try {
      domainLabel = new URL(canonicalURL).host;
    } catch {
      domainLabel = canonicalURL;
    }

    return {
      title: resolvedTitle || t('adminAccount.content.modals.post.seo.placeholderTitle', { ns: 'admin-account' }),
      description: resolvedDescription,
      canonicalPath,
      canonicalURL,
      imageURL: absoluteImageURL,
      previewImageSrc,
      domainLabel,
      creatorLabel: TWITTER_USERNAME,
      authorLabel: AUTHOR_NAME,
    };
  }, [editingPost, postEditorSummary, postEditorThumbnail, postEditorTitle, t]);

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
    setPage(1);
  }, [filterCategoryID, filterLocale, filterQueryDebounced, filterSource, filterTopicID]);

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

  useAutoClearValue(successMessage, setSuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS);

  React.useEffect(() => {
    const categoryExists =
      filterCategoryID === '' ||
      filterCategoryOptions.some(item => item.id.toLowerCase() === filterCategoryID.toLowerCase());
    if (!categoryExists) {
      setFilterCategoryID('');
    }
  }, [filterCategoryID, filterCategoryOptions]);

  React.useEffect(() => {
    const topicExists =
      filterTopicID === '' || filterTopicOptions.some(item => item.id.toLowerCase() === filterTopicID.toLowerCase());
    if (!topicExists) {
      setFilterTopicID('');
    }
  }, [filterTopicID, filterTopicOptions]);

  React.useEffect(() => {
    const appWindow = globalThis.window;
    if (!appWindow) {
      return;
    }

    const syncTabFromHash = () => {
      const hashValue = appWindow.location.hash.replace(/^#/, '');
      setActiveTab(resolveContentSectionTab(hashValue));
    };

    syncTabFromHash();
    appWindow.addEventListener('hashchange', syncTabFromHash);
    return () => {
      appWindow.removeEventListener('hashchange', syncTabFromHash);
    };
  }, []);

  React.useEffect(() => {
    const appWindow = globalThis.window;
    if (!appWindow) {
      return;
    }

    const syncPostEditorTabFromHash = () => {
      const hashValue = appWindow.location.hash.replace(/^#/, '');
      setPostEditorTabKey(resolvePostEditorTab(hashValue));
    };

    syncPostEditorTabFromHash();
    appWindow.addEventListener('hashchange', syncPostEditorTabFromHash);
    return () => {
      appWindow.removeEventListener('hashchange', syncPostEditorTabFromHash);
    };
  }, []);

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

  const handleTabSelect = React.useCallback((nextKey: string | null) => {
    const resolvedTab = resolveContentSectionTab(nextKey);
    setActiveTab(resolvedTab);

    const appWindow = globalThis.window;
    if (!appWindow) {
      return;
    }

    const nextHash = `#${resolvedTab}`;
    if (appWindow.location.hash === nextHash) {
      return;
    }

    const nextURL = `${appWindow.location.pathname}${appWindow.location.search}${nextHash}`;
    appWindow.history.replaceState(appWindow.history.state, '', nextURL);
  }, []);

  const navigateToPostEditorRoute = React.useCallback(
    (nextRoute: string, nextTab: PostEditorTab, mode: 'push' | 'replace' = 'push') => {
      const appWindow = globalThis.window;
      if (!appWindow) {
        return;
      }

      const nextURL = withAdminLocalePath(routeLocale, `${nextRoute}${buildAdminContentPostDetailHash(nextTab)}`);
      if (
        appWindow.location.pathname === withAdminLocalePath(routeLocale, nextRoute) &&
        appWindow.location.hash === `#${nextTab}`
      ) {
        setPostEditorTabKey(nextTab);
        return;
      }

      if (mode === 'replace') {
        appWindow.history.replaceState(appWindow.history.state, '', nextURL);
      } else {
        appWindow.history.pushState(appWindow.history.state, '', nextURL);
      }
      setPostEditorTabKey(nextTab);
    },
    [routeLocale],
  );

  const handleSwitchPostEditorLocale = React.useCallback(
    (locale: SupportedContentLocale) => {
      if (!editingPost || editingPost.id.trim() === '' || editingPost.locale.trim().toLowerCase() === locale) {
        return;
      }

      router.push(
        withAdminLocalePath(routeLocale, buildAdminContentPostDetailHref(locale, editingPost.id, activePostEditorTab)),
      );
    },
    [activePostEditorTab, editingPost, routeLocale, router],
  );

  React.useEffect(() => {
    if (!editingPost || !isPostDetailRoute) {
      return;
    }

    const canonicalTab = resolvePostEditorTab(postEditorTabKey, editingPost.source === 'blog');
    if (canonicalTab === postEditorTabKey) {
      return;
    }

    navigateToPostEditorRoute(
      buildAdminContentPostDetailRoute(editingPost.locale, editingPost.id),
      canonicalTab,
      'replace',
    );
  }, [editingPost, isPostDetailRoute, navigateToPostEditorRoute, postEditorTabKey]);

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

  const shouldShowPostSaveAction = activePostEditorTab !== 'comments';
  const shouldUpdatePostMetadata = Boolean(
    editingPost && (activePostEditorTab === 'metadata' || editingPost.source !== 'blog'),
  );
  let postSaveAction: React.ReactNode = null;

  if (shouldShowPostSaveAction) {
    if (shouldUpdatePostMetadata) {
      postSaveAction = (
        <Button
          type="button"
          variant="primary"
          disabled={!canSavePostMetadata || isPostUpdating}
          onClick={handleUpdatePostMetadata}
        >
          {isPostUpdating ? (
            <span className="d-inline-flex align-items-center gap-2">
              <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
              <span>{t('adminAccount.content.actions.updating', { ns: 'admin-account' })}</span>
            </span>
          ) : (
            <>
              <FontAwesomeIcon icon="save" className="me-2" />
              {t('adminAccount.content.actions.updatePost', { ns: 'admin-account' })}
            </>
          )}
        </Button>
      );
    } else {
      postSaveAction = (
        <Button
          type="button"
          variant="primary"
          disabled={!canSavePostContent || isPostContentUpdating}
          onClick={handleUpdatePostContent}
        >
          {isPostContentUpdating ? (
            <span className="d-inline-flex align-items-center gap-2">
              <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
              <span>{t('adminAccount.content.actions.updating', { ns: 'admin-account' })}</span>
            </span>
          ) : (
            <>
              <FontAwesomeIcon icon="save" className="me-2" />
              {t('adminAccount.content.actions.updatePostContent', { ns: 'admin-account' })}
            </>
          )}
        </Button>
      );
    }
  }

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
                      <div className="mb-1">
                        <Badge bg={resolvePostLifecycleBadgeVariant(editingPost.status)}>
                          {t(
                            `adminAccount.content.modals.post.lifecycle.statuses.${editingPost.status.toLowerCase()}`,
                            {
                              ns: 'admin-account',
                            },
                          )}
                        </Badge>
                      </div>
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
                    activeKey={activePostEditorTab}
                    onSelect={nextKey => {
                      const nextTab = resolvePostEditorTab(nextKey, editingPost.source === 'blog');
                      navigateToPostEditorRoute(
                        buildAdminContentPostDetailRoute(editingPost.locale, editingPost.id),
                        nextTab,
                      );
                    }}
                    className="mb-3 admin-content-tabs"
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
                      <AdminContentPostMetadataTab
                        t={t}
                        routeLocale={routeLocale}
                        editingPost={editingPost}
                        formatCount={value => adminNumberFormatter.format(value)}
                        formatDateTime={value => adminDateTimeFormatter.format(new Date(value))}
                        postEditorSeoPreview={postEditorSeoPreview}
                        postSeoPreviewTab={postSeoPreviewTab}
                        onPostSeoPreviewTabChange={setPostSeoPreviewTab}
                        imageLoader={adminPreviewImageLoader}
                        postEditorTitle={postEditorTitle}
                        onPostEditorTitleChange={setPostEditorTitle}
                        postEditorSummary={postEditorSummary}
                        onPostEditorSummaryChange={setPostEditorSummary}
                        postEditorPublishedDate={postEditorPublishedDate}
                        onPostEditorPublishedDateChange={setPostEditorPublishedDate}
                        postEditorUpdatedDate={postEditorUpdatedDate}
                        onPostEditorUpdatedDateChange={setPostEditorUpdatedDate}
                        parseISODateInput={parseISODateInput}
                        datePickerLocaleConfig={datePickerLocaleConfig}
                        postEditorStatus={postEditorStatus}
                        onPostEditorStatusChange={setPostEditorStatus}
                        postEditorScheduledAt={postEditorScheduledAt}
                        onPostEditorScheduledAtChange={setPostEditorScheduledAt}
                        toDateTimeLocalInputValue={toDateTimeLocalInputValue}
                        fromDateTimeLocalInputValue={fromDateTimeLocalInputValue}
                        resolvePostLifecycleBadgeVariant={resolvePostLifecycleBadgeVariant}
                        postEditorThumbnail={postEditorThumbnail}
                        onPostEditorThumbnailChange={setPostEditorThumbnail}
                        resolveThumbnailSrc={resolveAdminContentThumbnailSrc}
                        onOpenMediaLibrary={openMediaLibraryScreen}
                        onClearPostEditorThumbnail={() => {
                          setPostEditorThumbnail('');
                        }}
                        selectedMediaLibraryItem={selectedMediaLibraryItem}
                        postEditorCategoryID={postEditorCategoryID}
                        onPostEditorCategoryIDChange={setPostEditorCategoryID}
                        postEditorCategoryOptions={postEditorCategoryOptions}
                        postEditorTopicQuery={postEditorTopicQuery}
                        onPostEditorTopicQueryChange={setPostEditorTopicQuery}
                        onClearPostEditorTopicQuery={() => {
                          setPostEditorTopicQuery('');
                        }}
                        postEditorTopicOptions={postEditorTopicOptions}
                        postEditorTopicIDs={postEditorTopicIDs}
                        onPostTopicToggle={handlePostTopicToggle}
                        getTaxonomyKey={toTaxonomyKey}
                        postRevisionsErrorMessage={postRevisionsErrorMessage}
                        isPostRevisionsLoading={isPostRevisionsLoading}
                        postRevisions={postRevisions}
                        postRevisionsTotal={postRevisionsTotal}
                        postRevisionsPage={postRevisionsPage}
                        totalPostRevisionPages={totalPostRevisionPages}
                        postRevisionsPageSize={postRevisionsPageSize}
                        onPostRevisionsPageChange={setPostRevisionsPage}
                        onPostRevisionsPageSizeChange={size => {
                          setPostRevisionsPageSize(size);
                          setPostRevisionsPage(1);
                        }}
                        onOpenRestoreRevision={setPendingPostRevisionRestore}
                      />
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
                        <AdminContentPostContentTab
                          t={t}
                          editingPost={editingPost}
                          postEditorPreviewState={postEditorPreviewState}
                          postContentViewMode={postContentViewMode}
                          onPostContentViewModeChange={setPostContentViewMode}
                          postEditorContent={postEditorContent}
                          onPostEditorContentChange={setPostEditorContent}
                          onSplitEditorViewportChange={handleSplitEditorViewportChange}
                          splitPreviewRef={splitPreviewRef}
                        />
                      </Tab>
                    ) : null}
                    <Tab
                      eventKey="comments"
                      title={
                        <span className="d-inline-flex align-items-center gap-2">
                          <FontAwesomeIcon icon="comments" />
                          <span>{t('adminAccount.content.modals.post.tabs.comments', { ns: 'admin-account' })}</span>
                        </span>
                      }
                    >
                      <AdminContentPostCommentsTab
                        t={t}
                        formatDate={formatDate}
                        listTopRef={postCommentsListTopRef}
                        postCommentsTotal={postCommentsTotal}
                        postCommentsStatusFilter={postCommentsStatusFilter}
                        onPostCommentsStatusFilterChange={value => {
                          setPostCommentsStatusFilter(value);
                          setPostCommentsErrorMessage('');
                          setPostCommentsSuccessMessage('');
                        }}
                        postCommentsFilterQuery={postCommentsFilterQuery}
                        onPostCommentsFilterQueryChange={value => {
                          setPostCommentsFilterQuery(value);
                          setPostCommentsErrorMessage('');
                          setPostCommentsSuccessMessage('');
                        }}
                        onClearPostCommentsFilterQuery={() => {
                          setPostCommentsFilterQuery('');
                          setPostCommentsErrorMessage('');
                          setPostCommentsSuccessMessage('');
                        }}
                        postCommentsErrorMessage={postCommentsErrorMessage}
                        postCommentsSuccessMessage={postCommentsSuccessMessage}
                        postComments={postComments}
                        allVisiblePostCommentsSelected={allVisiblePostCommentsSelected}
                        isPostCommentsLoading={isPostCommentsLoading}
                        isBulkPostCommentActionPending={isBulkPostCommentActionPending}
                        hasSelectedPostComments={hasSelectedPostComments}
                        selectedPostCommentIDs={selectedPostCommentIDs}
                        onToggleVisiblePostCommentsSelection={toggleVisiblePostCommentsSelection}
                        onClearSelectedPostCommentIDs={() => {
                          setSelectedPostCommentIDs([]);
                        }}
                        bulkPostCommentActionStatus={bulkPostCommentActionStatus}
                        isBulkPostCommentDeleting={isBulkPostCommentDeleting}
                        onBulkApprove={() => {
                          void handleBulkPostCommentStatusUpdate('APPROVED');
                        }}
                        onBulkReject={() => {
                          void handleBulkPostCommentStatusUpdate('REJECTED');
                        }}
                        onBulkSpam={() => {
                          void handleBulkPostCommentStatusUpdate('SPAM');
                        }}
                        onOpenBulkDelete={() => {
                          setPendingBulkPostCommentDeleteIDs(selectedPostCommentIDs);
                        }}
                        postCommentActionID={postCommentActionID}
                        postCommentActionStatus={postCommentActionStatus}
                        deletingPostCommentID={deletingPostCommentID}
                        onTogglePostCommentSelection={togglePostCommentSelection}
                        resolveCommentStatusVariant={resolveCommentStatusVariant}
                        onUpdatePostCommentStatus={(commentID, status) => {
                          void handlePostCommentStatusUpdate(commentID, status);
                        }}
                        onOpenDeletePostComment={item => {
                          setPendingPostCommentDelete(item);
                        }}
                        postCommentsPage={postCommentsPage}
                        totalPostCommentPages={totalPostCommentPages}
                        postCommentsPageSize={postCommentsPageSize}
                        onPostCommentsPageChange={nextPage => {
                          setPostCommentsPage(nextPage);
                          scrollToPostCommentsListTop();
                        }}
                        onPostCommentsPageSizeChange={size => {
                          setPostCommentsPageSize(size);
                          setPostCommentsPage(1);
                          scrollToPostCommentsListTop();
                        }}
                      />
                    </Tab>
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
                    {postSaveAction}
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
              <AdminContentCategoriesTab
                t={t}
                formatDate={formatDate}
                categoryFilterLocale={categoryFilterLocale}
                onCategoryFilterLocaleChange={value => {
                  setCategoryFilterLocale(value);
                }}
                categoryFilterQuery={categoryFilterQuery}
                onCategoryFilterQueryChange={setCategoryFilterQuery}
                onClearCategoryFilterQuery={() => {
                  setCategoryFilterQuery('');
                }}
                isCategoryListLoading={isCategoryListLoading}
                categoryTotal={categoryListTotal}
                categoryListItems={categoryListItems}
                onOpenCreateCategory={handleOpenCreateCategory}
                onOpenUpdateCategory={handleOpenUpdateCategory}
                onOpenDeleteCategory={item => {
                  setPendingCategoryDelete(item);
                }}
                resolveAccentColor={resolveAdminContentAccentColor}
                categoryPage={categoryPage}
                categoryTotalPages={categoryTotalPages}
                categoryPageSize={categoryPageSize}
                onCategoryPageChange={nextPage => {
                  setCategoryPage(nextPage);
                  scrollToListTop();
                }}
                onCategoryPageSizeChange={size => {
                  setCategoryPageSize(size);
                  setCategoryPage(1);
                  scrollToListTop();
                }}
              />
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
              <AdminContentTopicsTab
                t={t}
                formatDate={formatDate}
                topicFilterLocale={topicFilterLocale}
                onTopicFilterLocaleChange={value => {
                  setTopicFilterLocale(value);
                }}
                topicFilterQuery={topicFilterQuery}
                onTopicFilterQueryChange={setTopicFilterQuery}
                onClearTopicFilterQuery={() => {
                  setTopicFilterQuery('');
                }}
                isTopicListLoading={isTopicListLoading}
                topicTotal={topicListTotal}
                topicListItems={topicListItems}
                onOpenCreateTopic={handleOpenCreateTopic}
                onOpenUpdateTopic={handleOpenUpdateTopic}
                onOpenDeleteTopic={item => {
                  setPendingTopicDelete(item);
                }}
                resolveAccentColor={resolveAdminContentAccentColor}
                topicPage={topicPage}
                topicTotalPages={topicTotalPages}
                topicPageSize={topicPageSize}
                onTopicPageChange={nextPage => {
                  setTopicPage(nextPage);
                  scrollToListTop();
                }}
                onTopicPageSizeChange={size => {
                  setTopicPageSize(size);
                  setTopicPage(1);
                  scrollToListTop();
                }}
              />
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
              <AdminContentPostsTab
                t={t}
                formatDate={formatDate}
                formatDateTime={value => adminDateTimeFormatter.format(new Date(value))}
                formatCount={value => adminNumberFormatter.format(value)}
                routeLocale={routeLocale}
                filterLocale={filterLocale}
                onFilterLocaleChange={setFilterLocale}
                filterSource={filterSource}
                onFilterSourceChange={setFilterSource}
                filterCategoryID={filterCategoryID}
                onFilterCategoryIDChange={setFilterCategoryID}
                filterTopicID={filterTopicID}
                onFilterTopicIDChange={setFilterTopicID}
                filterQuery={filterQuery}
                onFilterQueryChange={setFilterQuery}
                onClearFilterQuery={() => {
                  setFilterQuery('');
                }}
                filterCategoryOptions={filterCategoryOptions}
                filterTopicOptions={filterTopicOptions}
                resolvedPostDensityMode={resolvedPostDensityMode}
                canUsePostGridDensity={canUsePostGridDensity}
                onPostDensityModeChange={setPostDensityMode}
                isLoading={isLoading}
                total={total}
                posts={posts}
                categoriesByLocaleAndID={categoriesByLocaleAndID}
                topicsByLocaleAndID={topicsByLocaleAndID}
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={nextPage => {
                  setPage(nextPage);
                  scrollToListTop();
                }}
                onPageSizeChange={size => {
                  setPageSize(size);
                  setPage(1);
                  scrollToListTop();
                }}
                onOpenDeletePost={item => {
                  setPendingPostDelete(item);
                }}
              />
            </Tab>

            <Tab
              eventKey="media"
              title={
                <>
                  <FontAwesomeIcon icon="images" className="me-2" />
                  {t('adminAccount.content.tabs.media', { ns: 'admin-account' })}
                </>
              }
            >
              <AdminContentMediaTab
                t={t}
                formatDate={formatDate}
                routeLocale={routeLocale}
                mediaLibraryQuery={mediaLibraryQuery}
                onMediaLibraryQueryChange={value => {
                  setMediaLibraryQuery(value);
                  setMediaLibraryPage(1);
                }}
                onClearMediaLibraryQuery={() => {
                  setMediaLibraryQuery('');
                  setMediaLibraryPage(1);
                }}
                mediaLibraryFilter={mediaLibraryFilter}
                onMediaLibraryFilterChange={value => {
                  setMediaLibraryFilter(value);
                  setMediaLibraryPage(1);
                }}
                mediaLibrarySort={mediaLibrarySort}
                onMediaLibrarySortChange={value => {
                  setMediaLibrarySort(value);
                  setMediaLibraryPage(1);
                }}
                isMediaLibraryUploading={isMediaLibraryUploading}
                onTriggerUpload={() => {
                  mediaUploadInputRef.current?.click();
                }}
                uploadInputRef={mediaUploadInputRef}
                onUploadFileChange={handleMediaUpload}
                mediaLibraryErrorMessage={mediaLibraryErrorMessage}
                resolvedMediaDensityMode={resolvedMediaDensityMode}
                onMediaDensityModeChange={mode =>
                  setMediaDensityMode(!canUsePostGridDensity && mode === 'grid' ? 'default' : mode)
                }
                isMediaLibraryLoading={isMediaLibraryLoading}
                mediaLibraryTotal={mediaLibraryTotal}
                mediaLibraryItems={mediaLibraryItems}
                formatMediaSize={formatMediaSize}
                imageLoader={adminPreviewImageLoader}
                copiedMediaAssetID={copiedMediaAssetID}
                onCopyMediaPath={handleCopyMediaPath}
                onOpenDeleteMediaAsset={item => {
                  setPendingMediaAssetDelete(item);
                }}
                mediaLibraryPage={mediaLibraryPage}
                totalMediaLibraryPages={totalMediaLibraryPages}
                mediaLibraryPageSize={mediaLibraryPageSize}
                onMediaLibraryPageChange={nextPage => {
                  setMediaLibraryPage(nextPage);
                  scrollToListTop();
                }}
                onMediaLibraryPageSizeChange={size => {
                  setMediaLibraryPageSize(size);
                  setMediaLibraryPage(1);
                  scrollToListTop();
                }}
              />
            </Tab>
          </Tabs>
        )}
      </div>

      <AdminContentMediaDeleteModal
        t={t}
        pendingMediaAssetDelete={pendingMediaAssetDelete}
        isMediaAssetDeleting={isMediaAssetDeleting}
        onHide={() => {
          if (isMediaAssetDeleting) {
            return;
          }
          setPendingMediaAssetDelete(null);
        }}
        onConfirmDelete={handleDeleteMediaAsset}
      />

      <AdminContentPostRevisionRestoreModal
        t={t}
        pendingPostRevisionRestore={pendingPostRevisionRestore}
        isPostRevisionRestoring={isPostRevisionRestoring}
        formatDateTime={value => adminDateTimeFormatter.format(new Date(value))}
        onHide={() => {
          if (isPostRevisionRestoring) {
            return;
          }
          setPendingPostRevisionRestore(null);
        }}
        onConfirmRestore={handleRestorePostRevision}
      />

      <AdminContentPostDeleteModal
        t={t}
        pendingPostDelete={pendingPostDelete}
        isPostDeleting={isPostDeleting}
        onHide={() => {
          if (isPostDeleting) {
            return;
          }
          setPendingPostDelete(null);
        }}
        onConfirmDelete={handleDeletePost}
      />

      <AdminContentBulkPostCommentDeleteModal
        t={t}
        pendingBulkPostCommentDeleteIDs={pendingBulkPostCommentDeleteIDs}
        isBulkPostCommentDeleting={isBulkPostCommentDeleting}
        onHide={() => {
          if (isBulkPostCommentDeleting) {
            return;
          }
          setPendingBulkPostCommentDeleteIDs([]);
        }}
        onConfirmDelete={handleBulkDeletePostCommentSubmit}
      />

      <AdminContentPostCommentDeleteModal
        t={t}
        pendingPostCommentDelete={pendingPostCommentDelete}
        deletingPostCommentID={deletingPostCommentID}
        onHide={() => {
          if (deletingPostCommentID) {
            return;
          }
          setPendingPostCommentDelete(null);
        }}
        onConfirmDelete={handleDeletePostCommentSubmit}
      />

      <AdminContentTopicEditorModal
        t={t}
        isOpen={isTopicEditorOpen}
        isSubmitting={isTopicSubmitting}
        mode={topicEditorMode}
        localeTabs={topicLocaleTabs}
        locale={topicLocale}
        onSwitchLocale={handleSwitchTopicEditorLocale}
        onLocaleChange={setTopicLocale}
        resolveLocaleLabel={resolveLocaleLabel}
        id={topicID}
        onIDChange={setTopicID}
        isIDInvalid={normalizedTopicID !== '' && !CONTENT_ID_PATTERN.test(normalizedTopicID)}
        name={topicName}
        onNameChange={setTopicName}
        color={topicColor}
        onColorChange={setTopicColor}
        link={topicLink}
        onLinkChange={setTopicLink}
        canSubmit={canSubmitTopic}
        onSubmit={handleSubmitTopic}
        onHide={() => {
          if (isTopicSubmitting) {
            return;
          }
          setIsTopicEditorOpen(false);
        }}
      />

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

      <AdminContentCategoryEditorModal
        t={t}
        isOpen={isCategoryEditorOpen}
        isSubmitting={isCategorySubmitting}
        mode={categoryEditorMode}
        localeTabs={categoryLocaleTabs}
        locale={categoryLocale}
        onSwitchLocale={handleSwitchCategoryEditorLocale}
        onLocaleChange={setCategoryLocale}
        resolveLocaleLabel={resolveLocaleLabel}
        id={categoryID}
        onIDChange={setCategoryID}
        isIDInvalid={normalizedCategoryID !== '' && !CONTENT_ID_PATTERN.test(normalizedCategoryID)}
        name={categoryName}
        onNameChange={setCategoryName}
        color={categoryColor}
        onColorChange={setCategoryColor}
        icon={categoryIcon}
        onIconChange={setCategoryIcon}
        link={categoryLink}
        onLinkChange={setCategoryLink}
        canSubmit={canSubmitCategory}
        onSubmit={handleSubmitCategory}
        onHide={() => {
          if (isCategorySubmitting) {
            return;
          }
          setIsCategoryEditorOpen(false);
        }}
      />

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
