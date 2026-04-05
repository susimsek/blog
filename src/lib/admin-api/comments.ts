'use client';

import { gql } from '@apollo/client/core';
import { executeAdminGraphQL } from './core';

export type AdminCommentItem = {
  id: string;
  postId: string;
  postTitle: string;
  parentId: string | null;
  authorName: string;
  authorEmail: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
  createdAt: string;
  updatedAt: string;
};

type AdminCommentFilterStatus = AdminCommentItem['status'];

type AdminCommentsFilter = {
  status?: AdminCommentFilterStatus;
  postId?: string;
  query?: string;
  page?: number;
  size?: number;
};

type AdminCommentsPayload = {
  comments: {
    items: AdminCommentItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminCommentsQueryVariables = {
  filter?: AdminCommentsFilter;
};

type AdminUpdateCommentStatusPayload = {
  updateCommentStatus: AdminCommentItem;
};

type AdminDeleteCommentPayload = {
  deleteComment: {
    success: boolean;
  };
};

type AdminBulkCommentMutationPayload = {
  bulkUpdateCommentStatus?: {
    successCount: number;
  };
  bulkDeleteComments?: {
    successCount: number;
  };
};

const ADMIN_COMMENTS_QUERY = gql`
  query AdminCommentsQuery($filter: AdminCommentFilterInput) {
    comments(filter: $filter) {
      items {
        id
        postId
        postTitle
        parentId
        authorName
        authorEmail
        content
        status
        createdAt
        updatedAt
      }
      total
      page
      size
    }
  }
`;

const ADMIN_UPDATE_COMMENT_STATUS_MUTATION = gql`
  mutation AdminUpdateCommentStatusMutation($input: AdminUpdateCommentStatusInput!) {
    updateCommentStatus(input: $input) {
      id
      postId
      postTitle
      parentId
      authorName
      authorEmail
      content
      status
      createdAt
      updatedAt
    }
  }
`;

const ADMIN_DELETE_COMMENT_MUTATION = gql`
  mutation AdminDeleteCommentMutation($input: AdminDeleteCommentInput!) {
    deleteComment(input: $input) {
      success
    }
  }
`;

const ADMIN_BULK_UPDATE_COMMENT_STATUS_MUTATION = gql`
  mutation AdminBulkUpdateCommentStatusMutation($input: AdminBulkUpdateCommentStatusInput!) {
    bulkUpdateCommentStatus(input: $input) {
      successCount
    }
  }
`;

const ADMIN_BULK_DELETE_COMMENTS_MUTATION = gql`
  mutation AdminBulkDeleteCommentsMutation($input: AdminBulkDeleteCommentsInput!) {
    bulkDeleteComments(input: $input) {
      successCount
    }
  }
`;

export const fetchAdminComments = async (filter?: AdminCommentsFilter) => {
  const payload = await executeAdminGraphQL<AdminCommentsPayload, AdminCommentsQueryVariables>(
    ADMIN_COMMENTS_QUERY,
    filter ? { filter } : undefined,
    { operationName: 'AdminComments' },
  );

  return payload.comments;
};

export const updateAdminCommentStatus = async (input: { commentId: string; status: AdminCommentFilterStatus }) => {
  const payload = await executeAdminGraphQL<
    AdminUpdateCommentStatusPayload,
    {
      input: {
        commentId: string;
        status: AdminCommentFilterStatus;
      };
    }
  >(ADMIN_UPDATE_COMMENT_STATUS_MUTATION, { input }, { operationName: 'AdminUpdateCommentStatus' });

  return payload.updateCommentStatus;
};

export const deleteAdminComment = async (input: { commentId: string }) => {
  const payload = await executeAdminGraphQL<
    AdminDeleteCommentPayload,
    {
      input: {
        commentId: string;
      };
    }
  >(
    ADMIN_DELETE_COMMENT_MUTATION,
    {
      input: {
        commentId: input.commentId.trim(),
      },
    },
    { operationName: 'AdminDeleteComment' },
  );

  return payload.deleteComment?.success === true;
};

export const bulkUpdateAdminCommentStatus = async (input: {
  commentIds: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
}) => {
  const payload = await executeAdminGraphQL<
    AdminBulkCommentMutationPayload,
    {
      input: {
        commentIds: string[];
        status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
      };
    }
  >(
    ADMIN_BULK_UPDATE_COMMENT_STATUS_MUTATION,
    {
      input: {
        commentIds: input.commentIds.map(commentId => commentId.trim()).filter(Boolean),
        status: input.status,
      },
    },
    { operationName: 'AdminBulkUpdateCommentStatus' },
  );

  return payload.bulkUpdateCommentStatus?.successCount ?? 0;
};

export const bulkDeleteAdminComments = async (input: { commentIds: string[] }) => {
  const payload = await executeAdminGraphQL<
    AdminBulkCommentMutationPayload,
    {
      input: {
        commentIds: string[];
      };
    }
  >(
    ADMIN_BULK_DELETE_COMMENTS_MUTATION,
    {
      input: {
        commentIds: input.commentIds.map(commentId => commentId.trim()).filter(Boolean),
      },
    },
    { operationName: 'AdminBulkDeleteComments' },
  );

  return payload.bulkDeleteComments?.successCount ?? 0;
};
