'use client';

import { gql } from '@apollo/client/core';
import { executeAdminGraphQL } from './core';
import { ADMIN_MEDIA_LIBRARY_FIELDS, type AdminMediaLibraryItem, type AdminMediaLibrarySort } from './content-shared';

type AdminMediaLibraryPayload = {
  mediaLibrary: {
    items: AdminMediaLibraryItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminUploadMediaAssetPayload = {
  uploadMediaAsset: AdminMediaLibraryItem;
};

type AdminDeleteMediaAssetPayload = {
  deleteMediaAsset: {
    success: boolean;
  };
};

const ADMIN_MEDIA_LIBRARY_QUERY = gql`
  query AdminMediaLibraryQuery($filter: AdminMediaLibraryFilterInput) {
    mediaLibrary(filter: $filter) {
      items {
        ${ADMIN_MEDIA_LIBRARY_FIELDS}
      }
      total
      page
      size
    }
  }
`;

const ADMIN_UPLOAD_MEDIA_ASSET_MUTATION = gql`
  mutation AdminUploadMediaAssetMutation($input: AdminUploadMediaAssetInput!) {
    uploadMediaAsset(input: $input) {
      ${ADMIN_MEDIA_LIBRARY_FIELDS}
    }
  }
`;

const ADMIN_DELETE_MEDIA_ASSET_MUTATION = gql`
  mutation AdminDeleteMediaAssetMutation($id: ID!) {
    deleteMediaAsset(id: $id) {
      success
    }
  }
`;

export const fetchAdminMediaLibrary = async (params?: {
  query?: string;
  kind?: AdminMediaLibraryItem['kind'] | 'ALL';
  sort?: AdminMediaLibrarySort;
  page?: number;
  size?: number;
}) => {
  const resolvedQuery = params?.query?.trim() ?? '';
  const resolvedKind = params?.kind?.trim().toUpperCase() ?? '';
  const resolvedSort = params?.sort?.trim().toUpperCase() ?? '';
  const resolvedPage =
    params?.page && Number.isFinite(params.page) && params.page > 0 ? Math.trunc(params.page) : undefined;
  const resolvedSize =
    params?.size && Number.isFinite(params.size) && params.size > 0 ? Math.trunc(params.size) : undefined;

  const payload = await executeAdminGraphQL<
    AdminMediaLibraryPayload,
    {
      filter?: {
        query?: string;
        kind?: string;
        sort?: string;
        page?: number;
        size?: number;
      };
    }
  >(
    ADMIN_MEDIA_LIBRARY_QUERY,
    {
      filter: {
        ...(resolvedQuery ? { query: resolvedQuery } : {}),
        ...(resolvedKind && resolvedKind !== 'ALL' ? { kind: resolvedKind } : {}),
        ...(resolvedSort && resolvedSort !== 'RECENT' ? { sort: resolvedSort } : {}),
        ...(resolvedPage ? { page: resolvedPage } : {}),
        ...(resolvedSize ? { size: resolvedSize } : {}),
      },
    },
    {
      operationName: 'AdminMediaLibrary',
    },
  );

  return payload.mediaLibrary;
};

export const uploadAdminMediaAsset = async (input: { fileName: string; dataUrl: string }) => {
  const payload = await executeAdminGraphQL<
    AdminUploadMediaAssetPayload,
    {
      input: {
        fileName: string;
        dataUrl: string;
      };
    }
  >(
    ADMIN_UPLOAD_MEDIA_ASSET_MUTATION,
    {
      input: {
        fileName: input.fileName.trim(),
        dataUrl: input.dataUrl.trim(),
      },
    },
    {
      operationName: 'AdminUploadMediaAsset',
    },
  );

  return payload.uploadMediaAsset;
};

export const deleteAdminMediaAsset = async (id: string) => {
  const payload = await executeAdminGraphQL<
    AdminDeleteMediaAssetPayload,
    {
      id: string;
    }
  >(
    ADMIN_DELETE_MEDIA_ASSET_MUTATION,
    {
      id: id.trim(),
    },
    {
      operationName: 'AdminDeleteMediaAsset',
    },
  );

  return payload.deleteMediaAsset?.success === true;
};
