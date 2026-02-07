import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeRoute, { generateMetadata } from '@/app/[locale]/page';

const getServerTranslatorMock = jest.fn(async (_locale: string, _ns: string[]) => ({
  t: (key: string) =>
    ({
      'home.meta.title': 'Home Meta Title',
      'home.meta.description': 'Home Meta Description',
      'home.meta.keywords': 'home,meta,keywords',
    })[key] ?? key,
}));

const getSortedPostsDataMock = jest.fn(async (_locale: string) => [{ id: 'post-1' }]);
const getAllTopicsMock = jest.fn(async (_locale: string) => [{ id: 'topic-1' }]);
const homePageMock = jest.fn((props: { posts: unknown[]; topics: unknown[]; locale: string }) => (
  <div data-testid="home-page">home-page</div>
));

jest.mock('@/i18n/server', () => ({
  getServerTranslator: (locale: string, ns: string[]) => getServerTranslatorMock(locale, ns),
}));

jest.mock('@/lib/posts', () => ({
  getSortedPostsData: (locale: string) => getSortedPostsDataMock(locale),
  getAllTopics: (locale: string) => getAllTopicsMock(locale),
}));

jest.mock('@/views/HomePage', () => ({
  __esModule: true,
  default: (props: { posts: unknown[]; topics: unknown[]; locale: string }) => homePageMock(props),
}));

describe('App Route /[locale]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds metadata from i18n translator', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'tr' }),
      searchParams: Promise.resolve({}),
    });

    expect(getServerTranslatorMock).toHaveBeenCalledWith('tr', ['home']);
    expect(metadata).toMatchObject({
      title: 'Home Meta Title',
      description: 'Home Meta Description',
      keywords: 'home,meta,keywords',
    });
  });

  it('loads posts/topics and renders HomePage view', async () => {
    const element = await HomeRoute({
      params: Promise.resolve({ locale: 'tr' }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(getSortedPostsDataMock).toHaveBeenCalledWith('tr');
    expect(getAllTopicsMock).toHaveBeenCalledWith('tr');
    expect(homePageMock).toHaveBeenCalledWith({
      posts: [{ id: 'post-1' }],
      topics: [{ id: 'topic-1' }],
      locale: 'tr',
    });
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });
});
