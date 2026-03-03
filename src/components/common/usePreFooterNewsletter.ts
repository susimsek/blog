import { useCallback, useMemo, useState } from 'react';
import {
  resendNewsletterConfirmation as resendNewsletterConfirmationMutation,
  subscribeNewsletter as subscribeNewsletterMutation,
} from '@/lib/newsletterApi';

export type NewsletterErrorStatus = 'invalid-email' | 'rate-limited' | 'unknown-error' | 'unreachable-server';
export type NewsletterClientErrorStatus = 'required' | 'invalid-email';
export type SubscriptionStatus = 'idle' | 'success' | 'resent' | 'error';

const NEWSLETTER_FORM_NAME = 'preFooterNewsletter';
const NEWSLETTER_TAGS = ['preFooterNewsletter'];
const NEWSLETTER_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NEWSLETTER_REQUEST_TIMEOUT_MS = 8000;

const mapNewsletterErrorStatus = (status: string | undefined): NewsletterErrorStatus => {
  switch (status) {
    case 'invalid-email':
      return 'invalid-email';
    case 'rate-limited':
      return 'rate-limited';
    case 'unknown-error':
      return 'unknown-error';
    default:
      return 'unreachable-server';
  }
};

const getNewsletterClientError = (email: string): NewsletterClientErrorStatus | null => {
  const normalized = email.trim();

  if (normalized.length === 0) {
    return 'required';
  }

  if (normalized.length > 254 || !NEWSLETTER_EMAIL_PATTERN.test(normalized)) {
    return 'invalid-email';
  }

  return null;
};

type Translator = (key: string) => string;

export function usePreFooterNewsletter(locale: string, t: Translator) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterHoneypotChecked, setNewsletterHoneypotChecked] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('idle');
  const [newsletterErrorStatus, setNewsletterErrorStatus] = useState<NewsletterErrorStatus | null>(null);
  const [newsletterClientErrorStatus, setNewsletterClientErrorStatus] = useState<NewsletterClientErrorStatus | null>(
    null,
  );
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const [isNewsletterResending, setIsNewsletterResending] = useState(false);
  const [lastNewsletterEmail, setLastNewsletterEmail] = useState('');

  const handleNewsletterEmailChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.currentTarget.value;
      setNewsletterEmail(nextValue);

      if (subscriptionStatus === 'error') {
        setSubscriptionStatus('idle');
        setNewsletterErrorStatus(null);
        setNewsletterClientErrorStatus(null);
      }

      if (subscriptionStatus === 'success' || subscriptionStatus === 'resent') {
        setSubscriptionStatus('idle');
      }
    },
    [subscriptionStatus],
  );

  const submitNewsletter = useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isNewsletterSubmitting || isNewsletterResending) {
        return;
      }

      const clientError = getNewsletterClientError(newsletterEmail);
      if (clientError) {
        setNewsletterClientErrorStatus(clientError);
        setNewsletterErrorStatus(null);
        setSubscriptionStatus('error');
        return;
      }

      const normalizedEmail = newsletterEmail.trim();
      setIsNewsletterSubmitting(true);
      setNewsletterErrorStatus(null);
      setNewsletterClientErrorStatus(null);

      const result = await subscribeNewsletterMutation(
        {
          locale,
          email: normalizedEmail,
          terms: newsletterHoneypotChecked,
          tags: NEWSLETTER_TAGS,
          formName: NEWSLETTER_FORM_NAME,
        },
        { timeoutMs: NEWSLETTER_REQUEST_TIMEOUT_MS },
      );

      if (result?.status === 'success') {
        if (typeof result.forwardTo === 'string' && result.forwardTo.length > 0) {
          setIsNewsletterSubmitting(false);
          globalThis.window.location.href = result.forwardTo;
          return;
        }

        setSubscriptionStatus('success');
        setLastNewsletterEmail(normalizedEmail);
        setNewsletterEmail('');
        setNewsletterHoneypotChecked(false);
        setNewsletterClientErrorStatus(null);
        setIsNewsletterSubmitting(false);
        return;
      }

      setNewsletterErrorStatus(mapNewsletterErrorStatus(result?.status));
      setSubscriptionStatus('error');
      setIsNewsletterSubmitting(false);
    },
    [isNewsletterResending, isNewsletterSubmitting, locale, newsletterEmail, newsletterHoneypotChecked],
  );

  const resendNewsletterConfirmation = useCallback(async () => {
    if (isNewsletterSubmitting || isNewsletterResending) {
      return;
    }

    const emailForResend = lastNewsletterEmail || newsletterEmail.trim();
    const clientError = getNewsletterClientError(emailForResend);
    if (clientError) {
      setNewsletterClientErrorStatus(clientError);
      setNewsletterErrorStatus(null);
      setSubscriptionStatus('error');
      return;
    }

    setIsNewsletterResending(true);
    setNewsletterErrorStatus(null);
    setNewsletterClientErrorStatus(null);
    setSubscriptionStatus('idle');

    const result = await resendNewsletterConfirmationMutation(
      {
        locale,
        email: emailForResend,
        terms: false,
      },
      { timeoutMs: NEWSLETTER_REQUEST_TIMEOUT_MS },
    );

    if (result?.status === 'success') {
      setSubscriptionStatus('resent');
      setLastNewsletterEmail(emailForResend);
      setNewsletterErrorStatus(null);
      setNewsletterClientErrorStatus(null);
      setIsNewsletterResending(false);
      return;
    }

    setNewsletterErrorStatus(mapNewsletterErrorStatus(result?.status));
    setSubscriptionStatus('error');
    setIsNewsletterResending(false);
  }, [isNewsletterResending, isNewsletterSubmitting, lastNewsletterEmail, locale, newsletterEmail]);

  const newsletterFeedbackMessage = useMemo(() => {
    if (newsletterClientErrorStatus === 'required') {
      return t('common.preFooter.newsletter.errors.required');
    }

    if (newsletterClientErrorStatus === 'invalid-email') {
      return t('common.preFooter.newsletter.errors.invalidEmail');
    }

    if (subscriptionStatus === 'success') {
      return t('common.preFooter.newsletter.success');
    }
    if (subscriptionStatus === 'resent') {
      return t('common.preFooter.newsletter.resent');
    }

    if (subscriptionStatus !== 'error' || !newsletterErrorStatus) {
      return null;
    }

    switch (newsletterErrorStatus) {
      case 'invalid-email':
        return t('common.preFooter.newsletter.errors.invalidEmail');
      case 'rate-limited':
        return t('common.preFooter.newsletter.errors.rateLimited');
      default:
        return t('common.preFooter.newsletter.errors.generic');
    }
  }, [newsletterClientErrorStatus, newsletterErrorStatus, subscriptionStatus, t]);

  return {
    hasNewsletterError: newsletterClientErrorStatus !== null || newsletterErrorStatus !== null,
    handleNewsletterEmailChange,
    isNewsletterResending,
    isNewsletterSubmitting,
    lastNewsletterEmail,
    newsletterEmail,
    newsletterFeedbackMessage,
    newsletterHoneypotChecked,
    resendNewsletterConfirmation,
    setNewsletterHoneypotChecked,
    submitNewsletter,
    subscriptionStatus,
  };
}
