'use client';

import { gql } from '@apollo/client/core';
import { executeAdminGraphQL } from './core';
import {
  ADMIN_CONTENT_CATEGORY_FIELDS,
  ADMIN_CONTENT_TOPIC_FIELDS,
  type AdminContentCategoryGroupItem,
  type AdminContentCategoryItem,
  type AdminContentTopicGroupItem,
  type AdminContentTopicItem,
} from './content-shared';

type AdminContentTopicsPayload = {
  contentTopics: AdminContentTopicItem[];
};

type AdminContentCategoriesPayload = {
  contentCategories: AdminContentCategoryItem[];
};

type AdminContentTopicsPagePayload = {
  contentTopicsPage: {
    items: AdminContentTopicGroupItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminContentCategoriesPagePayload = {
  contentCategoriesPage: {
    items: AdminContentCategoryGroupItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminCreateContentTopicPayload = {
  createContentTopic: AdminContentTopicItem;
};

type AdminUpdateContentTopicPayload = {
  updateContentTopic: AdminContentTopicItem;
};

type AdminDeleteContentTopicPayload = {
  deleteContentTopic: {
    success: boolean;
  };
};

type AdminCreateContentCategoryPayload = {
  createContentCategory: AdminContentCategoryItem;
};

type AdminUpdateContentCategoryPayload = {
  updateContentCategory: AdminContentCategoryItem;
};

type AdminDeleteContentCategoryPayload = {
  deleteContentCategory: {
    success: boolean;
  };
};

const ADMIN_CONTENT_TOPICS_QUERY = gql`
  query AdminContentTopicsQuery($locale: Locale, $query: String) {
    contentTopics(locale: $locale, query: $query) {
      ${ADMIN_CONTENT_TOPIC_FIELDS}
    }
  }
`;

const ADMIN_CONTENT_CATEGORIES_QUERY = gql`
  query AdminContentCategoriesQuery($locale: Locale) {
    contentCategories(locale: $locale) {
      ${ADMIN_CONTENT_CATEGORY_FIELDS}
    }
  }
`;

const ADMIN_CONTENT_TOPICS_PAGE_QUERY = gql`
  query AdminContentTopicsPageQuery($filter: AdminContentTaxonomyFilterInput) {
    contentTopicsPage(filter: $filter) {
      items {
        id
        preferred {
          ${ADMIN_CONTENT_TOPIC_FIELDS}
        }
        en {
          ${ADMIN_CONTENT_TOPIC_FIELDS}
        }
        tr {
          ${ADMIN_CONTENT_TOPIC_FIELDS}
        }
      }
      total
      page
      size
    }
  }
`;

const ADMIN_CONTENT_CATEGORIES_PAGE_QUERY = gql`
  query AdminContentCategoriesPageQuery($filter: AdminContentTaxonomyFilterInput) {
    contentCategoriesPage(filter: $filter) {
      items {
        id
        preferred {
          ${ADMIN_CONTENT_CATEGORY_FIELDS}
        }
        en {
          ${ADMIN_CONTENT_CATEGORY_FIELDS}
        }
        tr {
          ${ADMIN_CONTENT_CATEGORY_FIELDS}
        }
      }
      total
      page
      size
    }
  }
`;

const ADMIN_CREATE_CONTENT_TOPIC_MUTATION = gql`
  mutation AdminCreateContentTopicMutation($input: AdminContentTopicInput!) {
    createContentTopic(input: $input) {
      ${ADMIN_CONTENT_TOPIC_FIELDS}
    }
  }
`;

const ADMIN_UPDATE_CONTENT_TOPIC_MUTATION = gql`
  mutation AdminUpdateContentTopicMutation($input: AdminContentTopicInput!) {
    updateContentTopic(input: $input) {
      ${ADMIN_CONTENT_TOPIC_FIELDS}
    }
  }
`;

const ADMIN_DELETE_CONTENT_TOPIC_MUTATION = gql`
  mutation AdminDeleteContentTopicMutation($input: AdminContentEntityKeyInput!) {
    deleteContentTopic(input: $input) {
      success
    }
  }
`;

const ADMIN_CREATE_CONTENT_CATEGORY_MUTATION = gql`
  mutation AdminCreateContentCategoryMutation($input: AdminContentCategoryInput!) {
    createContentCategory(input: $input) {
      ${ADMIN_CONTENT_CATEGORY_FIELDS}
    }
  }
`;

const ADMIN_UPDATE_CONTENT_CATEGORY_MUTATION = gql`
  mutation AdminUpdateContentCategoryMutation($input: AdminContentCategoryInput!) {
    updateContentCategory(input: $input) {
      ${ADMIN_CONTENT_CATEGORY_FIELDS}
    }
  }
`;

const ADMIN_DELETE_CONTENT_CATEGORY_MUTATION = gql`
  mutation AdminDeleteContentCategoryMutation($input: AdminContentEntityKeyInput!) {
    deleteContentCategory(input: $input) {
      success
    }
  }
`;

export const fetchAdminContentTopics = async (locale?: string, query?: string) => {
  const resolvedLocale = locale?.trim().toLowerCase() ?? '';
  const resolvedQuery = query?.trim() ?? '';
  const payload = await executeAdminGraphQL<
    AdminContentTopicsPayload,
    {
      locale?: string;
      query?: string;
    }
  >(
    ADMIN_CONTENT_TOPICS_QUERY,
    {
      ...(resolvedLocale ? { locale: resolvedLocale } : {}),
      ...(resolvedQuery ? { query: resolvedQuery } : {}),
    },
    {
      operationName: 'AdminContentTopics',
    },
  );

  return payload.contentTopics;
};

export const fetchAdminContentCategories = async (locale?: string) => {
  const resolvedLocale = locale?.trim().toLowerCase() ?? '';
  const payload = await executeAdminGraphQL<
    AdminContentCategoriesPayload,
    {
      locale?: string;
    }
  >(
    ADMIN_CONTENT_CATEGORIES_QUERY,
    {
      ...(resolvedLocale ? { locale: resolvedLocale } : {}),
    },
    {
      operationName: 'AdminContentCategories',
    },
  );

  return payload.contentCategories;
};

export const fetchAdminContentTopicsPage = async (params?: {
  locale?: string;
  preferredLocale?: string;
  query?: string;
  page?: number;
  size?: number;
}) => {
  const resolvedLocale = params?.locale?.trim().toLowerCase() ?? '';
  const resolvedPreferredLocale = params?.preferredLocale?.trim().toLowerCase() ?? '';
  const resolvedQuery = params?.query?.trim() ?? '';
  const resolvedPage = Number.isFinite(params?.page) ? (params?.page as number) : undefined;
  const resolvedSize = Number.isFinite(params?.size) ? (params?.size as number) : undefined;

  const payload = await executeAdminGraphQL<
    AdminContentTopicsPagePayload,
    {
      filter?: {
        locale?: string;
        preferredLocale?: string;
        query?: string;
        page?: number;
        size?: number;
      };
    }
  >(
    ADMIN_CONTENT_TOPICS_PAGE_QUERY,
    {
      filter: {
        ...(resolvedLocale ? { locale: resolvedLocale } : {}),
        ...(resolvedPreferredLocale ? { preferredLocale: resolvedPreferredLocale } : {}),
        ...(resolvedQuery ? { query: resolvedQuery } : {}),
        ...(resolvedPage ? { page: resolvedPage } : {}),
        ...(resolvedSize ? { size: resolvedSize } : {}),
      },
    },
    {
      operationName: 'AdminContentTopicsPage',
    },
  );

  return payload.contentTopicsPage;
};

export const fetchAdminContentCategoriesPage = async (params?: {
  locale?: string;
  preferredLocale?: string;
  query?: string;
  page?: number;
  size?: number;
}) => {
  const resolvedLocale = params?.locale?.trim().toLowerCase() ?? '';
  const resolvedPreferredLocale = params?.preferredLocale?.trim().toLowerCase() ?? '';
  const resolvedQuery = params?.query?.trim() ?? '';
  const resolvedPage = Number.isFinite(params?.page) ? (params?.page as number) : undefined;
  const resolvedSize = Number.isFinite(params?.size) ? (params?.size as number) : undefined;

  const payload = await executeAdminGraphQL<
    AdminContentCategoriesPagePayload,
    {
      filter?: {
        locale?: string;
        preferredLocale?: string;
        query?: string;
        page?: number;
        size?: number;
      };
    }
  >(
    ADMIN_CONTENT_CATEGORIES_PAGE_QUERY,
    {
      filter: {
        ...(resolvedLocale ? { locale: resolvedLocale } : {}),
        ...(resolvedPreferredLocale ? { preferredLocale: resolvedPreferredLocale } : {}),
        ...(resolvedQuery ? { query: resolvedQuery } : {}),
        ...(resolvedPage ? { page: resolvedPage } : {}),
        ...(resolvedSize ? { size: resolvedSize } : {}),
      },
    },
    {
      operationName: 'AdminContentCategoriesPage',
    },
  );

  return payload.contentCategoriesPage;
};

export const createAdminContentTopic = async (input: {
  locale: string;
  id: string;
  name: string;
  color: string;
  link?: string | null;
}) => {
  const payload = await executeAdminGraphQL<
    AdminCreateContentTopicPayload,
    {
      input: {
        locale: string;
        id: string;
        name: string;
        color: string;
        link?: string;
      };
    }
  >(
    ADMIN_CREATE_CONTENT_TOPIC_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
        name: input.name.trim(),
        color: input.color.trim().toLowerCase(),
        ...(input.link?.trim() ? { link: input.link.trim() } : {}),
      },
    },
    {
      operationName: 'AdminCreateContentTopic',
    },
  );

  return payload.createContentTopic;
};

export const updateAdminContentTopic = async (input: {
  locale: string;
  id: string;
  name: string;
  color: string;
  link?: string | null;
}) => {
  const payload = await executeAdminGraphQL<
    AdminUpdateContentTopicPayload,
    {
      input: {
        locale: string;
        id: string;
        name: string;
        color: string;
        link?: string;
      };
    }
  >(
    ADMIN_UPDATE_CONTENT_TOPIC_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
        name: input.name.trim(),
        color: input.color.trim().toLowerCase(),
        ...(input.link?.trim() ? { link: input.link.trim() } : {}),
      },
    },
    {
      operationName: 'AdminUpdateContentTopic',
    },
  );

  return payload.updateContentTopic;
};

export const deleteAdminContentTopic = async (input: { locale: string; id: string }) => {
  const payload = await executeAdminGraphQL<
    AdminDeleteContentTopicPayload,
    {
      input: {
        locale: string;
        id: string;
      };
    }
  >(
    ADMIN_DELETE_CONTENT_TOPIC_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
      },
    },
    {
      operationName: 'AdminDeleteContentTopic',
    },
  );

  return payload.deleteContentTopic?.success === true;
};

export const createAdminContentCategory = async (input: {
  locale: string;
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  link?: string | null;
}) => {
  const payload = await executeAdminGraphQL<
    AdminCreateContentCategoryPayload,
    {
      input: {
        locale: string;
        id: string;
        name: string;
        color: string;
        icon?: string;
        link?: string;
      };
    }
  >(
    ADMIN_CREATE_CONTENT_CATEGORY_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
        name: input.name.trim(),
        color: input.color.trim().toLowerCase(),
        ...(input.icon?.trim() ? { icon: input.icon.trim() } : {}),
        ...(input.link?.trim() ? { link: input.link.trim() } : {}),
      },
    },
    {
      operationName: 'AdminCreateContentCategory',
    },
  );

  return payload.createContentCategory;
};

export const updateAdminContentCategory = async (input: {
  locale: string;
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  link?: string | null;
}) => {
  const payload = await executeAdminGraphQL<
    AdminUpdateContentCategoryPayload,
    {
      input: {
        locale: string;
        id: string;
        name: string;
        color: string;
        icon?: string;
        link?: string;
      };
    }
  >(
    ADMIN_UPDATE_CONTENT_CATEGORY_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
        name: input.name.trim(),
        color: input.color.trim().toLowerCase(),
        ...(input.icon?.trim() ? { icon: input.icon.trim() } : {}),
        ...(input.link?.trim() ? { link: input.link.trim() } : {}),
      },
    },
    {
      operationName: 'AdminUpdateContentCategory',
    },
  );

  return payload.updateContentCategory;
};

export const deleteAdminContentCategory = async (input: { locale: string; id: string }) => {
  const payload = await executeAdminGraphQL<
    AdminDeleteContentCategoryPayload,
    {
      input: {
        locale: string;
        id: string;
      };
    }
  >(
    ADMIN_DELETE_CONTENT_CATEGORY_MUTATION,
    {
      input: {
        locale: input.locale.trim().toLowerCase(),
        id: input.id.trim().toLowerCase(),
      },
    },
    {
      operationName: 'AdminDeleteContentCategory',
    },
  );

  return payload.deleteContentCategory?.success === true;
};
