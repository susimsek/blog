import React from 'react';
import { render, screen } from '@testing-library/react';
import RelatedPosts from '@/components/posts/RelatedPosts';
import type { PostSummary } from '@/types/posts';
import { useRouter } from '@/navigation/router';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/navigation/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('@/components/common/DateDisplay', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <span>{date}</span>,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string | string[] }) => (
    <span data-testid={`icon-${Array.isArray(icon) ? icon.join('-') : icon}`} />
  ),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string }) => <img src={src} alt={alt} {...props} />,
}));

const basePost: PostSummary = {
  id: '1',
  title: 'First related post',
  summary: 'Summary 1',
  date: '2026-01-01',
  readingTime: '4 min read',
  thumbnail: '/images/post-1.webp',
  topics: [
    { id: 'react', name: 'React', color: 'red' },
    { id: 'testing', name: 'Testing', color: 'green' },
  ],
};

describe('RelatedPosts', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ query: { locale: 'tr' } });
  });

  it('returns nothing when posts are empty', () => {
    const { container } = render(<RelatedPosts posts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders related posts with localized links, thumbnail and topic badges', () => {
    render(<RelatedPosts posts={[basePost]} />);

    expect(screen.getByRole('region', { name: 'post.relatedPostsTitle' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /First related post/i })).toHaveAttribute('href', '/tr/posts/1');
    expect(screen.getByAltText('First related post')).toHaveAttribute(
      'src',
      expect.stringContaining('/images/post-1.webp'),
    );
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
    expect(screen.getByText('4 min read')).toBeInTheDocument();
    expect(screen.getByText('2026-01-01')).toBeInTheDocument();
  });

  it('falls back to default locale and handles posts without thumbnail/topics', () => {
    (useRouter as jest.Mock).mockReturnValue({ query: {} });
    const noMediaPost: PostSummary = {
      ...basePost,
      id: '2',
      title: 'No media post',
      thumbnail: null,
      topics: [],
    };

    render(<RelatedPosts posts={[noMediaPost]} />);

    expect(screen.getByRole('link', { name: /No media post/i })).toHaveAttribute('href', '/en/posts/2');
    expect(screen.queryByAltText('No media post')).not.toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });
});
