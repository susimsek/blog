'use client';

import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import CommentCard from '@/components/posts/CommentCard';
import CommentForm from '@/components/posts/CommentForm';
import { usePostCommentAuth } from '@/components/posts/usePostCommentAuth';
import { usePostCommentThreads } from '@/components/posts/usePostCommentThreads';
import type { CommentThread } from '@/types/comments';

type PostCommentsProps = {
  locale: string;
  postId: string;
  initialThreads?: CommentThread[];
  initialTotal?: number;
  initialStatus?: string;
  skipInitialFetch?: boolean;
  initialLoading?: boolean;
};

export default function PostComments({
  // NOSONAR
  locale,
  postId,
  initialThreads,
  initialTotal,
  initialStatus,
  skipInitialFetch = false,
  initialLoading = false,
}: Readonly<PostCommentsProps>) {
  const { t } = useTranslation('post');
  const [isViewerAvatarBroken, setIsViewerAvatarBroken] = React.useState(false);
  const {
    threads,
    total,
    isLoading,
    errorMessage,
    successMessage,
    activeReplyID,
    replySuccessMessage,
    expandedReplyThreadIDs,
    handleReplyToggle,
    handleReplyThreadToggle,
    handleSubmitted,
    resetReplyState,
  } = usePostCommentThreads({
    postId,
    skipInitialFetch,
    initialLoading,
    initialStatus,
    initialThreads,
    initialTotal,
    t,
  });
  const {
    isAuthLoading,
    isLoggingOut,
    authSession,
    authFeedback,
    composerAccessMethod,
    authenticatedViewer,
    composerViewer,
    resolveProviderLabel,
    handleComposerAccessMethodChange,
    handleViewerLogout,
  } = usePostCommentAuth({
    locale,
    t,
    onLoggedOut: resetReplyState,
  });

  React.useEffect(() => {
    setIsViewerAvatarBroken(false);
  }, [composerViewer?.avatarUrl]);

  return (
    <section className="post-comments-section" aria-labelledby="post-comments-title">
      <div className="post-comments-shell">
        <div className="post-comments-header">
          <div className="post-comments-composer-header">
            <div className="post-comments-composer-copy">
              <div className="post-comments-header-badges">
                <span className="post-comments-eyebrow">
                  <FontAwesomeIcon icon="comments" />
                  {t('post.comments.eyebrow')}
                </span>
                <span className="post-comments-count-chip" aria-label={t('post.comments.title', { count: total })}>
                  {total}
                </span>
              </div>
              <div className="post-comments-title-row">
                <h2 id="post-comments-title" className="h3 mb-0">
                  {t('post.comments.title', { count: total })}
                </h2>
                <p className="post-comments-copy mb-0">{t('post.comments.copy')}</p>
              </div>
            </div>
            <div className="post-comments-note">
              <FontAwesomeIcon icon="shield-halved" />
              <span>{t('post.comments.moderationNote')}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="post-comments-feedback post-comments-feedback--loading">
            <Spinner size="sm" />
            <span>{t('post.comments.loading')}</span>
          </div>
        ) : null}

        <div className="post-comments-section-block post-comments-section-block--list">
          <div className="post-comments-section-heading">
            <h3 className="h5 mb-1">{t('post.comments.streamTitle')}</h3>
          </div>

          {!isLoading && threads.length === 0 ? (
            <Card className="post-card shadow-none border-0 post-comments-empty-card">
              <Card.Body className="post-comments-empty-card-body">
                <div className="post-comments-empty-icon" aria-hidden="true">
                  <FontAwesomeIcon icon="comments" />
                </div>
                <div>
                  <h3 className="h5 mb-2">{t('post.comments.emptyTitle')}</h3>
                  <p className="mb-0 text-muted">{t('post.comments.empty')}</p>
                </div>
              </Card.Body>
            </Card>
          ) : null}

          {threads.length > 0 ? (
            <div className="post-comments-list-wrap">
              <div className="post-comments-list">
                {threads.map((thread, index) => (
                  <div
                    key={thread.root.id}
                    className="post-comments-thread"
                    style={{ '--comment-enter-delay': `${index * 70}ms` } as React.CSSProperties}
                  >
                    {(() => {
                      const hasReplies = thread.replies.length > 0;
                      const areRepliesExpanded = expandedReplyThreadIDs.includes(thread.root.id);

                      return (
                        <CommentCard
                          comment={thread.root}
                          locale={locale}
                          metaBadge={
                            hasReplies ? (
                              <span
                                className="post-comment-reply-count-badge"
                                aria-label={t('post.comments.replies', { count: thread.replies.length })}
                                title={t('post.comments.replies', { count: thread.replies.length })}
                              >
                                <FontAwesomeIcon icon="comments" />
                                <span>{thread.replies.length}</span>
                              </span>
                            ) : undefined
                          }
                          replyButton={
                            <>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => handleReplyToggle(thread.root.id)}
                              >
                                {activeReplyID === thread.root.id
                                  ? t('post.comments.closeReply')
                                  : t('post.comments.reply')}
                              </Button>
                              {hasReplies ? (
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  className="post-comment-thread-toggle"
                                  onClick={() => handleReplyThreadToggle(thread.root.id)}
                                >
                                  <FontAwesomeIcon
                                    icon={areRepliesExpanded ? 'chevron-up' : 'chevron-down'}
                                    className="me-2"
                                  />
                                  {areRepliesExpanded
                                    ? t('post.comments.hideReplies', { count: thread.replies.length })
                                    : t('post.comments.viewReplies', { count: thread.replies.length })}
                                </Button>
                              ) : null}
                            </>
                          }
                        />
                      );
                    })()}

                    {activeReplyID === thread.root.id ? (
                      <Card className="post-card shadow-none border-0 post-comment-reply-card">
                        <Card.Body className="post-comment-reply-card-body">
                          <CommentForm
                            postId={postId}
                            viewer={authenticatedViewer}
                            parentId={thread.root.id}
                            replyToName={thread.root.authorName}
                            onSubmitted={handleSubmitted}
                            onCancel={resetReplyState}
                            submitLabel={t('post.comments.form.submitReply')}
                            cancelLabel={t('post.comments.form.cancelReply')}
                            variant="reply"
                          />
                        </Card.Body>
                      </Card>
                    ) : null}

                    {replySuccessMessage?.parentId === thread.root.id ? (
                      <Alert
                        variant="success"
                        className="mb-0 post-comments-status-alert post-comments-status-alert--success post-comment-reply-success"
                      >
                        {replySuccessMessage.message}
                      </Alert>
                    ) : null}

                    {expandedReplyThreadIDs.includes(thread.root.id)
                      ? thread.replies.map((reply, replyIndex) => (
                          <div
                            key={reply.id}
                            className="post-comment-reply-item"
                            style={
                              {
                                '--comment-enter-delay': `${index * 70 + (replyIndex + 1) * 55}ms`,
                              } as React.CSSProperties
                            }
                          >
                            <CommentCard comment={reply} locale={locale} />
                          </div>
                        ))
                      : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <Card className="post-card shadow-none border-0 post-comments-composer">
          <Card.Body className="post-comments-composer-body">
            <div className="post-comments-section-heading">
              <h3 className="h5 mb-1">{t('post.comments.composerTitle')}</h3>
              <p className="mb-0 text-muted">{t('post.comments.composerCopy')}</p>
            </div>

            <div className="post-comments-auth">
              <div className="post-comments-auth-copy">
                <span className="post-comments-auth-kicker">{t('post.comments.auth.title')}</span>
                <p className="mb-0 text-muted">{t('post.comments.auth.copy')}</p>
              </div>
              {isAuthLoading ? (
                <div className="post-comments-auth-loading">
                  <Spinner size="sm" />
                  <span>{t('post.comments.auth.loading')}</span>
                </div>
              ) : null}
              <fieldset className="post-comments-auth-options border-0 p-0 m-0">
                <legend className="visually-hidden">{t('post.comments.auth.title')}</legend>
                <Button
                  type="button"
                  variant="danger"
                  className="post-comments-auth-option post-comments-auth-option--icon post-comments-auth-option--google"
                  onClick={() => handleComposerAccessMethodChange('google')}
                  disabled={isAuthLoading || !authSession.providers.google}
                  aria-label={t('post.comments.auth.google')}
                  title={t('post.comments.auth.google')}
                  aria-pressed={composerAccessMethod === 'google'}
                >
                  <FontAwesomeIcon icon={['fab', 'google']} />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="post-comments-auth-option post-comments-auth-option--icon post-comments-auth-option--github"
                  onClick={() => handleComposerAccessMethodChange('github')}
                  disabled={isAuthLoading || !authSession.providers.github}
                  aria-label={t('post.comments.auth.github')}
                  title={t('post.comments.auth.github')}
                  aria-pressed={composerAccessMethod === 'github'}
                >
                  <FontAwesomeIcon icon={['fab', 'github']} />
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="post-comments-auth-option post-comments-auth-option--icon post-comments-auth-option--email"
                  onClick={() => handleComposerAccessMethodChange('email')}
                  disabled={isAuthLoading}
                  aria-label={t('post.comments.auth.email')}
                  title={t('post.comments.auth.email')}
                  aria-pressed={composerAccessMethod === 'email'}
                >
                  <FontAwesomeIcon icon="envelope" />
                </Button>
              </fieldset>
              {composerViewer ? (
                <div className="post-comments-authenticated">
                  <div className="post-comments-authenticated-user">
                    <div className="post-comments-authenticated-avatar" aria-hidden="true">
                      {composerViewer.avatarUrl && !isViewerAvatarBroken ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={composerViewer.avatarUrl}
                          className="post-comments-authenticated-avatar-image"
                          src={composerViewer.avatarUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          onLoad={() => setIsViewerAvatarBroken(false)}
                          onError={() => {
                            console.warn('post comments viewer avatar failed to load', {
                              avatarUrl: composerViewer.avatarUrl,
                              viewerId: composerViewer.id,
                              provider: composerViewer.provider,
                            });
                            setIsViewerAvatarBroken(true);
                          }}
                        />
                      ) : (
                        <FontAwesomeIcon icon="user" className="post-comments-authenticated-avatar-fallback" />
                      )}
                    </div>
                    <div className="post-comments-authenticated-copy">
                      <span className="post-comments-authenticated-title">
                        {t('post.comments.auth.signedInAs', { name: composerViewer.name })}
                      </span>
                      <small className="text-muted">
                        {t('post.comments.auth.providerHint', {
                          provider: resolveProviderLabel(composerViewer.provider ?? composerAccessMethod),
                          email: composerViewer.email,
                        })}
                      </small>
                    </div>
                  </div>
                  <div className="post-comments-authenticated-actions">
                    <Button
                      type="button"
                      variant="link"
                      className="post-comments-auth-alert-action"
                      onClick={() => handleComposerAccessMethodChange('email')}
                    >
                      {t('post.comments.auth.useEmail')}
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleViewerLogout} disabled={isLoggingOut}>
                      {isLoggingOut ? (
                        <span className="d-inline-flex align-items-center gap-2">
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                          <span>{t('post.comments.auth.signingOut')}</span>
                        </span>
                      ) : (
                        <>
                          <FontAwesomeIcon icon="right-from-bracket" className="me-2" />
                          <span>{t('post.comments.auth.signOut')}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            {authFeedback || successMessage || errorMessage ? (
              <div className="post-comments-status-stack">
                {authFeedback ? (
                  <Alert
                    variant={authFeedback.variant}
                    className={`mb-0 post-comments-status-alert post-comments-status-alert--${authFeedback.variant}`}
                  >
                    {authFeedback.message}
                  </Alert>
                ) : null}
                {successMessage ? (
                  <Alert
                    variant="success"
                    className="mb-0 post-comments-status-alert post-comments-status-alert--success"
                  >
                    {successMessage}
                  </Alert>
                ) : null}
                {errorMessage ? (
                  <Alert
                    variant="danger"
                    className="mb-0 post-comments-status-alert post-comments-status-alert--danger"
                  >
                    {errorMessage}
                  </Alert>
                ) : null}
              </div>
            ) : null}

            <CommentForm
              postId={postId}
              viewer={composerViewer}
              onSubmitted={handleSubmitted}
              submitLabel={t('post.comments.form.submit')}
              variant="composer"
            />
          </Card.Body>
        </Card>
      </div>
    </section>
  );
}
