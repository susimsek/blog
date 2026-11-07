import { act, renderHook, waitFor } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import {
  createAdminContentCategory,
  createAdminContentTopic,
  deleteAdminContentCategory,
  deleteAdminContentTopic,
  fetchAdminContentCategoriesPage,
  fetchAdminContentTopicsPage,
  isAdminSessionError,
  resolveAdminError,
  updateAdminContentCategory,
  updateAdminContentTopic,
  type AdminContentCategoryItem,
  type AdminContentTopicItem,
} from '@/lib/adminApi';
import { useAdminContentCategorySection } from '@/hooks/admin-content/useAdminContentCategorySection';
import { useAdminContentTopicSection } from '@/hooks/admin-content/useAdminContentTopicSection';

jest.mock('@/lib/adminApi', () => ({
  createAdminContentCategory: jest.fn(),
  createAdminContentTopic: jest.fn(),
  deleteAdminContentCategory: jest.fn(),
  deleteAdminContentTopic: jest.fn(),
  fetchAdminContentCategoriesPage: jest.fn(),
  fetchAdminContentTopicsPage: jest.fn(),
  isAdminSessionError: jest.fn(),
  resolveAdminError: jest.fn(),
  updateAdminContentCategory: jest.fn(),
  updateAdminContentTopic: jest.fn(),
}));

const category: AdminContentCategoryItem = {
  locale: 'en',
  id: 'game-category',
  name: 'Games',
  color: '#123456',
  icon: 'gamepad',
  link: 'https://example.com/games',
  updatedAt: null,
};
const topic: AdminContentTopicItem = {
  locale: 'en',
  id: 'game-topic',
  name: 'Sports',
  color: '#654321',
  link: 'https://example.com/sports',
  updatedAt: null,
};
const t = ((key: string) => key) as TFunction;
const onSessionExpired = jest.fn();
const reloadPosts = jest.fn().mockResolvedValue(undefined);
const loadTaxonomies = jest.fn().mockResolvedValue(undefined);
const loadFilterTaxonomyOptions = jest.fn().mockResolvedValue(undefined);
const categoryPayload = () => ({
  items: [{ id: category.id, preferred: category, en: category, tr: null }],
  total: 1,
  page: 1,
  size: 10,
});
const topicPayload = () => ({
  items: [{ id: topic.id, preferred: topic, en: topic, tr: null }],
  total: 1,
  page: 1,
  size: 10,
});

const renderCategorySection = (
  options: {
    categories?: AdminContentCategoryItem[];
    categoriesByLocaleAndID?: Map<string, AdminContentCategoryItem>;
    filterLocale?: 'all' | 'en' | 'tr';
  } = {},
) =>
  renderHook(() => {
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const section = useAdminContentCategorySection({
      filterLocale: options.filterLocale ?? 'en',
      preferredContentLocale: 'en',
      categories: options.categories ?? [category],
      categoriesByLocaleAndID: options.categoriesByLocaleAndID ?? new Map([[`en|${category.id}`, category]]),
      onSessionExpired,
      t,
      setErrorMessage,
      setSuccessMessage,
      reloadPosts,
      loadTaxonomies,
      loadFilterTaxonomyOptions,
    });
    return { section, errorMessage, successMessage };
  });

const renderTopicSection = (
  options: {
    topics?: AdminContentTopicItem[];
    topicsByLocaleAndID?: Map<string, AdminContentTopicItem>;
  } = {},
) =>
  renderHook(() => {
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const section = useAdminContentTopicSection({
      filterLocale: 'tr',
      preferredContentLocale: 'en',
      topics: options.topics ?? [topic],
      topicsByLocaleAndID: options.topicsByLocaleAndID ?? new Map([[`en|${topic.id}`, topic]]),
      onSessionExpired,
      t,
      setErrorMessage,
      setSuccessMessage,
      reloadPosts,
      loadTaxonomies,
      loadFilterTaxonomyOptions,
    });
    return { section, errorMessage, successMessage };
  });

describe('admin content taxonomy sections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchAdminContentCategoriesPage).mockResolvedValue(categoryPayload());
    jest.mocked(fetchAdminContentTopicsPage).mockResolvedValue(topicPayload());
    jest.mocked(createAdminContentCategory).mockResolvedValue(category);
    jest.mocked(createAdminContentTopic).mockResolvedValue(topic);
    jest.mocked(updateAdminContentCategory).mockResolvedValue(category);
    jest.mocked(updateAdminContentTopic).mockResolvedValue(topic);
    jest.mocked(deleteAdminContentCategory).mockResolvedValue(true);
    jest.mocked(deleteAdminContentTopic).mockResolvedValue(true);
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: 'Request failed' });
  });

  it('loads categories, resolves localized editors, creates, updates, and deletes', async () => {
    const { result } = renderCategorySection();
    await waitFor(() => expect(result.current.section.categoryListItems).toHaveLength(1));
    expect(fetchAdminContentCategoriesPage).toHaveBeenCalledWith({
      locale: undefined,
      preferredLocale: 'en',
      query: '',
      page: 1,
      size: 10,
    });

    act(() => {
      result.current.section.handleOpenCreateCategory();
      result.current.section.setCategoryID(category.id);
    });
    act(() => result.current.section.handleSwitchCategoryEditorLocale('tr'));
    expect(result.current.section.categoryEditorMode).toBe('create');
    expect(result.current.section.categoryLocale).toBe('tr');
    expect(result.current.section.categoryName).toBe(category.name);
    expect(result.current.section.categoryLocaleTabs).toEqual([
      { locale: 'en', available: true },
      { locale: 'tr', available: false },
    ]);
    act(() => {
      result.current.section.setCategoryColor('#abcdef');
      result.current.section.setCategoryLink('https://example.com/new');
    });
    expect(result.current.section.canSubmitCategory).toBe(true);
    await act(async () => result.current.section.handleSubmitCategory());
    expect(createAdminContentCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'tr',
        id: category.id,
        name: category.name,
        color: '#abcdef',
      }),
    );
    expect(result.current.successMessage).toBe('adminAccount.content.success.categoryCreated');
    expect(loadTaxonomies).toHaveBeenCalled();
    expect(loadFilterTaxonomyOptions).toHaveBeenCalled();
    expect(reloadPosts).toHaveBeenCalled();

    act(() => result.current.section.handleOpenUpdateCategory(category));
    expect(result.current.section.categoryEditorMode).toBe('update');
    expect(result.current.section.categoryIcon).toBe('gamepad');
    act(() => result.current.section.setCategoryName('Updated games'));
    await act(async () => result.current.section.handleSubmitCategory());
    expect(updateAdminContentCategory).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated games' }));
    expect(result.current.successMessage).toBe('adminAccount.content.success.categoryUpdated');

    act(() => result.current.section.setPendingCategoryDelete(category));
    await act(async () => result.current.section.handleDeleteCategory());
    expect(deleteAdminContentCategory).toHaveBeenCalledWith({ locale: 'en', id: category.id });
    expect(result.current.section.pendingCategoryDelete).toBeNull();
    expect(result.current.successMessage).toBe('adminAccount.content.success.categoryDeleted');

    jest.mocked(deleteAdminContentCategory).mockResolvedValue(false);
    act(() => result.current.section.setPendingCategoryDelete(category));
    await act(async () => result.current.section.handleDeleteCategory());
    expect(result.current.errorMessage).toBe('Request failed');
    expect(result.current.section.isCategoryDeleting).toBe(false);

    jest.mocked(createAdminContentCategory).mockRejectedValue(new Error('create failed'));
    act(() => {
      result.current.section.handleOpenCreateCategory();
      result.current.section.setCategoryID('new-category');
      result.current.section.setCategoryName('New category');
      result.current.section.setCategoryColor('#abcdef');
    });
    await act(async () => result.current.section.handleSubmitCategory());
    expect(result.current.errorMessage).toBe('Request failed');
  });

  it('loads topics, supports update and localized fallback creation, and handles delete errors', async () => {
    const { result } = renderTopicSection();
    await waitFor(() => expect(result.current.section.topicListItems).toHaveLength(1));
    expect(fetchAdminContentTopicsPage).toHaveBeenCalledWith({
      locale: undefined,
      preferredLocale: 'en',
      query: '',
      page: 1,
      size: 10,
    });

    act(() => {
      result.current.section.handleOpenCreateTopic();
      result.current.section.setTopicID(topic.id);
    });
    act(() => result.current.section.handleSwitchTopicEditorLocale('tr'));
    expect(result.current.section.topicEditorMode).toBe('create');
    expect(result.current.section.topicLocale).toBe('tr');
    expect(result.current.section.topicName).toBe(topic.name);
    expect(result.current.section.topicLocaleTabs).toEqual([
      { locale: 'en', available: true },
      { locale: 'tr', available: false },
    ]);
    await act(async () => result.current.section.handleSubmitTopic());
    expect(createAdminContentTopic).toHaveBeenCalledWith(expect.objectContaining({ locale: 'tr', id: topic.id }));
    expect(result.current.successMessage).toBe('adminAccount.content.success.topicCreated');

    act(() => result.current.section.handleOpenUpdateTopic(topic));
    act(() => result.current.section.setTopicName('Updated sports'));
    await act(async () => result.current.section.handleSubmitTopic());
    expect(updateAdminContentTopic).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated sports' }));
    expect(result.current.successMessage).toBe('adminAccount.content.success.topicUpdated');

    act(() => result.current.section.setPendingTopicDelete(topic));
    jest.mocked(deleteAdminContentTopic).mockResolvedValue(false);
    await act(async () => result.current.section.handleDeleteTopic());
    expect(result.current.errorMessage).toBe('Request failed');
    expect(result.current.section.isTopicDeleting).toBe(false);

    jest.mocked(updateAdminContentTopic).mockRejectedValue(new Error('update failed'));
    act(() => {
      result.current.section.handleOpenUpdateTopic(topic);
      result.current.section.setTopicName('Rejected update');
    });
    await act(async () => result.current.section.handleSubmitTopic());
    expect(result.current.errorMessage).toBe('Request failed');
  });

  it('rejects invalid taxonomy input and routes session-expired page loading', async () => {
    jest.mocked(fetchAdminContentCategoriesPage).mockRejectedValue(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValue(true);
    const categorySection = renderCategorySection();
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalled());
    act(() => categorySection.result.current.section.handleOpenCreateCategory());
    act(() => {
      categorySection.result.current.section.setCategoryID('x');
      categorySection.result.current.section.setCategoryName('Name');
      categorySection.result.current.section.setCategoryColor('#fff');
    });
    expect(categorySection.result.current.section.canSubmitCategory).toBe(false);
    await act(async () => categorySection.result.current.section.handleSubmitCategory());
    expect(createAdminContentCategory).not.toHaveBeenCalled();
  });

  it('handles category page fallbacks, locale lookup fallbacks and empty editor fields', async () => {
    const emptyPage = {
      items: null,
      total: 0,
      page: 0,
      size: 0,
    } as unknown as Awaited<ReturnType<typeof fetchAdminContentCategoriesPage>>;
    jest.mocked(fetchAdminContentCategoriesPage).mockResolvedValueOnce(emptyPage);
    const { result } = renderCategorySection({ categoriesByLocaleAndID: new Map() });
    await waitFor(() => expect(fetchAdminContentCategoriesPage).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.section.categoryTotalPages).toBe(1));
    expect(result.current.section.categoryListItems).toEqual([]);
    expect(result.current.section.categoryListTotal).toBe(0);

    jest.mocked(fetchAdminContentCategoriesPage).mockResolvedValue(emptyPage);
    act(() => result.current.section.setCategoryPage(4));
    await waitFor(() =>
      expect(fetchAdminContentCategoriesPage).toHaveBeenLastCalledWith({
        locale: undefined,
        preferredLocale: 'en',
        query: '',
        page: 1,
        size: 10,
      }),
    );
    await waitFor(() => expect(result.current.section.categoryPage).toBe(1));
    act(() => result.current.section.setCategoryID(category.id.toUpperCase()));
    act(() => result.current.section.handleSwitchCategoryEditorLocale('tr'));
    expect(result.current.section.categoryPage).toBe(1);
    expect(result.current.section.categoryLocale).toBe('tr');
    expect(result.current.section.categoryName).toBe('Games');
    expect(result.current.section.categoryIcon).toBe('gamepad');

    act(() => {
      result.current.section.handleOpenUpdateCategory({ ...category, locale: 'tr', icon: null, link: null });
    });
    expect(result.current.section.categoryIcon).toBe('');
    expect(result.current.section.categoryLink).toBe('');
  });

  it('filters category requests by locale and opens a blank localized category when no source exists', async () => {
    jest.mocked(fetchAdminContentCategoriesPage).mockImplementation(async filter => ({
      ...categoryPayload(),
      total: filter?.locale === 'tr' ? 2 : 1,
    }));
    const { result } = renderCategorySection({ categories: [], categoriesByLocaleAndID: new Map() });
    await waitFor(() => expect(result.current.section.categoryListItems).toHaveLength(1));

    act(() => result.current.section.setCategoryFilterLocale('tr'));
    await waitFor(() =>
      expect(fetchAdminContentCategoriesPage).toHaveBeenLastCalledWith({
        locale: 'tr',
        preferredLocale: 'en',
        query: '',
        page: 1,
        size: 10,
      }),
    );
    await waitFor(() => expect(result.current.section.categoryListTotal).toBe(2));

    act(() => result.current.section.setCategoryID('missing-category'));
    act(() => result.current.section.handleSwitchCategoryEditorLocale('tr'));
    expect(result.current.section.categoryEditorMode).toBe('create');
    expect(result.current.section.categoryName).toBe('');
    expect(result.current.section.categoryColor).toBe('');
    expect(result.current.section.categoryIcon).toBe('');
    expect(result.current.section.categoryLink).toBe('');
  });

  it('surfaces a network failure while loading topics', async () => {
    jest.mocked(fetchAdminContentTopicsPage).mockRejectedValue(new Error('topics unavailable'));
    const { result } = renderTopicSection();
    await waitFor(() => expect(result.current.errorMessage).toBe('Request failed'));
    expect(result.current.section.topicListItems).toEqual([]);
    expect(result.current.section.isTopicListLoading).toBe(false);
  });

  it('applies server pagination corrections and clamps a page beyond the final page', async () => {
    jest.mocked(fetchAdminContentTopicsPage).mockResolvedValue({
      ...topicPayload(),
      total: 41,
      page: 2,
      size: 20,
    });
    const { result } = renderTopicSection();

    await waitFor(() => {
      expect(result.current.section.topicPage).toBe(2);
      expect(result.current.section.topicPageSize).toBe(20);
    });
    expect(result.current.section.topicTotalPages).toBe(3);

    jest.mocked(fetchAdminContentTopicsPage).mockResolvedValue({
      ...topicPayload(),
      total: 41,
      page: 3,
      size: 20,
    });
    act(() => result.current.section.setTopicPage(9));
    await waitFor(() => expect(result.current.section.topicPage).toBe(3));
  });

  it('opens an existing translated topic and ignores locale switching without an id', async () => {
    const translatedTopic = { ...topic, locale: 'tr', name: 'Spor' };
    const topicsByLocaleAndID = new Map([
      [`en|${topic.id}`, topic],
      [`tr|${topic.id}`, translatedTopic],
    ]);
    const { result } = renderTopicSection({ topics: [topic, translatedTopic], topicsByLocaleAndID });
    await waitFor(() => expect(result.current.section.topicListItems).toHaveLength(1));

    act(() => {
      result.current.section.handleOpenCreateTopic();
      result.current.section.setTopicID(topic.id);
    });
    act(() => result.current.section.handleSwitchTopicEditorLocale('tr'));
    expect(result.current.section.topicEditorMode).toBe('update');
    expect(result.current.section.topicName).toBe('Spor');

    act(() => result.current.section.handleOpenCreateTopic());
    act(() => result.current.section.handleSwitchTopicEditorLocale('en'));
    expect(result.current.section.topicID).toBe('');
  });

  it('routes topic create and delete session errors through the expiry callback', async () => {
    const { result } = renderTopicSection();
    await waitFor(() => expect(result.current.section.topicListItems).toHaveLength(1));
    jest.mocked(isAdminSessionError).mockReturnValue(true);
    jest.mocked(createAdminContentTopic).mockRejectedValue(new Error('expired'));
    act(() => {
      result.current.section.handleOpenCreateTopic();
      result.current.section.setTopicID('new-topic');
      result.current.section.setTopicName('New topic');
      result.current.section.setTopicColor('#123456');
    });

    await act(async () => result.current.section.handleSubmitTopic());
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(result.current.section.isTopicSubmitting).toBe(false);

    jest.mocked(deleteAdminContentTopic).mockRejectedValue(new Error('expired'));
    act(() => result.current.section.setPendingTopicDelete(topic));
    await act(async () => result.current.section.handleDeleteTopic());
    expect(onSessionExpired).toHaveBeenCalledTimes(2);
    expect(result.current.section.isTopicDeleting).toBe(false);
  });

  it('routes category mutation sessions and shows the localized update fallback', async () => {
    const { result } = renderCategorySection();
    await waitFor(() => expect(result.current.section.categoryListItems).toHaveLength(1));
    jest.mocked(isAdminSessionError).mockReturnValue(true);

    act(() => {
      result.current.section.handleOpenCreateCategory();
      result.current.section.setCategoryID('new-category');
      result.current.section.setCategoryName('New category');
      result.current.section.setCategoryColor('#abcdef');
    });
    jest.mocked(createAdminContentCategory).mockRejectedValueOnce(new Error('expired'));
    await act(async () => result.current.section.handleSubmitCategory());
    expect(onSessionExpired).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.section.handleOpenUpdateCategory(category);
      result.current.section.setCategoryName('Changed category');
    });
    jest.mocked(updateAdminContentCategory).mockRejectedValueOnce(new Error('expired'));
    await act(async () => result.current.section.handleSubmitCategory());
    expect(onSessionExpired).toHaveBeenCalledTimes(2);

    jest.mocked(deleteAdminContentCategory).mockRejectedValueOnce(new Error('expired'));
    act(() => result.current.section.setPendingCategoryDelete(category));
    await act(async () => result.current.section.handleDeleteCategory());
    expect(onSessionExpired).toHaveBeenCalledTimes(3);

    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: '' });
    jest.mocked(updateAdminContentCategory).mockRejectedValueOnce(new Error('update failed'));
    act(() => {
      result.current.section.handleOpenUpdateCategory(category);
      result.current.section.setCategoryName('Another category');
    });
    await act(async () => result.current.section.handleSubmitCategory());
    expect(result.current.errorMessage).toBe('adminAccount.content.errors.categoryUpdate');
    expect(result.current.section.isCategorySubmitting).toBe(false);
  });
});
