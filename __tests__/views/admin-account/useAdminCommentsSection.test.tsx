import { act, renderHook, waitFor } from '@testing-library/react';
import type { TFunction } from 'i18next';
import {
  bulkDeleteAdminComments,
  bulkUpdateAdminCommentStatus,
  deleteAdminComment,
  fetchAdminComments,
  isAdminSessionError,
  resolveAdminError,
  updateAdminCommentStatus,
  type AdminCommentItem,
} from '@/lib/adminApi';
import useAdminCommentsSection from '@/views/admin-account/useAdminCommentsSection';

jest.mock('@/lib/adminApi', () => ({
  bulkDeleteAdminComments: jest.fn(),
  bulkUpdateAdminCommentStatus: jest.fn(),
  deleteAdminComment: jest.fn(),
  fetchAdminComments: jest.fn(),
  isAdminSessionError: jest.fn(),
  resolveAdminError: jest.fn(),
  updateAdminCommentStatus: jest.fn(),
}));

const firstComment: AdminCommentItem = {
  id: 'comment-1',
  postId: 'post-1',
  postTitle: 'First post',
  parentId: null,
  authorName: 'Reader One',
  authorEmail: 'one@example.com',
  content: 'First comment',
  status: 'PENDING',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};
const secondComment: AdminCommentItem = {
  ...firstComment,
  id: 'comment-2',
  authorName: 'Reader Two',
  authorEmail: 'two@example.com',
  status: 'APPROVED',
};
const payload = (items: AdminCommentItem[] = [firstComment]) => ({
  items,
  total: items.length,
  page: 1,
  size: 10,
});
const translate = ((key: string) => key) as unknown as TFunction;
const onSessionExpired = jest.fn();

const renderSection = (overrides: Partial<Parameters<typeof useAdminCommentsSection>[0]> = {}) =>
  renderHook(() =>
    useAdminCommentsSection({
      isActive: true,
      hasAdminUser: true,
      t: translate,
      onSessionExpired,
      successMessageAutoHideMs: 0,
      ...overrides,
    }),
  );

describe('useAdminCommentsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchAdminComments).mockResolvedValue(payload());
    jest.mocked(bulkDeleteAdminComments).mockResolvedValue(1);
    jest.mocked(bulkUpdateAdminCommentStatus).mockResolvedValue(1);
    jest.mocked(deleteAdminComment).mockResolvedValue(true);
    jest.mocked(updateAdminCommentStatus).mockResolvedValue({ ...firstComment, status: 'APPROVED' });
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: 'Request failed' });
    onSessionExpired.mockReset();
  });

  it('loads comments, applies filters, and synchronizes visible selection', async () => {
    jest.mocked(fetchAdminComments).mockResolvedValue(payload([firstComment, secondComment]));
    const { result } = renderSection();

    await waitFor(() => expect(result.current.comments).toEqual([firstComment, secondComment]));
    expect(fetchAdminComments).toHaveBeenCalledWith({ status: undefined, query: '', page: 1, size: 10 });
    expect(result.current.totalCommentPages).toBe(1);
    expect(result.current.resolveCommentStatusVariant('PENDING')).toBe('warning');
    expect(result.current.resolveCommentStatusVariant('APPROVED')).toBe('success');
    expect(result.current.resolveCommentStatusVariant('REJECTED')).toBe('secondary');
    expect(result.current.resolveCommentStatusVariant('SPAM')).toBe('danger');

    act(() => result.current.onToggleVisibleCommentsSelection());
    expect(result.current.selectedCommentIDs).toEqual(['comment-1', 'comment-2']);
    expect(result.current.allVisibleCommentsSelected).toBe(true);
    act(() => result.current.onToggleVisibleCommentsSelection());
    expect(result.current.selectedCommentIDs).toEqual([]);
    act(() => {
      result.current.onToggleCommentSelection('comment-1', true);
      result.current.onToggleCommentSelection('comment-1', true);
    });
    expect(result.current.selectedCommentIDs).toEqual(['comment-1']);
    act(() => result.current.onToggleVisibleCommentsSelection());
    expect(result.current.selectedCommentIDs).toEqual(['comment-1', 'comment-2']);
    act(() => result.current.onToggleCommentSelection('comment-1', false));
    expect(result.current.selectedCommentIDs).toEqual(['comment-2']);
    act(() => result.current.onToggleVisibleCommentsSelection());
    expect(result.current.selectedCommentIDs).toEqual(['comment-2', 'comment-1']);
    act(() => result.current.onClearSelectedComments());
    expect(result.current.hasSelectedComments).toBe(false);
    const scrollTarget = document.createElement('div');
    const scrollIntoView = jest.fn();
    scrollTarget.scrollIntoView = scrollIntoView;
    result.current.commentsListTopRef.current = scrollTarget;
    window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as typeof window.matchMedia;
    act(() => result.current.onCommentsPageChange(2));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
    delete (window as Partial<Window>).matchMedia;

    act(() => {
      result.current.onCommentFilterStatusChange('PENDING');
      result.current.onCommentFilterQueryChange('  captain  ');
    });
    await waitFor(() =>
      expect(fetchAdminComments).toHaveBeenLastCalledWith({ status: 'PENDING', query: 'captain', page: 1, size: 10 }),
    );
    act(() => result.current.onClearCommentFilterQuery());
    expect(result.current.commentFilterQuery).toBe('');
  });

  it('updates and deletes an individual comment', async () => {
    const { result } = renderSection({ successMessageAutoHideMs: 60_000 });
    await waitFor(() => expect(result.current.comments).toEqual([firstComment]));

    await act(async () => result.current.onCommentStatusUpdate(firstComment.id, 'APPROVED'));
    expect(updateAdminCommentStatus).toHaveBeenCalledWith({ commentId: firstComment.id, status: 'APPROVED' });
    expect(result.current.commentsSuccessMessage).toBe('adminAccount.comments.success.approved');

    act(() => result.current.onOpenCommentDelete(firstComment));
    expect(result.current.pendingCommentDelete).toEqual(firstComment);
    act(() => result.current.onCloseCommentDelete());
    expect(result.current.pendingCommentDelete).toBeNull();
    act(() => result.current.onOpenCommentDelete(firstComment));
    await act(async () => result.current.onConfirmCommentDelete());

    expect(deleteAdminComment).toHaveBeenCalledWith({ commentId: firstComment.id });
    expect(result.current.comments).toEqual([]);
    expect(result.current.commentsSuccessMessage).toBe('adminAccount.comments.success.deleted');
  });

  it('updates and deletes selected comments and reports partial results', async () => {
    jest.mocked(fetchAdminComments).mockResolvedValue(payload([firstComment, secondComment]));
    const { result } = renderSection({ successMessageAutoHideMs: 60_000 });
    await waitFor(() => expect(result.current.comments).toHaveLength(2));

    act(() => result.current.onToggleVisibleCommentsSelection());
    act(() => result.current.onOpenBulkCommentDelete());
    expect(result.current.pendingBulkCommentDeleteCount).toBe(2);
    act(() => result.current.onCloseBulkCommentDelete());
    expect(result.current.pendingBulkCommentDeleteCount).toBe(0);

    await act(async () => result.current.onBulkCommentStatusUpdate('REJECTED'));
    expect(bulkUpdateAdminCommentStatus).toHaveBeenCalledWith({
      commentIds: ['comment-1', 'comment-2'],
      status: 'REJECTED',
    });
    expect(result.current.commentsSuccessMessage).toBe('adminAccount.comments.success.bulkRejected');
    expect(result.current.commentsErrorMessage).toBe('adminAccount.comments.errors.bulkStatusUpdatePartial');

    act(() => result.current.onToggleVisibleCommentsSelection());
    act(() => result.current.onOpenBulkCommentDelete());
    await act(async () => result.current.onConfirmBulkCommentDelete());
    expect(bulkDeleteAdminComments).toHaveBeenCalledWith({ commentIds: ['comment-1', 'comment-2'] });
    expect(result.current.commentsSuccessMessage).toBe('adminAccount.comments.success.bulkDeleted');
    expect(result.current.commentsErrorMessage).toBe('adminAccount.comments.errors.bulkDeletePartial');
    expect(result.current.pendingBulkCommentDeleteCount).toBe(0);
  });

  it('scrolls when pagination changes and resets the page size', async () => {
    jest.mocked(fetchAdminComments).mockImplementation(async filter => ({
      ...payload(),
      total: 25,
      page: filter?.page ?? 1,
      size: filter?.size ?? 10,
    }));
    const { result } = renderSection();
    await waitFor(() => expect(result.current.commentsPageSize).toBe(10));

    const target = document.createElement('div');
    const scrollIntoView = jest.fn();
    target.scrollIntoView = scrollIntoView;
    result.current.commentsListTopRef.current = target;
    act(() => result.current.onCommentsPageChange(2));
    await waitFor(() =>
      expect(fetchAdminComments).toHaveBeenLastCalledWith({ status: undefined, query: '', page: 2, size: 10 }),
    );
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    act(() => result.current.onCommentsPageSizeChange(20));
    await waitFor(() => expect(result.current.commentsPageSize).toBe(20));
    expect(result.current.commentsPage).toBe(1);
  });

  it('skips scrolling without a list ref and supports the bulk-approved message', async () => {
    jest.mocked(fetchAdminComments).mockResolvedValue(payload([firstComment]));
    const { result } = renderSection({ successMessageAutoHideMs: 60_000 });
    await waitFor(() => expect(result.current.comments).toEqual([firstComment]));

    act(() => result.current.onCommentsPageChange(2));
    await waitFor(() =>
      expect(fetchAdminComments).toHaveBeenLastCalledWith({
        status: undefined,
        query: '',
        page: 2,
        size: 10,
      }),
    );

    act(() => result.current.onToggleVisibleCommentsSelection());
    await act(async () => result.current.onBulkCommentStatusUpdate('APPROVED'));
    expect(result.current.commentsSuccessMessage).toBe('adminAccount.comments.success.bulkApproved');
  });

  it('keeps an open delete confirmation while a delete request is pending', async () => {
    let resolveDelete: ((deleted: boolean) => void) | undefined;
    jest.mocked(deleteAdminComment).mockReturnValue(
      new Promise(resolve => {
        resolveDelete = resolve;
      }),
    );
    const { result } = renderSection();
    await waitFor(() => expect(result.current.comments).toEqual([firstComment]));
    act(() => result.current.onOpenCommentDelete(firstComment));

    await act(async () => {
      void result.current.onConfirmCommentDelete();
    });
    act(() => result.current.onCloseCommentDelete());
    expect(result.current.pendingCommentDelete).toEqual(firstComment);

    await act(async () => resolveDelete?.(true));
    expect(result.current.pendingCommentDelete).toBeNull();
  });

  it('moves back a page after bulk actions leave the current page empty', async () => {
    jest
      .mocked(fetchAdminComments)
      .mockImplementation(async filter =>
        filter?.page === 2
          ? { ...payload([]), total: 11, page: 2, size: 10 }
          : { ...payload([firstComment]), total: 11, page: 1, size: 10 },
      );
    const { result } = renderSection({ successMessageAutoHideMs: 60_000 });
    await waitFor(() => expect(result.current.comments).toEqual([firstComment]));

    act(() => result.current.onCommentsPageChange(2));
    await waitFor(() => expect(result.current.commentsPage).toBe(2));
    await waitFor(() => expect(result.current.comments).toEqual([]));
    act(() => result.current.onToggleCommentSelection('comment-on-previous-page', true));
    await act(async () => result.current.onBulkCommentStatusUpdate('SPAM'));
    await waitFor(() => expect(result.current.commentsPage).toBe(1));

    act(() => result.current.onCommentsPageChange(2));
    await waitFor(() => expect(result.current.commentsPage).toBe(2));
    await waitFor(() => expect(result.current.comments).toEqual([]));
    act(() => result.current.onToggleCommentSelection('comment-on-previous-page', true));
    act(() => result.current.onOpenBulkCommentDelete());
    await act(async () => result.current.onConfirmBulkCommentDelete());
    await waitFor(() => expect(result.current.commentsPage).toBe(1));
  });

  it('handles load failures and skips requests while the section is inactive', async () => {
    jest.mocked(fetchAdminComments).mockRejectedValue(new Error('offline'));
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'network', message: '' });
    const failed = renderSection();
    await waitFor(() => expect(failed.result.current.commentsErrorMessage).toBe('adminCommon.errors.network'));

    jest.mocked(fetchAdminComments).mockClear();
    jest.mocked(fetchAdminComments).mockRejectedValue(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValue(true);
    const expired = renderSection();
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalled());
    expect(expired.result.current.commentsErrorMessage).toBe('');

    jest.mocked(fetchAdminComments).mockClear();
    renderSection({ isActive: false });
    expect(fetchAdminComments).not.toHaveBeenCalled();

    renderSection({ hasAdminUser: false });
    expect(fetchAdminComments).not.toHaveBeenCalled();
  });

  it('handles empty results, empty selection actions, and zero-count bulk failures', async () => {
    jest.mocked(fetchAdminComments).mockResolvedValue({ ...payload([]), total: 0 });
    const { result } = renderSection();
    await waitFor(() => expect(result.current.isCommentsLoading).toBe(false));
    act(() => result.current.onToggleVisibleCommentsSelection());
    expect(result.current.selectedCommentIDs).toEqual([]);
    await act(async () => result.current.onBulkCommentStatusUpdate('SPAM'));
    expect(bulkUpdateAdminCommentStatus).not.toHaveBeenCalled();
    await act(async () => result.current.onConfirmBulkCommentDelete());
    expect(bulkDeleteAdminComments).not.toHaveBeenCalled();

    jest.mocked(fetchAdminComments).mockResolvedValue(payload([firstComment, secondComment]));
    const populated = renderSection();
    await waitFor(() => expect(populated.result.current.comments).toHaveLength(2));
    act(() => populated.result.current.onToggleVisibleCommentsSelection());
    jest.mocked(bulkUpdateAdminCommentStatus).mockResolvedValue(0);
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: '' });
    await act(async () => populated.result.current.onBulkCommentStatusUpdate('SPAM'));
    expect(populated.result.current.commentsErrorMessage).toBe('adminAccount.comments.errors.bulkStatusUpdate');
    expect(populated.result.current.commentsSuccessMessage).toBe('');
  });

  it('surfaces failures from bulk and individual comment actions', async () => {
    jest.mocked(fetchAdminComments).mockResolvedValue(payload([firstComment, secondComment]));
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: '' });
    const { result } = renderSection();
    await waitFor(() => expect(result.current.comments).toHaveLength(2));
    act(() => result.current.onToggleVisibleCommentsSelection());

    jest.mocked(bulkUpdateAdminCommentStatus).mockRejectedValueOnce(new Error('bulk update failed'));
    await act(async () => result.current.onBulkCommentStatusUpdate('APPROVED'));
    expect(result.current.commentsErrorMessage).toBe('adminAccount.comments.errors.bulkStatusUpdate');
    expect(result.current.commentsSuccessMessage).toBe('');

    act(() => result.current.onOpenBulkCommentDelete());
    jest.mocked(bulkDeleteAdminComments).mockRejectedValueOnce(new Error('bulk delete failed'));
    await act(async () => result.current.onConfirmBulkCommentDelete());
    expect(result.current.commentsErrorMessage).toBe('adminAccount.comments.errors.bulkDelete');
    act(() => result.current.onCloseBulkCommentDelete());

    jest.mocked(updateAdminCommentStatus).mockRejectedValueOnce(new Error('status update failed'));
    await act(async () => result.current.onCommentStatusUpdate(firstComment.id, 'SPAM'));
    expect(result.current.commentsErrorMessage).toBe('adminAccount.comments.errors.statusUpdate');

    act(() => result.current.onOpenCommentDelete(firstComment));
    jest.mocked(deleteAdminComment).mockResolvedValueOnce(false);
    await act(async () => result.current.onConfirmCommentDelete());
    expect(result.current.commentsErrorMessage).toBe('adminAccount.comments.errors.delete');
    expect(result.current.deletingCommentID).toBe('');
  });

  it('maps network failures from comment status and delete actions', async () => {
    jest.mocked(fetchAdminComments).mockResolvedValue(payload([firstComment, secondComment]));
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'network', message: 'Transport failed' });
    const { result } = renderSection();
    await waitFor(() => expect(result.current.comments).toHaveLength(2));

    jest.mocked(updateAdminCommentStatus).mockRejectedValueOnce(new Error('offline'));
    await act(async () => result.current.onCommentStatusUpdate(firstComment.id, 'SPAM'));
    expect(result.current.commentsErrorMessage).toBe('adminCommon.errors.network');

    act(() => result.current.onToggleVisibleCommentsSelection());
    jest.mocked(bulkUpdateAdminCommentStatus).mockRejectedValueOnce(new Error('offline'));
    await act(async () => result.current.onBulkCommentStatusUpdate('REJECTED'));
    expect(result.current.commentsErrorMessage).toBe('adminCommon.errors.network');

    act(() => result.current.onOpenBulkCommentDelete());
    jest.mocked(bulkDeleteAdminComments).mockRejectedValueOnce(new Error('offline'));
    await act(async () => result.current.onConfirmBulkCommentDelete());
    expect(result.current.commentsErrorMessage).toBe('adminCommon.errors.network');

    act(() => result.current.onOpenCommentDelete(firstComment));
    jest.mocked(deleteAdminComment).mockRejectedValueOnce(new Error('offline'));
    await act(async () => result.current.onConfirmCommentDelete());
    expect(result.current.commentsErrorMessage).toBe('adminCommon.errors.network');
  });

  it('routes session expiry from each individual and bulk comment action', async () => {
    jest.mocked(fetchAdminComments).mockResolvedValue(payload([firstComment, secondComment]));
    const { result } = renderSection();
    await waitFor(() => expect(result.current.comments).toHaveLength(2));
    jest.mocked(isAdminSessionError).mockReturnValue(true);

    jest.mocked(updateAdminCommentStatus).mockRejectedValueOnce(new Error('expired'));
    await act(async () => result.current.onCommentStatusUpdate(firstComment.id, 'APPROVED'));
    expect(onSessionExpired).toHaveBeenCalledTimes(1);

    act(() => result.current.onToggleVisibleCommentsSelection());
    jest.mocked(bulkUpdateAdminCommentStatus).mockRejectedValueOnce(new Error('expired'));
    await act(async () => result.current.onBulkCommentStatusUpdate('REJECTED'));
    expect(onSessionExpired).toHaveBeenCalledTimes(2);

    act(() => result.current.onOpenBulkCommentDelete());
    jest.mocked(bulkDeleteAdminComments).mockRejectedValueOnce(new Error('expired'));
    await act(async () => result.current.onConfirmBulkCommentDelete());
    expect(onSessionExpired).toHaveBeenCalledTimes(3);

    act(() => result.current.onOpenCommentDelete(firstComment));
    jest.mocked(deleteAdminComment).mockRejectedValueOnce(new Error('expired'));
    await act(async () => result.current.onConfirmCommentDelete());
    expect(onSessionExpired).toHaveBeenCalledTimes(4);
    expect(result.current.deletingCommentID).toBe('');
    expect(result.current.isBulkCommentDeleting).toBe(false);
  });

  it('handles zero bulk-delete results and returns to the previous page after a status update', async () => {
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: '' });
    jest
      .mocked(fetchAdminComments)
      .mockImplementation(async filter =>
        filter?.page === 2
          ? { ...payload([]), total: 11, page: 2, size: 10 }
          : { ...payload([firstComment]), total: 11, page: 1, size: 10 },
      );
    const { result } = renderSection({ successMessageAutoHideMs: 60_000 });
    await waitFor(() => expect(result.current.comments).toEqual([firstComment]));

    act(() => result.current.onToggleVisibleCommentsSelection());
    act(() => result.current.onOpenBulkCommentDelete());
    jest.mocked(bulkDeleteAdminComments).mockResolvedValueOnce(0);
    await act(async () => result.current.onConfirmBulkCommentDelete());
    expect(result.current.commentsErrorMessage).toBe('adminAccount.comments.errors.bulkDelete');

    act(() => result.current.onCommentsPageChange(2));
    await waitFor(() => expect(result.current.commentsPage).toBe(2));
    await waitFor(() => expect(result.current.comments).toEqual([]));
    await act(async () => result.current.onCommentStatusUpdate(firstComment.id, 'APPROVED'));
    await waitFor(() => expect(result.current.commentsPage).toBe(1));
  });
});
