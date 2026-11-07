import { act, renderHook, waitFor } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import {
  deleteAdminContentPost,
  fetchAdminContentCategories,
  fetchAdminContentPost,
  fetchAdminContentPostRevisions,
  fetchAdminContentTopics,
  isAdminSessionError,
  resolveAdminError,
  restoreAdminContentPostRevision,
  updateAdminContentPostContent,
  updateAdminContentPostMetadata,
  type AdminContentPostItem,
  type AdminContentPostRevisionItem,
} from '@/lib/adminApi';
import { useAdminContentPostEditorSection } from '@/hooks/admin-content/useAdminContentPostEditorSection';

jest.mock('@/lib/adminApi', () => ({
  deleteAdminContentPost: jest.fn(),
  fetchAdminContentCategories: jest.fn(),
  fetchAdminContentPost: jest.fn(),
  fetchAdminContentPostRevisions: jest.fn(),
  fetchAdminContentTopics: jest.fn(),
  isAdminSessionError: jest.fn(),
  resolveAdminError: jest.fn(),
  restoreAdminContentPostRevision: jest.fn(),
  updateAdminContentPostContent: jest.fn(),
  updateAdminContentPostMetadata: jest.fn(),
}));

const post: AdminContentPostItem = {
  locale: 'en',
  id: 'post-1',
  title: 'Original title',
  summary: 'Summary',
  content: 'Original body',
  contentMode: 'markdown',
  thumbnail: '/cover.png',
  source: 'blog',
  publishedDate: '2026-11-01',
  updatedDate: null,
  categoryId: 'category-1',
  categoryName: 'General',
  topicIds: ['topic-1'],
  topicNames: ['Topic one'],
  readingTimeMin: 2,
  status: 'PUBLISHED',
  scheduledAt: null,
  contentUpdatedAt: null,
  updatedAt: null,
  revisionCount: 1,
  latestRevisionAt: null,
  viewCount: 0,
  likeCount: 0,
  commentCount: 0,
};

const revision: AdminContentPostRevisionItem = {
  id: 'revision-1',
  locale: 'en',
  postId: 'post-1',
  revisionNumber: 1,
  title: 'Earlier title',
  summary: null,
  content: 'Earlier body',
  contentMode: 'markdown',
  thumbnail: null,
  publishedDate: '2026-10-30',
  updatedDate: null,
  categoryId: null,
  categoryName: null,
  topicIds: [],
  topicNames: [],
  readingTimeMin: 1,
  status: 'DRAFT',
  scheduledAt: null,
  createdAt: '2026-10-30T12:00:00.000Z',
};

const renderEditor = (
  overrides: Partial<{
    activePostEditorTab: 'metadata' | 'content' | 'comments';
    isPostDetailRoute: boolean;
    routePostLocale: string;
    routePostID: string;
    totalPosts: number;
    page: number;
    pageSize: number;
  }> = {},
) => {
  const reloadPosts = jest.fn().mockResolvedValue(undefined);
  return renderHook(() => {
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [page, setPage] = useState(overrides.page ?? 1);
    const editor = useAdminContentPostEditorSection({
      activePostEditorTab: overrides.activePostEditorTab ?? 'metadata',
      isPostDetailRoute: overrides.isPostDetailRoute ?? true,
      routePostLocale: overrides.routePostLocale ?? 'en',
      routePostID: overrides.routePostID ?? 'post-1',
      onSessionExpired,
      t,
      setErrorMessage,
      setSuccessMessage,
      reloadPosts,
      totalPosts: overrides.totalPosts ?? 12,
      page,
      pageSize: overrides.pageSize ?? 10,
      setPage,
    });
    return { editor, errorMessage, successMessage, page, reloadPosts };
  });
};

const onSessionExpired = jest.fn();
const t = ((key: string) => key) as TFunction;

describe('useAdminContentPostEditorSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchAdminContentPost).mockImplementation(async ({ locale }) => (locale === 'en' ? post : null));
    jest
      .mocked(fetchAdminContentTopics)
      .mockResolvedValue([
        { locale: 'en', id: 'topic-1', name: 'Topic one', color: '#123', link: null, updatedAt: null },
      ]);
    jest
      .mocked(fetchAdminContentCategories)
      .mockResolvedValue([
        { locale: 'en', id: 'category-1', name: 'General', color: '#123', icon: null, link: null, updatedAt: null },
      ]);
    jest.mocked(fetchAdminContentPostRevisions).mockResolvedValue({ items: [revision], total: 1, page: 1, size: 5 });
    jest.mocked(updateAdminContentPostMetadata).mockResolvedValue(post);
    jest.mocked(updateAdminContentPostContent).mockResolvedValue(post);
    jest.mocked(restoreAdminContentPostRevision).mockResolvedValue(post);
    jest.mocked(deleteAdminContentPost).mockResolvedValue(true);
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: 'Request failed' });
  });

  it('loads a post, alternate locale availability, taxonomy and revisions', async () => {
    const { result } = renderEditor();
    await waitFor(() => {
      expect(result.current.editor.editingPost).toEqual(post);
      expect(result.current.editor.postEditorTopicOptions).toHaveLength(1);
      expect(result.current.editor.postEditorCategoryOptions).toHaveLength(1);
      expect(result.current.editor.postRevisions).toEqual([revision]);
    });

    expect(fetchAdminContentPost).toHaveBeenNthCalledWith(1, { locale: 'en', id: 'post-1' });
    expect(fetchAdminContentPost).toHaveBeenNthCalledWith(2, { locale: 'tr', id: 'post-1' });
    expect(result.current.editor.postLocaleTabs).toEqual([
      { locale: 'en', available: true },
      { locale: 'tr', available: false },
    ]);
    expect(result.current.editor.canSavePostMetadata).toBe(false);
    expect(result.current.editor.canSavePostContent).toBe(false);

    act(() => {
      result.current.editor.setPostEditorTitle('Changed title');
      result.current.editor.setPostEditorContent('Changed body');
      result.current.editor.handlePostTopicToggle('   ', true);
      result.current.editor.handlePostTopicToggle(' TOPIC-2 ', true);
      result.current.editor.handlePostTopicToggle('topic-1', false);
    });
    expect(result.current.editor.canSavePostMetadata).toBe(true);
    expect(result.current.editor.canSavePostContent).toBe(true);
    expect(result.current.editor.postEditorTopicIDs).toEqual(['topic-2']);
  });

  it('uses empty editor defaults for nullable post fields', async () => {
    const nullablePost = {
      ...post,
      summary: null,
      thumbnail: null,
      scheduledAt: null,
      updatedDate: null,
      categoryId: null,
      topicIds: null,
      content: null,
    } as unknown as AdminContentPostItem;
    jest
      .mocked(fetchAdminContentPost)
      .mockImplementation(async ({ locale }) => (locale === 'en' ? nullablePost : null));

    const { result } = renderEditor();
    await waitFor(() => expect(result.current.editor.editingPost).toEqual(nullablePost));

    expect(result.current.editor.postEditorSummary).toBe('');
    expect(result.current.editor.postEditorThumbnail).toBe('');
    expect(result.current.editor.postEditorScheduledAt).toBe('');
    expect(result.current.editor.postEditorUpdatedDate).toBe('');
    expect(result.current.editor.postEditorCategoryID).toBe('');
    expect(result.current.editor.postEditorTopicIDs).toEqual([]);
    expect(result.current.editor.postEditorContent).toBe('');
    expect(result.current.editor.canSavePostMetadata).toBe(false);
    expect(result.current.editor.canSavePostContent).toBe(false);
  });

  it('updates metadata/content and restores a revision', async () => {
    const { result } = renderEditor();
    await waitFor(() => expect(result.current.editor.editingPost).toEqual(post));

    act(() => {
      result.current.editor.setPostEditorTitle('Updated title');
      result.current.editor.setPostEditorStatus('SCHEDULED');
      result.current.editor.setPostEditorScheduledAt('2026-12-01T10:00');
      result.current.editor.setPostEditorCategoryID(' category-2 ');
    });
    await act(async () => result.current.editor.handleUpdatePostMetadata());
    expect(updateAdminContentPostMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'en',
        id: 'post-1',
        title: 'Updated title',
        status: 'SCHEDULED',
        scheduledAt: '2026-12-01T10:00',
        categoryId: ' category-2 ',
      }),
    );
    expect(result.current.successMessage).toBe('adminAccount.content.success.postUpdated');

    act(() => result.current.editor.setPostEditorContent('Updated body'));
    await act(async () => result.current.editor.handleUpdatePostContent());
    expect(updateAdminContentPostContent).toHaveBeenCalledWith({ locale: 'en', id: 'post-1', content: 'Updated body' });
    expect(result.current.successMessage).toBe('adminAccount.content.success.postContentUpdated');

    act(() => result.current.editor.setPendingPostRevisionRestore(revision));
    await act(async () => result.current.editor.handleRestorePostRevision());
    expect(restoreAdminContentPostRevision).toHaveBeenCalledWith({
      locale: 'en',
      postId: 'post-1',
      revisionId: 'revision-1',
    });
    expect(result.current.editor.pendingPostRevisionRestore).toBeNull();
    expect(result.current.successMessage).toBe('adminAccount.content.success.postRevisionRestored');
  });

  it('uses the Turkish locale as the active post locale', async () => {
    jest.mocked(fetchAdminContentPost).mockResolvedValue(post);
    const { result } = renderEditor({ routePostLocale: 'tr' });

    await waitFor(() => expect(result.current.editor.editingPost).toEqual(post));
    expect(result.current.editor.postLocaleTabs).toEqual([
      { locale: 'en', available: true },
      { locale: 'tr', available: true },
    ]);
  });

  it('sends null metadata values for a published post without category or schedule', async () => {
    const { result } = renderEditor();
    await waitFor(() => expect(result.current.editor.editingPost).toEqual(post));

    act(() => {
      result.current.editor.setPostEditorTitle('Published without category');
      result.current.editor.setPostEditorCategoryID('');
      result.current.editor.setPostEditorStatus('PUBLISHED');
    });
    await act(async () => result.current.editor.handleUpdatePostMetadata());

    expect(updateAdminContentPostMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PUBLISHED', scheduledAt: null, categoryId: null }),
    );
  });

  it('detects metadata changes independently and compares topic IDs case-insensitively', async () => {
    const { result } = renderEditor();
    await waitFor(() => expect(result.current.editor.editingPost).toEqual(post));

    const cases = [
      [
        () => result.current.editor.setPostEditorSummary('Changed summary'),
        () => result.current.editor.setPostEditorSummary('Summary'),
      ],
      [
        () => result.current.editor.setPostEditorThumbnail('/other.png'),
        () => result.current.editor.setPostEditorThumbnail('/cover.png'),
      ],
      [
        () => result.current.editor.setPostEditorPublishedDate('2026-11-02'),
        () => result.current.editor.setPostEditorPublishedDate('2026-11-01'),
      ],
      [
        () => result.current.editor.setPostEditorUpdatedDate('2026-11-06'),
        () => result.current.editor.setPostEditorUpdatedDate(''),
      ],
      [
        () => result.current.editor.setPostEditorStatus('DRAFT'),
        () => result.current.editor.setPostEditorStatus('PUBLISHED'),
      ],
      [
        () => result.current.editor.setPostEditorScheduledAt('2026-12-01T10:00'),
        () => result.current.editor.setPostEditorScheduledAt(''),
      ],
      [
        () => result.current.editor.setPostEditorCategoryID('category-2'),
        () => result.current.editor.setPostEditorCategoryID('category-1'),
      ],
    ] as const;
    for (const [change, reset] of cases) {
      act(change);
      expect(result.current.editor.canSavePostMetadata).toBe(true);
      act(reset);
    }

    act(() => result.current.editor.handlePostTopicToggle(' TOPIC-1 ', true));
    expect(result.current.editor.canSavePostMetadata).toBe(false);
    act(() => result.current.editor.handlePostTopicToggle('topic-2', true));
    expect(result.current.editor.canSavePostMetadata).toBe(true);
  });

  it('deletes a post and chooses between reloading and moving to the previous page', async () => {
    const { result } = renderEditor({ page: 2, totalPosts: 11 });
    await waitFor(() => expect(result.current.editor.editingPost).toEqual(post));
    act(() => result.current.editor.setPendingPostDelete(post));
    await act(async () => result.current.editor.handleDeletePost());
    expect(deleteAdminContentPost).toHaveBeenCalledWith({ locale: 'en', id: 'post-1' });
    expect(result.current.page).toBe(1);
    expect(result.current.editor.pendingPostDelete).toBeNull();
    expect(result.current.successMessage).toBe('adminAccount.content.success.postDeleted');

    const reloadScenario = renderEditor({ page: 1, totalPosts: 12 });
    await waitFor(() => expect(reloadScenario.result.current.editor.editingPost).toEqual(post));
    act(() => reloadScenario.result.current.editor.setPendingPostDelete(post));
    await act(async () => reloadScenario.result.current.editor.handleDeletePost());
    expect(reloadScenario.result.current.reloadPosts).toHaveBeenCalled();
  });

  it('resets editor state when the route is inactive or route identifiers are blank', async () => {
    const { result, rerender } = renderHook(
      ({ detail, id }: { detail: boolean; id: string }) => {
        const [, setErrorMessage] = useState('');
        const [, setSuccessMessage] = useState('');
        return useAdminContentPostEditorSection({
          activePostEditorTab: 'metadata',
          isPostDetailRoute: detail,
          routePostLocale: 'en',
          routePostID: id,
          onSessionExpired,
          t,
          setErrorMessage,
          setSuccessMessage,
          reloadPosts: jest.fn().mockResolvedValue(undefined),
          totalPosts: 0,
          page: 1,
          pageSize: 5,
          setPage: jest.fn(),
        });
      },
      { initialProps: { detail: false, id: 'post-1' } },
    );
    expect(result.current.editingPost).toBeNull();
    rerender({ detail: true, id: '  ' });
    expect(result.current.editingPost).toBeNull();
    expect(fetchAdminContentPost).not.toHaveBeenCalled();
  });

  it('handles a missing detail and non-session alternate-locale failures', async () => {
    jest.mocked(fetchAdminContentPost).mockResolvedValue(null);
    const missing = renderEditor();
    await waitFor(() => expect(missing.result.current.editor.isPostContentLoading).toBe(false));
    expect(missing.result.current.editor.editingPost).toBeNull();
    missing.unmount();

    jest.mocked(fetchAdminContentPost).mockImplementation(async ({ locale }) => {
      if (locale === 'tr') throw new Error('alternate lookup failed');
      return post;
    });
    const alternateFailure = renderEditor();
    await waitFor(() => expect(alternateFailure.result.current.editor.editingPost).toEqual(post));
    expect(alternateFailure.result.current.editor.postLocaleTabs).toEqual([
      { locale: 'en', available: true },
      { locale: 'tr', available: false },
    ]);
    expect(alternateFailure.result.current.errorMessage).toBe('');

    alternateFailure.unmount();
    jest.mocked(isAdminSessionError).mockReturnValue(true);
    const sessionAlternate = renderEditor();
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalled());
    expect(sessionAlternate.result.current.editor.postLocaleTabs[1]).toEqual({ locale: 'tr', available: false });
  });

  it('reports content, revision restore and delete errors and handles update session expiry', async () => {
    const { result } = renderEditor();
    await waitFor(() => expect(result.current.editor.editingPost).toEqual(post));

    jest.mocked(updateAdminContentPostContent).mockRejectedValue(new Error('content failed'));
    act(() => result.current.editor.setPostEditorContent('Changed body'));
    await act(async () => result.current.editor.handleUpdatePostContent());
    expect(result.current.errorMessage).toBe('Request failed');

    jest.mocked(restoreAdminContentPostRevision).mockRejectedValue(new Error('restore failed'));
    act(() => result.current.editor.setPendingPostRevisionRestore(revision));
    await act(async () => result.current.editor.handleRestorePostRevision());
    expect(result.current.errorMessage).toBe('Request failed');
    expect(result.current.editor.isPostRevisionRestoring).toBe(false);

    jest.mocked(deleteAdminContentPost).mockResolvedValue(false);
    act(() => result.current.editor.setPendingPostDelete(post));
    await act(async () => result.current.editor.handleDeletePost());
    expect(result.current.errorMessage).toBe('Request failed');
    expect(result.current.editor.isPostDeleting).toBe(false);

    jest.mocked(isAdminSessionError).mockReturnValue(true);
    jest.mocked(updateAdminContentPostMetadata).mockRejectedValue(new Error('expired'));
    act(() => result.current.editor.setPostEditorTitle('Session test'));
    await act(async () => result.current.editor.handleUpdatePostMetadata());
    expect(onSessionExpired).toHaveBeenCalled();
  });

  it('surfaces load, taxonomy, revision and mutation failures, including session expiry', async () => {
    const loadError = new Error('detail failed');
    jest.mocked(fetchAdminContentPost).mockRejectedValue(loadError);
    const detailFailure = renderEditor();
    await waitFor(() => expect(detailFailure.result.current.errorMessage).toBe('Request failed'));
    detailFailure.unmount();

    jest.mocked(fetchAdminContentPost).mockResolvedValue(post);
    jest.mocked(fetchAdminContentTopics).mockRejectedValue(new Error('topics failed'));
    jest.mocked(fetchAdminContentCategories).mockRejectedValue(new Error('categories failed'));
    jest.mocked(fetchAdminContentPostRevisions).mockRejectedValue(new Error('revisions failed'));
    const taxonomyFailure = renderEditor();
    await waitFor(() => {
      expect(taxonomyFailure.result.current.editor.postRevisionsErrorMessage).toBe('Request failed');
      expect(taxonomyFailure.result.current.errorMessage).toBe('Request failed');
    });
    taxonomyFailure.unmount();

    const mutationFailure = renderEditor();
    await waitFor(() => expect(mutationFailure.result.current.editor.editingPost).toEqual(post));
    act(() => mutationFailure.result.current.editor.setPostEditorTitle('Changed'));
    jest.mocked(updateAdminContentPostMetadata).mockRejectedValue(new Error('metadata failed'));
    await act(async () => mutationFailure.result.current.editor.handleUpdatePostMetadata());
    expect(mutationFailure.result.current.errorMessage).toBe('Request failed');

    jest.mocked(isAdminSessionError).mockReturnValue(true);
    jest.mocked(fetchAdminContentPost).mockRejectedValue(new Error('expired'));
    const sessionFailure = renderEditor();
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalled());
    sessionFailure.unmount();
  });

  it('expires sessions while loading taxonomy and revisions', async () => {
    jest.mocked(isAdminSessionError).mockReturnValue(true);
    jest.mocked(fetchAdminContentTopics).mockRejectedValue(new Error('expired topics'));
    jest.mocked(fetchAdminContentCategories).mockRejectedValue(new Error('expired categories'));
    jest.mocked(fetchAdminContentPostRevisions).mockRejectedValue(new Error('expired revisions'));

    const { result } = renderEditor();
    await waitFor(() => expect(result.current.editor.editingPost).toEqual(post));
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalledTimes(3));
    expect(result.current.errorMessage).toBe('');
    expect(result.current.editor.postRevisionsErrorMessage).toBe('');
  });

  it('expires sessions during content, revision restore and delete mutations', async () => {
    jest.mocked(isAdminSessionError).mockReturnValue(true);
    jest.mocked(updateAdminContentPostContent).mockRejectedValue(new Error('expired content'));
    jest.mocked(restoreAdminContentPostRevision).mockRejectedValue(new Error('expired restore'));
    jest.mocked(deleteAdminContentPost).mockRejectedValue(new Error('expired delete'));
    const { result } = renderEditor();
    await waitFor(() => expect(result.current.editor.editingPost).toEqual(post));

    act(() => result.current.editor.setPostEditorContent('Changed body'));
    await act(async () => result.current.editor.handleUpdatePostContent());
    act(() => result.current.editor.setPendingPostRevisionRestore(revision));
    await act(async () => result.current.editor.handleRestorePostRevision());
    act(() => result.current.editor.setPendingPostDelete(post));
    await act(async () => result.current.editor.handleDeletePost());

    expect(onSessionExpired).toHaveBeenCalledTimes(3);
    expect(result.current.editor.isPostContentUpdating).toBe(false);
    expect(result.current.editor.isPostRevisionRestoring).toBe(false);
    expect(result.current.editor.isPostDeleting).toBe(false);
  });

  it('accepts corrected revision pagination from the server', async () => {
    jest.mocked(fetchAdminContentPostRevisions).mockResolvedValue({
      items: [revision],
      total: 13,
      page: 2,
      size: 7,
    });
    const { result } = renderEditor();

    await waitFor(() => {
      expect(result.current.editor.postRevisionsPage).toBe(2);
      expect(result.current.editor.postRevisionsPageSize).toBe(7);
    });
    expect(result.current.editor.postRevisionsTotal).toBe(13);
  });

  it('ignores editor mutations when the post detail route is inactive', async () => {
    const { result } = renderEditor({ isPostDetailRoute: false });

    await act(async () => {
      await result.current.editor.handleUpdatePostMetadata();
      await result.current.editor.handleUpdatePostContent();
      await result.current.editor.handleRestorePostRevision();
      await result.current.editor.handleDeletePost();
    });

    expect(updateAdminContentPostMetadata).not.toHaveBeenCalled();
    expect(updateAdminContentPostContent).not.toHaveBeenCalled();
    expect(restoreAdminContentPostRevision).not.toHaveBeenCalled();
    expect(deleteAdminContentPost).not.toHaveBeenCalled();
  });
});
