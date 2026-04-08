'use client';

import React from 'react';
import type { Locale } from 'date-fns';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import type { TFunction } from 'i18next';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Spinner from 'react-bootstrap/Spinner';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdminContentPostContentTab from '@/components/admin/content/AdminContentPostContentTab';
import AdminContentPostCommentsTab from '@/components/admin/content/AdminContentPostCommentsTab';
import AdminContentPostMetadataTab from '@/components/admin/content/AdminContentPostMetadataTab';
import FlagIcon from '@/components/common/FlagIcon';
import Link from '@/components/common/Link';
import type {
  AdminCommentItem,
  AdminContentCategoryItem,
  AdminContentPostItem,
  AdminContentPostRevisionItem,
  AdminContentTopicItem,
  AdminMediaLibraryItem,
} from '@/lib/adminApi';
import { ADMIN_ROUTES, buildAdminContentPostDetailRoute } from '@/lib/adminRoutes';
import type { PostCategoryRef } from '@/types/posts';
import type { AdminMarkdownEditorViewport } from '../AdminMarkdownEditor';

type AdminAccountTranslate = TFunction;
type PostEditorTab = 'metadata' | 'content' | 'comments';
type SupportedContentLocale = 'en' | 'tr';
type PostSeoPreviewTab = 'openGraph' | 'twitter';
type PostCommentStatusFilter = 'all' | AdminCommentItem['status'];
type PostContentViewMode = 'editor' | 'preview' | 'split';
type PostCommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';

type PostEditorSeoPreview = {
  title: string;
  description: string;
  canonicalURL: string;
  previewImageSrc: string | null;
  domainLabel: string;
  creatorLabel: string;
  authorLabel: string;
};

type PostEditorPreviewState = {
  localeCode: string;
  localeLabel: string;
  normalizedSource: string;
  sourceIcon: IconProp;
  sourceLabel: string;
  thumbnailSrc: string | null;
  resolvedSummary: string;
  resolvedPostCategory: PostCategoryRef | null;
  resolvedTopicBadges: AdminContentTopicItem[];
};

type AdminContentPostDetailSectionProps = {
  t: AdminAccountTranslate;
  routeLocale: string;
  editingPost: AdminContentPostItem | null;
  activePostEditorTab: PostEditorTab;
  postLocaleTabs: Array<{ locale: SupportedContentLocale; available: boolean }>;
  onSwitchPostEditorLocale: (locale: SupportedContentLocale) => void;
  resolveLocaleLabel: (value: string) => string;
  resolvePostLifecycleBadgeVariant: (status: AdminContentPostItem['status']) => string;
  isPostContentLoading: boolean;
  navigateToPostEditorRoute: (nextRoute: string, nextTab: PostEditorTab) => void;
  resolvePostEditorTab: (value?: string | null, allowContent?: boolean) => PostEditorTab;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
  formatCount: (value: number) => string;
  postEditorSeoPreview: PostEditorSeoPreview | null;
  postSeoPreviewTab: PostSeoPreviewTab;
  onPostSeoPreviewTabChange: (tab: PostSeoPreviewTab) => void;
  imageLoader: ({ src }: { src: string }) => string;
  postEditorTitle: string;
  onPostEditorTitleChange: (value: string) => void;
  postEditorSummary: string;
  onPostEditorSummaryChange: (value: string) => void;
  postEditorPublishedDate: string;
  onPostEditorPublishedDateChange: (value: string) => void;
  postEditorUpdatedDate: string;
  onPostEditorUpdatedDateChange: (value: string) => void;
  parseISODateInput: (value: string) => Date | null;
  datePickerLocaleConfig: Locale;
  postEditorStatus: AdminContentPostItem['status'];
  onPostEditorStatusChange: (value: AdminContentPostItem['status']) => void;
  postEditorScheduledAt: string;
  onPostEditorScheduledAtChange: (value: string) => void;
  toDateTimeLocalInputValue: (value: string | null) => string;
  fromDateTimeLocalInputValue: (value: string) => string | null;
  postEditorThumbnail: string;
  onPostEditorThumbnailChange: (value: string) => void;
  resolveThumbnailSrc: (value: string | null) => string | null;
  onOpenMediaLibrary: () => void;
  onClearPostEditorThumbnail: () => void;
  selectedMediaLibraryItem: AdminMediaLibraryItem | null;
  postEditorCategoryID: string;
  onPostEditorCategoryIDChange: (value: string) => void;
  postEditorCategoryOptions: AdminContentCategoryItem[];
  postEditorTopicQuery: string;
  onPostEditorTopicQueryChange: (value: string) => void;
  onClearPostEditorTopicQuery: () => void;
  postEditorTopicOptions: AdminContentTopicItem[];
  postEditorTopicIDs: string[];
  onPostTopicToggle: (topicID: string, checked: boolean) => void;
  getTaxonomyKey: (item: { locale: string; id: string }) => string;
  postRevisionsErrorMessage: string;
  isPostRevisionsLoading: boolean;
  postRevisions: AdminContentPostRevisionItem[];
  postRevisionsTotal: number;
  postRevisionsPage: number;
  totalPostRevisionPages: number;
  postRevisionsPageSize: number;
  onPostRevisionsPageChange: (page: number) => void;
  onPostRevisionsPageSizeChange: (size: number) => void;
  onOpenRestoreRevision: (revision: AdminContentPostRevisionItem) => void;
  postEditorPreviewState: PostEditorPreviewState | null;
  postContentViewMode: PostContentViewMode;
  onPostContentViewModeChange: (mode: PostContentViewMode) => void;
  postEditorContent: string;
  onPostEditorContentChange: (value: string) => void;
  onSplitEditorViewportChange: (viewport: AdminMarkdownEditorViewport) => void;
  splitPreviewRef: React.RefObject<HTMLDivElement | null>;
  postCommentsTotal: number;
  postCommentsStatusFilter: PostCommentStatusFilter;
  onPostCommentsStatusFilterChange: (value: PostCommentStatusFilter) => void;
  postCommentsFilterQuery: string;
  onPostCommentsFilterQueryChange: (value: string) => void;
  onClearPostCommentsFilterQuery: () => void;
  postCommentsErrorMessage: string;
  postCommentsSuccessMessage: string;
  postComments: AdminCommentItem[];
  allVisiblePostCommentsSelected: boolean;
  isPostCommentsLoading: boolean;
  isBulkPostCommentActionPending: boolean;
  hasSelectedPostComments: boolean;
  selectedPostCommentIDs: string[];
  onToggleVisiblePostCommentsSelection: () => void;
  onClearSelectedPostCommentIDs: () => void;
  bulkPostCommentActionStatus: PostCommentStatus | null;
  isBulkPostCommentDeleting: boolean;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onBulkSpam: () => void;
  onOpenBulkDelete: () => void;
  postCommentActionID: string;
  postCommentActionStatus: PostCommentStatus | null;
  deletingPostCommentID: string;
  onTogglePostCommentSelection: (commentID: string, checked: boolean) => void;
  resolveCommentStatusVariant: (status: PostCommentStatus) => string;
  onUpdatePostCommentStatus: (commentID: string, status: PostCommentStatus) => void;
  onOpenDeletePostComment: (item: AdminCommentItem) => void;
  postCommentsPage: number;
  totalPostCommentPages: number;
  postCommentsPageSize: number;
  onPostCommentsPageChange: (page: number) => void;
  onPostCommentsPageSizeChange: (size: number) => void;
  postCommentsListTopRef: React.RefObject<HTMLDivElement | null>;
  showInlinePostFeedback: boolean;
  errorMessage: string;
  successMessage: string;
  postSaveAction: React.ReactNode;
  onOpenDeletePost: () => void;
};

export default function AdminContentPostDetailSection({
  t,
  routeLocale,
  editingPost,
  activePostEditorTab,
  postLocaleTabs,
  onSwitchPostEditorLocale,
  resolveLocaleLabel,
  resolvePostLifecycleBadgeVariant,
  isPostContentLoading,
  navigateToPostEditorRoute,
  resolvePostEditorTab,
  formatDate,
  formatDateTime,
  formatCount,
  postEditorSeoPreview,
  postSeoPreviewTab,
  onPostSeoPreviewTabChange,
  imageLoader,
  postEditorTitle,
  onPostEditorTitleChange,
  postEditorSummary,
  onPostEditorSummaryChange,
  postEditorPublishedDate,
  onPostEditorPublishedDateChange,
  postEditorUpdatedDate,
  onPostEditorUpdatedDateChange,
  parseISODateInput,
  datePickerLocaleConfig,
  postEditorStatus,
  onPostEditorStatusChange,
  postEditorScheduledAt,
  onPostEditorScheduledAtChange,
  toDateTimeLocalInputValue,
  fromDateTimeLocalInputValue,
  postEditorThumbnail,
  onPostEditorThumbnailChange,
  resolveThumbnailSrc,
  onOpenMediaLibrary,
  onClearPostEditorThumbnail,
  selectedMediaLibraryItem,
  postEditorCategoryID,
  onPostEditorCategoryIDChange,
  postEditorCategoryOptions,
  postEditorTopicQuery,
  onPostEditorTopicQueryChange,
  onClearPostEditorTopicQuery,
  postEditorTopicOptions,
  postEditorTopicIDs,
  onPostTopicToggle,
  getTaxonomyKey,
  postRevisionsErrorMessage,
  isPostRevisionsLoading,
  postRevisions,
  postRevisionsTotal,
  postRevisionsPage,
  totalPostRevisionPages,
  postRevisionsPageSize,
  onPostRevisionsPageChange,
  onPostRevisionsPageSizeChange,
  onOpenRestoreRevision,
  postEditorPreviewState,
  postContentViewMode,
  onPostContentViewModeChange,
  postEditorContent,
  onPostEditorContentChange,
  onSplitEditorViewportChange,
  splitPreviewRef,
  postCommentsTotal,
  postCommentsStatusFilter,
  onPostCommentsStatusFilterChange,
  postCommentsFilterQuery,
  onPostCommentsFilterQueryChange,
  onClearPostCommentsFilterQuery,
  postCommentsErrorMessage,
  postCommentsSuccessMessage,
  postComments,
  allVisiblePostCommentsSelected,
  isPostCommentsLoading,
  isBulkPostCommentActionPending,
  hasSelectedPostComments,
  selectedPostCommentIDs,
  onToggleVisiblePostCommentsSelection,
  onClearSelectedPostCommentIDs,
  bulkPostCommentActionStatus,
  isBulkPostCommentDeleting,
  onBulkApprove,
  onBulkReject,
  onBulkSpam,
  onOpenBulkDelete,
  postCommentActionID,
  postCommentActionStatus,
  deletingPostCommentID,
  onTogglePostCommentSelection,
  resolveCommentStatusVariant,
  onUpdatePostCommentStatus,
  onOpenDeletePostComment,
  postCommentsPage,
  totalPostCommentPages,
  postCommentsPageSize,
  onPostCommentsPageChange,
  onPostCommentsPageSizeChange,
  showInlinePostFeedback,
  errorMessage,
  successMessage,
  postSaveAction,
  onOpenDeletePost,
  postCommentsListTopRef,
}: Readonly<AdminContentPostDetailSectionProps>) {
  return (
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
                    {t(`adminAccount.content.modals.post.lifecycle.statuses.${editingPost.status.toLowerCase()}`, {
                      ns: 'admin-account',
                    })}
                  </Badge>
                </div>
                <div>
                  {t('adminAccount.content.modals.post.labels.id', { ns: 'admin-account', value: editingPost.id })}
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
                onSwitchPostEditorLocale(eventKey);
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
                  formatCount={formatCount}
                  formatDateTime={formatDateTime}
                  postEditorSeoPreview={postEditorSeoPreview}
                  postSeoPreviewTab={postSeoPreviewTab}
                  onPostSeoPreviewTabChange={onPostSeoPreviewTabChange}
                  imageLoader={imageLoader}
                  postEditorTitle={postEditorTitle}
                  onPostEditorTitleChange={onPostEditorTitleChange}
                  postEditorSummary={postEditorSummary}
                  onPostEditorSummaryChange={onPostEditorSummaryChange}
                  postEditorPublishedDate={postEditorPublishedDate}
                  onPostEditorPublishedDateChange={onPostEditorPublishedDateChange}
                  postEditorUpdatedDate={postEditorUpdatedDate}
                  onPostEditorUpdatedDateChange={onPostEditorUpdatedDateChange}
                  parseISODateInput={parseISODateInput}
                  datePickerLocaleConfig={datePickerLocaleConfig}
                  postEditorStatus={postEditorStatus}
                  onPostEditorStatusChange={onPostEditorStatusChange}
                  postEditorScheduledAt={postEditorScheduledAt}
                  onPostEditorScheduledAtChange={onPostEditorScheduledAtChange}
                  toDateTimeLocalInputValue={toDateTimeLocalInputValue}
                  fromDateTimeLocalInputValue={fromDateTimeLocalInputValue}
                  resolvePostLifecycleBadgeVariant={resolvePostLifecycleBadgeVariant}
                  postEditorThumbnail={postEditorThumbnail}
                  onPostEditorThumbnailChange={onPostEditorThumbnailChange}
                  resolveThumbnailSrc={resolveThumbnailSrc}
                  onOpenMediaLibrary={onOpenMediaLibrary}
                  onClearPostEditorThumbnail={onClearPostEditorThumbnail}
                  selectedMediaLibraryItem={selectedMediaLibraryItem}
                  postEditorCategoryID={postEditorCategoryID}
                  onPostEditorCategoryIDChange={onPostEditorCategoryIDChange}
                  postEditorCategoryOptions={postEditorCategoryOptions}
                  postEditorTopicQuery={postEditorTopicQuery}
                  onPostEditorTopicQueryChange={onPostEditorTopicQueryChange}
                  onClearPostEditorTopicQuery={onClearPostEditorTopicQuery}
                  postEditorTopicOptions={postEditorTopicOptions}
                  postEditorTopicIDs={postEditorTopicIDs}
                  onPostTopicToggle={onPostTopicToggle}
                  getTaxonomyKey={getTaxonomyKey}
                  postRevisionsErrorMessage={postRevisionsErrorMessage}
                  isPostRevisionsLoading={isPostRevisionsLoading}
                  postRevisions={postRevisions}
                  postRevisionsTotal={postRevisionsTotal}
                  postRevisionsPage={postRevisionsPage}
                  totalPostRevisionPages={totalPostRevisionPages}
                  postRevisionsPageSize={postRevisionsPageSize}
                  onPostRevisionsPageChange={onPostRevisionsPageChange}
                  onPostRevisionsPageSizeChange={onPostRevisionsPageSizeChange}
                  onOpenRestoreRevision={onOpenRestoreRevision}
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
                    onPostContentViewModeChange={onPostContentViewModeChange}
                    postEditorContent={postEditorContent}
                    onPostEditorContentChange={onPostEditorContentChange}
                    onSplitEditorViewportChange={onSplitEditorViewportChange}
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
                  onPostCommentsStatusFilterChange={onPostCommentsStatusFilterChange}
                  postCommentsFilterQuery={postCommentsFilterQuery}
                  onPostCommentsFilterQueryChange={onPostCommentsFilterQueryChange}
                  onClearPostCommentsFilterQuery={onClearPostCommentsFilterQuery}
                  postCommentsErrorMessage={postCommentsErrorMessage}
                  postCommentsSuccessMessage={postCommentsSuccessMessage}
                  postComments={postComments}
                  allVisiblePostCommentsSelected={allVisiblePostCommentsSelected}
                  isPostCommentsLoading={isPostCommentsLoading}
                  isBulkPostCommentActionPending={isBulkPostCommentActionPending}
                  hasSelectedPostComments={hasSelectedPostComments}
                  selectedPostCommentIDs={selectedPostCommentIDs}
                  onToggleVisiblePostCommentsSelection={onToggleVisiblePostCommentsSelection}
                  onClearSelectedPostCommentIDs={onClearSelectedPostCommentIDs}
                  bulkPostCommentActionStatus={bulkPostCommentActionStatus}
                  isBulkPostCommentDeleting={isBulkPostCommentDeleting}
                  onBulkApprove={onBulkApprove}
                  onBulkReject={onBulkReject}
                  onBulkSpam={onBulkSpam}
                  onOpenBulkDelete={onOpenBulkDelete}
                  postCommentActionID={postCommentActionID}
                  postCommentActionStatus={postCommentActionStatus}
                  deletingPostCommentID={deletingPostCommentID}
                  onTogglePostCommentSelection={onTogglePostCommentSelection}
                  resolveCommentStatusVariant={resolveCommentStatusVariant}
                  onUpdatePostCommentStatus={onUpdatePostCommentStatus}
                  onOpenDeletePostComment={onOpenDeletePostComment}
                  postCommentsPage={postCommentsPage}
                  totalPostCommentPages={totalPostCommentPages}
                  postCommentsPageSize={postCommentsPageSize}
                  onPostCommentsPageChange={onPostCommentsPageChange}
                  onPostCommentsPageSizeChange={onPostCommentsPageSizeChange}
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
              <Button type="button" variant="danger" onClick={onOpenDeletePost}>
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
  );
}
