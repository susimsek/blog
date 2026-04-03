'use client';

import React from 'react';
import Image from 'next/image';
import type { TFunction } from 'i18next';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import CompactCount from '@/components/common/CompactCount';
import Link from '@/components/common/Link';
import PostDensityToggle, { type PostDensityMode } from '@/components/common/PostDensityToggle';
import PaginationBar from '@/components/pagination/PaginationBar';
import PostCategoryBadge from '@/components/posts/PostCategoryBadge';
import { assetPrefix } from '@/config/constants';
import { formatReadingTime } from '@/lib/readingTime';
import {
  type AdminContentCategoryItem,
  type AdminContentPostGroupItem,
  type AdminContentPostItem,
  type AdminContentTopicItem,
} from '@/lib/adminApi';
import { buildAdminContentPostDetailRoute } from '@/lib/adminRoutes';
import type { PostCategoryRef } from '@/types/posts';

type AdminAccountTranslate = TFunction;
type LocaleFilterValue = 'all' | 'en' | 'tr';
type SourceFilterValue = 'all' | 'blog' | 'medium';

type AdminContentPostsTabProps = {
  t: AdminAccountTranslate;
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
  isLoading: boolean;
  total: number;
  posts: AdminContentPostGroupItem[];
  categoriesByLocaleAndID: ReadonlyMap<string, AdminContentCategoryItem>;
  topicsByLocaleAndID: ReadonlyMap<string, AdminContentTopicItem>;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onOpenDeletePost: (item: AdminContentPostItem) => void;
};

const toTaxonomyKey = (item: { id: string }) => item.id.toLowerCase();

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

export default function AdminContentPostsTab({
  t,
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
  isLoading,
  total,
  posts,
  categoriesByLocaleAndID,
  topicsByLocaleAndID,
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onOpenDeletePost,
}: Readonly<AdminContentPostsTabProps>) {
  return (
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
                    onFilterLocaleChange(event.currentTarget.value as LocaleFilterValue);
                  }}
                >
                  <option value="all">{t('adminAccount.content.filters.locales.all', { ns: 'admin-account' })}</option>
                  <option value="en">{t('adminAccount.content.filters.locales.en', { ns: 'admin-account' })}</option>
                  <option value="tr">{t('adminAccount.content.filters.locales.tr', { ns: 'admin-account' })}</option>
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
                    onFilterSourceChange(event.currentTarget.value as SourceFilterValue);
                  }}
                >
                  <option value="all">{t('adminAccount.content.filters.sources.all', { ns: 'admin-account' })}</option>
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
                    onFilterCategoryIDChange(event.currentTarget.value);
                  }}
                >
                  <option value="">{t('adminAccount.content.filters.categories.all', { ns: 'admin-account' })}</option>
                  {filterCategoryOptions.map(item => (
                    <option key={toTaxonomyKey(item)} value={item.id}>
                      {item.name}
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
                    onFilterTopicIDChange(event.currentTarget.value);
                  }}
                >
                  <option value="">{t('adminAccount.content.filters.topics.all', { ns: 'admin-account' })}</option>
                  {filterTopicOptions.map(item => (
                    <option key={toTaxonomyKey(item)} value={item.id}>
                      {item.name}
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
                      onFilterQueryChange(event.currentTarget.value);
                    }}
                    placeholder={t('adminAccount.content.filters.queryPlaceholder', { ns: 'admin-account' })}
                  />
                  {filterQuery ? (
                    <button
                      type="button"
                      className="search-clear-btn border-0 bg-transparent"
                      onClick={onClearFilterQuery}
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
              onChange={mode => onPostDensityModeChange(!canUsePostGridDensity && mode === 'grid' ? 'default' : mode)}
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
            <p className="small text-muted mb-0">{t('adminAccount.content.empty.posts', { ns: 'admin-account' })}</p>
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
                const sourceIcon: IconProp = normalizedSource === 'medium' ? (['fab', 'medium'] as IconProp) : 'book';
                const canEditPostContent = normalizedSource === 'blog';
                const isListMode = resolvedPostDensityMode === 'editorial';
                const normalizedCategoryName = item.categoryName?.trim().toLowerCase() ?? '';
                const shouldShowCategoryBadge =
                  normalizedCategoryName !== '' &&
                  normalizedCategoryName !== 'all category' &&
                  normalizedCategoryName !== 'all categories' &&
                  normalizedCategoryName !== 'tüm kategoriler';
                const resolvedCategoryRecord = item.categoryId?.trim()
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
                          <Badge bg={resolvePostLifecycleBadgeVariant(item.status)}>
                            {t(`adminAccount.content.modals.post.lifecycle.statuses.${item.status.toLowerCase()}`, {
                              ns: 'admin-account',
                            })}
                          </Badge>
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

                      <div className="post-summary-meta-stack mb-2">
                        <p className="post-summary-meta mb-0">
                          <span className="text-muted d-flex align-items-center">
                            <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                            {formatDate(item.publishedDate)}
                          </span>
                          {item.updatedDate ? (
                            <span className={`text-muted d-flex align-items-center${isListMode ? '' : ' w-100'}`}>
                              <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                              {t('adminAccount.content.list.updatedAt', {
                                ns: 'admin-account',
                                value: item.updatedDate,
                              })}
                            </span>
                          ) : null}
                          {item.status === 'SCHEDULED' && item.scheduledAt ? (
                            <span className={`text-muted d-flex align-items-center${isListMode ? '' : ' w-100'}`}>
                              <FontAwesomeIcon icon="clock" className="me-2" />
                              {t('adminAccount.content.modals.post.lifecycle.scheduledFor', {
                                ns: 'admin-account',
                                value: formatDateTime(item.scheduledAt),
                              })}
                            </span>
                          ) : null}
                        </p>

                        <div className="post-summary-meta mb-0">
                          <span className="text-muted d-inline-flex align-items-center lh-1">
                            <FontAwesomeIcon icon="clock" className="me-2" />
                            <span>{formatReadingTime(item.readingTimeMin, t, 1)}</span>
                          </span>
                          <Link
                            href={buildAdminContentPostDetailRoute(item.locale, item.id)}
                            locale={item.locale.toLowerCase()}
                            className="link-muted d-inline-flex align-items-center lh-1"
                          >
                            <FontAwesomeIcon icon="heart" className="me-2 post-summary-like-icon" />
                            <span className="post-summary-like-value">{formatCount(item.likeCount)}</span>
                          </Link>
                          <Link
                            href={buildAdminContentPostDetailRoute(item.locale, item.id)}
                            locale={item.locale.toLowerCase()}
                            className="link-muted d-inline-flex align-items-center lh-1"
                          >
                            <FontAwesomeIcon icon="comments" className="me-2" />
                            <span className="post-summary-like-value">{formatCount(item.commentCount)}</span>
                          </Link>
                          <Link
                            href={buildAdminContentPostDetailRoute(item.locale, item.id)}
                            locale={item.locale.toLowerCase()}
                            className="link-muted d-inline-flex align-items-center lh-1"
                          >
                            <FontAwesomeIcon icon="eye" className="me-2" />
                            <span className="post-summary-like-value">
                              <CompactCount value={item.viewCount} locale={routeLocale} />
                            </span>
                          </Link>
                        </div>
                      </div>

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
                        <Button type="button" size="sm" variant="danger" onClick={() => onOpenDeletePost(item)}>
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
              onPageChange={onPageChange}
              onSizeChange={onPageSizeChange}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
