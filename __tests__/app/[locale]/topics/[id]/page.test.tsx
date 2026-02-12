import React from 'react';
import { render, screen } from '@testing-library/react';

const notFoundMock = jest.fn(() => {
  throw new Error('NOT_FOUND');
});

const getAllTopicIdsMock = jest.fn(async () => [
  { params: { id: 'java', locale: 'en' } },
  { params: { id: 'java', locale: 'tr' } },
]);
const getTopicDataMock = jest.fn<Promise<{ id: string; name: string } | null>, [string, string]>(
  async (_locale: string, _id: string) => ({ id: 'java', name: 'Java' }),
);
const getSortedPostsDataMock = jest.fn(async (_locale: string) => [
  { id: '1', topics: [{ id: 'java' }] },
  { id: '2', topics: [] },
]);
const getLayoutPostsMock = jest.fn((_posts: unknown[]) => [{ id: '1' }]);
const getAllTopicsMock = jest.fn(async (_locale: string) => [{ id: 'java', name: 'Java' }]);
const getTopTopicsFromPostsMock = jest.fn((_posts: unknown[], _topics: unknown[]) => [{ id: 'java', name: 'Java' }]);
const getServerTranslatorMock = jest.fn(async (_locale: string, _ns: string[]) => ({
  t: (key: string) =>
    ({
      'topic.title': 'Topic Title',
      'topic.meta.description': 'Topic Description',
      'topic.meta.keywords': 'topic,keywords',
    })[key] ?? key,
}));
const topicPageMock = jest.fn(
  (_props: {
    locale: string;
    topic: Record<string, unknown>;
    posts: unknown[];
    layoutPosts: unknown[];
    topics: unknown[];
    preFooterTopTopics: unknown[];
  }) => <div data-testid="topic-page">topic-page</div>,
);

jest.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}));

jest.mock('@/i18n/server', () => ({
  getServerTranslator: (locale: string, ns: string[]) => getServerTranslatorMock(locale, ns),
}));

jest.mock('@/lib/posts', () => ({
  getAllTopicIds: () => getAllTopicIdsMock(),
  getTopicData: (locale: string, id: string) => getTopicDataMock(locale, id),
  getSortedPostsData: (locale: string) => getSortedPostsDataMock(locale),
  getLayoutPosts: (posts: unknown[]) => getLayoutPostsMock(posts),
  getAllTopics: (locale: string) => getAllTopicsMock(locale),
  getTopTopicsFromPosts: (posts: unknown[], topics: unknown[]) => getTopTopicsFromPostsMock(posts, topics),
}));

jest.mock('@/views/TopicPage', () => ({
  __esModule: true,
  default: (props: {
    locale: string;
    topic: Record<string, unknown>;
    posts: unknown[];
    layoutPosts: unknown[];
    topics: unknown[];
    preFooterTopTopics: unknown[];
  }) => topicPageMock(props),
}));

import TopicRoute, { generateMetadata, generateStaticParams } from '@/app/(localized)/[locale]/topics/[id]/page';

describe('App Route /[locale]/topics/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTopicDataMock.mockResolvedValue({ id: 'java', name: 'Java' });
  });

  it('generates static params from all topic ids', async () => {
    await expect(generateStaticParams()).resolves.toEqual([
      { locale: 'en', id: 'java' },
      { locale: 'tr', id: 'java' },
    ]);
  });

  it('generates metadata from topic + translator', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en', id: 'java' }),
      searchParams: Promise.resolve({}),
    });

    expect(getServerTranslatorMock).toHaveBeenCalledWith('en', ['topic']);
    expect(metadata).toMatchObject({
      title: 'Topic Title',
      description: 'Topic Description',
      keywords: 'topic,keywords',
    });
  });

  it('returns fallback metadata when topic is missing', async () => {
    getTopicDataMock.mockResolvedValueOnce(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en', id: 'missing' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({
      title: 'Not Found',
      robots: { index: false, follow: false },
    });
  });

  it('loads all data and renders TopicPage view', async () => {
    const element = await TopicRoute({
      params: Promise.resolve({ locale: 'tr', id: 'java' }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(getTopicDataMock).toHaveBeenCalledWith('tr', 'java');
    expect(getSortedPostsDataMock).toHaveBeenCalledWith('tr');
    expect(topicPageMock).toHaveBeenCalledWith({
      locale: 'tr',
      topic: { id: 'java', name: 'Java' },
      posts: [{ id: '1', topics: [{ id: 'java' }] }],
      layoutPosts: [{ id: '1' }],
      topics: [{ id: 'java', name: 'Java' }],
      preFooterTopTopics: [{ id: 'java', name: 'Java' }],
    });
    expect(screen.getByTestId('topic-page')).toBeInTheDocument();
  });

  it('calls notFound when topic does not exist', async () => {
    getTopicDataMock.mockResolvedValueOnce(null);

    await expect(
      TopicRoute({
        params: Promise.resolve({ locale: 'en', id: 'missing' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
