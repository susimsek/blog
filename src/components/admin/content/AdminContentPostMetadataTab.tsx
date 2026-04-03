'use client';

import React from 'react';
import type { Locale } from 'date-fns';
import Image from 'next/image';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Nav from 'react-bootstrap/Nav';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DatePicker from 'react-datepicker';
import CompactCount from '@/components/common/CompactCount';
import PaginationBar from '@/components/pagination/PaginationBar';
import type {
  AdminContentCategoryItem,
  AdminContentPostItem,
  AdminContentPostRevisionItem,
  AdminContentTopicItem,
  AdminMediaLibraryItem,
} from '@/lib/adminApi';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;
type PostSeoPreviewTab = 'openGraph' | 'twitter';
type AdminContentPostLifecycleStatus = AdminContentPostItem['status'];

type PostEditorSeoPreview = {
  title: string;
  description: string;
  canonicalURL: string;
  previewImageSrc: string | null;
  domainLabel: string;
  creatorLabel: string;
  authorLabel: string;
};

type AdminContentPostMetadataTabProps = {
  t: AdminAccountTranslate;
  routeLocale: string;
  editingPost: AdminContentPostItem;
  formatCount: (value: number) => string;
  formatDateTime: (value: string) => string;
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
  postEditorStatus: AdminContentPostLifecycleStatus;
  onPostEditorStatusChange: (value: AdminContentPostLifecycleStatus) => void;
  postEditorScheduledAt: string;
  onPostEditorScheduledAtChange: (value: string) => void;
  toDateTimeLocalInputValue: (value: string) => string;
  fromDateTimeLocalInputValue: (value: string) => string | null;
  resolvePostLifecycleBadgeVariant: (status: AdminContentPostLifecycleStatus) => string;
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
};

export default function AdminContentPostMetadataTab({
  t,
  routeLocale,
  editingPost,
  formatCount,
  formatDateTime,
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
  resolvePostLifecycleBadgeVariant,
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
}: Readonly<AdminContentPostMetadataTabProps>) {
  const thumbnailSrc = resolveThumbnailSrc(postEditorThumbnail);

  return (
    <div className="admin-content-post-tab-pane pt-3">
      <div className="mb-4">
        <h5 className="mb-1">{t('adminAccount.content.modals.post.analytics.title', { ns: 'admin-account' })}</h5>
        <p className="small text-muted mb-0">
          {t('adminAccount.content.modals.post.analytics.copy', { ns: 'admin-account' })}
        </p>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-newsletter-summary-metric admin-newsletter-summary-metric--views h-100">
            <div className="admin-newsletter-summary-label d-flex align-items-center gap-2">
              <FontAwesomeIcon icon="eye" />
              <span>{t('adminAccount.content.modals.post.analytics.views', { ns: 'admin-account' })}</span>
            </div>
            <div className="admin-newsletter-summary-value">
              <CompactCount value={editingPost.viewCount} locale={routeLocale} />
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-newsletter-summary-metric admin-newsletter-summary-metric--likes h-100">
            <div className="admin-newsletter-summary-label d-flex align-items-center gap-2">
              <FontAwesomeIcon icon="heart" />
              <span>{t('adminAccount.content.modals.post.analytics.likes', { ns: 'admin-account' })}</span>
            </div>
            <div className="admin-newsletter-summary-value">{formatCount(editingPost.likeCount)}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-newsletter-summary-metric admin-newsletter-summary-metric--comments h-100">
            <div className="admin-newsletter-summary-label d-flex align-items-center gap-2">
              <FontAwesomeIcon icon="comments" />
              <span>{t('adminAccount.content.modals.post.analytics.comments', { ns: 'admin-account' })}</span>
            </div>
            <div className="admin-newsletter-summary-value">{formatCount(editingPost.commentCount)}</div>
          </div>
        </div>
      </div>

      {postEditorSeoPreview ? (
        <div className="mb-4">
          <div className="mb-3">
            <h5 className="mb-1">{t('adminAccount.content.modals.post.seo.title', { ns: 'admin-account' })}</h5>
            <p className="small text-muted mb-0">
              {t('adminAccount.content.modals.post.seo.copy', { ns: 'admin-account' })}
            </p>
          </div>
          <Nav
            variant="tabs"
            activeKey={postSeoPreviewTab}
            onSelect={nextKey => onPostSeoPreviewTabChange((nextKey as PostSeoPreviewTab) || 'openGraph')}
            className="mb-3 admin-content-tabs"
          >
            <Nav.Item>
              <Nav.Link eventKey="openGraph">
                <span className="d-inline-flex align-items-center gap-2">
                  <FontAwesomeIcon icon="globe" />
                  <span>{t('adminAccount.content.modals.post.seo.openGraphTitle', { ns: 'admin-account' })}</span>
                </span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="twitter">
                <span className="d-inline-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={['fab', 'x-twitter']} />
                  <span>{t('adminAccount.content.modals.post.seo.twitterTitle', { ns: 'admin-account' })}</span>
                </span>
              </Nav.Link>
            </Nav.Item>
          </Nav>
          <div className="admin-content-seo-preview-wrap">
            {postSeoPreviewTab === 'openGraph' ? (
              <Card className="admin-content-seo-preview-card">
                <Card.Body className="p-0">
                  <div className="admin-content-seo-image-frame">
                    {postEditorSeoPreview.previewImageSrc ? (
                      <Image
                        loader={imageLoader}
                        src={postEditorSeoPreview.previewImageSrc}
                        alt={postEditorSeoPreview.title}
                        fill
                        unoptimized
                        sizes="(max-width: 991px) 100vw, 50vw"
                        className="object-fit-cover"
                      />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted bg-body-tertiary">
                        <FontAwesomeIcon icon="camera" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 p-lg-4">
                    <div className="admin-content-seo-card-domain mb-2">{postEditorSeoPreview.domainLabel}</div>
                    <div className="admin-content-seo-card-title">{postEditorSeoPreview.title}</div>
                    <div className="admin-content-seo-card-description">{postEditorSeoPreview.description}</div>
                  </div>
                </Card.Body>
              </Card>
            ) : null}
            {postSeoPreviewTab === 'twitter' ? (
              <Card className="admin-content-seo-preview-card">
                <Card.Body className="p-0">
                  <div className="admin-content-seo-image-frame admin-content-seo-image-frame--x">
                    {postEditorSeoPreview.previewImageSrc ? (
                      <Image
                        loader={imageLoader}
                        src={postEditorSeoPreview.previewImageSrc}
                        alt={postEditorSeoPreview.title}
                        fill
                        unoptimized
                        sizes="(max-width: 991px) 100vw, 50vw"
                        className="object-fit-cover"
                      />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted bg-body-tertiary">
                        <FontAwesomeIcon icon="camera" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 p-lg-4">
                    <div className="admin-content-seo-card-title">{postEditorSeoPreview.title}</div>
                    <div className="admin-content-seo-card-description mb-3">{postEditorSeoPreview.description}</div>
                    <div className="small text-muted admin-content-seo-card-meta">
                      <span>
                        {t('adminAccount.content.modals.post.seo.canonicalLabel', { ns: 'admin-account' })}:{' '}
                        {postEditorSeoPreview.canonicalURL}
                      </span>
                      <span>
                        {t('adminAccount.content.modals.post.seo.creatorLabel', { ns: 'admin-account' })}:{' '}
                        {postEditorSeoPreview.creatorLabel}
                      </span>
                      <span>
                        {t('adminAccount.content.modals.post.seo.authorLabel', { ns: 'admin-account' })}:{' '}
                        {postEditorSeoPreview.authorLabel}
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      <Form.Group className="mb-3" controlId="admin-content-post-title">
        <Form.Label>{t('adminAccount.content.modals.post.metadataFields.title', { ns: 'admin-account' })}</Form.Label>
        <Form.Control
          type="text"
          value={postEditorTitle}
          onChange={event => onPostEditorTitleChange(event.currentTarget.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="admin-content-post-summary">
        <Form.Label>{t('adminAccount.content.modals.post.metadataFields.summary', { ns: 'admin-account' })}</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={postEditorSummary}
          onChange={event => onPostEditorSummaryChange(event.currentTarget.value)}
        />
      </Form.Group>

      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-6">
          <Form.Group controlId="admin-content-post-published-date">
            <Form.Label>
              {t('adminAccount.content.modals.post.metadataFields.publishedDate', { ns: 'admin-account' })}
            </Form.Label>
            <DatePicker
              selected={parseISODateInput(postEditorPublishedDate)}
              onChange={(date: Date | null) => {
                onPostEditorPublishedDateChange(
                  date
                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                    : '',
                );
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
              {t('adminAccount.content.modals.post.metadataFields.updatedDate', { ns: 'admin-account' })}
            </Form.Label>
            <DatePicker
              selected={parseISODateInput(postEditorUpdatedDate)}
              onChange={(date: Date | null) => {
                onPostEditorUpdatedDateChange(
                  date
                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                    : '',
                );
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
              {t('adminAccount.content.modals.post.metadataFields.updatedDateHint', { ns: 'admin-account' })}
            </Form.Text>
          </Form.Group>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-6">
          <Form.Group controlId="admin-content-post-status">
            <Form.Label>
              {t('adminAccount.content.modals.post.lifecycle.statusLabel', { ns: 'admin-account' })}
            </Form.Label>
            <Form.Select
              value={postEditorStatus}
              onChange={event => onPostEditorStatusChange(event.currentTarget.value as AdminContentPostLifecycleStatus)}
            >
              <option value="DRAFT">
                {t('adminAccount.content.modals.post.lifecycle.statuses.draft', { ns: 'admin-account' })}
              </option>
              <option value="SCHEDULED">
                {t('adminAccount.content.modals.post.lifecycle.statuses.scheduled', { ns: 'admin-account' })}
              </option>
              <option value="PUBLISHED">
                {t('adminAccount.content.modals.post.lifecycle.statuses.published', { ns: 'admin-account' })}
              </option>
            </Form.Select>
            <Form.Text className="text-muted">
              {t('adminAccount.content.modals.post.lifecycle.statusHint', { ns: 'admin-account' })}
            </Form.Text>
          </Form.Group>
        </div>
        <div className="col-12 col-lg-6">
          <Form.Group controlId="admin-content-post-scheduled-at">
            <Form.Label>
              {t('adminAccount.content.modals.post.lifecycle.scheduledAtLabel', { ns: 'admin-account' })}
            </Form.Label>
            <Form.Control
              type="datetime-local"
              value={toDateTimeLocalInputValue(postEditorScheduledAt)}
              onChange={event =>
                onPostEditorScheduledAtChange(fromDateTimeLocalInputValue(event.currentTarget.value) ?? '')
              }
              disabled={postEditorStatus !== 'SCHEDULED'}
            />
            <Form.Text className="text-muted">
              {postEditorStatus === 'SCHEDULED'
                ? t('adminAccount.content.modals.post.lifecycle.scheduledAtHint', { ns: 'admin-account' })
                : t('adminAccount.content.modals.post.lifecycle.scheduledAtDisabledHint', { ns: 'admin-account' })}
            </Form.Text>
          </Form.Group>
        </div>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        <Badge bg={resolvePostLifecycleBadgeVariant(postEditorStatus)}>
          {t(`adminAccount.content.modals.post.lifecycle.statuses.${postEditorStatus.toLowerCase()}`, {
            ns: 'admin-account',
          })}
        </Badge>
        <span className="small text-muted">
          {t('adminAccount.content.modals.post.lifecycle.revisionSummary', {
            ns: 'admin-account',
            count: editingPost.revisionCount,
          })}
        </span>
        {editingPost.latestRevisionAt ? (
          <span className="small text-muted">
            {t('adminAccount.content.modals.post.lifecycle.latestRevisionAt', {
              ns: 'admin-account',
              value: formatDateTime(editingPost.latestRevisionAt),
            })}
          </span>
        ) : null}
        {postEditorStatus === 'SCHEDULED' && postEditorScheduledAt ? (
          <span className="small text-muted">
            {t('adminAccount.content.modals.post.lifecycle.scheduledFor', {
              ns: 'admin-account',
              value: formatDateTime(postEditorScheduledAt),
            })}
          </span>
        ) : null}
      </div>

      <Form.Group className="mb-3" controlId="admin-content-post-thumbnail">
        <Form.Label>
          {t('adminAccount.content.modals.post.metadataFields.thumbnail', { ns: 'admin-account' })}
        </Form.Label>
        <div className="border rounded-3 p-3">
          <div className="d-flex flex-column flex-lg-row gap-3 align-items-stretch">
            <div
              className="border rounded-3 overflow-hidden bg-body-tertiary flex-shrink-0"
              style={{ width: '100%', maxWidth: '17rem' }}
            >
              <div className="ratio ratio-16x9">
                {thumbnailSrc ? (
                  <Image
                    loader={imageLoader}
                    src={thumbnailSrc}
                    alt={postEditorTitle.trim() || editingPost.title || 'Thumbnail preview'}
                    fill
                    unoptimized
                    sizes="(max-width: 991px) 100vw, 272px"
                    className="object-fit-cover"
                  />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                    <FontAwesomeIcon icon="camera" size="2x" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-grow-1 d-flex flex-column gap-3">
              <Form.Control
                type="text"
                value={postEditorThumbnail}
                onChange={event => onPostEditorThumbnailChange(event.currentTarget.value)}
              />
              <div className="d-flex flex-wrap gap-2">
                <Button type="button" variant="primary" onClick={onOpenMediaLibrary}>
                  <FontAwesomeIcon icon="images" className="me-2" />
                  {t('adminAccount.content.modals.post.media.openLibrary', { ns: 'admin-account' })}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={onClearPostEditorThumbnail}
                  disabled={!postEditorThumbnail.trim()}
                >
                  <FontAwesomeIcon icon="trash" className="me-2" />
                  {t('adminAccount.content.modals.post.media.clear', { ns: 'admin-account' })}
                </Button>
              </div>
              <div className="small text-muted">
                {selectedMediaLibraryItem ? (
                  <>
                    {selectedMediaLibraryItem.name}
                    {selectedMediaLibraryItem.usageCount > 0
                      ? ` · ${t('adminAccount.content.modals.post.media.usedIn', {
                          ns: 'admin-account',
                          count: selectedMediaLibraryItem.usageCount,
                        })}`
                      : ''}
                  </>
                ) : (
                  t('adminAccount.content.modals.post.media.hint', { ns: 'admin-account' })
                )}
              </div>
            </div>
          </div>
        </div>
      </Form.Group>

      <Form.Group className="mb-3" controlId="admin-content-post-category">
        <Form.Label>{t('adminAccount.content.modals.post.category', { ns: 'admin-account' })}</Form.Label>
        <Form.Select
          value={postEditorCategoryID}
          onChange={event => onPostEditorCategoryIDChange(event.currentTarget.value)}
        >
          <option value="">{t('adminAccount.content.modals.post.categoryNone', { ns: 'admin-account' })}</option>
          {postEditorCategoryOptions.map(item => (
            <option key={getTaxonomyKey(item)} value={item.id}>
              {item.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group controlId="admin-content-post-topics">
        <Form.Label>{t('adminAccount.content.modals.post.topics', { ns: 'admin-account' })}</Form.Label>
        <div className="admin-content-topic-picker-shell border rounded-3 overflow-hidden">
          <div className="admin-content-topic-picker-list list-group list-group-flush">
            <div className="list-group-item p-2">
              <div className="search-bar w-100 d-flex align-items-center">
                <div className="search-icon">
                  <FontAwesomeIcon icon="search" />
                </div>
                <Form.Control
                  type="text"
                  className="search-input form-control"
                  value={postEditorTopicQuery}
                  onChange={event => onPostEditorTopicQueryChange(event.currentTarget.value)}
                  placeholder={t('adminAccount.content.modals.post.topicsQueryPlaceholder', { ns: 'admin-account' })}
                />
                {postEditorTopicQuery ? (
                  <button
                    type="button"
                    className="search-clear-btn border-0 bg-transparent"
                    onClick={onClearPostEditorTopicQuery}
                    aria-label={t('adminAccount.content.modals.post.topics', { ns: 'admin-account' })}
                  >
                    <FontAwesomeIcon icon="times-circle" className="clear-icon" />
                  </button>
                ) : null}
              </div>
            </div>
            <div className="admin-content-topic-picker overflow-auto" style={{ maxHeight: '18rem' }}>
              {postEditorTopicOptions.length === 0 ? (
                <div className="list-group-item admin-content-topic-picker-empty small text-muted p-3">
                  {t('adminAccount.content.modals.post.topicsEmpty', { ns: 'admin-account' })}
                </div>
              ) : (
                postEditorTopicOptions.map(item => (
                  <div key={getTaxonomyKey(item)} className="list-group-item bg-transparent py-2">
                    <Form.Check
                      type="checkbox"
                      id={`admin-content-post-topic-${getTaxonomyKey(item)}`}
                      className="mb-0"
                      label={item.name}
                      checked={postEditorTopicIDs.includes(item.id)}
                      onChange={event => onPostTopicToggle(item.id, event.currentTarget.checked)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Form.Group>

      <Card className="mt-4">
        <Card.Body className="p-3 p-md-4">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
            <div>
              <h5 className="mb-1">{t('adminAccount.content.modals.post.revisions.title', { ns: 'admin-account' })}</h5>
              <p className="small text-muted mb-0">
                {t('adminAccount.content.modals.post.revisions.copy', { ns: 'admin-account' })}
              </p>
            </div>
          </div>

          {postRevisionsErrorMessage ? (
            <Alert variant="danger" className="mb-3">
              {postRevisionsErrorMessage}
            </Alert>
          ) : null}

          {isPostRevisionsLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted small py-2">
              <Spinner animation="border" size="sm" />
              <span>{t('adminAccount.content.modals.post.revisions.loading', { ns: 'admin-account' })}</span>
            </div>
          ) : postRevisions.length === 0 ? (
            <p className="small text-muted mb-0">
              {t('adminAccount.content.modals.post.revisions.empty', { ns: 'admin-account' })}
            </p>
          ) : (
            <div className="d-grid gap-3">
              {postRevisions.map(revision => (
                <div key={revision.id} className="border rounded-3 p-3">
                  <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                    <div className="d-grid gap-2">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <Badge bg="dark">
                          {t('adminAccount.content.modals.post.revisions.revisionBadge', {
                            ns: 'admin-account',
                            revision: revision.revisionNumber,
                          })}
                        </Badge>
                        <Badge bg={resolvePostLifecycleBadgeVariant(revision.status)}>
                          {t(`adminAccount.content.modals.post.lifecycle.statuses.${revision.status.toLowerCase()}`, {
                            ns: 'admin-account',
                          })}
                        </Badge>
                      </div>
                      <div className="small text-muted">
                        {t('adminAccount.content.modals.post.revisions.createdAt', {
                          ns: 'admin-account',
                          value: formatDateTime(revision.createdAt),
                        })}
                      </div>
                      <div className="fw-semibold">{revision.title}</div>
                      {revision.summary ? <div className="small text-muted">{revision.summary}</div> : null}
                      <div className="d-flex flex-wrap gap-3 small text-muted">
                        <span>
                          {t('adminAccount.content.modals.post.revisions.publishedDate', {
                            ns: 'admin-account',
                            value: revision.publishedDate,
                          })}
                        </span>
                        {revision.updatedDate ? (
                          <span>
                            {t('adminAccount.content.modals.post.revisions.updatedDate', {
                              ns: 'admin-account',
                              value: revision.updatedDate,
                            })}
                          </span>
                        ) : null}
                        {revision.scheduledAt ? (
                          <span>
                            {t('adminAccount.content.modals.post.revisions.scheduledAt', {
                              ns: 'admin-account',
                              value: formatDateTime(revision.scheduledAt),
                            })}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Button type="button" variant="outline-primary" onClick={() => onOpenRestoreRevision(revision)}>
                      <FontAwesomeIcon icon="rotate-left" className="me-2" />
                      {t('adminAccount.content.modals.post.revisions.restore', { ns: 'admin-account' })}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
        {!isPostRevisionsLoading && postRevisionsTotal > 0 ? (
          <Card.Footer className="bg-transparent border-top py-3">
            <PaginationBar
              className="border-0 rounded-0 px-2 px-md-3 py-0 bg-transparent shadow-none"
              currentPage={postRevisionsPage}
              totalPages={totalPostRevisionPages}
              totalResults={postRevisionsTotal}
              size={postRevisionsPageSize}
              onPageChange={onPostRevisionsPageChange}
              onSizeChange={onPostRevisionsPageSizeChange}
            />
          </Card.Footer>
        ) : null}
      </Card>
    </div>
  );
}
