import React from 'react';
import { render, screen } from '@testing-library/react';

const notFoundMock = jest.fn(() => {
  throw new Error('NOT_FOUND');
});

const getAllCategoryIdsMock = jest.fn(async () => [{ params: { locale: 'en', id: 'frontend' } }]);
const getCategoryDataMock = jest.fn(async (_locale: string, id: string) =>
  id === 'frontend' ? { id: 'frontend', name: 'Frontend', color: '#fff' } : null,
);
const getAllTopicsMock = jest.fn(async () => [{ id: 'topic-1' }]);
const getSortedPostsDataMock = jest.fn(async () => [
  { id: 'post-1', category: { id: 'frontend' } },
  { id: 'post-2', category: { id: 'backend' } },
]);
const getLayoutPostsMock = jest.fn(() => [{ id: 'post-1' }]);
const getTopTopicsFromPostsMock = jest.fn(() => [{ id: 'topic-1' }]);
const getServerTranslatorMock = jest.fn(async () => ({
  t: (key: string, options?: Record<string, string>) =>
    key === 'category.title' ? `Category ${options?.category}` : key,
}));
const loadLocaleResourcesMock = jest.fn(async () => ({ category: { title: 'Category' } }));
const categoryPageMock = jest.fn(() => <div data-testid="category-page">category-page</div>);

jest.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}));

jest.mock('@/lib/posts', () => ({
  getAllCategoryIds: () => getAllCategoryIdsMock(),
  getCategoryData: (locale: string, id: string) => getCategoryDataMock(locale, id),
  getAllTopics: (locale: string) => getAllTopicsMock(locale),
  getSortedPostsData: (locale: string) => getSortedPostsDataMock(locale),
  getLayoutPosts: (posts: unknown[]) => getLayoutPostsMock(posts),
  getTopTopicsFromPosts: (posts: unknown[], topics: unknown[]) => getTopTopicsFromPostsMock(posts, topics),
}));

jest.mock('@/i18n/server', () => ({
  getServerTranslator: (locale: string, ns: string[]) => getServerTranslatorMock(locale, ns),
  loadLocaleResources: (locale: string, ns: string[]) => loadLocaleResourcesMock(locale, ns),
}));

jest.mock('@/i18n/RouteI18nProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/views/CategoryPage', () => ({
  __esModule: true,
  default: (props: unknown) => categoryPageMock(props),
}));

import CategoryRoute, { generateMetadata, generateStaticParams } from '@/app/(localized)/[locale]/categories/[id]/page';

describe('App Route /[locale]/categories/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates static params from category ids', async () => {
    await expect(generateStaticParams()).resolves.toEqual([{ locale: 'en', id: 'frontend' }]);
  });

  it('builds category metadata when category exists', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en', id: 'frontend' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({
      title: 'Category Frontend',
    });
  });

  it('renders not-found metadata when category is missing', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en', id: 'missing' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({
      title: 'Not Found',
    });
  });

  it('loads posts and renders CategoryPage', async () => {
    const element = await CategoryRoute({
      params: Promise.resolve({ locale: 'en', id: 'frontend' }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(categoryPageMock).toHaveBeenCalledWith({
      locale: 'en',
      category: { id: 'frontend', name: 'Frontend', color: '#fff' },
      posts: [{ id: 'post-1', category: { id: 'frontend' } }],
      layoutPosts: [{ id: 'post-1' }],
      topics: [{ id: 'topic-1' }],
      preFooterTopTopics: [{ id: 'topic-1' }],
    });
    expect(screen.getByTestId('category-page')).toBeInTheDocument();
  });

  it('calls notFound when category is missing', async () => {
    await expect(
      CategoryRoute({
        params: Promise.resolve({ locale: 'en', id: 'missing' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
