import {
  confirmNewsletterSubscription,
  resendNewsletterConfirmation,
  subscribeNewsletter,
  unsubscribeNewsletter,
} from '@/lib/newsletterApi';
import {
  ConfirmNewsletterSubscriptionDocument,
  Locale,
  ResendNewsletterConfirmationDocument,
  SubscribeNewsletterDocument,
  UnsubscribeNewsletterDocument,
} from '@/graphql/generated/graphql';
import { mutateGraphQL } from '@/lib/graphql/apolloClient';

jest.mock('@/lib/graphql/apolloClient', () => ({
  mutateGraphQL: jest.fn(),
}));

const mutateGraphQLMock = mutateGraphQL as jest.Mock;

describe('newsletterApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes subscribe and resend responses', async () => {
    mutateGraphQLMock
      .mockResolvedValueOnce({
        subscribeNewsletter: {
          status: 'success',
          forwardTo: '/thanks',
        },
      })
      .mockResolvedValueOnce({
        resendNewsletterConfirmation: {
          status: 'resent',
          forwardTo: 42,
        },
      });

    await expect(
      subscribeNewsletter({
        email: 'mail@example.com',
        locale: 'en',
        terms: true,
      }),
    ).resolves.toEqual({
      status: 'success',
      forwardTo: '/thanks',
    });

    await expect(
      resendNewsletterConfirmation({
        email: 'mail@example.com',
        locale: 'tr',
        terms: false,
      }),
    ).resolves.toEqual({
      status: 'resent',
    });

    expect(mutateGraphQLMock).toHaveBeenNthCalledWith(
      1,
      SubscribeNewsletterDocument,
      {
        input: {
          email: 'mail@example.com',
          locale: Locale.En,
          terms: true,
        },
      },
      {},
    );
    expect(mutateGraphQLMock).toHaveBeenNthCalledWith(
      2,
      ResendNewsletterConfirmationDocument,
      {
        input: {
          email: 'mail@example.com',
          locale: Locale.Tr,
          terms: false,
        },
      },
      {},
    );
  });

  it('normalizes confirm and unsubscribe responses and handles missing payloads', async () => {
    mutateGraphQLMock
      .mockResolvedValueOnce({
        confirmNewsletterSubscription: {
          status: 'success',
          forwardTo: null,
        },
      })
      .mockResolvedValueOnce({
        unsubscribeNewsletter: {
          forwardTo: '/bye',
        },
      })
      .mockResolvedValueOnce({
        unsubscribeNewsletter: null,
      });

    await expect(confirmNewsletterSubscription('token-1')).resolves.toEqual({
      status: 'success',
    });
    await expect(unsubscribeNewsletter('token-2')).resolves.toEqual({
      forwardTo: '/bye',
    });
    await expect(unsubscribeNewsletter('token-3')).resolves.toBeNull();

    expect(mutateGraphQLMock).toHaveBeenNthCalledWith(
      1,
      ConfirmNewsletterSubscriptionDocument,
      { token: 'token-1' },
      {},
    );
    expect(mutateGraphQLMock).toHaveBeenNthCalledWith(2, UnsubscribeNewsletterDocument, { token: 'token-2' }, {});
  });
});
