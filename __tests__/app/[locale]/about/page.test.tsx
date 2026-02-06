import React from 'react';
import { render, screen } from '@testing-library/react';
import AboutRoute, { generateMetadata } from '@/app/[locale]/about/page';

const getServerTranslatorMock = jest.fn(async () => ({
  t: (key: string) =>
    ({
      'about.meta.title': 'About Meta Title',
      'about.meta.description': 'About Meta Description',
      'about.meta.keywords': 'about,meta,keywords',
    })[key] ?? key,
}));

const getSortedPostsDataMock = jest.fn(async () => [{ id: 'post-1' }, { id: 'post-2' }]);
const getAllTopicsMock = jest.fn(async () => [{ id: 'topic-1' }]);
const getTopTopicsFromPostsMock = jest.fn(() => [{ id: 'topic-1' }]);
const getLayoutPostsMock = jest.fn(() => [{ id: 'post-1' }]);
const aboutPageMock = jest.fn(() => <div data-testid="about-page">about-page</div>);

jest.mock('@/i18n/server', () => ({
  getServerTranslator: (locale: string, ns: string[]) => getServerTranslatorMock(locale, ns),
}));

jest.mock('@/lib/posts', () => ({
  getSortedPostsData: (locale: string) => getSortedPostsDataMock(locale),
  getAllTopics: (locale: string) => getAllTopicsMock(locale),
  getTopTopicsFromPosts: (posts: unknown[], topics: unknown[]) => getTopTopicsFromPostsMock(posts, topics),
  getLayoutPosts: (posts: unknown[]) => getLayoutPostsMock(posts),
}));

jest.mock('@/appViews/AboutPage', () => ({
  __esModule: true,
  default: (props: { layoutPosts: unknown[]; topics: unknown[]; preFooterTopTopics: unknown[] }) =>
    aboutPageMock(props),
}));

describe('App Route /[locale]/about', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds metadata from i18n translator', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });

    expect(metadata).toMatchObject({
      title: 'About Meta Title',
      description: 'About Meta Description',
      keywords: 'about,meta,keywords',
    });
  });

  it('loads page data and renders AboutPage view', async () => {
    const element = await AboutRoute({ params: Promise.resolve({ locale: 'en' }) });
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
