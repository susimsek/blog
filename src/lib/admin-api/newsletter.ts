'use client';

import { gql } from '@apollo/client/core';
import { executeAdminGraphQL } from './core';

type AdminNewsletterSubscriberFilterStatus = 'pending' | 'active' | 'unsubscribed';
type AdminNewsletterSubscriberStatus = 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';

type AdminNewsletterSubscribersFilter = {
  locale?: string;
  status?: AdminNewsletterSubscriberFilterStatus;
  query?: string;
  page?: number;
  size?: number;
};

type AdminNewsletterSubscribersQueryVariables = {
  filter?: {
    locale?: string;
    status?: AdminNewsletterSubscriberStatus;
    query?: string;
    page?: number;
    size?: number;
  };
};

export type AdminNewsletterSubscriberItem = {
  email: string;
  locale: string;
  status: 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';
  tags: string[];
  formName: string | null;
  source: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
};

export type AdminNewsletterCampaignItem = {
  locale: string;
  itemKey: string;
  title: string;
  summary: string | null;
  link: string | null;
  pubDate: string | null;
  rssUrl: string | null;
  status: string;
  sentCount: number;
  failedCount: number;
  lastRunAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
};

export type AdminNewsletterDeliveryFailureItem = {
  locale: string;
  itemKey: string;
  email: string;
  status: string;
  lastError: string | null;
  lastAttemptAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
};

export type AdminNewsletterDispatchLocaleResult = {
  locale: string;
  rssUrl: string | null;
  itemKey: string | null;
  postTitle: string | null;
  sentCount: number;
  failedCount: number;
  skipped: boolean;
  reason: string | null;
};

export type AdminNewsletterTestSendResult = {
  success: boolean;
  message: string;
  timestamp: string;
  email: string;
  locale: string;
  itemKey: string;
  postTitle: string | null;
};

type AdminNewsletterSubscribersPayload = {
  newsletterSubscribers: {
    items: AdminNewsletterSubscriberItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminNewsletterCampaignsPayload = {
  newsletterCampaigns: {
    items: AdminNewsletterCampaignItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminNewsletterCampaignFailuresPayload = {
  newsletterCampaignFailures: {
    items: AdminNewsletterDeliveryFailureItem[];
    total: number;
    page: number;
    size: number;
  };
};

type AdminTriggerNewsletterDispatchPayload = {
  triggerNewsletterDispatch: {
    success: boolean;
    message: string;
    timestamp: string;
    results: AdminNewsletterDispatchLocaleResult[];
  };
};

type AdminSendTestNewsletterPayload = {
  sendTestNewsletter: AdminNewsletterTestSendResult;
};

type AdminUpdateNewsletterSubscriberStatusPayload = {
  updateNewsletterSubscriberStatus: AdminNewsletterSubscriberItem;
};

type AdminDeleteNewsletterSubscriberPayload = {
  deleteNewsletterSubscriber: {
    success: boolean;
  };
};

const ADMIN_NEWSLETTER_SUBSCRIBERS_QUERY = gql`
  query AdminNewsletterSubscribersQuery($filter: AdminNewsletterSubscriberFilterInput) {
    newsletterSubscribers(filter: $filter) {
      items {
        email
        locale
        status
        tags
        formName
        source
        updatedAt
        createdAt
        confirmedAt
        unsubscribedAt
      }
      total
      page
      size
    }
  }
`;

const ADMIN_NEWSLETTER_CAMPAIGNS_QUERY = gql`
  query AdminNewsletterCampaignsQuery($filter: AdminNewsletterCampaignFilterInput) {
    newsletterCampaigns(filter: $filter) {
      items {
        locale
        itemKey
        title
        summary
        link
        pubDate
        rssUrl
        status
        sentCount
        failedCount
        lastRunAt
        updatedAt
        createdAt
      }
      total
      page
      size
    }
  }
`;

const ADMIN_NEWSLETTER_CAMPAIGN_FAILURES_QUERY = gql`
  query AdminNewsletterCampaignFailuresQuery($filter: AdminNewsletterDeliveryFailureFilterInput!) {
    newsletterCampaignFailures(filter: $filter) {
      items {
        locale
        itemKey
        email
        status
        lastError
        lastAttemptAt
        updatedAt
        createdAt
      }
      total
      page
      size
    }
  }
`;

const ADMIN_TRIGGER_NEWSLETTER_DISPATCH_MUTATION = gql`
  mutation AdminTriggerNewsletterDispatchMutation {
    triggerNewsletterDispatch {
      success
      message
      timestamp
      results {
        locale
        rssUrl
        itemKey
        postTitle
        sentCount
        failedCount
        skipped
        reason
      }
    }
  }
`;

const ADMIN_SEND_TEST_NEWSLETTER_MUTATION = gql`
  mutation AdminSendTestNewsletterMutation($input: AdminSendTestNewsletterInput!) {
    sendTestNewsletter(input: $input) {
      success
      message
      timestamp
      email
      locale
      itemKey
      postTitle
    }
  }
`;

const ADMIN_UPDATE_NEWSLETTER_SUBSCRIBER_STATUS_MUTATION = gql`
  mutation AdminUpdateNewsletterSubscriberStatusMutation($input: AdminUpdateNewsletterSubscriberStatusInput!) {
    updateNewsletterSubscriberStatus(input: $input) {
      email
      locale
      status
      tags
      formName
      source
      updatedAt
      createdAt
      confirmedAt
      unsubscribedAt
    }
  }
`;

const ADMIN_DELETE_NEWSLETTER_SUBSCRIBER_MUTATION = gql`
  mutation AdminDeleteNewsletterSubscriberMutation($input: AdminDeleteNewsletterSubscriberInput!) {
    deleteNewsletterSubscriber(input: $input) {
      success
    }
  }
`;

const resolveAdminNewsletterSubscriberStatus = (status: string): AdminNewsletterSubscriberStatus | undefined => {
  if (status === 'active') {
    return 'ACTIVE';
  }
  if (status === 'unsubscribed') {
    return 'UNSUBSCRIBED';
  }
  if (status === 'pending') {
    return 'PENDING';
  }

  return undefined;
};

export const fetchAdminNewsletterSubscribers = async (filter?: AdminNewsletterSubscribersFilter) => {
  const resolvedLocale = filter?.locale?.trim().toLowerCase() ?? '';
  const resolvedStatus = filter?.status?.trim().toLowerCase() ?? '';
  const resolvedQuery = filter?.query?.trim() ?? '';
  const resolvedPage = filter?.page && Number.isFinite(filter.page) && filter.page > 0 ? Math.trunc(filter.page) : 1;
  const resolvedSize =
    filter?.size && Number.isFinite(filter.size) && filter.size > 0 ? Math.trunc(filter.size) : undefined;

  const statusEnum = resolveAdminNewsletterSubscriberStatus(resolvedStatus);

  const payload = await executeAdminGraphQL<
    AdminNewsletterSubscribersPayload,
    AdminNewsletterSubscribersQueryVariables
  >(
    ADMIN_NEWSLETTER_SUBSCRIBERS_QUERY,
    {
      filter: {
        ...(resolvedLocale ? { locale: resolvedLocale } : {}),
        ...(statusEnum ? { status: statusEnum } : {}),
        ...(resolvedQuery ? { query: resolvedQuery } : {}),
        ...(resolvedPage ? { page: resolvedPage } : {}),
        ...(resolvedSize ? { size: resolvedSize } : {}),
      },
    },
    {
      operationName: 'AdminNewsletterSubscribers',
    },
  );

  return payload.newsletterSubscribers;
};

export const fetchAdminNewsletterCampaigns = async (filter?: {
  locale?: string;
  status?: string;
  query?: string;
  page?: number;
  size?: number;
}) => {
  const resolvedLocale = filter?.locale?.trim().toLowerCase() ?? '';
  const resolvedStatus = filter?.status?.trim().toLowerCase() ?? '';
  const resolvedQuery = filter?.query?.trim() ?? '';
  const resolvedPage = filter?.page && Number.isFinite(filter.page) && filter.page > 0 ? Math.trunc(filter.page) : 1;
  const resolvedSize =
    filter?.size && Number.isFinite(filter.size) && filter.size > 0 ? Math.trunc(filter.size) : undefined;

  const payload = await executeAdminGraphQL<
    AdminNewsletterCampaignsPayload,
    {
      filter?: {
        locale?: string;
        status?: string;
        query?: string;
        page?: number;
        size?: number;
      };
    }
  >(
    ADMIN_NEWSLETTER_CAMPAIGNS_QUERY,
    {
      filter: {
        ...(resolvedLocale ? { locale: resolvedLocale } : {}),
        ...(resolvedStatus ? { status: resolvedStatus } : {}),
        ...(resolvedQuery ? { query: resolvedQuery } : {}),
        ...(resolvedPage ? { page: resolvedPage } : {}),
        ...(resolvedSize ? { size: resolvedSize } : {}),
      },
    },
    {
      operationName: 'AdminNewsletterCampaigns',
    },
  );

  return payload.newsletterCampaigns;
};

export const fetchAdminNewsletterCampaignFailures = async (filter: {
  locale: string;
  itemKey: string;
  page?: number;
  size?: number;
}) => {
  const payload = await executeAdminGraphQL<
    AdminNewsletterCampaignFailuresPayload,
    {
      filter: {
        locale: string;
        itemKey: string;
        page?: number;
        size?: number;
      };
    }
  >(
    ADMIN_NEWSLETTER_CAMPAIGN_FAILURES_QUERY,
    {
      filter: {
        locale: filter.locale.trim().toLowerCase(),
        itemKey: filter.itemKey.trim(),
        ...(filter.page && Number.isFinite(filter.page) && filter.page > 0 ? { page: Math.trunc(filter.page) } : {}),
        ...(filter.size && Number.isFinite(filter.size) && filter.size > 0 ? { size: Math.trunc(filter.size) } : {}),
      },
    },
    {
      operationName: 'AdminNewsletterCampaignFailures',
    },
  );

  return payload.newsletterCampaignFailures;
};

export const triggerAdminNewsletterDispatch = async () => {
  const payload = await executeAdminGraphQL<AdminTriggerNewsletterDispatchPayload, Record<string, never>>(
    ADMIN_TRIGGER_NEWSLETTER_DISPATCH_MUTATION,
    {},
    {
      operationName: 'AdminTriggerNewsletterDispatch',
    },
  );

  return payload.triggerNewsletterDispatch;
};

export const sendAdminNewsletterTestEmail = async (input: { email: string; locale: string; itemKey: string }) => {
  const payload = await executeAdminGraphQL<
    AdminSendTestNewsletterPayload,
    {
      input: {
        email: string;
        locale: string;
        itemKey: string;
      };
    }
  >(
    ADMIN_SEND_TEST_NEWSLETTER_MUTATION,
    {
      input: {
        email: input.email.trim().toLowerCase(),
        locale: input.locale.trim().toLowerCase(),
        itemKey: input.itemKey.trim(),
      },
    },
    {
      operationName: 'AdminSendTestNewsletter',
    },
  );

  return payload.sendTestNewsletter;
};

export const updateAdminNewsletterSubscriberStatus = async (input: {
  email: string;
  status: 'active' | 'unsubscribed';
}) => {
  const status = input.status.trim().toLowerCase() === 'active' ? 'ACTIVE' : 'UNSUBSCRIBED';

  const payload = await executeAdminGraphQL<
    AdminUpdateNewsletterSubscriberStatusPayload,
    {
      input: {
        email: string;
        status: 'ACTIVE' | 'UNSUBSCRIBED';
      };
    }
  >(
    ADMIN_UPDATE_NEWSLETTER_SUBSCRIBER_STATUS_MUTATION,
    {
      input: {
        email: input.email.trim().toLowerCase(),
        status,
      },
    },
    {
      operationName: 'AdminUpdateNewsletterSubscriberStatus',
    },
  );

  return payload.updateNewsletterSubscriberStatus;
};

export const deleteAdminNewsletterSubscriber = async (input: { email: string }) => {
  const payload = await executeAdminGraphQL<
    AdminDeleteNewsletterSubscriberPayload,
    {
      input: {
        email: string;
      };
    }
  >(
    ADMIN_DELETE_NEWSLETTER_SUBSCRIBER_MUTATION,
    {
      input: {
        email: input.email.trim().toLowerCase(),
      },
    },
    {
      operationName: 'AdminDeleteNewsletterSubscriber',
    },
  );

  return payload.deleteNewsletterSubscriber?.success === true;
};
