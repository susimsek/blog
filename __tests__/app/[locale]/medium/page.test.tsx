import React from 'react';
import { render, screen } from '@testing-library/react';
import MediumRoute, { generateMetadata } from '@/app/[locale]/medium/page';

const getServerTranslatorMock = jest.fn(async (_locale: string, _ns: string[]) => ({
  t: (key: string) =>
    ({
      'medium.meta.title': 'Medium Meta Title',
      'medium.meta.description': 'Medium Meta Description',
      'medium.meta.keywords': 'medium,meta,keywords',
    })[key] ?? key,
}));

const fetchRssSummariesMock = jest.fn(async (_locale: string) => [{ id: 'medium-1' }]);
const getSortedPostsDataMock = jest.fn(async (_locale: string) => [{ id: 'post-1' }, { id: 'post-2' }]);
const getLayoutPostsMock = jest.fn((_posts: unknown[]) => [{ id: 'post-1' }]);
const getAllTopicsMock = jest.fn(async (_locale: string) => [{ id: 'topic-1' }]);
const getTopTopicsFromPostsMock = jest.fn((_posts: unknown[], _topics: unknown[]) => [{ id: 'topic-1' }]);
const mediumPageMock = jest.fn(
  (_props: { mediumPosts: unknown[]; layoutPosts: unknown[]; topics: unknown[]; preFooterTopTopics: unknown[] }) => (
    <div data-testid="medium-page">medium-page</div>
  ),
);

jest.mock('@/i18n/server', () => ({
  getServerTranslator: (locale: string, ns: string[]) => getServerTranslatorMock(locale, ns),
}));

jest.mock('@/lib/medium', () => ({
  fetchRssSummaries: (locale: string) => fetchRssSummariesMock(locale),
}));

jest.mock('@/lib/posts', () => ({
  getSortedPostsData: (locale: string) => getSortedPostsDataMock(locale),
  getLayoutPosts: (posts: unknown[]) => getLayoutPostsMock(posts),
  getAllTopics: (locale: string) => getAllTopicsMock(locale),
  getTopTopicsFromPosts: (posts: unknown[], topics: unknown[]) => getTopTopicsFromPostsMock(posts, topics),
}));

jest.mock('@/views/MediumPage', () => ({
  __esModule: true,
  default: (props: {
    mediumPosts: unknown[];
    layoutPosts: unknown[];
    topics: unknown[];
    preFooterTopTopics: unknown[];
  }) => mediumPageMock(props),
}));

describe('App Route /[locale]/medium', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds metadata from i18n translator', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({
      title: 'Medium Meta Title',
      description: 'Medium Meta Description',
      keywords: 'medium,meta,keywords',
    });
  });

  it('loads medium/posts data and renders MediumPage view', async () => {
    const element = await MediumRoute({
      params: Promise.resolve({ locale: 'tr' }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(fetchRssSummariesMock).toHaveBeenCalledWith('tr');
    expect(getSortedPostsDataMock).toHaveBeenCalledWith('tr');
    expect(mediumPageMock).toHaveBeenCalledWith({
      mediumPosts: [{ id: 'medium-1' }],
      layoutPosts: [{ id: 'post-1' }],
      topics: [{ id: 'topic-1' }],
      preFooterTopTopics: [{ id: 'topic-1' }],
    });
    expect(screen.getByTestId('medium-page')).toBeInTheDocument();
  });
});
