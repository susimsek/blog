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
  type AdminContentPostItem,
} from '@/lib/adminApi';
import { useAdminContentPostCommentsSection } from '@/hooks/admin-content/useAdminContentPostCommentsSection';

jest.mock('@/lib/adminApi', () => ({
  bulkDeleteAdminComments: jest.fn(),
  bulkUpdateAdminCommentStatus: jest.fn(),
  deleteAdminComment: jest.fn(),
  fetchAdminComments: jest.fn(),
  isAdminSessionError: jest.fn(),
  resolveAdminError: jest.fn(),
  updateAdminCommentStatus: jest.fn(),
}));

const post: AdminContentPostItem = {
  locale: 'en',
  id: 'post-1',
  title: 'Post',
  summary: null,
  content: null,
  contentMode: null,
  thumbnail: null,
  source: 'blog',
  publishedDate: '2026-11-01',
  updatedDate: null,
  categoryId: null,
  categoryName: null,
  topicIds: [],
  topicNames: [],
  readingTimeMin: 1,
  status: 'PUBLISHED',
  scheduledAt: null,
  contentUpdatedAt: null,
  updatedAt: null,
  revisionCount: 0,
  latestRevisionAt: null,
  viewCount: 0,
  likeCount: 0,
  commentCount: 0,
};

const comments: AdminCommentItem[] = [
  {
    id: 'comment-1',
    postId: 'post-1',
    postTitle: 'Post',
    parentId: null,
    authorName: 'Reader one',
    authorEmail: 'one@example.com',
    content: 'First',
    status: 'PENDING',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
  },
  {
    id: 'comment-2',
    postId: 'post-1',
    postTitle: 'Post',
    parentId: null,
    authorName: 'Reader two',
    authorEmail: 'two@example.com',
    content: 'Second',
    status: 'PENDING',
    createdAt: '2026-11-02',
    updatedAt: '2026-11-02',
  },
];

const t = ((key: string) => key) as TFunction;
const onSessionExpired = jest.fn();
const commentPayload = (items = comments) => ({ items, total: items.length, page: 1, size: 5 });
const renderComments = (
  editingPost: AdminContentPostItem | null = post,
  activePostEditorTab: 'metadata' | 'content' | 'comments' = 'comments',
) =>
  renderHook(
    ({ currentPost, tab }: { currentPost: AdminContentPostItem | null; tab: 'metadata' | 'content' | 'comments' }) =>
      useAdminContentPostCommentsSection({
        editingPost: currentPost,
        activePostEditorTab: tab,
        routePostID: currentPost?.id,
        onSessionExpired,
        t,
      }),
    { initialProps: { currentPost: editingPost, tab: activePostEditorTab } },
  );

describe('useAdminContentPostCommentsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchAdminComments).mockResolvedValue(commentPayload());
    jest.mocked(bulkDeleteAdminComments).mockResolvedValue(2);
    jest.mocked(bulkUpdateAdminCommentStatus).mockResolvedValue(2);
    jest.mocked(deleteAdminComment).mockResolvedValue(true);
    jest.mocked(updateAdminCommentStatus).mockResolvedValue(comments[0]!);
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: 'Request failed' });
  });

  it('loads comments only for an active post comments tab and maintains selection/filter pages', async () => {
    const inactive = renderComments(post, 'metadata');
    expect(fetchAdminComments).not.toHaveBeenCalled();
    inactive.unmount();

    const { result } = renderComments();
    await waitFor(() => expect(result.current.postComments).toEqual(comments));
    expect(fetchAdminComments).toHaveBeenCalledWith({
      postId: 'post-1',
      status: undefined,
      query: '',
      page: 1,
      size: 5,
    });
    expect(result.current.totalPostCommentPages).toBe(1);

    act(() => {
      result.current.togglePostCommentSelection('comment-1', true);
      result.current.togglePostCommentSelection('comment-1', true);
    });
    expect(result.current.selectedPostCommentIDs).toEqual(['comment-1']);
    expect(result.current.hasSelectedPostComments).toBe(true);
    act(() => result.current.toggleVisiblePostCommentsSelection());
    expect(result.current.selectedPostCommentIDs).toEqual(['comment-1', 'comment-2']);
    expect(result.current.allVisiblePostCommentsSelected).toBe(true);
    act(() => result.current.toggleVisiblePostCommentsSelection());
    expect(result.current.selectedPostCommentIDs).toEqual([]);
    act(() => result.current.togglePostCommentSelection('comment-1', false));
    expect(result.current.selectedPostCommentIDs).toEqual([]);

    act(() => {
      result.current.setPostCommentsPage(3);
      result.current.setPostCommentsStatusFilter('APPROVED');
    });
    await waitFor(() =>
      expect(fetchAdminComments).toHaveBeenLastCalledWith({
        postId: 'post-1',
        status: 'APPROVED',
        query: '',
        page: 1,
        size: 5,
      }),
    );
  });

  it('uses server pagination and ignores an older request after the post changes', async () => {
    let resolveOlderRequest: ((value: ReturnType<typeof commentPayload>) => void) | undefined;
    jest.mocked(fetchAdminComments).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveOlderRequest = resolve;
        }),
    );
    jest.mocked(fetchAdminComments).mockResolvedValue({
      items: comments,
      total: 20,
      page: 2,
      size: 10,
    });

    const { result, rerender } = renderComments();
    await waitFor(() => expect(fetchAdminComments).toHaveBeenCalledTimes(1));
    rerender({ currentPost: { ...post, id: 'post-2' }, tab: 'comments' });

    await waitFor(() => {
      expect(result.current.postCommentsPage).toBe(2);
      expect(result.current.postCommentsPageSize).toBe(10);
    });
    await act(async () => resolveOlderRequest?.(commentPayload([comments[1]!])));

    expect(result.current.postComments).toEqual(comments);
    expect(result.current.isPostCommentsLoading).toBe(false);
  });

  it('updates a single comment, reloads the list, and handles single deletion', async () => {
    const { result } = renderComments();
    await waitFor(() => expect(result.current.postComments).toEqual(comments));

    await act(async () => result.current.handlePostCommentStatusUpdate('comment-1', 'APPROVED'));
    expect(updateAdminCommentStatus).toHaveBeenCalledWith({ commentId: 'comment-1', status: 'APPROVED' });
    expect(result.current.postCommentsSuccessMessage).toBe('adminAccount.comments.success.approved');
    expect(result.current.postCommentActionID).toBe('');
    expect(result.current.postCommentActionStatus).toBeNull();

    act(() => result.current.setPendingPostCommentDelete(comments[0]!));
    await act(async () => result.current.handleDeletePostCommentSubmit());
    expect(deleteAdminComment).toHaveBeenCalledWith({ commentId: 'comment-1' });
    expect(result.current.postComments.map(item => item.id)).toEqual(['comment-2']);
    expect(result.current.postCommentsSuccessMessage).toBe('adminAccount.comments.success.deleted');
    expect(result.current.pendingPostCommentDelete).toBeNull();
  });

  it('runs bulk status and delete actions and reports partial outcomes', async () => {
    jest.mocked(bulkUpdateAdminCommentStatus).mockResolvedValue(1);
    jest.mocked(bulkDeleteAdminComments).mockResolvedValue(1);
    const { result } = renderComments();
    await waitFor(() => expect(result.current.postComments).toEqual(comments));
    act(() => result.current.setSelectedPostCommentIDs(['comment-1', 'comment-2']));

    await act(async () => result.current.handleBulkPostCommentStatusUpdate('REJECTED'));
    expect(bulkUpdateAdminCommentStatus).toHaveBeenCalledWith({
      commentIds: ['comment-1', 'comment-2'],
      status: 'REJECTED',
    });
    expect(result.current.postCommentsSuccessMessage).toBe('adminAccount.comments.success.bulkRejected');
    expect(result.current.postCommentsErrorMessage).toBe('adminAccount.comments.errors.bulkStatusUpdatePartial');
    expect(result.current.selectedPostCommentIDs).toEqual([]);

    act(() => result.current.setSelectedPostCommentIDs(['comment-1']));
    await act(async () => result.current.handleBulkPostCommentStatusUpdate('APPROVED'));
    expect(result.current.postCommentsSuccessMessage).toBe('adminAccount.comments.success.bulkApproved');

    act(() => result.current.setPendingBulkPostCommentDeleteIDs(['comment-1', 'comment-2']));
    await act(async () => result.current.handleBulkDeletePostCommentSubmit());
    expect(bulkDeleteAdminComments).toHaveBeenCalledWith({ commentIds: ['comment-1', 'comment-2'] });
    expect(result.current.postCommentsSuccessMessage).toBe('adminAccount.comments.success.bulkDeleted');
    expect(result.current.postCommentsErrorMessage).toBe('adminAccount.comments.errors.bulkDeletePartial');
    expect(result.current.pendingBulkPostCommentDeleteIDs).toEqual([]);
    expect(result.current.isBulkPostCommentDeleting).toBe(false);
  });

  it('surfaces load, status and delete failures and handles session expiration', async () => {
    jest.mocked(fetchAdminComments).mockRejectedValue(new Error('load failed'));
    const loadFailure = renderComments();
    await waitFor(() => expect(loadFailure.result.current.postCommentsErrorMessage).toBe('Request failed'));
    loadFailure.unmount();

    jest.mocked(fetchAdminComments).mockResolvedValue(commentPayload());
    const { result } = renderComments();
    await waitFor(() => expect(result.current.postComments).toEqual(comments));

    jest.mocked(updateAdminCommentStatus).mockRejectedValue(new Error('status failed'));
    await act(async () => result.current.handlePostCommentStatusUpdate('comment-1', 'SPAM'));
    expect(result.current.postCommentsErrorMessage).toBe('Request failed');

    jest.mocked(deleteAdminComment).mockResolvedValue(false);
    act(() => result.current.setPendingPostCommentDelete(comments[0]!));
    await act(async () => result.current.handleDeletePostCommentSubmit());
    expect(result.current.postCommentsErrorMessage).toBe('Request failed');
    expect(result.current.deletingPostCommentID).toBe('');

    jest.mocked(isAdminSessionError).mockReturnValue(true);
    jest.mocked(fetchAdminComments).mockRejectedValue(new Error('expired'));
    const sessionFailure = renderComments();
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalled());
    sessionFailure.unmount();
  });

  it('clears post-specific state when the editor closes and ignores empty actions', async () => {
    const { result, rerender } = renderComments();
    await waitFor(() => expect(result.current.postComments).toEqual(comments));
    act(() => {
      result.current.setSelectedPostCommentIDs(['comment-1']);
      result.current.setPendingBulkPostCommentDeleteIDs(['comment-1']);
      result.current.setPendingPostCommentDelete(comments[0]!);
    });
    await act(async () => result.current.handleBulkPostCommentStatusUpdate('SPAM'));
    expect(bulkUpdateAdminCommentStatus).toHaveBeenCalled();

    rerender({ currentPost: null, tab: 'comments' });
    await waitFor(() => expect(result.current.postComments).toEqual([]));
    expect(result.current.selectedPostCommentIDs).toEqual([]);
    expect(result.current.pendingPostCommentDelete).toBeNull();
    expect(result.current.pendingBulkPostCommentDeleteIDs).toEqual([]);
    await act(async () => result.current.handleBulkDeletePostCommentSubmit());
    expect(bulkDeleteAdminComments).toHaveBeenCalledTimes(0);
    act(() => result.current.toggleVisiblePostCommentsSelection());
    expect(result.current.selectedPostCommentIDs).toEqual([]);
  });

  it('ignores empty bulk selections and reports zero-success bulk operations', async () => {
    const { result } = renderComments();
    await waitFor(() => expect(result.current.postComments).toEqual(comments));
    await act(async () => result.current.handleBulkPostCommentStatusUpdate('APPROVED'));
    expect(bulkUpdateAdminCommentStatus).not.toHaveBeenCalled();

    act(() => result.current.setSelectedPostCommentIDs(['comment-1']));
    jest.mocked(bulkUpdateAdminCommentStatus).mockResolvedValue(0);
    await act(async () => result.current.handleBulkPostCommentStatusUpdate('APPROVED'));
    expect(result.current.postCommentsErrorMessage).toBe('Request failed');
    expect(result.current.postCommentsSuccessMessage).toBe('');

    act(() => result.current.setPendingBulkPostCommentDeleteIDs(['comment-1']));
    jest.mocked(bulkDeleteAdminComments).mockResolvedValue(0);
    await act(async () => result.current.handleBulkDeletePostCommentSubmit());
    expect(result.current.postCommentsErrorMessage).toBe('Request failed');
    expect(result.current.isBulkPostCommentDeleting).toBe(false);
  });

  it('routes session-expired mutation failures to the session handler', async () => {
    const { result } = renderComments();
    await waitFor(() => expect(result.current.postComments).toEqual(comments));
    jest.mocked(isAdminSessionError).mockReturnValue(true);
    jest.mocked(updateAdminCommentStatus).mockRejectedValue(new Error('expired'));

    await act(async () => result.current.handlePostCommentStatusUpdate('comment-1', 'APPROVED'));
    expect(onSessionExpired).toHaveBeenCalled();
    expect(result.current.postCommentActionID).toBe('');
  });

  it('moves back after post-specific bulk and individual actions empty the final page', async () => {
    jest
      .mocked(fetchAdminComments)
      .mockImplementation(async filter =>
        filter?.page === 2
          ? { ...commentPayload([]), total: 6, page: 2, size: 5 }
          : { ...commentPayload(), total: 6, page: 1, size: 5 },
      );
    const { result } = renderComments();
    await waitFor(() => expect(result.current.postComments).toEqual(comments));

    act(() => result.current.setPostCommentsPage(2));
    await waitFor(() => expect(result.current.postComments).toEqual([]));
    act(() => result.current.setSelectedPostCommentIDs(['comment-on-previous-page']));
    await act(async () => result.current.handleBulkPostCommentStatusUpdate('SPAM'));
    await waitFor(() => expect(result.current.postCommentsPage).toBe(1));

    act(() => result.current.setPostCommentsPage(2));
    await waitFor(() => expect(result.current.postComments).toEqual([]));
    act(() => result.current.setPendingBulkPostCommentDeleteIDs(['comment-on-previous-page']));
    await act(async () => result.current.handleBulkDeletePostCommentSubmit());
    await waitFor(() => expect(result.current.postCommentsPage).toBe(1));

    act(() => result.current.setPostCommentsPage(2));
    await waitFor(() => expect(result.current.postComments).toEqual([]));
    await act(async () => result.current.handlePostCommentStatusUpdate('comment-on-previous-page', 'SPAM'));
    await waitFor(() => expect(result.current.postCommentsPage).toBe(1));
  });

  it('moves to the previous page when deleting the last item on the final page', async () => {
    jest
      .mocked(fetchAdminComments)
      .mockImplementation(async filter =>
        filter?.page === 2
          ? { ...commentPayload([]), total: 6, page: 2, size: 5 }
          : { ...commentPayload(), total: 6, page: 1, size: 5 },
      );
    const { result } = renderComments();
    await waitFor(() => expect(result.current.postComments).toEqual(comments));
    act(() => result.current.setPostCommentsPage(2));
    await waitFor(() => expect(result.current.postComments).toEqual([]));
    act(() => result.current.setPendingPostCommentDelete(comments[0]!));

    await act(async () => result.current.handleDeletePostCommentSubmit());

    await waitFor(() => expect(result.current.postCommentsPage).toBe(1));
    expect(result.current.postComments).toEqual(comments);
    expect(result.current.pendingPostCommentDelete).toBeNull();
  });
});
