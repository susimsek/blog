import {
  deleteAdminNewsletterSubscriber,
  fetchAdminNewsletterCampaignFailures,
  fetchAdminNewsletterCampaigns,
  fetchAdminNewsletterSubscribers,
  sendAdminNewsletterTestEmail,
  triggerAdminNewsletterDispatch,
  updateAdminNewsletterSubscriberStatus,
} from '@/lib/admin-api/newsletter';
import { executeAdminGraphQL } from '@/lib/admin-api/core';

jest.mock('@/lib/admin-api/core', () => ({ executeAdminGraphQL: jest.fn() }));

const respondWith = (value: unknown) => jest.mocked(executeAdminGraphQL).mockResolvedValueOnce(value as never);

describe('admin newsletter API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('normalizes subscriber filters and maps supported statuses', async () => {
    const result = { items: [], total: 0, page: 2, size: 10 };

    for (const [status, expectedStatus] of [
      ['active', 'ACTIVE'],
      ['pending', 'PENDING'],
      ['unsubscribed', 'UNSUBSCRIBED'],
    ] as const) {
      respondWith({ newsletterSubscribers: result });
      await expect(
        fetchAdminNewsletterSubscribers({
          locale: ' EN ',
          status,
          query: ' reader@example.com ',
          page: 2.8,
          size: 10.9,
        }),
      ).resolves.toBe(result);
      expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
        expect.anything(),
        {
          filter: {
            locale: 'en',
            status: expectedStatus,
            query: 'reader@example.com',
            page: 2,
            size: 10,
          },
        },
        expect.objectContaining({ operationName: 'AdminNewsletterSubscribers' }),
      );
    }

    respondWith({ newsletterSubscribers: result });
    await fetchAdminNewsletterSubscribers({
      locale: ' ',
      status: 'unknown' as never,
      query: ' ',
      page: -2,
      size: Number.NaN,
    });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: { page: 1 } },
      expect.objectContaining({ operationName: 'AdminNewsletterSubscribers' }),
    );
  });

  it('normalizes campaign filters and defaults the page', async () => {
    const result = { items: [], total: 0, page: 1, size: 20 };
    respondWith({ newsletterCampaigns: result });

    await expect(
      fetchAdminNewsletterCampaigns({ locale: ' TR ', status: ' SENT ', query: ' captain ', page: 3, size: 15 }),
    ).resolves.toBe(result);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: { locale: 'tr', status: 'sent', query: 'captain', page: 3, size: 15 } },
      expect.objectContaining({ operationName: 'AdminNewsletterCampaigns' }),
    );

    respondWith({ newsletterCampaigns: result });
    await fetchAdminNewsletterCampaigns({ locale: ' ', status: ' ', query: ' ', page: 0, size: -1 });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: { page: 1 } },
      expect.objectContaining({ operationName: 'AdminNewsletterCampaigns' }),
    );
  });

  it('normalizes campaign failure filters and omits invalid pagination', async () => {
    const result = { items: [], total: 0, page: 1, size: 20 };
    respondWith({ newsletterCampaignFailures: result });

    await expect(
      fetchAdminNewsletterCampaignFailures({ locale: ' EN ', itemKey: ' captain-post ', page: 2.7, size: 8.9 }),
    ).resolves.toBe(result);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: { locale: 'en', itemKey: 'captain-post', page: 2, size: 8 } },
      expect.objectContaining({ operationName: 'AdminNewsletterCampaignFailures' }),
    );

    respondWith({ newsletterCampaignFailures: result });
    await fetchAdminNewsletterCampaignFailures({
      locale: 'TR',
      itemKey: 'key',
      page: 0,
      size: Number.POSITIVE_INFINITY,
    });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: { locale: 'tr', itemKey: 'key' } },
      expect.objectContaining({ operationName: 'AdminNewsletterCampaignFailures' }),
    );
  });

  it('triggers dispatch and normalizes test email inputs', async () => {
    const dispatch = { success: true, message: 'sent', timestamp: 'now', results: [] };
    respondWith({ triggerNewsletterDispatch: dispatch });
    await expect(triggerAdminNewsletterDispatch()).resolves.toBe(dispatch);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      {},
      expect.objectContaining({ operationName: 'AdminTriggerNewsletterDispatch' }),
    );

    const testSend = {
      success: true,
      message: 'sent',
      timestamp: 'now',
      email: 'a@b.com',
      locale: 'en',
      itemKey: 'post',
      postTitle: null,
    };
    respondWith({ sendTestNewsletter: testSend });
    await expect(
      sendAdminNewsletterTestEmail({ email: ' Reader@Example.com ', locale: ' EN ', itemKey: ' post ' }),
    ).resolves.toBe(testSend);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { email: 'reader@example.com', locale: 'en', itemKey: 'post' } },
      expect.objectContaining({ operationName: 'AdminSendTestNewsletter' }),
    );
  });

  it('updates and deletes subscribers with normalized input and status', async () => {
    const subscriber = { email: 'reader@example.com', locale: 'en', status: 'ACTIVE', tags: [] };
    respondWith({ updateNewsletterSubscriberStatus: subscriber });
    await expect(
      updateAdminNewsletterSubscriberStatus({ email: ' Reader@Example.com ', status: 'active' }),
    ).resolves.toBe(subscriber);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { email: 'reader@example.com', status: 'ACTIVE' } },
      expect.objectContaining({ operationName: 'AdminUpdateNewsletterSubscriberStatus' }),
    );

    respondWith({ updateNewsletterSubscriberStatus: subscriber });
    await updateAdminNewsletterSubscriberStatus({ email: 'reader@example.com', status: 'unsubscribed' });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { email: 'reader@example.com', status: 'UNSUBSCRIBED' } },
      expect.objectContaining({ operationName: 'AdminUpdateNewsletterSubscriberStatus' }),
    );

    respondWith({ deleteNewsletterSubscriber: { success: true } });
    await expect(deleteAdminNewsletterSubscriber({ email: ' Reader@Example.com ' })).resolves.toBe(true);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { email: 'reader@example.com' } },
      expect.objectContaining({ operationName: 'AdminDeleteNewsletterSubscriber' }),
    );

    respondWith({ deleteNewsletterSubscriber: { success: false } });
    await expect(deleteAdminNewsletterSubscriber({ email: 'reader@example.com' })).resolves.toBe(false);
    respondWith({});
    await expect(deleteAdminNewsletterSubscriber({ email: 'reader@example.com' })).resolves.toBe(false);
  });
});
