import {
  CommentModerationStatus,
  CommentMutationStatus,
  CommentQueryStatus,
  ContentQueryStatus,
  NewsletterMutationStatus,
  PostMetricStatus,
  Scalars,
  SortOrder,
} from '@/graphql/generated/schema';

const enumToKebabCase = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value.toLowerCase().replaceAll('_', '-');
};

export const toGraphQLLocale = (value: string): Scalars['Locale']['input'] | null => {
  const normalized = value.trim().toLowerCase();

  if (normalized === 'tr' || normalized.startsWith('tr-')) {
    return 'tr';
  }
  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }

  return null;
};

export const fromGraphQLLocale = (
  value: Scalars['Locale']['output'] | string | null | undefined,
): string | undefined => {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'tr') {
    return 'tr';
  }
  if (normalized === 'en') {
    return 'en';
  }
  return undefined;
};

export const fromContentQueryStatus = (value: ContentQueryStatus | string | null | undefined): string | undefined =>
  value ? enumToKebabCase(value) : undefined;

export const fromPostMetricStatus = (value: PostMetricStatus | string | null | undefined): string | undefined =>
  value ? enumToKebabCase(value) : undefined;

export const fromNewsletterMutationStatus = (
  value: NewsletterMutationStatus | string | null | undefined,
): string | undefined =>
  value ? enumToKebabCase(value) : undefined;

export const fromCommentQueryStatus = (value: CommentQueryStatus | string | null | undefined): string | undefined =>
  value ? enumToKebabCase(value) : undefined;

export const fromCommentMutationStatus = (
  value: CommentMutationStatus | string | null | undefined,
): string | undefined =>
  value ? enumToKebabCase(value) : undefined;

export const fromCommentModerationStatus = (
  value: CommentModerationStatus | string | null | undefined,
): string | undefined =>
  value ? enumToKebabCase(value) : undefined;

export const fromGraphQLSortOrder = (value: SortOrder | string | null | undefined): string | undefined => {
  const normalized = value?.trim().toUpperCase();

  if (normalized === SortOrder.Asc) {
    return SortOrder.Asc;
  }
  if (normalized === SortOrder.Desc) {
    return SortOrder.Desc;
  }

  return undefined;
};
