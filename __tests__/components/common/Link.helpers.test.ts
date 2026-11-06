import { hasLocalePrefix, isExternalUrl, localizeHref, localizePathname } from '@/components/common/Link';

describe('Link helpers', () => {
  it('adds only non-default locale prefixes while normalizing existing prefixes', () => {
    expect(hasLocalePrefix('/en/posts/demo')).toBe(true);
    expect(hasLocalePrefix('/tr/posts/demo')).toBe(true);
    expect(hasLocalePrefix('/posts/demo')).toBe(false);
    expect(localizePathname('/en/posts/demo', 'tr')).toBe('/tr/posts/demo');
    expect(localizePathname('/tr', 'en')).toBe('/');
    expect(localizePathname('/about', 'tr')).toBe('/tr/about');
  });

  it('switches locale prefixes and preserves query strings and fragments', () => {
    expect(localizeHref('/tr/posts/demo?tab=1#code', 'en')).toBe('/posts/demo?tab=1#code');
    expect(localizeHref('/posts/demo?tab=1#code', 'tr')).toBe('/tr/posts/demo?tab=1#code');
    expect(localizeHref('#section', 'en')).toBe('#section');
    expect(localizeHref('mailto:test@example.com', 'en')).toBe('mailto:test@example.com');
    expect(localizeHref('relative/path', 'en')).toBe('relative/path');
  });

  it('normalizes same-origin absolute links and preserves external links', () => {
    expect(isExternalUrl('/about')).toBe(false);
    expect(isExternalUrl('https://example.org')).toBe(true);
    expect(localizeHref('http://localhost/en/about?page=1#top', 'tr')).toBe('/tr/about?page=1#top');
    expect(localizeHref('https://example.org/en/about', 'tr')).toBe('https://example.org/en/about');
  });
});
