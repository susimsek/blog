import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PreFooter from '@/components/common/PreFooter';
import type { PostSummary, Topic } from '@/types/posts';
import { CONTACT_LINKS } from '@/config/constants';

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
  const originalFetch = global.fetch;
  const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    useParamsMock.mockReturnValue({ locale: 'tr' });
  });

  afterEach(() => {
    Object.defineProperty(global, 'fetch', { value: originalFetch, writable: true });
    if (originalApiBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    }
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

  it('renders social links from contact constants', () => {
    const { container } = render(<PreFooter posts={[]} topics={[]} />);

    expect(container.querySelector(`a[href="${CONTACT_LINKS.github}"]`)).toBeInTheDocument();
    expect(container.querySelector(`a[href="${CONTACT_LINKS.linkedin}"]`)).toBeInTheDocument();
    expect(container.querySelector(`a[href="${CONTACT_LINKS.medium}"]`)).toBeInTheDocument();
    expect(container.querySelector(`a[href="mailto:${CONTACT_LINKS.email}"]`)).toBeInTheDocument();
  });

  it('submits newsletter form and shows success feedback', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: async () => ({ status: 'success' }),
    });
    Object.defineProperty(global, 'fetch', { value: fetchMock, writable: true });

    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const [endpoint, requestOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(endpoint).toBe('/api/subscribe-user');
    expect(requestOptions).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Accept-Language': 'tr',
        }),
      }),
    );
    expect(JSON.parse(String(requestOptions.body))).toEqual({
      email: 'reader@example.com',
      terms: false,
      tags: ['preFooterNewsletter'],
      formName: 'preFooterNewsletter',
    });

    await waitFor(() => {
      expect(screen.getByText('common.preFooter.newsletter.success')).toBeInTheDocument();
    });
  });

  it('resends confirmation email after a successful subscription', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ status: 'success' }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ status: 'success' }),
      });
    Object.defineProperty(global, 'fetch', { value: fetchMock, writable: true });

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
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const [resendEndpoint, resendRequestOptions] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(resendEndpoint).toBe('/api/subscribe-resend');
    expect(JSON.parse(String(resendRequestOptions.body))).toEqual({
      email: 'reader@example.com',
      terms: false,
    });

    await waitFor(() => {
      expect(screen.getByText('common.preFooter.newsletter.resent')).toBeInTheDocument();
    });
  });

  it('shows invalid email error only after submit', async () => {
    const fetchMock = jest.fn();
    Object.defineProperty(global, 'fetch', { value: fetchMock, writable: true });

    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'invalid-email' },
    });
    expect(screen.queryByText('common.preFooter.newsletter.errors.invalidEmail')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    expect(await screen.findByText('common.preFooter.newsletter.errors.invalidEmail')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows rate-limited message when api responds with rate-limited status', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: async () => ({ status: 'rate-limited' }),
    });
    Object.defineProperty(global, 'fetch', { value: fetchMock, writable: true });

    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    expect(await screen.findByText('common.preFooter.newsletter.errors.rateLimited')).toBeInTheDocument();
  });

  it('shows generic error when api is unreachable', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('network failed'));
    Object.defineProperty(global, 'fetch', { value: fetchMock, writable: true });

    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    expect(await screen.findByText('common.preFooter.newsletter.errors.generic')).toBeInTheDocument();
  });

  it('uses NEXT_PUBLIC_API_BASE_URL when configured', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.suaybsimsek.com/';

    const fetchMock = jest.fn().mockResolvedValue({
      json: async () => ({ status: 'success' }),
    });
    Object.defineProperty(global, 'fetch', { value: fetchMock, writable: true });

    render(<PreFooter posts={[]} topics={[]} />);

    fireEvent.change(screen.getByLabelText('common.preFooter.newsletter.emailLabel'), {
      target: { value: 'reader@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.preFooter.newsletter.submit' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.suaybsimsek.com/api/subscribe-user');
  });
});
