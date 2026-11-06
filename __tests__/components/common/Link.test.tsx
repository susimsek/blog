import React from 'react';
import { render, screen } from '@testing-library/react';
import Link from '@/components/common/Link';

const mockNextLink = jest.fn(({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a {...props}>{children}</a>
));

jest.mock('next/link', () => ({
  __esModule: true,
  default: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => mockNextLink(props),
}));

describe('Link', () => {
  beforeEach(() => mockNextLink.mockClear());

  it('renders a prefixless internal URL and the default class', () => {
    render(<Link href="/en/about">About</Link>);

    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'About' })).toHaveClass('link');
  });

  it('preserves the explicit route when locale handling is skipped', () => {
    render(
      <Link href="/tr/posts/example" skipLocaleHandling className="custom">
        Post
      </Link>,
    );

    const link = screen.getByRole('link', { name: 'Post' });
    expect(link).toHaveAttribute('href', '/tr/posts/example');
    expect(link).toHaveAttribute('data-locale', 'false');
    expect(link).toHaveClass('link custom');
  });

  it('keeps external URLs unchanged', () => {
    render(<Link href="https://example.org/en/about">External</Link>);

    expect(screen.getByRole('link', { name: 'External' })).toHaveAttribute('href', 'https://example.org/en/about');
  });
});
