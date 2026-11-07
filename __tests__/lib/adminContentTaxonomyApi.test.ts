import {
  createAdminContentCategory,
  createAdminContentTopic,
  deleteAdminContentCategory,
  deleteAdminContentTopic,
  fetchAdminContentCategories,
  fetchAdminContentCategoriesPage,
  fetchAdminContentTopics,
  fetchAdminContentTopicsPage,
  updateAdminContentCategory,
  updateAdminContentTopic,
} from '@/lib/admin-api/content-taxonomy';
import { executeAdminGraphQL } from '@/lib/admin-api/core';

jest.mock('@/lib/admin-api/core', () => ({ executeAdminGraphQL: jest.fn() }));

const respondWith = (value: unknown) => jest.mocked(executeAdminGraphQL).mockResolvedValueOnce(value as never);

describe('admin content taxonomy API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches topics and categories with normalized optional filters', async () => {
    const topics = [{ id: 'gaming' }];
    respondWith({ contentTopics: topics });
    await expect(fetchAdminContentTopics(' EN ', '  sports  ')).resolves.toBe(topics);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { locale: 'en', query: 'sports' },
      expect.objectContaining({ operationName: 'AdminContentTopics' }),
    );

    respondWith({ contentTopics: [] });
    await fetchAdminContentTopics(' ', ' ');
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      {},
      expect.objectContaining({ operationName: 'AdminContentTopics' }),
    );

    const categories = [{ id: 'games' }];
    respondWith({ contentCategories: categories });
    await expect(fetchAdminContentCategories(' TR ')).resolves.toBe(categories);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { locale: 'tr' },
      expect.objectContaining({ operationName: 'AdminContentCategories' }),
    );

    respondWith({ contentCategories: [] });
    await fetchAdminContentCategories(' ');
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      {},
      expect.objectContaining({ operationName: 'AdminContentCategories' }),
    );
  });

  it('normalizes taxonomy page filters while preserving finite page values', async () => {
    const page = { items: [], total: 0, page: 1, size: 20 };
    respondWith({ contentTopicsPage: page });
    await expect(
      fetchAdminContentTopicsPage({
        locale: ' EN ',
        preferredLocale: ' TR ',
        query: '  anime ',
        page: 2,
        size: 10,
      }),
    ).resolves.toBe(page);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: { locale: 'en', preferredLocale: 'tr', query: 'anime', page: 2, size: 10 } },
      expect.objectContaining({ operationName: 'AdminContentTopicsPage' }),
    );

    respondWith({ contentTopicsPage: page });
    await fetchAdminContentTopicsPage({ locale: ' ', preferredLocale: ' ', query: ' ', page: 0, size: Number.NaN });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: {} },
      expect.objectContaining({ operationName: 'AdminContentTopicsPage' }),
    );

    respondWith({ contentCategoriesPage: page });
    await expect(fetchAdminContentCategoriesPage({ locale: 'TR', page: -1, size: 4 })).resolves.toBe(page);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: { locale: 'tr', page: -1, size: 4 } },
      expect.objectContaining({ operationName: 'AdminContentCategoriesPage' }),
    );
  });

  it('omits absent page and taxonomy optionals and requires explicit delete success', async () => {
    const page = { items: [], total: 0, page: 1, size: 20 };
    respondWith({ contentTopicsPage: page });
    await expect(fetchAdminContentTopicsPage()).resolves.toBe(page);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: {} },
      expect.objectContaining({ operationName: 'AdminContentTopicsPage' }),
    );

    respondWith({ contentCategoriesPage: page });
    await expect(fetchAdminContentCategoriesPage()).resolves.toBe(page);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: {} },
      expect.objectContaining({ operationName: 'AdminContentCategoriesPage' }),
    );

    respondWith({ createContentTopic: { id: 'sports' } });
    await createAdminContentTopic({ locale: 'en', id: 'sports', name: 'Sports', color: 'green' });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { locale: 'en', id: 'sports', name: 'Sports', color: 'green' } },
      expect.objectContaining({ operationName: 'AdminCreateContentTopic' }),
    );

    respondWith({ createContentCategory: { id: 'games' } });
    await createAdminContentCategory({ locale: 'en', id: 'games', name: 'Games', color: 'blue' });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { locale: 'en', id: 'games', name: 'Games', color: 'blue' } },
      expect.objectContaining({ operationName: 'AdminCreateContentCategory' }),
    );

    respondWith({ deleteContentTopic: { success: false } });
    await expect(deleteAdminContentTopic({ locale: 'en', id: 'sports' })).resolves.toBe(false);
    respondWith({ deleteContentCategory: { success: false } });
    await expect(deleteAdminContentCategory({ locale: 'en', id: 'games' })).resolves.toBe(false);
  });

  it('creates, updates, and deletes topics with cleaned inputs', async () => {
    const topic = { id: 'sports' };
    respondWith({ createContentTopic: topic });
    await expect(
      createAdminContentTopic({
        locale: ' EN ',
        id: ' SPORTS ',
        name: ' Sports ',
        color: ' #ABCDEF ',
        link: ' /sports ',
      }),
    ).resolves.toBe(topic);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { locale: 'en', id: 'sports', name: 'Sports', color: '#abcdef', link: '/sports' } },
      expect.objectContaining({ operationName: 'AdminCreateContentTopic' }),
    );

    respondWith({ updateContentTopic: topic });
    await updateAdminContentTopic({ locale: 'tr', id: 'id', name: 'Name', color: 'BLUE', link: ' ' });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { locale: 'tr', id: 'id', name: 'Name', color: 'blue' } },
      expect.objectContaining({ operationName: 'AdminUpdateContentTopic' }),
    );

    respondWith({ deleteContentTopic: { success: true } });
    await expect(deleteAdminContentTopic({ locale: ' EN ', id: ' SPORTS ' })).resolves.toBe(true);
    respondWith({});
    await expect(deleteAdminContentTopic({ locale: 'en', id: 'sports' })).resolves.toBe(false);
  });

  it('creates, updates, and deletes categories with optional fields', async () => {
    const category = { id: 'games' };
    respondWith({ createContentCategory: category });
    await expect(
      createAdminContentCategory({
        locale: ' EN ',
        id: ' GAMES ',
        name: ' Games ',
        color: ' RED ',
        icon: ' icon-game ',
        link: ' /games ',
      }),
    ).resolves.toBe(category);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { locale: 'en', id: 'games', name: 'Games', color: 'red', icon: 'icon-game', link: '/games' } },
      expect.objectContaining({ operationName: 'AdminCreateContentCategory' }),
    );

    respondWith({ updateContentCategory: category });
    await updateAdminContentCategory({ locale: 'tr', id: 'id', name: 'Name', color: 'BLUE', icon: ' ', link: null });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { locale: 'tr', id: 'id', name: 'Name', color: 'blue' } },
      expect.objectContaining({ operationName: 'AdminUpdateContentCategory' }),
    );

    respondWith({ deleteContentCategory: { success: true } });
    await expect(deleteAdminContentCategory({ locale: ' EN ', id: ' GAMES ' })).resolves.toBe(true);
    respondWith({});
    await expect(deleteAdminContentCategory({ locale: 'en', id: 'games' })).resolves.toBe(false);
  });
});
