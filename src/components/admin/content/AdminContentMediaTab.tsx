'use client';

import React from 'react';
import Image from 'next/image';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import PostDensityToggle, { type PostDensityMode } from '@/components/common/PostDensityToggle';
import PaginationBar from '@/components/pagination/PaginationBar';
import type { AdminMediaLibraryItem } from '@/lib/adminApi';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;
type MediaLibraryFilterValue = AdminMediaLibraryItem['kind'] | 'ALL';
type MediaLibrarySortValue = 'RECENT' | 'NAME' | 'SIZE' | 'USAGE';

type MediaMetadataItem = {
  key: 'updated' | 'usage' | 'dimensions' | 'size';
  icon: 'calendar-alt' | 'copy' | 'image' | 'database';
  label: string;
};

type AdminContentMediaTabProps = {
  t: AdminAccountTranslate;
  formatDate: (value: string) => string;
  routeLocale: string;
  mediaLibraryQuery: string;
  onMediaLibraryQueryChange: (value: string) => void;
  onClearMediaLibraryQuery: () => void;
  mediaLibraryFilter: MediaLibraryFilterValue;
  onMediaLibraryFilterChange: (value: MediaLibraryFilterValue) => void;
  mediaLibrarySort: MediaLibrarySortValue;
  onMediaLibrarySortChange: (value: MediaLibrarySortValue) => void;
  isMediaLibraryUploading: boolean;
  onTriggerUpload: () => void;
  uploadInputRef: React.RefObject<HTMLInputElement | null>;
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

export default function AdminContentMediaTab({
  t,
  formatDate,
  routeLocale,
  mediaLibraryQuery,
  onMediaLibraryQueryChange,
  onClearMediaLibraryQuery,
  mediaLibraryFilter,
  onMediaLibraryFilterChange,
  mediaLibrarySort,
  onMediaLibrarySortChange,
  isMediaLibraryUploading,
  onTriggerUpload,
  uploadInputRef,
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
}: Readonly<AdminContentMediaTabProps>) {
  return (
    <div className="d-grid gap-3 pt-3">
      <div className="card d-block">
        <div className="card-body p-3 w-100">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h4 className="admin-dashboard-panel-title mb-0">
              {t('adminAccount.content.media.title', { ns: 'admin-account' })}
            </h4>
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={onTriggerUpload}
              disabled={isMediaLibraryUploading}
            >
              {isMediaLibraryUploading ? (
                <Spinner as="span" animation="border" size="sm" className="me-2" />
              ) : (
                <FontAwesomeIcon icon="upload" className="me-2" />
              )}
              {t('adminAccount.content.modals.post.media.upload', { ns: 'admin-account' })}
            </Button>
          </div>

          <div className="row g-3">
            <div className="col-12 col-xl-6">
              <Form.Group controlId="admin-content-media-filter-query">
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
                    value={mediaLibraryQuery}
                    onChange={event => {
                      onMediaLibraryQueryChange(event.currentTarget.value);
                    }}
                    placeholder={t('adminAccount.content.modals.post.media.queryPlaceholder', {
                      ns: 'admin-account',
                    })}
                  />
                  {mediaLibraryQuery ? (
                    <button
                      type="button"
                      className="search-clear-btn border-0 bg-transparent"
                      onClick={onClearMediaLibraryQuery}
                      aria-label={t('adminAccount.content.modals.post.media.clearSearch', {
                        ns: 'admin-account',
                      })}
                    >
                      <FontAwesomeIcon icon="times-circle" className="clear-icon" />
                    </button>
                  ) : null}
                </div>
              </Form.Group>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <Form.Group controlId="admin-content-media-filter-kind">
                <Form.Label className="small fw-semibold mb-1">
                  {t('adminAccount.content.modals.post.media.filterLabel', { ns: 'admin-account' })}
                </Form.Label>
                <Form.Select
                  value={mediaLibraryFilter}
                  onChange={event => {
                    onMediaLibraryFilterChange(event.currentTarget.value as MediaLibraryFilterValue);
                  }}
                >
                  <option value="ALL">
                    {t('adminAccount.content.modals.post.media.filters.all', { ns: 'admin-account' })}
                  </option>
                  <option value="UPLOADED">
                    {t('adminAccount.content.modals.post.media.filters.uploaded', { ns: 'admin-account' })}
                  </option>
                  <option value="REFERENCE">
                    {t('adminAccount.content.modals.post.media.filters.reused', { ns: 'admin-account' })}
                  </option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <Form.Group controlId="admin-content-media-filter-sort">
                <Form.Label className="small fw-semibold mb-1">
                  {t('adminAccount.content.modals.post.media.sortLabel', { ns: 'admin-account' })}
                </Form.Label>
                <Form.Select
                  value={mediaLibrarySort}
                  onChange={event => {
                    onMediaLibrarySortChange(event.currentTarget.value as MediaLibrarySortValue);
                  }}
                >
                  <option value="RECENT">
                    {t('adminAccount.content.modals.post.media.sorts.recent', { ns: 'admin-account' })}
                  </option>
                  <option value="NAME">
                    {t('adminAccount.content.modals.post.media.sorts.name', { ns: 'admin-account' })}
                  </option>
                  <option value="SIZE">
                    {t('adminAccount.content.modals.post.media.sorts.size', { ns: 'admin-account' })}
                  </option>
                  <option value="USAGE">
                    {t('adminAccount.content.modals.post.media.sorts.usage', { ns: 'admin-account' })}
                  </option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <p className="small text-muted mb-0 mt-3">{t('adminAccount.content.media.copy', { ns: 'admin-account' })}</p>

          <div className="d-flex justify-content-end mt-3">
            <PostDensityToggle value={resolvedMediaDensityMode} onChange={onMediaDensityModeChange} />
          </div>

          <Form.Control
            ref={uploadInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="d-none"
            onChange={async event => {
              const input = event.target as HTMLInputElement;
              const file = input.files?.[0];
              if (!file) {
                return;
              }
              await onUploadFileChange(file);
            }}
          />

          {mediaLibraryErrorMessage ? <Alert variant="danger">{mediaLibraryErrorMessage}</Alert> : null}
        </div>
      </div>

      <div className="card d-block">
        <div className="card-body p-3 w-100">
          {isMediaLibraryLoading ? (
            <div className="admin-account-sessions-loading">
              <AdminLoadingState
                className="admin-loading-stack"
                ariaLabel={t('adminAccount.content.media.loading', { ns: 'admin-account' })}
              />
            </div>
          ) : mediaLibraryTotal === 0 ? (
            <p className="small text-muted mb-0">
              {t('adminAccount.content.modals.post.media.empty', { ns: 'admin-account' })}
            </p>
          ) : (
            <div className={`post-list-results post-list-results--${resolvedMediaDensityMode}`}>
              {mediaLibraryItems.map(item => {
                const previewSrc = item.previewUrl?.trim() || '';
                const itemKindLabel =
                  item.kind === 'UPLOADED'
                    ? t('adminAccount.content.modals.post.media.badges.uploaded', { ns: 'admin-account' })
                    : t('adminAccount.content.modals.post.media.badges.reused', { ns: 'admin-account' });
                const itemDate = item.updatedAt ?? item.createdAt;
                const metadataItems = [
                  itemDate
                    ? {
                        key: 'updated',
                        icon: 'calendar-alt',
                        label: t('adminAccount.content.list.updatedAt', {
                          ns: 'admin-account',
                          value: formatDate(itemDate),
                        }),
                      }
                    : null,
                  item.usageCount > 0
                    ? {
                        key: 'usage',
                        icon: 'copy',
                        label: t('adminAccount.content.modals.post.media.usedIn', {
                          ns: 'admin-account',
                          count: item.usageCount,
                        }),
                      }
                    : null,
                  item.width && item.height
                    ? {
                        key: 'dimensions',
                        icon: 'image',
                        label: `${item.width}×${item.height}`,
                      }
                    : null,
                  item.sizeBytes > 0
                    ? {
                        key: 'size',
                        icon: 'database',
                        label: formatMediaSize(item.sizeBytes, routeLocale),
                      }
                    : null,
                ].filter((metaItem): metaItem is MediaMetadataItem => metaItem !== null);

                return (
                  <div key={item.id} className="post-card d-flex align-items-center post-summary-card">
                    <div className="post-card-content flex-grow-1">
                      <div className="post-summary-title-row">
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <h4 className="fw-bold post-summary-title fs-4 mb-0 text-break">{item.name}</h4>
                          <Badge bg={item.kind === 'UPLOADED' ? 'primary' : 'secondary'}>{itemKindLabel}</Badge>
                        </div>
                      </div>

                      {metadataItems.length > 0 ? (
                        <div className="post-summary-meta admin-media-library-meta-grid mb-2">
                          {metadataItems.map(metaItem => (
                            <span key={metaItem.key} className="text-muted d-flex align-items-center">
                              <FontAwesomeIcon icon={metaItem.icon} className="me-2" />
                              {metaItem.label}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="post-summary-thumbnail">
                        <div className="thumbnail-wrapper rounded-3 overflow-hidden border bg-body-tertiary">
                          {previewSrc ? (
                            <Image
                              loader={imageLoader}
                              src={previewSrc}
                              alt={item.name}
                              width={1200}
                              height={630}
                              unoptimized
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="img-fluid rounded"
                              style={{ width: '100%', height: 'auto', aspectRatio: '16 / 9', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="w-100 d-flex align-items-center justify-content-center text-muted bg-body-tertiary"
                              style={{ aspectRatio: '16 / 9' }}
                            >
                              <FontAwesomeIcon icon="camera" size="2x" />
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="post-summary-text small text-muted mb-3 text-break">{item.value}</p>

                      <div className="post-summary-cta d-flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          onClick={async () => {
                            await onCopyMediaPath(item);
                          }}
                        >
                          <FontAwesomeIcon icon={copiedMediaAssetID === item.id ? 'check' : 'copy'} className="me-2" />
                          {copiedMediaAssetID === item.id
                            ? t('adminAccount.content.media.actions.copied', { ns: 'admin-account' })
                            : t('adminAccount.content.media.actions.copy', { ns: 'admin-account' })}
                        </Button>
                        <Button
                          type="button"
                          as="a"
                          size="sm"
                          variant="secondary"
                          href={previewSrc || item.value}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FontAwesomeIcon icon="up-right-from-square" className="me-2" />
                          {t('adminAccount.content.media.actions.open', { ns: 'admin-account' })}
                        </Button>
                        {item.kind === 'UPLOADED' ? (
                          <Button type="button" size="sm" variant="danger" onClick={() => onOpenDeleteMediaAsset(item)}>
                            <FontAwesomeIcon icon="trash" className="me-2" />
                            {t('adminAccount.content.media.actions.delete', { ns: 'admin-account' })}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {!isMediaLibraryLoading && mediaLibraryTotal > 0 ? (
          <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
            <PaginationBar
              className="border-0 rounded-0 px-2 px-md-3 py-0 bg-transparent shadow-none"
              currentPage={mediaLibraryPage}
              totalPages={totalMediaLibraryPages}
              totalResults={mediaLibraryTotal}
              size={mediaLibraryPageSize}
              onPageChange={onMediaLibraryPageChange}
              onSizeChange={onMediaLibraryPageSizeChange}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
