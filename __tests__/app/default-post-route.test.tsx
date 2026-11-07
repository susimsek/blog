import React from 'react';
import { render, screen } from '@testing-library/react';

const notFoundMock = jest.fn(() => {
  throw new Error('NOT_FOUND');
});
const getAllPostIdsMock = jest.fn(async () => [
  { params: { id: 'post-1', locale: 'en' } },
  { params: { id: 'post-1', locale: 'tr' } },
]);
const getPostDataMock = jest.fn(async () => ({
  id: 'post-1',
  title: 'Post title',
  summary: 'Post summary',
  topics: [{ name: 'Testing' }],
  publishedDate: '2026-01-01',
  updatedDate: null,
  thumbnail: null,
}));
const getLocalizedPostPageDataMock = jest.fn(async (_id: string) => ({
  en: { post: { id: 'post-1', title: 'Post title' } },
  tr: { post: null },
}));
const buildPageMetadataMock = jest.fn((metadata: unknown) => metadata);
const buildNotFoundMetadataMock = jest.fn(() => ({ title: 'Not Found' }));
const postPageMock = jest.fn(() => <div data-testid="post-page">Post page</div>);

jest.mock('next/navigation', () => ({ notFound: () => notFoundMock() }));
jest.mock('@/lib/posts', () => ({
  getAllPostIds: () => getAllPostIdsMock(),
  getPostData: () => getPostDataMock(),
}));
jest.mock('@/lib/localizedPageData', () => ({
  getLocalizedPostPageData: (id: string) => getLocalizedPostPageDataMock(id),
}));
jest.mock('@/lib/metadata', () => ({
  buildNotFoundMetadata: () => buildNotFoundMetadataMock(),
  buildPageMetadata: (metadata: unknown) => buildPageMetadataMock(metadata),
}));
jest.mock('@/views/PostPage', () => ({ __esModule: true, default: () => postPageMock() }));

import PostRoute, { generateMetadata, generateStaticParams } from '@/app/(default)/posts/[id]/page';

describe('default post route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPostDataMock.mockResolvedValue({
      id: 'post-1',
      title: 'Post title',
      summary: 'Post summary',
      topics: [{ name: 'Testing' }],
      publishedDate: '2026-01-01',
      updatedDate: null,
      thumbnail: null,
    });
  });

  it('filters static params to the default locale', async () => {
    await expect(generateStaticParams()).resolves.toEqual([{ id: 'post-1' }]);
  });

  it('builds article metadata and uses publication defaults for optional fields', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 'post-1' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({ type: 'article' });
    expect(buildPageMetadataMock).toHaveBeenCalledWith(
      expect.objectContaining({
        keywords: 'Testing',
        image: undefined,
        availableLocales: ['en', 'tr'],
        openGraph: expect.objectContaining({ modifiedTime: '2026-01-01' }),
      }),
    );
  });

  it('returns fallback metadata and not-found for a missing post', async () => {
    getPostDataMock.mockResolvedValueOnce(null as never);
    await expect(
      generateMetadata({ params: Promise.resolve({ id: 'missing' }), searchParams: Promise.resolve({}) }),
    ).resolves.toEqual({ title: 'Not Found' });

    getLocalizedPostPageDataMock.mockResolvedValueOnce({ en: { post: null }, tr: { post: null } } as never);
    await expect(
      PostRoute({ params: Promise.resolve({ id: 'missing' }), searchParams: Promise.resolve({}) }),
    ).rejects.toThrow('NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('renders the post page from localized route data', async () => {
    const element = await PostRoute({
      params: Promise.resolve({ id: 'post-1' }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(getLocalizedPostPageDataMock).toHaveBeenCalledWith('post-1');
    expect(screen.getByTestId('post-page')).toBeInTheDocument();
  });
});
