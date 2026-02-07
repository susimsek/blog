import React from 'react';
import { render, screen } from '@testing-library/react';

const notFoundMock = jest.fn(() => {
  throw new Error('NOT_FOUND');
});

const getAllPostIdsMock = jest.fn(async () => [
  { params: { id: '1', locale: 'en' } },
  { params: { id: '1', locale: 'tr' } },
]);
const getPostDataMock = jest.fn(async () => ({ id: '1', title: 'Post Title', summary: 'Post Summary', topics: [] }));
const getSortedPostsDataMock = jest.fn(async () => [{ id: '1' }, { id: '2' }]);
const getLayoutPostsMock = jest.fn(() => [{ id: '1' }]);
const getAllTopicsMock = jest.fn(async () => [{ id: 'topic-1' }]);
const getTopTopicsFromPostsMock = jest.fn(() => [{ id: 'topic-1' }]);
const getRelatedPostsMock = jest.fn(() => [{ id: '2' }]);
const postPageMock = jest.fn(() => <div data-testid="post-page">post-page</div>);

jest.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}));

jest.mock('@/lib/posts', () => ({
  getAllPostIds: () => getAllPostIdsMock(),
  getPostData: (id: string, locale: string) => getPostDataMock(id, locale),
  getSortedPostsData: (locale: string) => getSortedPostsDataMock(locale),
  getLayoutPosts: (posts: unknown[]) => getLayoutPostsMock(posts),
  getAllTopics: (locale: string) => getAllTopicsMock(locale),
  getTopTopicsFromPosts: (posts: unknown[], topics: unknown[]) => getTopTopicsFromPostsMock(posts, topics),
}));

jest.mock('@/lib/postFilters', () => ({
  getRelatedPosts: (post: unknown, allPosts: unknown[], limit: number) => getRelatedPostsMock(post, allPosts, limit),
}));

jest.mock('@/views/PostPage', () => ({
  __esModule: true,
  default: (props: {
    locale: string;
    post: Record<string, unknown>;
    relatedPosts: unknown[];
    layoutPosts: unknown[];
    preFooterTopTopics: unknown[];
  }) => postPageMock(props),
}));

import PostRoute, { generateMetadata, generateStaticParams } from '@/app/[locale]/posts/[id]/page';

describe('App Route /[locale]/posts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPostDataMock.mockResolvedValue({ id: '1', title: 'Post Title', summary: 'Post Summary', topics: [] });
  });

  it('generates static params from all post ids', async () => {
    await expect(generateStaticParams()).resolves.toEqual([
      { locale: 'en', id: '1' },
      { locale: 'tr', id: '1' },
    ]);
  });

  it('generates metadata from post content', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'en', id: '1' }) });

    expect(metadata).toMatchObject({
      title: 'Post Title',
      description: 'Post Summary',
      keywords: '',
    });
  });

  it('returns fallback metadata when post is missing', async () => {
    getPostDataMock.mockResolvedValueOnce(null);

    const metadata = await generateMetadata({ params: Promise.resolve({ locale: 'en', id: 'missing' }) });

    expect(metadata).toMatchObject({
      title: 'Not Found',
      robots: { index: false, follow: false },
    });
  });

  it('loads all data and renders PostPage view', async () => {
    const element = await PostRoute({ params: Promise.resolve({ locale: 'tr', id: '1' }) });
    render(element);

    expect(getPostDataMock).toHaveBeenCalledWith('1', 'tr');
    expect(getSortedPostsDataMock).toHaveBeenCalledWith('tr');
    expect(getRelatedPostsMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1' }),
      [{ id: '1' }, { id: '2' }],
      3,
    );
    expect(postPageMock).toHaveBeenCalledWith({
      locale: 'tr',
      post: { id: '1', title: 'Post Title', summary: 'Post Summary', topics: [] },
      relatedPosts: [{ id: '2' }],
      layoutPosts: [{ id: '1' }],
      preFooterTopTopics: [{ id: 'topic-1' }],
    });
    expect(screen.getByTestId('post-page')).toBeInTheDocument();
  });

  it('calls notFound when post does not exist', async () => {
    getPostDataMock.mockResolvedValueOnce(null);

    await expect(PostRoute({ params: Promise.resolve({ locale: 'en', id: 'missing' }) })).rejects.toThrow('NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
