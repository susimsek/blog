import { hasLocalePrefix, isExternalUrl, localizeHref, localizePathname } from '@/components/common/Link';

describe('Link helpers', () => {
  it('detects external urls using the current origin', () => {
    expect(isExternalUrl('/about')).toBe(false);
    expect(isExternalUrl('mailto:test@example.com')).toBe(true);
    expect(isExternalUrl('https://example.com')).toBe(true);
  });

  it('detects locale prefixes and localizes paths safely', () => {
    expect(hasLocalePrefix('/en/posts/demo')).toBe(true);
    expect(hasLocalePrefix('/posts/demo')).toBe(false);

    expect(localizePathname('/', 'tr')).toBe('/tr');
    expect(localizePathname('/about', 'en')).toBe('/en/about');
    expect(localizePathname('/en/about', 'en')).toBe('/en/about');
  });

  it('localizes href variants and preserves non-localizable schemes', () => {
    expect(localizeHref('#section', 'en')).toBe('#section');
    expect(localizeHref('mailto:test@example.com', 'en')).toBe('mailto:test@example.com');
    expect(localizeHref('/posts/demo?tab=1#code', 'tr')).toBe('/tr/posts/demo?tab=1#code');
    expect(localizeHref('https://example.com/posts/demo?tab=1#code', 'en')).toBe('/en/posts/demo?tab=1#code');
    expect(localizeHref('invalid::href', 'en')).toBe('invalid::href');
  });
});
