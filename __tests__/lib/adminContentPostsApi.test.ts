import {
  deleteAdminContentPost,
  fetchAdminContentPost,
  fetchAdminContentPosts,
  fetchAdminContentPostRevisions,
  restoreAdminContentPostRevision,
  updateAdminContentPostContent,
  updateAdminContentPostMetadata,
} from '@/lib/admin-api/content-posts';
import { executeAdminGraphQL } from '@/lib/admin-api/core';

jest.mock('@/lib/admin-api/core', () => ({ executeAdminGraphQL: jest.fn() }));

const respondWith = (value: unknown) => jest.mocked(executeAdminGraphQL).mockResolvedValueOnce(value as never);

describe('admin content posts API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('normalizes post filters and falls back to default pagination', async () => {
    const result = { items: [], total: 0, page: 1, size: 20 };
    respondWith({ contentPosts: result });

    await expect(
      fetchAdminContentPosts({
        locale: ' EN ',
        preferredLocale: ' TR ',
        source: ' MEDIUM ' as 'medium',
        query: '  captain  ',
        categoryId: ' GAMING ',
        topicId: ' SPORTS ',
        page: 2.9,
        size: 0,
      }),
    ).resolves.toEqual(result);
    expect(executeAdminGraphQL).toHaveBeenCalledWith(
      expect.anything(),
      {
        filter: {
          locale: 'en',
          preferredLocale: 'tr',
          source: 'medium',
          query: 'captain',
          categoryId: 'gaming',
          topicId: 'sports',
          page: 2,
        },
      },
      expect.objectContaining({ operationName: 'AdminContentPosts' }),
    );

    respondWith({ contentPosts: result });
    await fetchAdminContentPosts({ source: 'other' as 'blog', page: -1, size: 3.8 });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: { page: 1, size: 3 } },
      expect.objectContaining({ operationName: 'AdminContentPosts' }),
    );
  });

  it('normalizes entity keys and update fields', async () => {
    const post = { id: 'post-1' };
    respondWith({ contentPost: post });
    await expect(fetchAdminContentPost({ locale: ' EN ', id: ' POST-1 ' })).resolves.toBe(post);

    respondWith({ updateContentPostMetadata: post });
    await expect(
      updateAdminContentPostMetadata({
        locale: ' EN ',
        id: ' POST-1 ',
        title: ' Title ',
        summary: ' ',
        thumbnail: ' /image.webp ',
        publishedDate: ' date ',
        updatedDate: ' updated ',
        status: 'draft' as 'DRAFT',
        scheduledAt: '  ',
        categoryId: ' GAMING ',
        topicIds: [' TAG ', '', 'SPORTS'],
      }),
    ).resolves.toBe(post);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      {
        input: {
          locale: 'en',
          id: 'post-1',
          title: 'Title',
          summary: '',
          thumbnail: '/image.webp',
          publishedDate: 'date',
          updatedDate: 'updated',
          status: 'DRAFT',
          scheduledAt: null,
          categoryId: 'gaming',
          topicIds: ['tag', 'sports'],
        },
      },
      expect.objectContaining({ operationName: 'AdminUpdateContentPostMetadata' }),
    );

    respondWith({ updateContentPostMetadata: post });
    await updateAdminContentPostMetadata({ locale: 'tr', id: 'ID', topicIds: [], scheduledAt: '2026-01-01' });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { locale: 'tr', id: 'id', scheduledAt: '2026-01-01', topicIds: [] } },
      expect.objectContaining({ operationName: 'AdminUpdateContentPostMetadata' }),
    );
  });

  it('handles revisions, restore, content update, and optional delete success', async () => {
    const result = { items: [], total: 0, page: 1, size: 10 };
    respondWith({ contentPostRevisions: result });
    await expect(fetchAdminContentPostRevisions({ locale: ' TR ', id: ' POST ', page: 2.9, size: 0 })).resolves.toEqual(
      result,
    );
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { locale: 'tr', id: 'post' }, page: 2 },
      expect.objectContaining({ operationName: 'AdminContentPostRevisions' }),
    );

    respondWith({ contentPostRevisions: result });
    await fetchAdminContentPostRevisions({ locale: 'en', id: 'post', page: -2, size: 3.8 });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { locale: 'en', id: 'post' }, size: 3 },
      expect.objectContaining({ operationName: 'AdminContentPostRevisions' }),
    );

    const post = { id: 'post' };
    respondWith({ restoreContentPostRevision: post });
    await expect(
      restoreAdminContentPostRevision({ locale: ' EN ', postId: ' POST ', revisionId: ' rev-1 ' }),
    ).resolves.toBe(post);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { locale: 'en', postId: 'post', revisionId: 'rev-1' } },
      expect.objectContaining({ operationName: 'AdminRestoreContentPostRevision' }),
    );

    respondWith({ updateContentPostContent: post });
    await expect(updateAdminContentPostContent({ locale: ' EN ', id: ' POST ', content: ' body ' })).resolves.toBe(
      post,
    );
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { locale: 'en', id: 'post', content: ' body ' } },
      expect.objectContaining({ operationName: 'AdminUpdateContentPostContent' }),
    );

    respondWith({ deleteContentPost: { success: true } });
    await expect(deleteAdminContentPost({ locale: ' EN ', id: ' POST ' })).resolves.toBe(true);
    respondWith({});
    await expect(deleteAdminContentPost({ locale: 'en', id: 'post' })).resolves.toBe(false);
  });
});
