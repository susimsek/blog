import React from 'react';
import { render, screen } from '@testing-library/react';
import AboutRoute, { generateMetadata } from '@/app/(localized)/[locale]/about/page';

const getServerTranslatorMock = jest.fn(async (_locale: string, _ns: string[]) => ({
  t: (key: string) =>
    ({
      'about.meta.title': 'About Meta Title',
      'about.meta.description': 'About Meta Description',
      'about.meta.keywords': 'about,meta,keywords',
    })[key] ?? key,
}));

const getSortedPostsDataMock = jest.fn(async (_locale: string) => [{ id: 'post-1' }, { id: 'post-2' }]);
const getAllTopicsMock = jest.fn(async (_locale: string) => [{ id: 'topic-1' }]);
const getTopTopicsFromPostsMock = jest.fn((_posts: unknown[], _topics: unknown[]) => [{ id: 'topic-1' }]);
const getLayoutPostsMock = jest.fn((_posts: unknown[]) => [{ id: 'post-1' }]);
const aboutPageMock = jest.fn(
  (_props: { layoutPosts: unknown[]; topics: unknown[]; preFooterTopTopics: unknown[] }) => (
    <div data-testid="about-page">about-page</div>
  ),
);

jest.mock('@/i18n/server', () => ({
  getServerTranslator: (locale: string, ns: string[]) => getServerTranslatorMock(locale, ns),
}));

jest.mock('@/lib/posts', () => ({
  getSortedPostsData: (locale: string) => getSortedPostsDataMock(locale),
  getAllTopics: (locale: string) => getAllTopicsMock(locale),
  getTopTopicsFromPosts: (posts: unknown[], topics: unknown[]) => getTopTopicsFromPostsMock(posts, topics),
  getLayoutPosts: (posts: unknown[]) => getLayoutPostsMock(posts),
}));

jest.mock('@/views/AboutPage', () => ({
  __esModule: true,
  default: (props: { layoutPosts: unknown[]; topics: unknown[]; preFooterTopTopics: unknown[] }) =>
    aboutPageMock(props),
}));

describe('App Route /[locale]/about', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds metadata from i18n translator', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({
      title: 'About Meta Title',
      description: 'About Meta Description',
      keywords: 'about,meta,keywords',
    });
  });

  it('loads page data and renders AboutPage view', async () => {
    const element = await AboutRoute({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(getSortedPostsDataMock).toHaveBeenCalledWith('en');
    expect(getAllTopicsMock).toHaveBeenCalledWith('en');
    expect(getTopTopicsFromPostsMock).toHaveBeenCalled();
    expect(getLayoutPostsMock).toHaveBeenCalled();
    expect(aboutPageMock).toHaveBeenCalledWith({
      layoutPosts: [{ id: 'post-1' }],
      topics: [{ id: 'topic-1' }],
      preFooterTopTopics: [{ id: 'topic-1' }],
    });
    expect(screen.getByTestId('about-page')).toBeInTheDocument();
  });
});
