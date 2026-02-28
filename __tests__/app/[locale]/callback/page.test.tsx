import React from 'react';
import { render, screen } from '@testing-library/react';
import NewsletterCallbackRoute, { generateMetadata } from '@/app/(localized)/[locale]/callback/page';

const getServerTranslatorMock = jest.fn(async (_locale: string, _ns: string[]) => ({
  t: (key: string) =>
    ({
      'common.newsletterCallback.meta.title': 'Callback Title',
      'common.newsletterCallback.meta.description': 'Callback Description',
    })[key] ?? key,
}));
const loadLocaleResourcesMock = jest.fn(async (_locale: string, _ns: string[]) => ({
  common: { common: { newsletterCallback: {} } },
}));
const getSortedPostsDataMock = jest.fn(async (_locale: string) => [{ id: 'post-1' }]);
const getAllTopicsMock = jest.fn(async (_locale: string) => [{ id: 'topic-1' }]);
const getTopTopicsFromPostsMock = jest.fn((_posts: unknown[], _topics: unknown[]) => [{ id: 'topic-1' }]);
const getLayoutPostsMock = jest.fn((_posts: unknown[]) => [{ id: 'post-1' }]);
const callbackPageMock = jest.fn((_props: unknown) => <div data-testid="callback-page">callback-page</div>);

jest.mock('@/i18n/server', () => ({
  getServerTranslator: (locale: string, ns: string[]) => getServerTranslatorMock(locale, ns),
  loadLocaleResources: (locale: string, ns: string[]) => loadLocaleResourcesMock(locale, ns),
}));

jest.mock('@/i18n/RouteI18nProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/lib/posts', () => ({
  getSortedPostsData: (locale: string) => getSortedPostsDataMock(locale),
  getAllTopics: (locale: string) => getAllTopicsMock(locale),
  getTopTopicsFromPosts: (posts: unknown[], topics: unknown[]) => getTopTopicsFromPostsMock(posts, topics),
  getLayoutPosts: (posts: unknown[]) => getLayoutPostsMock(posts),
}));

jest.mock('@/views/NewsletterCallbackPage', () => ({
  __esModule: true,
  default: (props: unknown) => callbackPageMock(props),
}));

describe('App Route /[locale]/callback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds callback metadata with noindex robots', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({
      title: 'Callback Title',
      description: 'Callback Description',
      robots: { index: false, follow: false },
    });
  });

  it('loads route data and renders NewsletterCallbackPage', async () => {
    const element = await NewsletterCallbackRoute({
      params: Promise.resolve({ locale: 'tr' }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(callbackPageMock).toHaveBeenCalledWith({
      locale: 'tr',
      layoutPosts: [{ id: 'post-1' }],
      topics: [{ id: 'topic-1' }],
      preFooterTopTopics: [{ id: 'topic-1' }],
    });
    expect(screen.getByTestId('callback-page')).toBeInTheDocument();
  });
});
