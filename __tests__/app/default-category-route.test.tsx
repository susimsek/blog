import React from 'react';
import { render, screen } from '@testing-library/react';

const notFoundMock = jest.fn(() => {
  throw new Error('NOT_FOUND');
});
const getAllCategoryIdsMock = jest.fn(async () => [
  { params: { id: 'games', locale: 'en' } },
  { params: { id: 'games', locale: 'tr' } },
]);
const getCategoryDataMock = jest.fn(async (_locale: string, _id: string) => ({ id: 'games', name: 'Games' }));
const getLocalizedCategoryPageDataMock = jest.fn(async (_id: string) => ({
  en: { category: { id: 'games', name: 'Games' } },
}));
const getServerTranslatorMock = jest.fn(async (_locale: string, _namespaces: string[]) => ({
  t: (key: string) => key,
}));
const loadLocaleResourcesMock = jest.fn(async (_locale: string, _namespaces: string[]) => ({ category: {} }));
const buildPageMetadataMock = jest.fn((metadata: unknown) => metadata);
const buildNotFoundMetadataMock = jest.fn(() => ({ title: 'Not Found' }));
const categoryPageMock = jest.fn(() => <div data-testid="category-page">Category page</div>);

jest.mock('next/navigation', () => ({ notFound: () => notFoundMock() }));
jest.mock('@/lib/posts', () => ({
  getAllCategoryIds: () => getAllCategoryIdsMock(),
  getCategoryData: (locale: string, id: string) => getCategoryDataMock(locale, id),
}));
jest.mock('@/lib/localizedPageData', () => ({
  getLocalizedCategoryPageData: (id: string) => getLocalizedCategoryPageDataMock(id),
}));
jest.mock('@/i18n/server', () => ({
  getServerTranslator: (locale: string, ns: string[]) => getServerTranslatorMock(locale, ns),
  loadLocaleResources: (locale: string, ns: string[]) => loadLocaleResourcesMock(locale, ns),
}));
jest.mock('@/i18n/RouteI18nProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/lib/metadata', () => ({
  buildNotFoundMetadata: () => buildNotFoundMetadataMock(),
  buildPageMetadata: (metadata: unknown) => buildPageMetadataMock(metadata),
}));
jest.mock('@/views/CategoryPage', () => ({ __esModule: true, default: () => categoryPageMock() }));

import CategoryRoute, { generateMetadata, generateStaticParams } from '@/app/(default)/categories/[id]/page';

describe('default category route', () => {
  beforeEach(() => jest.clearAllMocks());

  it('generates default-locale params and metadata', async () => {
    await expect(generateStaticParams()).resolves.toEqual([{ id: 'games' }]);
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 'games' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({ title: 'category.title' });
    expect(getServerTranslatorMock).toHaveBeenCalledWith('en', ['category']);
    expect(buildPageMetadataMock).toHaveBeenCalledWith(
      expect.objectContaining({ availableLocales: ['en', 'tr'], path: 'categories/games' }),
    );
  });

  it('renders the category page with default-locale resources', async () => {
    const element = await CategoryRoute({
      params: Promise.resolve({ id: 'games' }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(getLocalizedCategoryPageDataMock).toHaveBeenCalledWith('games');
    expect(loadLocaleResourcesMock).toHaveBeenCalledWith('en', ['category']);
    expect(screen.getByTestId('category-page')).toBeInTheDocument();
  });

  it('uses not-found metadata and route handling for a missing category', async () => {
    getCategoryDataMock.mockResolvedValueOnce(null as never);
    await expect(
      generateMetadata({ params: Promise.resolve({ id: 'missing' }), searchParams: Promise.resolve({}) }),
    ).resolves.toEqual({ title: 'Not Found' });
    getLocalizedCategoryPageDataMock.mockResolvedValueOnce({ en: { category: null } } as never);
    await expect(
      CategoryRoute({ params: Promise.resolve({ id: 'missing' }), searchParams: Promise.resolve({}) }),
    ).rejects.toThrow('NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
