import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PreFooter from '@/components/common/PreFooter';
import type { PostSummary, Topic } from '@/types/posts';
import { CONTACT_LINKS } from '@/config/constants';
import { resendNewsletterConfirmation, subscribeNewsletter } from '@/lib/newsletterApi';
import type { NewsletterMutationResponse } from '@/lib/newsletterApi';

const useParamsMock = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
}));

jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => {
    const { skipLocaleHandling, ...anchorProps } = props as { skipLocaleHandling?: boolean };
    void skipLocaleHandling;
    return (
      <a href={href} {...anchorProps}>
        {children}
      </a>
    );
  },
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string | string[] }) => (
    <span data-testid={`icon-${Array.isArray(icon) ? icon.join('-') : icon}`} />
  ),
}));

jest.mock('@/lib/newsletterApi', () => ({
  subscribeNewsletter: jest.fn(),
  resendNewsletterConfirmation: jest.fn(),
}));

const buildPost = (
  id: string,
  publishedDate: string,
  topics: Array<{ id?: string; name: string; color: string }> = [],
) =>
  ({
    id,
    title: `Post ${id}`,
    publishedDate,
    summary: `Summary ${id}`,
    searchText: `post ${id} summary`,
    thumbnail: null,
    readingTimeMin: 3,
    topics,
  }) as PostSummary;

describe('PreFooter', () => {
  const subscribeNewsletterMock = jest.mocked(subscribeNewsletter);
  const resendNewsletterConfirmationMock = jest.mocked(resendNewsletterConfirmation);

  beforeEach(() => {
    useParamsMock.mockReturnValue({ locale: 'tr' });
    subscribeNewsletterMock.mockReset();
    resendNewsletterConfirmationMock.mockReset();
  });

  it('renders latest posts and top topics based on frequency', () => {
    const posts: PostSummary[] = [
      buildPost('1', '2026-01-01', [
        { id: 'react', name: 'React', color: 'red' },
        { id: 'next', name: 'Next.js', color: 'blue' },
      ]),
      buildPost('2', '2026-01-02', [{ id: 'react', name: 'React', color: 'red' }]),
      buildPost('3', '2026-01-03', [{ id: 'testing', name: 'Testing', color: 'green' }]),
      buildPost('4', '2026-01-04', [{ name: 'No Id Topic', color: 'gray' }]),
      buildPost('5', '2026-01-05', [{ id: 'react', name: 'React', color: 'red' }]),
      buildPost('6', '2026-01-06', [{ id: 'security', name: 'Security', color: 'orange' }]),
    ];

    const topics: Topic[] = [
      { id: 'react', name: 'React', color: 'red' },
      { id: 'next', name: 'Next.js', color: 'blue' },
      { id: 'testing', name: 'Testing', color: 'green' },
      { id: 'security', name: 'Security', color: 'orange' },
    ];

    render(<PreFooter posts={posts} topics={topics} />);

    expect(screen.getByLabelText('common.preFooter.title')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'common.preFooter.contactCta' })).toHaveAttribute('href', '/tr/contact');
    expect(screen.getByRole('link', { name: 'common.preFooter.startHereCta' })).toHaveAttribute('href', '/tr/about');

    // Latest posts are limited to 5 and sorted by date desc.
    expect(screen.queryByRole('link', { name: 'Post 1' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Post 6' })).toHaveAttribute('href', '/tr/posts/6');

    // Top topics include known IDs and ignore entries without ID.
    expect(screen.getByRole('link', { name: 'React' })).toHaveAttribute('href', '/tr/topics/react');
    expect(screen.getByRole('link', { name: 'Next.js' })).toHaveAttribute('href', '/tr/topics/next');
    expect(screen.queryByText('No Id Topic')).not.toBeInTheDocument();
  });

  it('falls back to default locale when route locale is missing', () => {
    useParamsMock.mockReturnValue({});
    render(<PreFooter posts={[]} topics={[]} />);

    expect(screen.getByRole('link', { name: 'common.preFooter.contactCta' })).toHaveAttribute('href', '/en/contact');
    expect(screen.getByRole('link', { name: 'common.preFooter.startHereCta' })).toHaveAttribute('href', '/en/about');
    expect(screen.getByRole('link', { name: 'common.preFooter.rss' })).toHaveAttribute('href', '/en/rss.xml');
  });

  it('prefers provided topTopics over derived topic frequency', () => {
    const posts: PostSummary[] = [buildPost('1', '2026-01-01', [{ id: 'react', name: 'React', color: 'red' }])];
    const topTopics: Topic[] = [{ id: 'curated', name: 'Curated', color: 'purple' }];

    render(<PreFooter posts={posts} topics={[{ id: 'react', name: 'React', color: 'red' }]} topTopics={topTopics} />);

    expect(screen.getByRole('link', { name: 'Curated' })).toHaveAttribute('href', '/tr/topics/curated');
    expect(screen.queryByRole('link', { name: 'React' })).not.toBeInTheDocument();
  });

  it('renders social links from contact constants', () => {
    const { container } = render(<PreFooter posts={[]} topics={[]} />);

    expect(container.querySelector(`a[href="${CONTACT_LINKS.github}"]`)).toBeInTheDocument();
    expect(container.querySelector(`a[href="${CONTACT_LINKS.linkedin}"]`)).toBeInTheDocument();
    expect(container.querySelector(`a[href="${CONTACT_LINKS.medium}"]`)).toBeInTheDocument();
    expect(container.querySelector(`a[href="mailto:${CONTACT_LINKS.email}"]`)).toBeInTheDocument();
  });

  it('submits newsletter form and shows success feedback', async () => {
    subscribeNewsletterMock.mockResolvedValue({ status: 'success' });

    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    await waitFor(() => {
      expect(subscribeNewsletterMock).toHaveBeenCalled();
    });

    expect(subscribeNewsletterMock).toHaveBeenCalledWith(
      {
        locale: 'tr',
        email: 'reader@example.com',
        terms: false,
        tags: ['preFooterNewsletter'],
        formName: 'preFooterNewsletter',
      },
      { timeoutMs: 8000 },
    );

    await waitFor(() => {
      expect(screen.getByText('common.preFooter.newsletter.success')).toBeInTheDocument();
    });
  });

  it('submits newsletter with honeypot checkbox state', async () => {
    subscribeNewsletterMock.mockResolvedValue({ status: 'success' });

    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.click(screen.getByLabelText('common.preFooter.newsletter.honeypotLabel'));
    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    await waitFor(() => expect(subscribeNewsletterMock).toHaveBeenCalled());
    expect(subscribeNewsletterMock).toHaveBeenCalledWith(
      expect.objectContaining({
        terms: true,
      }),
      { timeoutMs: 8000 },
    );
  });

  it('redirects to forwardTo url on successful newsletter response', async () => {
    const originalHref = window.location.href;
    subscribeNewsletterMock.mockResolvedValue({ status: 'success', forwardTo: '#newsletter-confirmed' });

    render(<PreFooter posts={[]} topics={[]} />);
    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    await waitFor(() => expect(subscribeNewsletterMock).toHaveBeenCalled());
    await waitFor(() => expect(window.location.href).toContain('#newsletter-confirmed'));
    expect(screen.queryByText('common.preFooter.newsletter.success')).not.toBeInTheDocument();

    window.location.hash = '';
    expect(window.location.href).toBeTruthy();
    window.history.replaceState({}, '', originalHref);
  });

  it('resends confirmation email after a successful subscription', async () => {
    subscribeNewsletterMock.mockResolvedValue({ status: 'success' });
    resendNewsletterConfirmationMock.mockResolvedValue({ status: 'success' });

    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    await waitFor(() => {
      expect(screen.getByText('common.preFooter.newsletter.success')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.resend' }));

    await waitFor(() => {
      expect(resendNewsletterConfirmationMock).toHaveBeenCalledTimes(1);
    });

    expect(resendNewsletterConfirmationMock).toHaveBeenCalledWith(
      {
        locale: 'tr',
        email: 'reader@example.com',
        terms: false,
      },
      { timeoutMs: 8000 },
    );

    await waitFor(() => {
      expect(screen.getByText('common.preFooter.newsletter.resent')).toBeInTheDocument();
    });
  });

  it('shows invalid email error only after submit', async () => {
    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'invalid-email' },
    });
    expect(screen.queryByText('common.preFooter.newsletter.errors.invalidEmail')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    expect(await screen.findByText('common.preFooter.newsletter.errors.invalidEmail')).toBeInTheDocument();
    expect(subscribeNewsletterMock).not.toHaveBeenCalled();
  });

  it('shows required error when newsletter email is empty', async () => {
    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    expect(await screen.findByText('common.preFooter.newsletter.errors.required')).toBeInTheDocument();
    expect(subscribeNewsletterMock).not.toHaveBeenCalled();
  });

  it('clears newsletter error state when typing after error', async () => {
    subscribeNewsletterMock.mockResolvedValue({ status: 'rate-limited' });
    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));
    expect(await screen.findByText('common.preFooter.newsletter.errors.rateLimited')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader2@example.com' },
    });
    expect(screen.queryByText('common.preFooter.newsletter.errors.rateLimited')).not.toBeInTheDocument();
  });

  it('clears success message when typing after successful subscribe', async () => {
    subscribeNewsletterMock.mockResolvedValue({ status: 'success' });
    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));
    expect(await screen.findByText('common.preFooter.newsletter.success')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'next@example.com' },
    });
    expect(screen.queryByText('common.preFooter.newsletter.success')).not.toBeInTheDocument();
  });

  it('prevents duplicate submit while a newsletter request is pending', async () => {
    let resolveSubscribe: ((value: NewsletterMutationResponse | null) => void) | undefined;
    subscribeNewsletterMock.mockReturnValue(
      new Promise(resolve => {
        resolveSubscribe = resolve;
      }) as ReturnType<typeof subscribeNewsletter>,
    );

    const { container } = render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(subscribeNewsletterMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSubscribe?.({ status: 'success' });
    });
  });

  it('shows rate-limited message when api responds with rate-limited status', async () => {
    subscribeNewsletterMock.mockResolvedValue({ status: 'rate-limited' });

    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    expect(await screen.findByText('common.preFooter.newsletter.errors.rateLimited')).toBeInTheDocument();
  });

  it('shows invalid-email server error message when api returns invalid-email status', async () => {
    subscribeNewsletterMock.mockResolvedValue({ status: 'invalid-email' });

    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    expect(await screen.findByText('common.preFooter.newsletter.errors.invalidEmail')).toBeInTheDocument();
  });

  it('shows generic error when api returns unknown-error status', async () => {
    subscribeNewsletterMock.mockResolvedValue({ status: 'unknown-error' });

    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    expect(await screen.findByText('common.preFooter.newsletter.errors.generic')).toBeInTheDocument();
  });

  it('shows generic error when api is unreachable', async () => {
    subscribeNewsletterMock.mockResolvedValue(null);

    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    expect(await screen.findByText('common.preFooter.newsletter.errors.generic')).toBeInTheDocument();
  });

  it('shows resend error feedback when resend API fails after success', async () => {
    subscribeNewsletterMock.mockResolvedValue({ status: 'success' });
    resendNewsletterConfirmationMock.mockResolvedValue({ status: 'unknown-error' });

    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));
    expect(await screen.findByText('common.preFooter.newsletter.success')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.resend' }));

    await waitFor(() => expect(resendNewsletterConfirmationMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('common.preFooter.newsletter.errors.generic')).toBeInTheDocument();
  });
});
