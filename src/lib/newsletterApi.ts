import {
  ConfirmNewsletterSubscriptionDocument,
  ResendNewsletterConfirmationDocument,
  SubscribeNewsletterDocument,
  UnsubscribeNewsletterDocument,
  type NewsletterResendInput,
  type NewsletterSubscribeInput,
} from '@/graphql/generated/graphql';
import { mutateGraphQL } from '@/lib/graphql/apolloClient';

type NewsletterApiOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type NewsletterMutationResponse = {
  status?: string;
  forwardTo?: string | null;
};

const normalizeNewsletterResult = (
  payload: NewsletterMutationResponse | null | undefined,
): NewsletterMutationResponse | null => {
  if (!payload) {
    return null;
  }

  return {
    ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
    ...(typeof payload.forwardTo === 'string' ? { forwardTo: payload.forwardTo } : {}),
  };
};

export const subscribeNewsletter = async (
  input: NewsletterSubscribeInput,
  options: NewsletterApiOptions = {},
): Promise<NewsletterMutationResponse | null> => {
  const payload = await mutateGraphQL(
    SubscribeNewsletterDocument,
    {
      input,
    },
    options,
  );
  return normalizeNewsletterResult(payload?.subscribeNewsletter);
};

export const resendNewsletterConfirmation = async (
  input: NewsletterResendInput,
  options: NewsletterApiOptions = {},
): Promise<NewsletterMutationResponse | null> => {
  const payload = await mutateGraphQL(
    ResendNewsletterConfirmationDocument,
    {
      input,
    },
    options,
  );
  return normalizeNewsletterResult(payload?.resendNewsletterConfirmation);
};

export const confirmNewsletterSubscription = async (
  token: string,
  options: NewsletterApiOptions = {},
): Promise<NewsletterMutationResponse | null> => {
  const payload = await mutateGraphQL(
    ConfirmNewsletterSubscriptionDocument,
    {
      token,
    },
    options,
  );
  return normalizeNewsletterResult(payload?.confirmNewsletterSubscription);
};

export const unsubscribeNewsletter = async (
  token: string,
  options: NewsletterApiOptions = {},
): Promise<NewsletterMutationResponse | null> => {
  const payload = await mutateGraphQL(
    UnsubscribeNewsletterDocument,
    {
      token,
    },
    options,
  );
  return normalizeNewsletterResult(payload?.unsubscribeNewsletter);
};
