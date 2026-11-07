import { renderHook, waitFor } from '@testing-library/react';
import type { TFunction } from 'i18next';
import {
  fetchAdminContentCategories,
  fetchAdminContentCategoriesPage,
  fetchAdminContentTopics,
  fetchAdminContentTopicsPage,
  isAdminSessionError,
  resolveAdminError,
  type AdminContentCategoryItem,
  type AdminContentTopicItem,
} from '@/lib/adminApi';
import { useAdminContentTaxonomySection } from '@/hooks/admin-content/useAdminContentTaxonomySection';

jest.mock('@/lib/adminApi', () => ({
  fetchAdminContentCategories: jest.fn(),
  fetchAdminContentCategoriesPage: jest.fn(),
  fetchAdminContentTopics: jest.fn(),
  fetchAdminContentTopicsPage: jest.fn(),
  isAdminSessionError: jest.fn(() => false),
  resolveAdminError: jest.fn((error: unknown) => ({
    kind: 'unknown',
    message: error instanceof Error ? error.message : '',
  })),
}));

jest.mock('@/hooks/admin-content/useAdminContentCategorySection', () => ({
  useAdminContentCategorySection: () => ({ categoryEditorMode: 'create' }),
}));
jest.mock('@/hooks/admin-content/useAdminContentTopicSection', () => ({
  useAdminContentTopicSection: () => ({ topicEditorMode: 'create' }),
}));

const topic: AdminContentTopicItem = {
  locale: 'EN',
  id: 'Sports',
  name: 'Sports',
  color: '#123456',
  link: null,
  updatedAt: null,
};
const category: AdminContentCategoryItem = {
  locale: 'TR',
  id: 'Games',
  name: 'Games',
  color: '#654321',
  icon: null,
  link: null,
  updatedAt: null,
};
const topicPagePayload = (item: AdminContentTopicItem): Awaited<ReturnType<typeof fetchAdminContentTopicsPage>> => ({
  items: [{ id: item.id, preferred: item, en: item, tr: null }],
  total: 1,
  page: 1,
  size: 500,
});
const categoryPagePayload = (
  item: AdminContentCategoryItem,
): Awaited<ReturnType<typeof fetchAdminContentCategoriesPage>> => ({
  items: [{ id: item.id, preferred: item, en: item, tr: null }],
  total: 1,
  page: 1,
  size: 500,
});
const makeParams = (overrides: Partial<Parameters<typeof useAdminContentTaxonomySection>[0]> = {}) => ({
  filterLocale: 'all' as const,
  currentDatePickerLocale: 'tr',
  routeLocale: 'en',
  onSessionExpired: jest.fn(),
  t: ((key: string) => key) as TFunction,
  setErrorMessage: jest.fn(),
  setSuccessMessage: jest.fn(),
  reloadPosts: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('useAdminContentTaxonomySection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchAdminContentTopics).mockResolvedValue([topic]);
    jest.mocked(fetchAdminContentCategories).mockResolvedValue([category]);
    jest.mocked(fetchAdminContentTopicsPage).mockResolvedValue(topicPagePayload(topic));
    jest.mocked(fetchAdminContentCategoriesPage).mockResolvedValue(categoryPagePayload(category));
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockImplementation((error: unknown) => ({
      kind: 'unknown',
      message: error instanceof Error ? error.message : '',
    }));
  });

  it('loads taxonomies, indexes normalized IDs and filters localized options', async () => {
    const { result } = renderHook(() => useAdminContentTaxonomySection(makeParams()));

    await waitFor(() => expect(result.current.topicsByLocaleAndID.get('en|sports')).toEqual(topic));
    expect(fetchAdminContentTopicsPage).toHaveBeenCalledWith({
      locale: undefined,
      preferredLocale: 'en',
      page: 1,
      size: 500,
    });
    expect(fetchAdminContentCategoriesPage).toHaveBeenCalledWith({
      locale: undefined,
      preferredLocale: 'en',
      page: 1,
      size: 500,
    });
    expect(result.current.preferredContentLocale).toBe('tr');
    expect(result.current.categoriesByLocaleAndID.get('tr|games')).toEqual(category);
    expect(result.current.filterTopicOptions).toEqual([topic]);
    expect(result.current.filterCategoryOptions).toEqual([category]);

    expect(result.current.topicEditorMode).toBe('create');
    expect(result.current.categoryEditorMode).toBe('create');
  });

  it('loads explicit locale options and resolves taxonomy load errors and expired sessions', async () => {
    const options = makeParams({ filterLocale: 'en', currentDatePickerLocale: 'en', routeLocale: 'tr' });
    const { result, rerender } = renderHook(({ params }) => useAdminContentTaxonomySection(params), {
      initialProps: { params: options },
    });

    await waitFor(() => expect(result.current.preferredContentLocale).toBe('en'));
    expect(fetchAdminContentTopicsPage).toHaveBeenCalledWith({
      locale: 'en',
      preferredLocale: 'tr',
      page: 1,
      size: 500,
    });

    jest.mocked(fetchAdminContentTopics).mockRejectedValueOnce(new Error('topics unavailable'));
    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'unknown', message: '' } as never);
    const failed = makeParams();
    rerender({ params: failed });
    await waitFor(() =>
      expect(failed.setErrorMessage).toHaveBeenCalledWith('adminAccount.content.errors.taxonomyLoad'),
    );

    jest.mocked(fetchAdminContentCategoriesPage).mockRejectedValueOnce(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValueOnce(true);
    const expired = makeParams({ filterLocale: 'tr' });
    rerender({ params: expired });
    await waitFor(() => expect(expired.onSessionExpired).toHaveBeenCalled());
  });
});
