'use client';

import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import {
  INITIAL_FORM_STATE,
  INITIAL_TOUCHED_STATE,
  resolveCommentErrorTranslationKey,
  validateCommentForm,
  type CommentFormField,
  type CommentFormTouchedState,
} from '@/components/posts/commentValidation';
import { addComment } from '@/lib/commentsApi';
import type { CommentViewer } from '@/types/comments';

type CommentFormProps = {
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

export default function CommentForm({
  // NOSONAR
  postId,
  viewer,
  parentId,
  replyToName,
  onSubmitted,
  onCancel,
  submitLabel,
  cancelLabel,
  variant = 'composer',
}: Readonly<CommentFormProps>) {
  // NOSONAR
  const { t } = useTranslation(['post', 'common']);
  const [formState, setFormState] = React.useState(INITIAL_FORM_STATE);
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

  const submitComment = async () => {
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
        postId,
        ...(parentId ? { parentId } : {}),
        authorName: requiresGuestIdentity ? formState.authorName.trim() : '',
        authorEmail: requiresGuestIdentity ? formState.authorEmail.trim() : '',
        content: formState.content.trim(),
      });

      if (result?.status !== 'success') {
        const errorTranslationKey = resolveCommentErrorTranslationKey(result?.status);
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

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitComment();
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
}
