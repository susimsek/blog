'use client';

import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import {
  beginCommentOAuthLogin,
  fetchCommentAuthSession,
  logoutCommentViewer,
  type CommentAuthSession,
} from '@/lib/commentAuthApi';
import { addComment, fetchComments } from '@/lib/commentsApi';
import type { CommentItem, CommentThread, CommentViewer } from '@/types/comments';

type CommentFormState = {
  authorName: string;
  authorEmail: string;
  content: string;
};

type CommentFormField = keyof CommentFormState;

type CommentFormErrors = Partial<Record<CommentFormField, string>>;
type CommentFormTouchedState = Record<CommentFormField, boolean>;

type PostCommentsProps = {
  locale: string;
  postId: string;
};

type CommentAccessMethod = 'email' | 'google' | 'github';

type CommentCardProps = {
  comment: CommentItem;
  locale: string;
  replyButton?: React.ReactNode;
  metaBadge?: React.ReactNode;
};

type CommentFormProps = {
  locale: string;
  postId: string;
  viewer?: CommentViewer | null;
  parentId?: string;
  replyToName?: string;
  onSubmitted: (result: { status?: string; moderationStatus?: string }, options?: { parentId?: string }) => void;
  onCancel?: () => void;
  submitLabel: string;
  cancelLabel?: string;
  variant?: 'composer' | 'reply';
};

const INITIAL_FORM_STATE: CommentFormState = {
  authorName: '',
  authorEmail: '',
  content: '',
};

const INITIAL_TOUCHED_STATE: CommentFormTouchedState = {
  authorName: false,
  authorEmail: false,
  content: false,
};
const SUCCESS_MESSAGE_AUTO_HIDE_MS = 3500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DEFAULT_COMMENT_AUTH_SESSION: CommentAuthSession = {
  authenticated: false,
  providers: {
    google: true,
    github: true,
  },
};

const getCommentInitial = (authorName: string) => {
  const normalized = authorName.trim();
  return normalized ? normalized.charAt(0).toUpperCase() : '?';
};

const COMMENT_ERROR_TRANSLATION_KEYS = {
  failed: 'post.comments.errors.failed',
  'invalid-post-id': 'post.comments.errors.invalid-post-id',
  'not-found': 'post.comments.errors.not-found',
  'invalid-parent': 'post.comments.errors.invalid-parent',
  'invalid-author': 'post.comments.errors.invalid-author',
  'invalid-email': 'post.comments.errors.invalid-email',
  'invalid-content': 'post.comments.errors.invalid-content',
  'rate-limited': 'post.comments.errors.rate-limited',
  'service-unavailable': 'post.comments.errors.service-unavailable',
} as const satisfies Record<string, string>;

const renderCommentContent = (value: string) => {
  const lines = value.split('\n');

  return lines.map((line, index) => (
    <React.Fragment key={`${line}-${index + 1}`}>
      {line}
      {index < lines.length - 1 ? <br /> : null}
    </React.Fragment>
  ));
};

const formatCommentDate = (value: string, locale: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

const validateCommentForm = (
  value: CommentFormState,
  t: ReturnType<typeof useTranslation>['t'],
  requireGuestIdentity = true,
): CommentFormErrors => {
  const nextErrors: CommentFormErrors = {};
  const normalizedName = value.authorName.trim();
  const normalizedEmail = value.authorEmail.trim();
  const normalizedContent = value.content.trim();

  if (requireGuestIdentity) {
    if (normalizedName.length === 0) {
      nextErrors.authorName = t('common.validation.required', { ns: 'common' });
    } else if (normalizedName.length < 2 || normalizedName.length > 80) {
      nextErrors.authorName = t('post.comments.errors.invalid-author');
    }

    if (normalizedEmail.length === 0) {
      nextErrors.authorEmail = t('common.validation.required', { ns: 'common' });
    } else if (normalizedEmail.length > 254 || !EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.authorEmail = t('post.comments.errors.invalid-email');
    }
  }

  if (normalizedContent.length === 0) {
    nextErrors.content = t('common.validation.required', { ns: 'common' });
  } else if (normalizedContent.length < 3 || normalizedContent.length > 2000) {
    nextErrors.content = t('post.comments.errors.invalid-content');
  }

  return nextErrors;
};

const CommentCard = ({ comment, locale, replyButton, metaBadge }: Readonly<CommentCardProps>) => {
  const { t } = useTranslation('post');
  const [isAvatarBroken, setIsAvatarBroken] = React.useState(false);

  React.useEffect(() => {
    setIsAvatarBroken(false);
  }, [comment.avatarUrl]);

  return (
    <Card className="post-card shadow-none border-0 post-comment-card">
      <Card.Body className="post-comment-card-body">
        <div className="post-comment-card-head">
          <div className="post-comment-author">
            <div className="post-comment-avatar" aria-hidden="true">
              {comment.avatarUrl && !isAvatarBroken ? (
                <img
                  key={comment.avatarUrl}
                  className="post-comment-avatar-image"
                  src={comment.avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  onLoad={() => setIsAvatarBroken(false)}
                  onError={() => setIsAvatarBroken(true)}
                />
              ) : (
                <span className="post-comment-avatar-fallback">{getCommentInitial(comment.authorName)}</span>
              )}
            </div>
            <div className="post-comment-author-meta">
              <div className="post-comment-author-row">
                <h4 className="h6 mb-1">{comment.authorName}</h4>
                {metaBadge}
              </div>
              <small className="text-muted">
                {t('post.comments.postedAt', { date: formatCommentDate(comment.createdAt, locale) })}
              </small>
            </div>
          </div>
        </div>
        <p className="mb-0 text-break post-comment-content">{renderCommentContent(comment.content)}</p>
        {replyButton ? <div className="post-comment-actions">{replyButton}</div> : null}
      </Card.Body>
    </Card>
  );
};

const CommentForm = ({
  locale,
  postId,
  viewer,
  parentId,
  replyToName,
  onSubmitted,
  onCancel,
  submitLabel,
  cancelLabel,
  variant = 'composer',
}: Readonly<CommentFormProps>) => {
  const { t } = useTranslation(['post', 'common']);
  const [formState, setFormState] = React.useState<CommentFormState>(INITIAL_FORM_STATE);
  const [touchedFields, setTouchedFields] = React.useState<CommentFormTouchedState>(INITIAL_TOUCHED_STATE);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = React.useState(false);
  const requiresGuestIdentity = !viewer;
  const validationErrors = React.useMemo(
    () => validateCommentForm(formState, t, requiresGuestIdentity),
    [formState, requiresGuestIdentity, t],
  );
  const showFieldError = React.useCallback(
    (field: CommentFormField) => (hasTriedSubmit || touchedFields[field]) && Boolean(validationErrors[field]),
    [hasTriedSubmit, touchedFields, validationErrors],
  );

  const handleChange =
    (field: CommentFormField) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      setFormState(previous => ({ ...previous, [field]: nextValue }));
      setTouchedFields(previous => ({ ...previous, [field]: true }));

      if (errorMessage) {
        setErrorMessage('');
      }
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setHasTriedSubmit(true);

    if (Object.keys(validationErrors).length > 0) {
      setTouchedFields(previous => ({
        authorName: requiresGuestIdentity ? true : previous.authorName,
        authorEmail: requiresGuestIdentity ? true : previous.authorEmail,
        content: true,
      }));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addComment({
        locale,
        postId,
        ...(parentId ? { parentId } : {}),
        authorName: requiresGuestIdentity ? formState.authorName.trim() : '',
        authorEmail: requiresGuestIdentity ? formState.authorEmail.trim() : '',
        content: formState.content.trim(),
      });

      if (!result || result.status !== 'success') {
        const resolvedStatus = typeof result?.status === 'string' ? result.status : 'failed';
        const errorTranslationKey = Object.prototype.hasOwnProperty.call(COMMENT_ERROR_TRANSLATION_KEYS, resolvedStatus)
          ? COMMENT_ERROR_TRANSLATION_KEYS[resolvedStatus as keyof typeof COMMENT_ERROR_TRANSLATION_KEYS]
          : COMMENT_ERROR_TRANSLATION_KEYS.failed;
        setErrorMessage(t(errorTranslationKey));
        return;
      }

      setFormState(INITIAL_FORM_STATE);
      setTouchedFields(INITIAL_TOUCHED_STATE);
      setHasTriedSubmit(false);
      onSubmitted(result, { parentId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className={`post-comment-form post-comment-form--${variant}`} noValidate>
      {variant === 'reply' && replyToName ? (
        <div className="post-comment-reply-banner">
          <span className="post-comment-reply-banner-label">
            <FontAwesomeIcon icon="comments" className="me-2" />
            {t('post.comments.form.replyingTo', { name: replyToName })}
          </span>
          {onCancel && cancelLabel ? (
            <Button
              type="button"
              variant="link"
              onClick={onCancel}
              disabled={isSubmitting}
              className="post-comment-reply-banner-close"
            >
              {cancelLabel}
            </Button>
          ) : null}
        </div>
      ) : null}

      {requiresGuestIdentity ? (
        <div className={`row ${variant === 'reply' ? 'g-2' : 'g-3'}`}>
          <div className="col-12">
            <Form.Group controlId={parentId ? `comment-reply-name-${parentId}` : 'comment-name'}>
              <Form.Label className="post-comment-form-label">{t('post.comments.form.nameLabel')}</Form.Label>
              <Form.Control
                type="text"
                value={formState.authorName}
                onChange={handleChange('authorName')}
                placeholder={t('post.comments.form.namePlaceholder')}
                maxLength={80}
                required
                isInvalid={showFieldError('authorName')}
                className="post-comment-form-control"
              />
              <Form.Control.Feedback type="invalid">{validationErrors.authorName}</Form.Control.Feedback>
            </Form.Group>
          </div>
          <div className="col-12">
            <Form.Group controlId={parentId ? `comment-reply-email-${parentId}` : 'comment-email'}>
              <Form.Label className="post-comment-form-label">{t('post.comments.form.emailLabel')}</Form.Label>
              <Form.Control
                type="email"
                value={formState.authorEmail}
                onChange={handleChange('authorEmail')}
                placeholder={t('post.comments.form.emailPlaceholder')}
                maxLength={160}
                required
                isInvalid={showFieldError('authorEmail')}
                className="post-comment-form-control"
              />
              <Form.Control.Feedback type="invalid">{validationErrors.authorEmail}</Form.Control.Feedback>
            </Form.Group>
          </div>
        </div>
      ) : (
        <div className="post-comment-form-viewer-note">
          <FontAwesomeIcon icon="circle-check" />
          <span>{t('post.comments.form.viewerHelper', { name: viewer.name })}</span>
        </div>
      )}

      <Form.Group controlId={parentId ? `comment-reply-content-${parentId}` : 'comment-content'}>
        <Form.Label className="post-comment-form-label">{t('post.comments.form.contentLabel')}</Form.Label>
        <Form.Control
          as="textarea"
          rows={variant === 'reply' ? 4 : 6}
          value={formState.content}
          onChange={handleChange('content')}
          placeholder={t('post.comments.form.contentPlaceholder')}
          maxLength={2000}
          required
          isInvalid={showFieldError('content')}
          className="post-comment-form-control post-comment-form-control--textarea"
        />
        <Form.Control.Feedback type="invalid">{validationErrors.content}</Form.Control.Feedback>
      </Form.Group>

      {variant === 'composer' ? (
        <p className="post-comment-form-help mb-0">
          <FontAwesomeIcon icon="shield-halved" className="me-2" />
          {t('post.comments.form.helper')}
        </p>
      ) : null}

      {errorMessage ? (
        <Alert variant="danger" className="mb-0 post-comments-status-alert post-comments-status-alert--danger">
          {errorMessage}
        </Alert>
      ) : null}

      <div className="post-comment-form-actions">
        <Button type="submit" disabled={isSubmitting} className="post-comment-submit-button">
          {isSubmitting ? (
            <span className="d-inline-flex align-items-center gap-2">
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span>{t('post.comments.form.submitting')}</span>
            </span>
          ) : (
            submitLabel
          )}
        </Button>
        {onCancel && cancelLabel && variant !== 'reply' ? (
          <Button
            type="button"
            variant="outline-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="post-comment-cancel-button"
          >
            {cancelLabel}
          </Button>
        ) : null}
      </div>
    </Form>
  );
};

export default function PostComments({ locale, postId }: Readonly<PostCommentsProps>) {
  const { t } = useTranslation('post');
  const [threads, setThreads] = React.useState<CommentThread[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [authSession, setAuthSession] = React.useState<CommentAuthSession>(DEFAULT_COMMENT_AUTH_SESSION);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [authFeedback, setAuthFeedback] = React.useState<{ variant: 'success' | 'danger'; message: string } | null>(
    null,
  );
  const [activeReplyID, setActiveReplyID] = React.useState<string | null>(null);
  const [replySuccessMessage, setReplySuccessMessage] = React.useState<{ parentId: string; message: string } | null>(
    null,
  );
  const [expandedReplyThreadIDs, setExpandedReplyThreadIDs] = React.useState<string[]>([]);
  const [composerAccessMethod, setComposerAccessMethod] = React.useState<CommentAccessMethod>('email');
  const [isViewerAvatarBroken, setIsViewerAvatarBroken] = React.useState(false);
  const authenticatedViewer = authSession.authenticated ? (authSession.viewer ?? null) : null;
  const composerViewer = composerAccessMethod === 'email' ? null : authenticatedViewer;

  React.useEffect(() => {
    setIsViewerAvatarBroken(false);
  }, [composerViewer?.avatarUrl]);

  const resolveProviderLabel = React.useCallback(
    (provider: string) => {
      switch (provider.trim().toLowerCase()) {
        case 'google':
          return t('post.comments.auth.providers.google');
        case 'github':
          return t('post.comments.auth.providers.github');
        default:
          return t('post.comments.auth.providers.account');
      }
    },
    [t],
  );

  const getCommentReturnTo = React.useCallback(() => {
    if (globalThis.window === undefined) {
      return `/${locale}`;
    }

    const currentURL = new URL(globalThis.window.location.href);
    currentURL.searchParams.delete('commentAuth');
    currentURL.searchParams.delete('commentProvider');
    const query = currentURL.searchParams.toString();

    return `${currentURL.pathname}${query ? `?${query}` : ''}${currentURL.hash}`;
  }, [locale]);

  const loadAuthSession = React.useCallback(async () => {
    setIsAuthLoading(true);

    try {
      const session = (await fetchCommentAuthSession()) ?? DEFAULT_COMMENT_AUTH_SESSION;
      setAuthSession(session);
      if (session.authenticated && session.viewer) {
        const provider = session.viewer.provider?.trim().toLowerCase();
        setComposerAccessMethod(current =>
          current === 'email' ? (provider === 'github' ? 'github' : 'google') : current,
        );
      }
      return session;
    } catch {
      setAuthSession(DEFAULT_COMMENT_AUTH_SESSION);
      return DEFAULT_COMMENT_AUTH_SESSION;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const loadComments = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await fetchComments(locale, postId);
      if (!result || (result.status && !['success', 'not-found'].includes(result.status))) {
        setErrorMessage(t('post.comments.errors.load'));
        return;
      }

      setThreads(result?.threads ?? []);
      setTotal(result?.total ?? 0);
    } finally {
      setIsLoading(false);
    }
  }, [locale, postId, t]);

  React.useEffect(() => {
    void loadComments();
  }, [loadComments]);

  React.useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      let authStatus = '';
      let authProvider = '';

      if (globalThis.window !== undefined) {
        const searchParams = new URLSearchParams(globalThis.window.location.search);
        authStatus = searchParams.get('commentAuth')?.trim().toLowerCase() ?? '';
        authProvider = searchParams.get('commentProvider')?.trim().toLowerCase() ?? '';

        if (authStatus || authProvider) {
          searchParams.delete('commentAuth');
          searchParams.delete('commentProvider');
          const nextQuery = searchParams.toString();
          const nextURL = `${globalThis.window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${globalThis.window.location.hash}`;
          globalThis.window.history.replaceState(globalThis.window.history.state, '', nextURL);
        }
      }

      const session = await loadAuthSession();
      if (!isMounted || !authStatus) {
        return;
      }

      const providerLabel = resolveProviderLabel(authProvider);
      if (authStatus === 'connected' && session.authenticated && session.viewer) {
        setAuthFeedback({
          variant: 'success',
          message: t('post.comments.auth.connected', {
            provider: providerLabel,
            name: session.viewer.name,
          }),
        });
        return;
      }

      if (authStatus === 'cancelled') {
        setAuthFeedback({
          variant: 'danger',
          message: t('post.comments.auth.cancelled', { provider: providerLabel }),
        });
        return;
      }

      if (authStatus === 'failed' || authStatus === 'connected') {
        setAuthFeedback({
          variant: 'danger',
          message: t('post.comments.auth.failed', { provider: providerLabel }),
        });
      }
    };

    void bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [loadAuthSession, resolveProviderLabel, t]);

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
    if (!replySuccessMessage) {
      return;
    }

    const timeoutID = globalThis.setTimeout(() => {
      setReplySuccessMessage(null);
    }, SUCCESS_MESSAGE_AUTO_HIDE_MS);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [replySuccessMessage]);

  const handleSubmitted = React.useCallback(
    async (result: { status?: string; moderationStatus?: string }, options?: { parentId?: string }) => {
      const successText =
        result.moderationStatus === 'approved'
          ? t('post.comments.success.approved')
          : t('post.comments.success.pending');

      if (options?.parentId) {
        setReplySuccessMessage({
          parentId: options.parentId,
          message: successText,
        });
        setExpandedReplyThreadIDs(previous =>
          previous.includes(options.parentId!) ? previous : [...previous, options.parentId!],
        );
        setSuccessMessage('');
      } else {
        setSuccessMessage(successText);
        setReplySuccessMessage(null);
      }

      setActiveReplyID(null);

      if (result.moderationStatus === 'approved') {
        await loadComments();
      }
    },
    [loadComments, t],
  );

  const handleComposerAccessMethodChange = React.useCallback(
    (nextMethod: CommentAccessMethod) => {
      if (nextMethod === 'email') {
        setComposerAccessMethod('email');
        setAuthFeedback(null);
        return;
      }

      if (authenticatedViewer && authenticatedViewer.provider?.trim().toLowerCase() === nextMethod) {
        setComposerAccessMethod(nextMethod);
        setAuthFeedback(null);
        return;
      }

      beginCommentOAuthLogin(nextMethod, locale, getCommentReturnTo());
    },
    [authenticatedViewer, getCommentReturnTo, locale],
  );

  const handleViewerLogout = React.useCallback(async () => {
    setIsLoggingOut(true);
    setAuthFeedback(null);

    try {
      await logoutCommentViewer();
      setAuthSession(DEFAULT_COMMENT_AUTH_SESSION);
      setComposerAccessMethod('email');
      setActiveReplyID(null);
      setReplySuccessMessage(null);
      setAuthFeedback({
        variant: 'success',
        message: t('post.comments.auth.signedOut'),
      });
    } finally {
      setIsLoggingOut(false);
    }
  }, [t]);

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
                                onClick={() => {
                                  setReplySuccessMessage(null);
                                  setActiveReplyID(current => (current === thread.root.id ? null : thread.root.id));
                                }}
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
                                  onClick={() => {
                                    setExpandedReplyThreadIDs(previous =>
                                      previous.includes(thread.root.id)
                                        ? previous.filter(id => id !== thread.root.id)
                                        : [...previous, thread.root.id],
                                    );
                                  }}
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
                            locale={locale}
                            postId={postId}
                            viewer={authenticatedViewer}
                            parentId={thread.root.id}
                            replyToName={thread.root.authorName}
                            onSubmitted={handleSubmitted}
                            onCancel={() => setActiveReplyID(null)}
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
              <div className="post-comments-auth-options" role="group" aria-label={t('post.comments.auth.title')}>
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
              </div>
              {composerViewer ? (
                <div className="post-comments-authenticated">
                  <div className="post-comments-authenticated-user">
                    <div className="post-comments-authenticated-avatar" aria-hidden="true">
                      {composerViewer.avatarUrl && !isViewerAvatarBroken ? (
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
              locale={locale}
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
