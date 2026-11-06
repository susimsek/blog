import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeRoute, { generateMetadata } from '@/app/(default)/page';

const mockGetLocalizedHomePageData = jest.fn(async () => ({
  en: { posts: [{ id: 'english-post' }], topics: [{ id: 'english-topic' }] },
  tr: { posts: [{ id: 'turkish-post' }], topics: [{ id: 'turkish-topic' }] },
}));
const mockLoadLocaleResources = jest.fn(async (_locale: string, _namespaces: string[]) => ({
  home: { home: { header: { title: 'Home' } } },
}));
const mockHomePage = jest.fn((props: { contentByLocale: Record<string, unknown> }) => (
  <div data-testid="home-page">{Object.keys(props.contentByLocale).join(',')}</div>
));

jest.mock('@/i18n/server', () => ({
  getServerTranslator: async () => ({
    t: (key: string) =>
      ({
        'home.meta.title': 'Home Meta Title',
        'home.meta.description': 'Home Meta Description',
        'home.meta.keywords': 'home,meta,keywords',
      })[key] ?? key,
  }),
  loadLocaleResources: (locale: string, namespaces: string[]) => mockLoadLocaleResources(locale, namespaces),
}));

jest.mock('@/lib/localizedPageData', () => ({
  getLocalizedHomePageData: () => mockGetLocalizedHomePageData(),
}));

jest.mock('@/i18n/RouteI18nProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/views/HomePage', () => ({
  __esModule: true,
  default: (props: { contentByLocale: Record<string, unknown> }) => mockHomePage(props),
}));

describe('static home route', () => {
  beforeEach(() => jest.clearAllMocks());

  it('builds the English root canonical and advertises both language URLs', async () => {
    const metadata = await generateMetadata();

    expect(metadata).toMatchObject({
      title: 'Home Meta Title',
      description: 'Home Meta Description',
      alternates: {
        canonical: '/',
        languages: { en: '/', tr: '/tr', 'x-default': '/' },
        types: {
          'application/rss+xml': [{ url: '/rss.xml', title: 'English RSS feed' }],
        },
      },
      openGraph: { url: '/' },
    });
  });

  it('renders both locale payloads into the static home page', async () => {
    render(await HomeRoute());

    expect(mockGetLocalizedHomePageData).toHaveBeenCalledTimes(1);
    expect(mockHomePage).toHaveBeenCalledWith({
      contentByLocale: expect.objectContaining({ en: expect.any(Object), tr: expect.any(Object) }),
    });
    expect(screen.getByTestId('home-page')).toHaveTextContent('en,tr');
  });
});
