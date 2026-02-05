import React from 'react';
import { render } from '@testing-library/react';
import SEO from '@/components/common/SEO';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('SEO', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en', page: 2, size: 12 },
    });
  });

  it('renders canonical/alternate links and paged query params', () => {
    render(
      <SEO
        title="Home"
        ogTitle="Home OG"
        description="Home description"
        path="posts/my-post"
        keywords="react,nextjs"
      />,
    );

    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toContain('/en/posts/my-post?page=2&size=12');

    expect(document.querySelector('link[hreflang="en"]')).toBeTruthy();
    expect(document.querySelector('link[hreflang="tr"]')).toBeTruthy();
    expect(document.querySelector('meta[name="keywords"]')?.getAttribute('content')).toBe('react,nextjs');
  });

  it('applies image fallback and skips keywords meta when not provided', () => {
    render(
      <SEO title="About" ogTitle="About OG" description="About description" image="%%invalid-url%%" type="article" />,
    );

    const imageMeta = document.querySelector('meta[property="og:image"]');
    expect(imageMeta?.getAttribute('content')).toContain('https://suaybsimsek.com/%%invalid-url%%');
    expect(document.querySelector('meta[name="keywords"]')).toBeNull();
  });

  it('renders article/profile metas and json-ld payload', () => {
    render(
      <SEO
        title="Post"
        ogTitle="Post OG"
        description="Post description"
        path="posts/post-1"
        profile={{ first_name: 'John', last_name: 'Doe' }}
        article={{ published_time: '2026-02-05', modified_time: '2026-02-05', tags: ['a', 'b'] }}
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Article' }}
      />,
    );

    expect(document.querySelector('meta[property="article:published_time"]')).toBeTruthy();
    expect(document.querySelector('meta[property="profile:first_name"]')?.getAttribute('content')).toBe('John');
    expect(document.querySelectorAll('meta[property="article:tag"]')).toHaveLength(2);

    const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
    expect(jsonLdScript?.innerHTML).toContain('"mainEntityOfPage"');
    expect(jsonLdScript?.innerHTML).toContain('"inLanguage"');
  });

  it('uses contact-page json-ld branch and locale fallback', () => {
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'unknown' },
    });

    render(
      <SEO
        title="Contact"
        ogTitle="Contact OG"
        description="Contact description"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'ContactPage' }}
      />,
    );

    const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
    expect(jsonLdScript?.innerHTML).toContain('"inLanguage"');
    expect(document.querySelector('meta[property="og:locale"]')).toBeTruthy();
  });
});
