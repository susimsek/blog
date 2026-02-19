import React, { useCallback, useMemo, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import i18nextConfig from '@/i18n/settings';
import type { LayoutPostSummary, Topic } from '@/types/posts';
import Link from '@/components/common/Link';
import { CONTACT_LINKS } from '@/config/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import useBoop from '@/hooks/useBoop';
import { withBasePath } from '@/lib/basePath';

interface PreFooterProps {
  posts?: LayoutPostSummary[];
  topics?: Topic[];
  topTopics?: Topic[];
}

interface PreFooterSocialLinkProps {
  href: string;
  icon: IconProp;
  label: string;
  mailto?: boolean;
  external?: boolean;
  boop?: {
    y?: number;
    rotation?: number;
    scale?: number;
    timing?: number;
  };
}

type NewsletterStatus = 'idle' | 'success' | 'resent' | 'error';
type NewsletterErrorStatus = 'invalid-email' | 'rate-limited' | 'unknown-error' | 'unreachable-server';
type NewsletterClientErrorStatus = 'required' | 'invalid-email';

type NewsletterApiResponse = {
  status?: string;
  forwardTo?: string;
};

const NEWSLETTER_FORM_NAME = 'preFooterNewsletter';
const NEWSLETTER_TAGS = ['preFooterNewsletter'];
const NEWSLETTER_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NEWSLETTER_REQUEST_TIMEOUT_MS = 8000;

const normalizeApiBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/g, '') ?? '';

const getNewsletterEndpoints = (apiPath: string) => {
  const prefixedEndpoint = withBasePath(apiPath);
  const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  const endpoints = new Set<string>();

  if (apiBaseUrl) {
    endpoints.add(`${apiBaseUrl}${apiPath}`);
    endpoints.add(`${apiBaseUrl}${prefixedEndpoint}`);
  }

  endpoints.add(prefixedEndpoint);
  endpoints.add(apiPath);
  return [...endpoints];
};

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

function PreFooterSocialLink({
  href,
  icon,
  label,
  mailto = false,
  external = true,
  boop = { y: -2, rotation: 8, scale: 1.08, timing: 170 },
}: Readonly<PreFooterSocialLinkProps>) {
  const [iconStyle, triggerIconBoop] = useBoop(boop);

  return (
    <a
      href={mailto ? `mailto:${href}` : href}
      target={mailto || !external ? undefined : '_blank'}
      rel={mailto || !external ? undefined : 'noopener noreferrer'}
      className="text-decoration-none pre-footer-social-link nav-icon-boop"
      aria-label={label}
      onMouseEnter={triggerIconBoop}
      onFocus={triggerIconBoop}
    >
      <FontAwesomeIcon icon={icon} className="icon-boop-target pre-footer-social-icon" style={iconStyle} />
    </a>
  );
}

const getTopTopics = (posts: LayoutPostSummary[], topics: Topic[], limit: number) => {
  const topicById = new Map(topics.map(topic => [topic.id, topic]));
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const topic of post.topics ?? []) {
      if (!topic?.id) continue;
      counts.set(topic.id, (counts.get(topic.id) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([id, count]) => ({ id, count, topic: topicById.get(id) }))
    .filter(item => item.topic)
    .sort((a, b) => b.count - a.count || String(a.topic?.name).localeCompare(String(b.topic?.name)))
    .slice(0, limit)
    .map(item => item.topic as Topic);
};

export default function PreFooter({ posts = [], topics = [], topTopics = [] }: Readonly<PreFooterProps>) {
  const { t } = useTranslation('common');
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
  const currentLocale = routeLocale || i18nextConfig.i18n.defaultLocale;
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterHoneypotChecked, setNewsletterHoneypotChecked] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<NewsletterStatus>('idle');
  const [newsletterErrorStatus, setNewsletterErrorStatus] = useState<NewsletterErrorStatus | null>(null);
  const [newsletterClientErrorStatus, setNewsletterClientErrorStatus] = useState<NewsletterClientErrorStatus | null>(
    null,
  );
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const [isNewsletterResending, setIsNewsletterResending] = useState(false);
  const [lastNewsletterEmail, setLastNewsletterEmail] = useState('');

  const latestPosts = useMemo(() => {
    const sorted = [...posts].sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
    return sorted.slice(0, 5);
  }, [posts]);

  const resolvedTopTopics = useMemo(() => {
    if (topTopics.length > 0) {
      return topTopics;
    }
    return getTopTopics(posts, topics, 6);
  }, [topTopics, posts, topics]);

  const getNewsletterClientError = useCallback((email: string): NewsletterClientErrorStatus | null => {
    const normalized = email.trim();

    if (normalized.length === 0) {
      return 'required';
    }

    if (normalized.length > 254 || !NEWSLETTER_EMAIL_PATTERN.test(normalized)) {
      return 'invalid-email';
    }

    return null;
  }, []);

  const sendNewsletterRequest = useCallback(
    async (apiPath: string, payload: Record<string, unknown>): Promise<NewsletterApiResponse | null> => {
      let result: NewsletterApiResponse | null = null;
      for (const endpoint of getNewsletterEndpoints(apiPath)) {
        const controller = new AbortController();
        const timeoutId = globalThis.setTimeout(() => {
          controller.abort();
        }, NEWSLETTER_REQUEST_TIMEOUT_MS);

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept-Language': currentLocale,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          result = (await response.json()) as NewsletterApiResponse;
          break;
        } catch {
          // Try the next endpoint candidate.
        } finally {
          globalThis.clearTimeout(timeoutId);
        }
      }

      return result;
    },
    [currentLocale],
  );

  const handleNewsletterEmailChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.currentTarget.value;
      setNewsletterEmail(nextValue);

      if (newsletterStatus === 'error') {
        setNewsletterStatus('idle');
        setNewsletterErrorStatus(null);
        setNewsletterClientErrorStatus(null);
      }

      if (newsletterStatus === 'success' || newsletterStatus === 'resent') {
        setNewsletterStatus('idle');
      }
    },
    [newsletterStatus],
  );

  const submitNewsletter = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isNewsletterSubmitting || isNewsletterResending) {
        return;
      }

      const clientError = getNewsletterClientError(newsletterEmail);
      if (clientError) {
        setNewsletterClientErrorStatus(clientError);
        setNewsletterErrorStatus(null);
        setNewsletterStatus('error');
        return;
      }

      const normalizedEmail = newsletterEmail.trim();
      const payload = {
        email: normalizedEmail,
        terms: newsletterHoneypotChecked,
        tags: NEWSLETTER_TAGS,
        formName: NEWSLETTER_FORM_NAME,
      };

      setIsNewsletterSubmitting(true);
      setNewsletterErrorStatus(null);
      setNewsletterClientErrorStatus(null);

      const result = await sendNewsletterRequest('/api/subscribe-user', payload);

      if (result?.status === 'success') {
        if (typeof result.forwardTo === 'string' && result.forwardTo.length > 0) {
          setIsNewsletterSubmitting(false);
          window.location.href = result.forwardTo;
          return;
        }

        setNewsletterStatus('success');
        setLastNewsletterEmail(normalizedEmail);
        setNewsletterEmail('');
        setNewsletterHoneypotChecked(false);
        setNewsletterClientErrorStatus(null);
        setIsNewsletterSubmitting(false);
        return;
      }

      setNewsletterErrorStatus(mapNewsletterErrorStatus(result?.status));
      setNewsletterStatus('error');
      setIsNewsletterSubmitting(false);
    },
    [
      getNewsletterClientError,
      isNewsletterResending,
      isNewsletterSubmitting,
      newsletterEmail,
      newsletterHoneypotChecked,
      sendNewsletterRequest,
    ],
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
      setNewsletterStatus('error');
      return;
    }

    setIsNewsletterResending(true);
    setNewsletterErrorStatus(null);
    setNewsletterClientErrorStatus(null);
    setNewsletterStatus('idle');

    const result = await sendNewsletterRequest('/api/subscribe-resend', {
      email: emailForResend,
      terms: false,
    });

    if (result?.status === 'success') {
      setNewsletterStatus('resent');
      setLastNewsletterEmail(emailForResend);
      setNewsletterErrorStatus(null);
      setNewsletterClientErrorStatus(null);
      setIsNewsletterResending(false);
      return;
    }

    setNewsletterErrorStatus(mapNewsletterErrorStatus(result?.status));
    setNewsletterStatus('error');
    setIsNewsletterResending(false);
  }, [
    getNewsletterClientError,
    isNewsletterResending,
    isNewsletterSubmitting,
    lastNewsletterEmail,
    newsletterEmail,
    sendNewsletterRequest,
  ]);

  const newsletterFeedbackMessage = useMemo(() => {
    if (newsletterClientErrorStatus === 'required') {
      return t('common.preFooter.newsletter.errors.required');
    }

    if (newsletterClientErrorStatus === 'invalid-email') {
      return t('common.preFooter.newsletter.errors.invalidEmail');
    }

    if (newsletterStatus === 'success') {
      return t('common.preFooter.newsletter.success');
    }
    if (newsletterStatus === 'resent') {
      return t('common.preFooter.newsletter.resent');
    }

    if (newsletterStatus !== 'error' || !newsletterErrorStatus) {
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
  }, [newsletterClientErrorStatus, newsletterErrorStatus, newsletterStatus, t]);

  const hasNewsletterError = newsletterClientErrorStatus !== null || newsletterErrorStatus !== null;

  return (
    <section className="pre-footer py-5" aria-label={t('common.preFooter.title')}>
      <Container>
        <Row className="g-4">
          <Col xs={12} lg={4}>
            <h3 className="pre-footer-title h5 fw-bold">{t('common.preFooter.aboutTitle')}</h3>
            <p className="text-muted mb-3">{t('common.preFooter.aboutText')}</p>
            <div className="d-flex flex-wrap gap-2">
              <Link
                href={`/${currentLocale}/contact`}
                skipLocaleHandling
                className="btn pre-footer-cta pre-footer-cta-primary"
              >
                {t('common.preFooter.contactCta')}
              </Link>
              <Link
                href={`/${currentLocale}/about`}
                skipLocaleHandling
                className="btn pre-footer-cta pre-footer-cta-secondary"
              >
                {t('common.preFooter.startHereCta')}
              </Link>
            </div>
          </Col>

          <Col xs={12} lg={4}>
            <h3 className="pre-footer-title h5 fw-bold">{t('common.preFooter.latestPostsTitle')}</h3>
            <ul className="list-unstyled mb-3">
              {latestPosts.map(post => (
                <li key={post.id} className="mb-2">
                  <Link
                    href={`/${currentLocale}/posts/${post.id}`}
                    skipLocaleHandling
                    className="text-decoration-none pre-footer-latest-link"
                  >
                    <FontAwesomeIcon icon="arrow-right" className="me-2 pre-footer-latest-icon" />
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="h6 fw-bold mb-2">{t('common.preFooter.topTopicsTitle')}</h4>
            <div className="d-flex flex-wrap gap-2">
              {resolvedTopTopics.map(topic => (
                <Link
                  key={topic.id}
                  href={`/${currentLocale}/topics/${topic.id}`}
                  skipLocaleHandling
                  className="text-decoration-none"
                >
                  <Badge bg={topic.color} className={`badge-${topic.color}`}>
                    {topic.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </Col>

          <Col xs={12} lg={4}>
            <h3 className="pre-footer-title h5 fw-bold mb-2">{t('common.preFooter.subscribeTitle')}</h3>
            <p className="text-muted mb-3">{t('common.preFooter.newsletter.description')}</p>
            <form className="pre-footer-newsletter-form mb-4" onSubmit={submitNewsletter} noValidate>
              <div className={`pre-footer-newsletter-shell${hasNewsletterError ? ' has-error' : ''}`}>
                <label htmlFor="pre-footer-newsletter-email" className="visually-hidden">
                  {t('common.preFooter.newsletter.emailLabel')}
                </label>
                <input
                  id="pre-footer-newsletter-email"
                  name="newsletter-email"
                  type="email"
                  className={`form-control pre-footer-newsletter-input${hasNewsletterError ? ' is-invalid' : ''}`}
                  placeholder={t('common.preFooter.newsletter.placeholder')}
                  value={newsletterEmail}
                  onChange={handleNewsletterEmailChange}
                  disabled={isNewsletterSubmitting || isNewsletterResending}
                  aria-invalid={hasNewsletterError}
                  aria-describedby="pre-footer-newsletter-feedback"
                  required
                  autoComplete="email"
                />
                <button
                  type="submit"
                  className="btn pre-footer-newsletter-submit"
                  disabled={isNewsletterSubmitting || isNewsletterResending}
                  aria-label={t('common.preFooter.newsletter.submit')}
                >
                  {isNewsletterSubmitting ? (
                    <span className="pre-footer-newsletter-submit-text">
                      {t('common.preFooter.newsletter.submitting')}
                    </span>
                  ) : (
                    <>
                      <FontAwesomeIcon icon="arrow-right" />
                      <span className="visually-hidden">{t('common.preFooter.newsletter.submit')}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="visually-hidden" aria-hidden="true">
                <label htmlFor="pre-footer-newsletter-honeypot">{t('common.preFooter.newsletter.honeypotLabel')}</label>
                <input
                  id="pre-footer-newsletter-honeypot"
                  name="accept-terms"
                  type="checkbox"
                  checked={newsletterHoneypotChecked}
                  onChange={event => setNewsletterHoneypotChecked(event.currentTarget.checked)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
            </form>

            {newsletterFeedbackMessage &&
              (newsletterStatus === 'success' || newsletterStatus === 'resent' ? (
                <p
                  id="pre-footer-newsletter-feedback"
                  className="pre-footer-newsletter-feedback form-text text-success mb-3"
                  role="status"
                >
                  {newsletterFeedbackMessage}
                </p>
              ) : (
                <div
                  id="pre-footer-newsletter-feedback"
                  className="pre-footer-newsletter-feedback invalid-feedback d-block mb-3"
                  role="status"
                >
                  {newsletterFeedbackMessage}
                </div>
              ))}
            {(newsletterStatus === 'success' || newsletterStatus === 'resent') && lastNewsletterEmail ? (
              <button
                type="button"
                className="btn btn-link pre-footer-newsletter-resend mb-3"
                onClick={resendNewsletterConfirmation}
                disabled={isNewsletterSubmitting || isNewsletterResending}
              >
                {isNewsletterResending
                  ? t('common.preFooter.newsletter.resending')
                  : t('common.preFooter.newsletter.resend')}
              </button>
            ) : null}

            <h4 className="h6 fw-bold mb-2">{t('common.preFooter.socialTitle')}</h4>
            <div className="d-flex align-items-center gap-3 flex-wrap pre-footer-social-links">
              <PreFooterSocialLink
                href={`/${currentLocale}/rss.xml`}
                icon="rss"
                label={t('common.preFooter.rss')}
                external={false}
                boop={{ y: 2, rotation: -10, scale: 1.08, timing: 170 }}
              />
              <PreFooterSocialLink href={CONTACT_LINKS.github} icon={['fab', 'github']} label="GitHub" />
              <PreFooterSocialLink href={CONTACT_LINKS.linkedin} icon={['fab', 'linkedin']} label="LinkedIn" />
              <PreFooterSocialLink href={CONTACT_LINKS.medium} icon={['fab', 'medium']} label="Medium" />
              <PreFooterSocialLink href={CONTACT_LINKS.email} icon="envelope" label="Email" mailto />
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
