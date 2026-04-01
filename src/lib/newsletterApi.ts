import {
  ConfirmNewsletterSubscriptionMutationDocument,
  NewsletterMutationStatus,
  ResendNewsletterConfirmationMutationDocument,
  SubscribeNewsletterMutationDocument,
  UnsubscribeNewsletterMutationDocument,
  type NewsletterResendInput as GraphQLNewsletterResendInput,
  type NewsletterSubscribeInput as GraphQLNewsletterSubscribeInput,
} from '@/graphql/generated/graphql';
import { mutateGraphQL } from '@/lib/graphql/apolloClient';
import { fromNewsletterMutationStatus, toGraphQLLocale } from '@/lib/graphql/enumMappers';

type NewsletterApiOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

type NewsletterSubscribeInput = Omit<GraphQLNewsletterSubscribeInput, 'locale'> & {
  locale: string;
};

type NewsletterResendInput = Omit<GraphQLNewsletterResendInput, 'locale'> & {
  locale: string;
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
    ...(fromNewsletterMutationStatus((payload as { status?: NewsletterMutationStatus }).status)
      ? { status: fromNewsletterMutationStatus((payload as { status?: NewsletterMutationStatus }).status) }
      : {}),
    ...(typeof payload.forwardTo === 'string' ? { forwardTo: payload.forwardTo } : {}),
  };
};

export const subscribeNewsletter = async (
  input: NewsletterSubscribeInput,
  options: NewsletterApiOptions = {},
): Promise<NewsletterMutationResponse | null> => {
  const locale = toGraphQLLocale(input.locale);
  if (!locale) {
    return null;
  }

  const payload = await mutateGraphQL(
    SubscribeNewsletterMutationDocument,
    {
      input: {
        ...input,
        locale,
      },
    },
    options,
  );
  return normalizeNewsletterResult(payload?.subscribeNewsletter);
};

export const resendNewsletterConfirmation = async (
  input: NewsletterResendInput,
  options: NewsletterApiOptions = {},
): Promise<NewsletterMutationResponse | null> => {
  const locale = toGraphQLLocale(input.locale);
  if (!locale) {
    return null;
  }

  const payload = await mutateGraphQL(
    ResendNewsletterConfirmationMutationDocument,
    {
      input: {
        ...input,
        locale,
      },
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
    ConfirmNewsletterSubscriptionMutationDocument,
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
    UnsubscribeNewsletterMutationDocument,
    {
      token,
    },
    options,
  );
  return normalizeNewsletterResult(payload?.unsubscribeNewsletter);
};
