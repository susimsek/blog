'use client';

export type AdminContentSourceFilter = 'blog' | 'medium';

export type AdminContentPostsFilter = {
  locale?: string;
  preferredLocale?: string;
  source?: AdminContentSourceFilter;
  query?: string;
  categoryId?: string;
  topicId?: string;
  page?: number;
  size?: number;
};

export type AdminContentPostItem = {
  locale: string;
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  contentMode: string | null;
  thumbnail: string | null;
  source: string;
  publishedDate: string;
  updatedDate: string | null;
  categoryId: string | null;
  categoryName: string | null;
  topicIds: string[];
  topicNames: string[];
  readingTimeMin: number;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  scheduledAt: string | null;
  contentUpdatedAt: string | null;
  updatedAt: string | null;
  revisionCount: number;
  latestRevisionAt: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

export type AdminContentPostRevisionItem = {
  id: string;
  locale: string;
  postId: string;
  revisionNumber: number;
  title: string;
  summary: string | null;
  content: string | null;
  contentMode: string | null;
  thumbnail: string | null;
  publishedDate: string;
  updatedDate: string | null;
  categoryId: string | null;
  categoryName: string | null;
  topicIds: string[];
  topicNames: string[];
  readingTimeMin: number;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  scheduledAt: string | null;
  createdAt: string;
};

export type AdminContentPostGroupItem = {
  id: string;
  source: string;
  preferred: AdminContentPostItem;
  en: AdminContentPostItem | null;
  tr: AdminContentPostItem | null;
};

export type AdminContentTopicItem = {
  locale: string;
  id: string;
  name: string;
  color: string;
  link: string | null;
  updatedAt: string | null;
};

export type AdminContentTopicGroupItem = {
  id: string;
  preferred: AdminContentTopicItem;
  en: AdminContentTopicItem | null;
  tr: AdminContentTopicItem | null;
};

export type AdminContentCategoryItem = {
  locale: string;
  id: string;
  name: string;
  color: string;
  icon: string | null;
  link: string | null;
  updatedAt: string | null;
};

export type AdminContentCategoryGroupItem = {
  id: string;
  preferred: AdminContentCategoryItem;
  en: AdminContentCategoryItem | null;
  tr: AdminContentCategoryItem | null;
};

export type AdminMediaLibraryItem = {
  id: string;
  kind: 'UPLOADED' | 'REFERENCE';
  name: string;
  value: string;
  previewUrl: string;
  contentType: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  usageCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminMediaLibrarySort = 'RECENT' | 'NAME' | 'SIZE' | 'USAGE';

export const ADMIN_CONTENT_POST_FIELDS = `
  locale
  id
  title
  summary
  content
  contentMode
  thumbnail
  source
  publishedDate
  updatedDate
  categoryId
  categoryName
  topicIds
  topicNames
  readingTimeMin
  status
  scheduledAt
  contentUpdatedAt
  updatedAt
  revisionCount
  latestRevisionAt
  viewCount
  likeCount
  commentCount
`;

export const ADMIN_CONTENT_TOPIC_FIELDS = `
  locale
  id
  name
  color
  link
  updatedAt
`;

export const ADMIN_CONTENT_CATEGORY_FIELDS = `
  locale
  id
  name
  color
  icon
  link
  updatedAt
`;

export const ADMIN_MEDIA_LIBRARY_FIELDS = `
  id
  kind
  name
  value
  previewUrl
  contentType
  width
  height
  sizeBytes
  usageCount
  createdAt
  updatedAt
`;

export const resolveAdminContentSourceFilter = (source: string): AdminContentSourceFilter | undefined => {
  if (source === 'medium') {
    return 'medium';
  }
  if (source === 'blog') {
    return 'blog';
  }

  return undefined;
};
