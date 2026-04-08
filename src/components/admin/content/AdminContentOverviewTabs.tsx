'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { PostDensityMode } from '@/components/common/PostDensityToggle';
import AdminContentCategoriesTab from '@/components/admin/content/AdminContentCategoriesTab';
import AdminContentMediaTab from '@/components/admin/content/AdminContentMediaTab';
import AdminContentPostsTab from '@/components/admin/content/AdminContentPostsTab';
import AdminContentTopicsTab from '@/components/admin/content/AdminContentTopicsTab';
import type {
  AdminContentCategoryGroupItem,
  AdminContentCategoryItem,
  AdminContentPostGroupItem,
  AdminContentPostItem,
  AdminContentTopicGroupItem,
  AdminContentTopicItem,
  AdminMediaLibraryItem,
} from '@/lib/adminApi';

type AdminAccountTranslate = TFunction;
type ContentSectionTab = 'posts' | 'topics' | 'categories' | 'media';
type LocaleFilterValue = 'all' | 'en' | 'tr';
type SourceFilterValue = 'all' | 'blog' | 'medium';
type MediaLibraryFilter = AdminMediaLibraryItem['kind'] | 'ALL';
type MediaLibrarySort = 'RECENT' | 'NAME' | 'SIZE' | 'USAGE';

type AdminContentOverviewTabsProps = {
  t: AdminAccountTranslate;
  activeTab: ContentSectionTab;
  onTabSelect: (nextKey: string | null) => void;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
  formatCount: (value: number) => string;
  routeLocale: string;
  filterLocale: LocaleFilterValue;
  onFilterLocaleChange: (value: LocaleFilterValue) => void;
  filterSource: SourceFilterValue;
  onFilterSourceChange: (value: SourceFilterValue) => void;
  filterCategoryID: string;
  onFilterCategoryIDChange: (value: string) => void;
  filterTopicID: string;
  onFilterTopicIDChange: (value: string) => void;
  filterQuery: string;
  onFilterQueryChange: (value: string) => void;
  onClearFilterQuery: () => void;
  filterCategoryOptions: AdminContentCategoryItem[];
  filterTopicOptions: AdminContentTopicItem[];
  resolvedPostDensityMode: PostDensityMode;
  canUsePostGridDensity: boolean;
  onPostDensityModeChange: (mode: PostDensityMode) => void;
  isPostsLoading: boolean;
  totalPosts: number;
  posts: AdminContentPostGroupItem[];
  categoriesByLocaleAndID: ReadonlyMap<string, AdminContentCategoryItem>;
  topicsByLocaleAndID: ReadonlyMap<string, AdminContentTopicItem>;
  postsPage: number;
  postTotalPages: number;
  postsPageSize: number;
  onPostsPageChange: (page: number) => void;
  onPostsPageSizeChange: (size: number) => void;
  onOpenDeletePost: (item: AdminContentPostItem) => void;
  categoryFilterLocale: LocaleFilterValue;
  onCategoryFilterLocaleChange: (value: LocaleFilterValue) => void;
  categoryFilterQuery: string;
  onCategoryFilterQueryChange: (value: string) => void;
  onClearCategoryFilterQuery: () => void;
  isCategoryListLoading: boolean;
  categoryTotal: number;
  categoryListItems: AdminContentCategoryGroupItem[];
  onOpenCreateCategory: () => void;
  onOpenUpdateCategory: (item: AdminContentCategoryItem) => void;
  onOpenDeleteCategory: (item: AdminContentCategoryItem) => void;
  resolveAccentColor: (value: string) => string;
  categoryPage: number;
  categoryTotalPages: number;
  categoryPageSize: number;
  onCategoryPageChange: (page: number) => void;
  onCategoryPageSizeChange: (size: number) => void;
  topicFilterLocale: LocaleFilterValue;
  onTopicFilterLocaleChange: (value: LocaleFilterValue) => void;
  topicFilterQuery: string;
  onTopicFilterQueryChange: (value: string) => void;
  onClearTopicFilterQuery: () => void;
  isTopicListLoading: boolean;
  topicTotal: number;
  topicListItems: AdminContentTopicGroupItem[];
  onOpenCreateTopic: () => void;
  onOpenUpdateTopic: (item: AdminContentTopicItem) => void;
  onOpenDeleteTopic: (item: AdminContentTopicItem) => void;
  topicPage: number;
  topicTotalPages: number;
  topicPageSize: number;
  onTopicPageChange: (page: number) => void;
  onTopicPageSizeChange: (size: number) => void;
  mediaLibraryQuery: string;
  onMediaLibraryQueryChange: (value: string) => void;
  onClearMediaLibraryQuery: () => void;
  mediaLibraryFilter: MediaLibraryFilter;
  onMediaLibraryFilterChange: (value: MediaLibraryFilter) => void;
  mediaLibrarySort: MediaLibrarySort;
  onMediaLibrarySortChange: (value: MediaLibrarySort) => void;
  isMediaLibraryUploading: boolean;
  onTriggerMediaUpload: () => void;
  mediaUploadInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadFileChange: (file: File) => Promise<void>;
  mediaLibraryErrorMessage: string;
  resolvedMediaDensityMode: PostDensityMode;
  onMediaDensityModeChange: (mode: PostDensityMode) => void;
  isMediaLibraryLoading: boolean;
  mediaLibraryTotal: number;
  mediaLibraryItems: AdminMediaLibraryItem[];
  formatMediaSize: (sizeBytes: number, locale: string) => string;
  imageLoader: ({ src }: { src: string }) => string;
  copiedMediaAssetID: string;
  onCopyMediaPath: (item: AdminMediaLibraryItem) => Promise<void>;
  onOpenDeleteMediaAsset: (item: AdminMediaLibraryItem) => void;
  mediaLibraryPage: number;
  totalMediaLibraryPages: number;
  mediaLibraryPageSize: number;
  onMediaLibraryPageChange: (page: number) => void;
  onMediaLibraryPageSizeChange: (size: number) => void;
};

export default function AdminContentOverviewTabs({
  t,
  activeTab,
  onTabSelect,
  formatDate,
  formatDateTime,
  formatCount,
  routeLocale,
  filterLocale,
  onFilterLocaleChange,
  filterSource,
  onFilterSourceChange,
  filterCategoryID,
  onFilterCategoryIDChange,
  filterTopicID,
  onFilterTopicIDChange,
  filterQuery,
  onFilterQueryChange,
  onClearFilterQuery,
  filterCategoryOptions,
  filterTopicOptions,
  resolvedPostDensityMode,
  canUsePostGridDensity,
  onPostDensityModeChange,
  isPostsLoading,
  totalPosts,
  posts,
  categoriesByLocaleAndID,
  topicsByLocaleAndID,
  postsPage,
  postTotalPages,
  postsPageSize,
  onPostsPageChange,
  onPostsPageSizeChange,
  onOpenDeletePost,
  categoryFilterLocale,
  onCategoryFilterLocaleChange,
  categoryFilterQuery,
  onCategoryFilterQueryChange,
  onClearCategoryFilterQuery,
  isCategoryListLoading,
  categoryTotal,
  categoryListItems,
  onOpenCreateCategory,
  onOpenUpdateCategory,
  onOpenDeleteCategory,
  resolveAccentColor,
  categoryPage,
  categoryTotalPages,
  categoryPageSize,
  onCategoryPageChange,
  onCategoryPageSizeChange,
  topicFilterLocale,
  onTopicFilterLocaleChange,
  topicFilterQuery,
  onTopicFilterQueryChange,
  onClearTopicFilterQuery,
  isTopicListLoading,
  topicTotal,
  topicListItems,
  onOpenCreateTopic,
  onOpenUpdateTopic,
  onOpenDeleteTopic,
  topicPage,
  topicTotalPages,
  topicPageSize,
  onTopicPageChange,
  onTopicPageSizeChange,
  mediaLibraryQuery,
  onMediaLibraryQueryChange,
  onClearMediaLibraryQuery,
  mediaLibraryFilter,
  onMediaLibraryFilterChange,
  mediaLibrarySort,
  onMediaLibrarySortChange,
  isMediaLibraryUploading,
  onTriggerMediaUpload,
  mediaUploadInputRef,
  onUploadFileChange,
  mediaLibraryErrorMessage,
  resolvedMediaDensityMode,
  onMediaDensityModeChange,
  isMediaLibraryLoading,
  mediaLibraryTotal,
  mediaLibraryItems,
  formatMediaSize,
  imageLoader,
  copiedMediaAssetID,
  onCopyMediaPath,
  onOpenDeleteMediaAsset,
  mediaLibraryPage,
  totalMediaLibraryPages,
  mediaLibraryPageSize,
  onMediaLibraryPageChange,
  onMediaLibraryPageSizeChange,
}: Readonly<AdminContentOverviewTabsProps>) {
  return (
    <Tabs
      id="admin-content-tabs"
      activeKey={activeTab}
      onSelect={onTabSelect}
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
          onCategoryFilterLocaleChange={onCategoryFilterLocaleChange}
          categoryFilterQuery={categoryFilterQuery}
          onCategoryFilterQueryChange={onCategoryFilterQueryChange}
          onClearCategoryFilterQuery={onClearCategoryFilterQuery}
          isCategoryListLoading={isCategoryListLoading}
          categoryTotal={categoryTotal}
          categoryListItems={categoryListItems}
          onOpenCreateCategory={onOpenCreateCategory}
          onOpenUpdateCategory={onOpenUpdateCategory}
          onOpenDeleteCategory={onOpenDeleteCategory}
          resolveAccentColor={resolveAccentColor}
          categoryPage={categoryPage}
          categoryTotalPages={categoryTotalPages}
          categoryPageSize={categoryPageSize}
          onCategoryPageChange={onCategoryPageChange}
          onCategoryPageSizeChange={onCategoryPageSizeChange}
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
          onTopicFilterLocaleChange={onTopicFilterLocaleChange}
          topicFilterQuery={topicFilterQuery}
          onTopicFilterQueryChange={onTopicFilterQueryChange}
          onClearTopicFilterQuery={onClearTopicFilterQuery}
          isTopicListLoading={isTopicListLoading}
          topicTotal={topicTotal}
          topicListItems={topicListItems}
          onOpenCreateTopic={onOpenCreateTopic}
          onOpenUpdateTopic={onOpenUpdateTopic}
          onOpenDeleteTopic={onOpenDeleteTopic}
          resolveAccentColor={resolveAccentColor}
          topicPage={topicPage}
          topicTotalPages={topicTotalPages}
          topicPageSize={topicPageSize}
          onTopicPageChange={onTopicPageChange}
          onTopicPageSizeChange={onTopicPageSizeChange}
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
          formatDateTime={formatDateTime}
          formatCount={formatCount}
          routeLocale={routeLocale}
          filterLocale={filterLocale}
          onFilterLocaleChange={onFilterLocaleChange}
          filterSource={filterSource}
          onFilterSourceChange={onFilterSourceChange}
          filterCategoryID={filterCategoryID}
          onFilterCategoryIDChange={onFilterCategoryIDChange}
          filterTopicID={filterTopicID}
          onFilterTopicIDChange={onFilterTopicIDChange}
          filterQuery={filterQuery}
          onFilterQueryChange={onFilterQueryChange}
          onClearFilterQuery={onClearFilterQuery}
          filterCategoryOptions={filterCategoryOptions}
          filterTopicOptions={filterTopicOptions}
          resolvedPostDensityMode={resolvedPostDensityMode}
          canUsePostGridDensity={canUsePostGridDensity}
          onPostDensityModeChange={onPostDensityModeChange}
          isLoading={isPostsLoading}
          total={totalPosts}
          posts={posts}
          categoriesByLocaleAndID={categoriesByLocaleAndID}
          topicsByLocaleAndID={topicsByLocaleAndID}
          page={postsPage}
          totalPages={postTotalPages}
          pageSize={postsPageSize}
          onPageChange={onPostsPageChange}
          onPageSizeChange={onPostsPageSizeChange}
          onOpenDeletePost={onOpenDeletePost}
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
          onMediaLibraryQueryChange={onMediaLibraryQueryChange}
          onClearMediaLibraryQuery={onClearMediaLibraryQuery}
          mediaLibraryFilter={mediaLibraryFilter}
          onMediaLibraryFilterChange={onMediaLibraryFilterChange}
          mediaLibrarySort={mediaLibrarySort}
          onMediaLibrarySortChange={onMediaLibrarySortChange}
          isMediaLibraryUploading={isMediaLibraryUploading}
          onTriggerUpload={onTriggerMediaUpload}
          uploadInputRef={mediaUploadInputRef}
          onUploadFileChange={onUploadFileChange}
          mediaLibraryErrorMessage={mediaLibraryErrorMessage}
          resolvedMediaDensityMode={resolvedMediaDensityMode}
          onMediaDensityModeChange={onMediaDensityModeChange}
          isMediaLibraryLoading={isMediaLibraryLoading}
          mediaLibraryTotal={mediaLibraryTotal}
          mediaLibraryItems={mediaLibraryItems}
          formatMediaSize={formatMediaSize}
          imageLoader={imageLoader}
          copiedMediaAssetID={copiedMediaAssetID}
          onCopyMediaPath={onCopyMediaPath}
          onOpenDeleteMediaAsset={onOpenDeleteMediaAsset}
          mediaLibraryPage={mediaLibraryPage}
          totalMediaLibraryPages={totalMediaLibraryPages}
          mediaLibraryPageSize={mediaLibraryPageSize}
          onMediaLibraryPageChange={onMediaLibraryPageChange}
          onMediaLibraryPageSizeChange={onMediaLibraryPageSizeChange}
        />
      </Tab>
    </Tabs>
  );
}
