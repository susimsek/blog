import React from 'react';
import { render, screen } from '@testing-library/react';
import SearchRoute, { generateMetadata } from '@/app/[locale]/search/page';

const getServerTranslatorMock = jest.fn(async () => ({
  t: (key: string) =>
    ({
      'search.title': 'Search Title',
      'search.meta.description': 'Search Description',
      'search.meta.keywords': 'search,meta,keywords',
    })[key] ?? key,
}));

const getSortedPostsDataMock = jest.fn(async () => [{ id: 'post-1' }]);
const getAllTopicsMock = jest.fn(async () => [{ id: 'topic-1' }]);
const getTopTopicsFromPostsMock = jest.fn(() => [{ id: 'topic-1' }]);
const searchPageMock = jest.fn(() => <div data-testid="search-page">search-page</div>);

jest.mock('@/i18n/server', () => ({
  getServerTranslator: (locale: string, ns: string[]) => getServerTranslatorMock(locale, ns),
}));

jest.mock('@/lib/posts', () => ({
  getSortedPostsData: (locale: string) => getSortedPostsDataMock(locale),
  getAllTopics: (locale: string) => getAllTopicsMock(locale),
  getTopTopicsFromPosts: (posts: unknown[], topics: unknown[]) => getTopTopicsFromPostsMock(posts, topics),
}));

jest.mock('@/views/SearchPage', () => ({
  __esModule: true,
  default: (props: { allPosts: unknown[]; topics: unknown[]; preFooterTopTopics: unknown[] }) => searchPageMock(props),
}));

describe('App Route /[locale]/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds metadata with noindex robots', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'en' }) });

    expect(metadata).toMatchObject({
      title: 'Search Title',
      description: 'Search Description',
      keywords: 'search,meta,keywords',
      robots: {
        index: false,
        follow: true,
      },
    });
  });

  it('loads search data and renders SearchPage view', async () => {
    const element = await SearchRoute({ params: Promise.resolve({ locale: 'tr' }) });
    render(element);

    expect(getSortedPostsDataMock).toHaveBeenCalledWith('tr');
    expect(getAllTopicsMock).toHaveBeenCalledWith('tr');
    expect(searchPageMock).toHaveBeenCalledWith({
      allPosts: [{ id: 'post-1' }],
      topics: [{ id: 'topic-1' }],
      preFooterTopTopics: [{ id: 'topic-1' }],
    });
    expect(screen.getByTestId('search-page')).toBeInTheDocument();
  });
});
