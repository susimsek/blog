import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NewsletterCallbackPage from '@/views/NewsletterCallbackPage';
import { confirmNewsletterSubscription, unsubscribeNewsletter } from '@/lib/newsletterApi';

const replaceStateMock = jest.fn();
const getParamMock = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => getParamMock(key),
  }),
}));

jest.mock('@/components/common/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/lib/newsletterApi', () => ({
  confirmNewsletterSubscription: jest.fn(),
  unsubscribeNewsletter: jest.fn(),
}));

const confirmNewsletterSubscriptionMock = confirmNewsletterSubscription as jest.Mock;
const unsubscribeNewsletterMock = unsubscribeNewsletter as jest.Mock;

describe('NewsletterCallbackPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getParamMock.mockImplementation((key: string) => {
      if (key === 'operation') return 'confirm';
      if (key === 'token') return 'token-1';
      return null;
    });
    window.history.replaceState = replaceStateMock;
    window.history.pushState({ page: 1 }, '', '/en/callback?operation=confirm&token=token-1&locale=en');
  });

  it('confirms newsletter subscriptions and strips sensitive query params from the url', async () => {
    confirmNewsletterSubscriptionMock.mockResolvedValue({
      status: 'success',
    });

    render(<NewsletterCallbackPage locale="en" layoutPosts={[]} topics={[]} preFooterTopTopics={[]} />);

    await waitFor(() =>
      expect(screen.getByText('common.newsletterCallback.confirm.status.success.title')).toBeInTheDocument(),
    );

    expect(confirmNewsletterSubscriptionMock).toHaveBeenCalledWith(
      'token-1',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(replaceStateMock).toHaveBeenCalledWith({ page: 1 }, '', '/en/callback?operation=confirm');
  });

  it('shows invalid link state when token is missing', async () => {
    getParamMock.mockImplementation((key: string) => (key === 'operation' ? 'confirm' : null));

    render(<NewsletterCallbackPage locale="en" layoutPosts={[]} topics={[]} preFooterTopTopics={[]} />);

    await waitFor(() =>
      expect(screen.getByText('common.newsletterCallback.confirm.status.invalid-link.title')).toBeInTheDocument(),
    );

    expect(confirmNewsletterSubscriptionMock).not.toHaveBeenCalled();
  });

  it('uses the unsubscribe flow and maps failing results to fallback statuses', async () => {
    getParamMock.mockImplementation((key: string) => {
      if (key === 'operation') return 'unsubscribe';
      if (key === 'token') return 'token-2';
      return null;
    });
    unsubscribeNewsletterMock.mockResolvedValue({
      status: '',
    });

    render(<NewsletterCallbackPage locale="tr" layoutPosts={[]} topics={[]} preFooterTopTopics={[]} />);

    await waitFor(() =>
      expect(
        screen.getByText('common.newsletterCallback.unsubscribe.status.service-unavailable.title'),
      ).toBeInTheDocument(),
    );

    expect(unsubscribeNewsletterMock).toHaveBeenCalledWith(
      'token-2',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });
});
