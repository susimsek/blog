'use client';

import { gql } from '@apollo/client/core';
import { executeAdminGraphQL } from './core';
import {
  ADMIN_CONTENT_POST_FIELDS,
  type AdminContentPostGroupItem,
  type AdminContentPostItem,
  type AdminContentPostRevisionItem,
  type AdminContentPostsFilter,
  resolveAdminContentSourceFilter,
} from './content-shared';

type AdminContentPostsQueryVariables = {
  filter?: AdminContentPostsFilter;
};

type AdminContentPostsPayload = {
  contentPosts: {
    items: AdminContentPostGroupItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminContentPostPayload = {
  contentPost: AdminContentPostItem | null;
};

type AdminContentPostRevisionsPayload = {
  contentPostRevisions: {
    items: AdminContentPostRevisionItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminUpdateContentPostMetadataPayload = {
  updateContentPostMetadata: AdminContentPostItem;
};

type AdminUpdateContentPostContentPayload = {
  updateContentPostContent: AdminContentPostItem;
};

type AdminRestoreContentPostRevisionPayload = {
  restoreContentPostRevision: AdminContentPostItem;
};

type AdminDeleteContentPostPayload = {
  deleteContentPost: {
    success: boolean;
  };
};

const ADMIN_CONTENT_POSTS_QUERY = gql`
  query AdminContentPostsQuery($filter: AdminContentPostFilterInput) {
    contentPosts(filter: $filter) {
      items {
        id
        source
        preferred {
          ${ADMIN_CONTENT_POST_FIELDS}
        }
        en {
          ${ADMIN_CONTENT_POST_FIELDS}
        }
        tr {
          ${ADMIN_CONTENT_POST_FIELDS}
        }
      }
      total
      page
      size
    }
  }
`;

const ADMIN_CONTENT_POST_QUERY = gql`
  query AdminContentPostQuery($input: AdminContentEntityKeyInput!) {
    contentPost(input: $input) {
      ${ADMIN_CONTENT_POST_FIELDS}
    }
  }
`;

const ADMIN_CONTENT_POST_REVISIONS_QUERY = gql`
  query AdminContentPostRevisionsQuery($input: AdminContentEntityKeyInput!, $page: Int, $size: Int) {
    contentPostRevisions(input: $input, page: $page, size: $size) {
      items {
        id
        locale
        postId
        revisionNumber
        title
        summary
        content
        contentMode
        thumbnail
        publishedDate
        updatedDate
        categoryId
        categoryName
        topicIds
        topicNames
        readingTimeMin
        status
        scheduledAt
        createdAt
      }
      total
      page
      size
    }
  }
`;

const ADMIN_UPDATE_CONTENT_POST_METADATA_MUTATION = gql`
  mutation AdminUpdateContentPostMetadataMutation($input: AdminUpdateContentPostMetadataInput!) {
    updateContentPostMetadata(input: $input) {
      ${ADMIN_CONTENT_POST_FIELDS}
    }
  }
`;

const ADMIN_UPDATE_CONTENT_POST_CONTENT_MUTATION = gql`
  mutation AdminUpdateContentPostContentMutation($input: AdminUpdateContentPostContentInput!) {
    updateContentPostContent(input: $input) {
      ${ADMIN_CONTENT_POST_FIELDS}
    }
  }
`;

const ADMIN_RESTORE_CONTENT_POST_REVISION_MUTATION = gql`
  mutation AdminRestoreContentPostRevisionMutation($input: AdminRestoreContentPostRevisionInput!) {
    restoreContentPostRevision(input: $input) {
      ${ADMIN_CONTENT_POST_FIELDS}
    }
  }
`;

const ADMIN_DELETE_CONTENT_POST_MUTATION = gql`
  mutation AdminDeleteContentPostMutation($input: AdminContentEntityKeyInput!) {
    deleteContentPost(input: $input) {
      success
    }
  }
`;

export const fetchAdminContentPosts = async (filter?: AdminContentPostsFilter) => {
  const resolvedLocale = filter?.locale?.trim().toLowerCase() ?? '';
  const resolvedPreferredLocale = filter?.preferredLocale?.trim().toLowerCase() ?? '';
  const resolvedSourceRaw = filter?.source?.trim().toLowerCase() ?? '';
  const resolvedSource = resolveAdminContentSourceFilter(resolvedSourceRaw);
  const resolvedQuery = filter?.query?.trim() ?? '';
  const resolvedCategoryID = filter?.categoryId?.trim().toLowerCase() ?? '';
  const resolvedTopicID = filter?.topicId?.trim().toLowerCase() ?? '';
  const resolvedPage = filter?.page && Number.isFinite(filter.page) && filter.page > 0 ? Math.trunc(filter.page) : 1;
  const resolvedSize =
    filter?.size && Number.isFinite(filter.size) && filter.size > 0 ? Math.trunc(filter.size) : undefined;

  const payload = await executeAdminGraphQL<AdminContentPostsPayload, AdminContentPostsQueryVariables>(
    ADMIN_CONTENT_POSTS_QUERY,
    {
      filter: {
        ...(resolvedLocale ? { locale: resolvedLocale } : {}),
        ...(resolvedPreferredLocale ? { preferredLocale: resolvedPreferredLocale } : {}),
        ...(resolvedSource ? { source: resolvedSource } : {}),
        ...(resolvedQuery ? { query: resolvedQuery } : {}),
        ...(resolvedCategoryID ? { categoryId: resolvedCategoryID } : {}),
        ...(resolvedTopicID ? { topicId: resolvedTopicID } : {}),
        ...(resolvedPage ? { page: resolvedPage } : {}),
        ...(resolvedSize ? { size: resolvedSize } : {}),
      },
    },
    {
      operationName: 'AdminContentPosts',
    },
  );

  return payload.contentPosts;
};

export const fetchAdminContentPost = async (input: { locale: string; id: string }) => {
  const payload = await executeAdminGraphQL<
    AdminContentPostPayload,
    {
      input: {
        locale: string;
        id: string;
      };
    }
  >(
    ADMIN_CONTENT_POST_QUERY,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
      },
    },
    {
      operationName: 'AdminContentPost',
    },
  );

  return payload.contentPost;
};

export const updateAdminContentPostMetadata = async (input: {
  locale: string;
  id: string;
  title?: string;
  summary?: string;
  thumbnail?: string;
  publishedDate?: string;
  updatedDate?: string;
  status?: AdminContentPostItem['status'];
  scheduledAt?: string | null;
  categoryId?: string | null;
  topicIds: string[];
}) => {
  const payload = await executeAdminGraphQL<
    AdminUpdateContentPostMetadataPayload,
    {
      input: {
        locale: string;
        id: string;
        title?: string;
        summary?: string;
        thumbnail?: string;
        publishedDate?: string;
        updatedDate?: string;
        status?: string;
        scheduledAt?: string | null;
        categoryId?: string;
        topicIds: string[];
      };
    }
  >(
    ADMIN_UPDATE_CONTENT_POST_METADATA_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
        ...(typeof input.title === 'string' ? { title: input.title.trim() } : {}),
        ...(typeof input.summary === 'string' ? { summary: input.summary.trim() } : {}),
        ...(typeof input.thumbnail === 'string' ? { thumbnail: input.thumbnail.trim() } : {}),
        ...(typeof input.publishedDate === 'string' ? { publishedDate: input.publishedDate.trim() } : {}),
        ...(typeof input.updatedDate === 'string' ? { updatedDate: input.updatedDate.trim() } : {}),
        ...(typeof input.status === 'string' ? { status: input.status.trim().toUpperCase() } : {}),
        ...('scheduledAt' in input
          ? {
              scheduledAt:
                typeof input.scheduledAt === 'string' && input.scheduledAt.trim() ? input.scheduledAt.trim() : null,
            }
          : {}),
        ...(input.categoryId?.trim() ? { categoryId: input.categoryId.trim().toLowerCase() } : {}),
        topicIds: input.topicIds.map(item => item.trim().toLowerCase()).filter(item => item !== ''),
      },
    },
    {
      operationName: 'AdminUpdateContentPostMetadata',
    },
  );

  return payload.updateContentPostMetadata;
};

export const fetchAdminContentPostRevisions = async (input: {
  locale: string;
  id: string;
  page?: number;
  size?: number;
}) => {
  const resolvedPage = input.page && Number.isFinite(input.page) && input.page > 0 ? Math.trunc(input.page) : undefined;
  const resolvedSize = input.size && Number.isFinite(input.size) && input.size > 0 ? Math.trunc(input.size) : undefined;
  const payload = await executeAdminGraphQL<
    AdminContentPostRevisionsPayload,
    {
      input: {
        locale: string;
        id: string;
      };
      page?: number;
      size?: number;
    }
  >(
    ADMIN_CONTENT_POST_REVISIONS_QUERY,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
      },
      ...(resolvedPage ? { page: resolvedPage } : {}),
      ...(resolvedSize ? { size: resolvedSize } : {}),
    },
    {
      operationName: 'AdminContentPostRevisions',
    },
  );

  return payload.contentPostRevisions;
};

export const restoreAdminContentPostRevision = async (input: {
  locale: string;
  postId: string;
  revisionId: string;
}) => {
  const payload = await executeAdminGraphQL<
    AdminRestoreContentPostRevisionPayload,
    {
      input: {
        locale: string;
        postId: string;
        revisionId: string;
      };
    }
  >(
    ADMIN_RESTORE_CONTENT_POST_REVISION_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        postId: input.postId.trim().toLowerCase(),
        revisionId: input.revisionId.trim(),
      },
    },
    {
      operationName: 'AdminRestoreContentPostRevision',
    },
  );

  return payload.restoreContentPostRevision;
};

export const updateAdminContentPostContent = async (input: { locale: string; id: string; content: string }) => {
  const payload = await executeAdminGraphQL<
    AdminUpdateContentPostContentPayload,
    {
      input: {
        locale: string;
        id: string;
        content: string;
      };
    }
  >(
    ADMIN_UPDATE_CONTENT_POST_CONTENT_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
        content: input.content,
      },
    },
    {
      operationName: 'AdminUpdateContentPostContent',
    },
  );

  return payload.updateContentPostContent;
};

export const deleteAdminContentPost = async (input: { locale: string; id: string }) => {
  const payload = await executeAdminGraphQL<
    AdminDeleteContentPostPayload,
    {
      input: {
        locale: string;
        id: string;
      };
    }
  >(
    ADMIN_DELETE_CONTENT_POST_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
      },
    },
    {
      operationName: 'AdminDeleteContentPost',
    },
  );

  return payload.deleteContentPost?.success === true;
};
