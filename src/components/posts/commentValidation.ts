import type { TFunction } from 'i18next';

export type CommentFormState = {
  authorName: string;
  authorEmail: string;
  content: string;
};

export type CommentFormField = keyof CommentFormState;

export type CommentFormErrors = Partial<Record<CommentFormField, string>>;
export type CommentFormTouchedState = Record<CommentFormField, boolean>;

export const INITIAL_FORM_STATE: CommentFormState = {
  authorName: '',
  authorEmail: '',
  content: '',
};

export const INITIAL_TOUCHED_STATE: CommentFormTouchedState = {
  authorName: false,
  authorEmail: false,
  content: false,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

export const resolveCommentErrorTranslationKey = (status?: string) => {
  if (typeof status === 'string' && Object.hasOwn(COMMENT_ERROR_TRANSLATION_KEYS, status)) {
    return COMMENT_ERROR_TRANSLATION_KEYS[status as keyof typeof COMMENT_ERROR_TRANSLATION_KEYS];
  }

  return COMMENT_ERROR_TRANSLATION_KEYS.failed;
};

export const validateCommentForm = (
  value: CommentFormState,
  t: TFunction,
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
