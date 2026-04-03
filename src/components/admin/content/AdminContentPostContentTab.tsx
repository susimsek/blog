'use client';

import React from 'react';
import Image from 'next/image';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import AdminMarkdownEditor, { type AdminMarkdownEditorViewport } from '@/components/admin/AdminMarkdownEditor';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import PostCategoryBadge from '@/components/posts/PostCategoryBadge';
import type { AdminContentPostItem, AdminContentTopicItem } from '@/lib/adminApi';
import type { PostCategoryRef } from '@/types/posts';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;
type PostContentViewMode = 'editor' | 'split' | 'preview';

type PostEditorPreviewState = {
  sourceIcon: IconProp;
  sourceLabel: string;
  thumbnailSrc: string | null;
  resolvedSummary: string;
  resolvedPostCategory: PostCategoryRef | null;
  resolvedTopicBadges: AdminContentTopicItem[];
};

type AdminContentPostContentTabProps = {
  t: AdminAccountTranslate;
  editingPost: AdminContentPostItem;
  postEditorPreviewState: PostEditorPreviewState | null;
  postContentViewMode: PostContentViewMode;
  onPostContentViewModeChange: (mode: PostContentViewMode) => void;
  postEditorContent: string;
  onPostEditorContentChange: (value: string) => void;
  onSplitEditorViewportChange: (viewport: AdminMarkdownEditorViewport) => void;
  splitPreviewRef: React.RefObject<HTMLDivElement | null>;
};

export default function AdminContentPostContentTab({
  t,
  editingPost,
  postEditorPreviewState,
  postContentViewMode,
  onPostContentViewModeChange,
  postEditorContent,
  onPostEditorContentChange,
  onSplitEditorViewportChange,
  splitPreviewRef,
}: Readonly<AdminContentPostContentTabProps>) {
  return (
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
                <span className="post-detail-meta-value">{editingPost.updatedDate || editingPost.publishedDate}</span>
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
                <Badge key={`${editingPost.id}-${topic.id}`} bg={topic.color} className={`badge-${topic.color}`}>
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
          <fieldset
            className="btn-group post-density-toggle border-0 p-0 m-0"
            aria-label={t('adminAccount.content.modals.post.previewTitle', { ns: 'admin-account' })}
          >
            <button
              type="button"
              className={`btn${postContentViewMode === 'editor' ? ' is-active' : ''}`}
              aria-pressed={postContentViewMode === 'editor'}
              aria-label={t('adminAccount.content.modals.post.modes.editor', { ns: 'admin-account' })}
              title={t('adminAccount.content.modals.post.modes.editor', { ns: 'admin-account' })}
              onClick={() => onPostContentViewModeChange('editor')}
            >
              <span className="post-density-toggle-icon" aria-hidden="true">
                <FontAwesomeIcon icon="code" className="fa-fw" />
              </span>
            </button>
            <button
              type="button"
              className={`btn${postContentViewMode === 'split' ? ' is-active' : ''}`}
              aria-pressed={postContentViewMode === 'split'}
              aria-label={t('adminAccount.content.modals.post.modes.split', { ns: 'admin-account' })}
              title={t('adminAccount.content.modals.post.modes.split', { ns: 'admin-account' })}
              onClick={() => onPostContentViewModeChange('split')}
            >
              <span className="post-density-toggle-icon" aria-hidden="true">
                <FontAwesomeIcon icon="table-cells" className="fa-fw" />
              </span>
            </button>
            <button
              type="button"
              className={`btn${postContentViewMode === 'preview' ? ' is-active' : ''}`}
              aria-pressed={postContentViewMode === 'preview'}
              aria-label={t('adminAccount.content.modals.post.modes.preview', { ns: 'admin-account' })}
              title={t('adminAccount.content.modals.post.modes.preview', { ns: 'admin-account' })}
              onClick={() => onPostContentViewModeChange('preview')}
            >
              <span className="post-density-toggle-icon" aria-hidden="true">
                <FontAwesomeIcon icon="eye" className="fa-fw" />
              </span>
            </button>
          </fieldset>
        </div>
      </div>

      {postContentViewMode === 'editor' ? (
        <AdminMarkdownEditor
          id="admin-content-post-content-editor"
          label={t('adminAccount.content.modals.post.contentLabel', { ns: 'admin-account' })}
          hint={t('adminAccount.content.modals.post.contentHint', { ns: 'admin-account' })}
          value={postEditorContent}
          rows={18}
          onChange={onPostEditorContentChange}
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
              onViewportChange={onSplitEditorViewportChange}
              onChange={onPostEditorContentChange}
            />
          </div>
          <div className="col-12 col-xl-6 admin-content-post-split-col">
            <Form.Label className="d-block mb-2">
              {t('adminAccount.content.modals.post.modes.preview', { ns: 'admin-account' })}
            </Form.Label>
            <div ref={splitPreviewRef} className="admin-post-content-preview admin-post-content-preview--split">
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
  );
}
