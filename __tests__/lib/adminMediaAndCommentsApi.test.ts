import {
  deleteAdminMediaAsset,
  fetchAdminMediaLibrary,
  replaceAdminMediaAsset,
  uploadAdminMediaAsset,
} from '@/lib/admin-api/content-media';
import {
  bulkDeleteAdminComments,
  bulkUpdateAdminCommentStatus,
  deleteAdminComment,
  fetchAdminComments,
  updateAdminCommentStatus,
} from '@/lib/admin-api/comments';
import { executeAdminGraphQL } from '@/lib/admin-api/core';

jest.mock('@/lib/admin-api/core', () => ({ executeAdminGraphQL: jest.fn() }));

const respondWith = (value: unknown) => jest.mocked(executeAdminGraphQL).mockResolvedValueOnce(value as never);

describe('admin media library API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('normalizes media filters and omits default values', async () => {
    const library = { items: [], total: 0, page: 1, size: 20 };
    respondWith({ mediaLibrary: library });
    await expect(
      fetchAdminMediaLibrary({
        query: '  photo ',
        kind: ' uploaded ' as 'UPLOADED',
        sort: ' size ' as 'SIZE',
        page: 2.8,
        size: 4.2,
      }),
    ).resolves.toBe(library);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: { query: 'photo', kind: 'UPLOADED', sort: 'SIZE', page: 2, size: 4 } },
      expect.objectContaining({ operationName: 'AdminMediaLibrary' }),
    );

    respondWith({ mediaLibrary: library });
    await fetchAdminMediaLibrary({ kind: 'all' as 'ALL', sort: 'recent' as 'RECENT', page: -1, size: 0 });
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: {} },
      expect.objectContaining({ operationName: 'AdminMediaLibrary' }),
    );
  });

  it('uploads, replaces, and deletes assets with expected values', async () => {
    const asset = { id: 'asset-1' };
    respondWith({ uploadMediaAsset: asset });
    await expect(uploadAdminMediaAsset({ fileName: ' image.webp ', dataUrl: ' data:image ' })).resolves.toBe(asset);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { fileName: 'image.webp', dataUrl: 'data:image' } },
      expect.objectContaining({ operationName: 'AdminUploadMediaAsset' }),
    );

    respondWith({ replaceMediaAsset: asset });
    await expect(replaceAdminMediaAsset({ id: ' asset-1 ', fileName: ' next.webp ', dataUrl: ' data ' })).resolves.toBe(
      asset,
    );
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { id: 'asset-1', input: { fileName: 'next.webp', dataUrl: 'data' } },
      expect.objectContaining({ operationName: 'AdminReplaceMediaAsset' }),
    );

    respondWith({ deleteMediaAsset: { success: true } });
    await expect(deleteAdminMediaAsset(' asset-1 ')).resolves.toBe(true);
    respondWith({});
    await expect(deleteAdminMediaAsset('asset-1')).resolves.toBe(false);
  });
});

describe('admin comments API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches comments with and without filters and updates one status', async () => {
    const comments = { items: [], total: 0, page: 1, size: 20 };
    respondWith({ comments });
    await expect(
      fetchAdminComments({ status: 'PENDING', postId: 'post-1', query: 'review', page: 2, size: 5 }),
    ).resolves.toBe(comments);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { filter: { status: 'PENDING', postId: 'post-1', query: 'review', page: 2, size: 5 } },
      { operationName: 'AdminComments' },
    );

    respondWith({ comments });
    await fetchAdminComments();
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(expect.anything(), undefined, {
      operationName: 'AdminComments',
    });

    const comment = { id: 'comment-1', status: 'APPROVED' };
    respondWith({ updateCommentStatus: comment });
    await expect(updateAdminCommentStatus({ commentId: 'comment-1', status: 'APPROVED' })).resolves.toBe(comment);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { commentId: 'comment-1', status: 'APPROVED' } },
      { operationName: 'AdminUpdateCommentStatus' },
    );
  });

  it('trims IDs and handles optional delete and bulk mutation results', async () => {
    respondWith({ deleteComment: { success: true } });
    await expect(deleteAdminComment({ commentId: ' comment-1 ' })).resolves.toBe(true);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { commentId: 'comment-1' } },
      { operationName: 'AdminDeleteComment' },
    );
    respondWith({});
    await expect(deleteAdminComment({ commentId: 'comment-1' })).resolves.toBe(false);

    respondWith({ bulkUpdateCommentStatus: { successCount: 2 } });
    await expect(bulkUpdateAdminCommentStatus({ commentIds: [' a ', '', 'b'], status: 'SPAM' })).resolves.toBe(2);
    expect(executeAdminGraphQL).toHaveBeenLastCalledWith(
      expect.anything(),
      { input: { commentIds: ['a', 'b'], status: 'SPAM' } },
      { operationName: 'AdminBulkUpdateCommentStatus' },
    );
    respondWith({});
    await expect(bulkUpdateAdminCommentStatus({ commentIds: [], status: 'PENDING' })).resolves.toBe(0);

    respondWith({ bulkDeleteComments: { successCount: 3 } });
    await expect(bulkDeleteAdminComments({ commentIds: [' one ', 'two'] })).resolves.toBe(3);
    respondWith({});
    await expect(bulkDeleteAdminComments({ commentIds: [' '] })).resolves.toBe(0);
  });
});
