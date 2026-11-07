import React from 'react';
import { render, screen } from '@testing-library/react';

const notFoundMock = jest.fn(() => {
  throw new Error('NOT_FOUND');
});
const getAllTopicIdsMock = jest.fn(async () => [
  { params: { id: 'games', locale: 'en' } },
  { params: { id: 'games', locale: 'tr' } },
]);
const getTopicDataMock = jest.fn(async (_locale: string, _id: string) => ({ id: 'games', name: 'Games' }));
const getLocalizedTopicPageDataMock = jest.fn(async (_id: string) => ({
  en: { topic: { id: 'games', name: 'Games' } },
}));
const getServerTranslatorMock = jest.fn(async (_locale: string, _namespaces: string[]) => ({
  t: (key: string) => key,
}));
const buildPageMetadataMock = jest.fn((metadata: unknown) => metadata);
const buildNotFoundMetadataMock = jest.fn(() => ({ title: 'Not Found' }));
const topicPageMock = jest.fn(() => <div data-testid="topic-page">Topic page</div>);

jest.mock('next/navigation', () => ({ notFound: () => notFoundMock() }));
jest.mock('@/lib/posts', () => ({
  getAllTopicIds: () => getAllTopicIdsMock(),
  getTopicData: (locale: string, id: string) => getTopicDataMock(locale, id),
}));
jest.mock('@/lib/localizedPageData', () => ({
  getLocalizedTopicPageData: (id: string) => getLocalizedTopicPageDataMock(id),
}));
jest.mock('@/i18n/server', () => ({
  getServerTranslator: (locale: string, ns: string[]) => getServerTranslatorMock(locale, ns),
}));
jest.mock('@/lib/metadata', () => ({
  buildNotFoundMetadata: () => buildNotFoundMetadataMock(),
  buildPageMetadata: (metadata: unknown) => buildPageMetadataMock(metadata),
}));
jest.mock('@/views/TopicPage', () => ({ __esModule: true, default: () => topicPageMock() }));

import TopicRoute, { generateMetadata, generateStaticParams } from '@/app/(default)/topics/[id]/page';

describe('default topic route', () => {
  beforeEach(() => jest.clearAllMocks());

  it('generates default-locale params and metadata', async () => {
    await expect(generateStaticParams()).resolves.toEqual([{ id: 'games' }]);
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 'games' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({ title: 'topic.title' });
    expect(getServerTranslatorMock).toHaveBeenCalledWith('en', ['topic']);
    expect(buildPageMetadataMock).toHaveBeenCalledWith(
      expect.objectContaining({ availableLocales: ['en', 'tr'], path: 'topics/games' }),
    );
  });

  it('renders the topic page from localized route data', async () => {
    const element = await TopicRoute({
      params: Promise.resolve({ id: 'games' }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(getLocalizedTopicPageDataMock).toHaveBeenCalledWith('games');
    expect(screen.getByTestId('topic-page')).toBeInTheDocument();
  });

  it('uses not-found metadata and route handling for a missing topic', async () => {
    getTopicDataMock.mockResolvedValueOnce(null as never);
    await expect(
      generateMetadata({ params: Promise.resolve({ id: 'missing' }), searchParams: Promise.resolve({}) }),
    ).resolves.toEqual({ title: 'Not Found' });
    getLocalizedTopicPageDataMock.mockResolvedValueOnce({ en: { topic: null } } as never);
    await expect(
      TopicRoute({ params: Promise.resolve({ id: 'missing' }), searchParams: Promise.resolve({}) }),
    ).rejects.toThrow('NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
