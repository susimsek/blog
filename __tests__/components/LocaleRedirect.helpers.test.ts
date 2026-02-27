import {
  getNormalizedBasePath,
  hasLocalePrefix,
  normalizeTarget,
  resolveLocale,
  splitHref,
  stripBasePathFromPathname,
} from '@/components/LocaleRedirect';
import languageDetector from '@/lib/languageDetector';

jest.mock('@/lib/languageDetector', () => ({
  detect: jest.fn(),
  cache: jest.fn(),
}));

describe('LocaleRedirect helpers', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  });

  it('resolves detected locales and falls back to default', () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('tr');
    expect(resolveLocale()).toBe('tr');

    (languageDetector.detect as jest.Mock).mockReturnValue('fr');
    expect(resolveLocale()).toBe('en');
  });

  it('normalizes base paths and splits href segments', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '//blog//';
    expect(getNormalizedBasePath()).toBe('blog');
    expect(splitHref('search?q=test#top')).toEqual({
      pathname: '/search',
      query: '?q=test',
      hash: '#top',
    });
    expect(splitHref('?q=test')).toEqual({
      pathname: '/',
      query: '?q=test',
      hash: '',
    });
    expect(splitHref('/blog/')).toEqual({
      pathname: '/blog/',
      query: '',
      hash: '',
    });
    expect(splitHref('/')).toEqual({
      pathname: '/',
      query: '',
      hash: '',
    });
  });

  it('strips base paths and localizes targets', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/blog';
    expect(stripBasePathFromPathname('/blog')).toBe('/');
    expect(stripBasePathFromPathname('/blog/')).toBe('/');
    expect(stripBasePathFromPathname('/blog/posts/demo')).toBe('/posts/demo');
    expect(stripBasePathFromPathname('/posts/demo')).toBe('/posts/demo');

    expect(hasLocalePrefix('/en/posts/demo')).toBe(true);
    expect(hasLocalePrefix('/posts/demo')).toBe(false);

    expect(normalizeTarget('/blog/posts/demo?tab=1#code', 'tr')).toBe('/tr/posts/demo?tab=1#code');
    expect(normalizeTarget('/tr/posts/demo', 'en')).toBe('/tr/posts/demo');
    expect(normalizeTarget('/', 'en')).toBe('/en');
    expect(normalizeTarget('?q=test', 'en')).toBe('/en?q=test');
  });
});
