import {
  CommentModerationStatus,
  CommentEventType,
  CommentMutationStatus,
  CommentQueryStatus,
  ContentQueryStatus,
  Locale as GraphQLLocale,
  NewsletterMutationStatus,
  PostMetricStatus,
  SortOrder,
} from '@/graphql/generated/graphql';

const enumToKebabCase = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value.toLowerCase().replaceAll('_', '-');
};

export const toGraphQLLocale = (value: string): GraphQLLocale | null => {
  const normalized = value.trim().toLowerCase();

  if (normalized === 'tr' || normalized.startsWith('tr-')) {
    return GraphQLLocale.Tr;
  }
  if (normalized === 'en' || normalized.startsWith('en-')) {
    return GraphQLLocale.En;
  }

  return null;
};

export const fromGraphQLLocale = (value: GraphQLLocale | string | null | undefined): string | undefined => {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'tr') {
    return 'tr';
  }
  if (normalized === 'en') {
    return 'en';
  }
  return undefined;
};

export const fromContentQueryStatus = (value: ContentQueryStatus | null | undefined): string | undefined =>
  value ? enumToKebabCase(value) : undefined;

export const fromPostMetricStatus = (value: PostMetricStatus | null | undefined): string | undefined =>
  value ? enumToKebabCase(value) : undefined;

export const fromNewsletterMutationStatus = (value: NewsletterMutationStatus | null | undefined): string | undefined =>
  value ? enumToKebabCase(value) : undefined;

export const fromCommentQueryStatus = (value: CommentQueryStatus | null | undefined): string | undefined =>
  value ? enumToKebabCase(value) : undefined;

export const fromCommentMutationStatus = (value: CommentMutationStatus | null | undefined): string | undefined =>
  value ? enumToKebabCase(value) : undefined;

export const fromCommentModerationStatus = (value: CommentModerationStatus | null | undefined): string | undefined =>
  value ? enumToKebabCase(value) : undefined;

export const fromCommentEventType = (value: CommentEventType | null | undefined): string | undefined =>
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
