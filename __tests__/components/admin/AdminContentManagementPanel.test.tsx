import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminContentManagementPanel from '@/components/admin/AdminContentManagementPanel';

let mockParams: Record<string, string | string[]> = {};
let mockRouter: { push: jest.Mock; replace: jest.Mock };
let mockBrowserState: Record<string, unknown>;
let mockNavigationState: Record<string, unknown>;
let mockEditorState: Record<string, unknown>;
let mockCommentsState: Record<string, unknown>;
let mockTaxonomyState: Record<string, unknown>;
let mockMediaState: Record<string, unknown>;
let mockMediaParams: Record<string, unknown> | null = null;
let mockOverviewProps: Record<string, unknown> | null = null;
let mockDetailProps: Record<string, unknown> | null = null;
let mockModalProps: Record<string, Record<string, unknown>[]>;
let mockResizeObserverCallback: ResizeObserverCallback | null = null;
let mockRenderSplitPreview = true;
let originalAnimationFrame: PropertyDescriptor | undefined;
let originalCancelAnimationFrame: PropertyDescriptor | undefined;
let originalResizeObserver: PropertyDescriptor | undefined;

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => mockRouter,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/i18n/useLocale', () => ({ useLocale: () => 'en' }));
jest.mock('@/hooks/useMediaQuery', () => ({ __esModule: true, default: () => false }));
jest.mock('@/hooks/admin-content/useAdminContentPostsBrowserSection', () => ({
  useAdminContentPostsBrowserSection: () => mockBrowserState,
}));
jest.mock('@/hooks/admin-content/useAdminContentNavigation', () => ({
  useAdminContentNavigation: () => mockNavigationState,
}));
jest.mock('@/hooks/admin-content/useAdminContentPostEditorSection', () => ({
  useAdminContentPostEditorSection: () => mockEditorState,
}));
jest.mock('@/hooks/admin-content/useAdminContentPostCommentsSection', () => ({
  useAdminContentPostCommentsSection: () => mockCommentsState,
}));
jest.mock('@/hooks/admin-content/useAdminContentTaxonomySection', () => ({
  useAdminContentTaxonomySection: () => mockTaxonomyState,
}));
jest.mock('@/hooks/admin-content/useAdminContentMediaSection', () => ({
  useAdminContentMediaSection: (params: Record<string, unknown>) => {
    mockMediaParams = params;
    return mockMediaState;
  },
}));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => null }));

jest.mock('@/components/admin/content/AdminContentOverviewTabs', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockOverviewProps = props;
    return <div data-testid="content-overview" />;
  },
}));

jest.mock('@/components/admin/content/AdminContentPostDetailSection', () => ({
  __esModule: true,
  default: function MockAdminContentPostDetailSection(props: Record<string, unknown>) {
    mockDetailProps = props;
    React.useEffect(() => {
      const previewRef = props.splitPreviewRef as React.MutableRefObject<HTMLDivElement | null>;
      const preview = previewRef.current;
      if (!preview) return;
      Object.defineProperties(preview, {
        scrollHeight: { configurable: true, value: 500 },
        clientHeight: { configurable: true, value: 100 },
      });
      const onViewportChange = props.onSplitEditorViewportChange as (viewport: {
        scrollHeight: number;
        clientHeight: number;
        scrollTop: number;
      }) => void;
      onViewportChange({ scrollHeight: 300, clientHeight: 100, scrollTop: 50 });
    }, [props.onSplitEditorViewportChange, props.splitPreviewRef]);
    return (
      <div data-testid="post-detail">
        {mockRenderSplitPreview && (
          <div ref={props.splitPreviewRef as React.Ref<HTMLDivElement>} data-testid="split-preview" />
        )}
        <div ref={props.postCommentsListTopRef as React.Ref<HTMLDivElement>} data-testid="comments-list-top" />
        {props.postSaveAction as React.ReactNode}
      </div>
    );
  },
}));

jest.mock('@/components/admin/content/AdminContentBulkPostCommentDeleteModal', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockModalProps.bulkComments = [...(mockModalProps.bulkComments ?? []), props];
    return null;
  },
}));
jest.mock('@/components/admin/content/AdminContentCategoryEditorModal', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockModalProps.categoryEditor = [...(mockModalProps.categoryEditor ?? []), props];
    return null;
  },
}));
jest.mock('@/components/admin/content/AdminContentDeleteEntityModal', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockModalProps.deleteEntity = [...(mockModalProps.deleteEntity ?? []), props];
    return null;
  },
}));
jest.mock('@/components/admin/content/AdminContentMediaDeleteModal', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockModalProps.mediaDelete = [...(mockModalProps.mediaDelete ?? []), props];
    return null;
  },
}));
jest.mock('@/components/admin/content/AdminContentPostCommentDeleteModal', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockModalProps.commentDelete = [...(mockModalProps.commentDelete ?? []), props];
    return null;
  },
}));
jest.mock('@/components/admin/content/AdminContentPostDeleteModal', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockModalProps.postDelete = [...(mockModalProps.postDelete ?? []), props];
    return null;
  },
}));
jest.mock('@/components/admin/content/AdminContentPostRevisionRestoreModal', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockModalProps.revisionRestore = [...(mockModalProps.revisionRestore ?? []), props];
    return null;
  },
}));
jest.mock('@/components/admin/content/AdminContentTopicEditorModal', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockModalProps.topicEditor = [...(mockModalProps.topicEditor ?? []), props];
    return null;
  },
}));

const defaultFor = (name: string) => {
  if (
    name.startsWith('set') ||
    name.startsWith('handle') ||
    name.startsWith('toggle') ||
    name.startsWith('open') ||
    name.startsWith('close') ||
    name.startsWith('clear') ||
    name.startsWith('reload') ||
    name.startsWith('navigate')
  ) {
    return jest.fn();
  }
  if (name.endsWith('InputRef')) return { current: null };
  if (name.endsWith('ByLocaleAndID')) return new Map();
  if (
    name.endsWith('Options') ||
    name.endsWith('Items') ||
    name.endsWith('IDs') ||
    name === 'posts' ||
    name === 'postLocaleTabs' ||
    name === 'postRevisions' ||
    name === 'postComments'
  )
    return [];
  if (
    name.startsWith('is') ||
    name.startsWith('can') ||
    name.startsWith('has') ||
    name === 'allVisiblePostCommentsSelected'
  )
    return false;
  if (name.startsWith('pending') || name === 'editingPost') return null;
  if (name.endsWith('PageSize')) return 10;
  if (name.endsWith('Page')) return 1;
  if (name.endsWith('TotalPages')) return 1;
  if (name.endsWith('Total')) return 0;
  return '';
};

const invoke = (props: Record<string, unknown> | null, name: string, ...args: unknown[]) => {
  const callback = props?.[name];
  if (typeof callback === 'function') {
    return (callback as (...values: unknown[]) => unknown)(...args);
  }
};

const sectionState = (overrides: Record<string, unknown> = {}) => {
  const functionCache = new Map<string, jest.Mock>();
  return new Proxy(overrides, {
    get(target, key: string) {
      if (key in target) return target[key];
      const value = defaultFor(key);
      if (typeof value !== 'function') return value;
      const cached = functionCache.get(key);
      if (cached) return cached;
      const fn = value as jest.Mock;
      functionCache.set(key, fn);
      return fn;
    },
  });
};

const renderPanel = () =>
  render(<AdminContentManagementPanel onSessionExpired={jest.fn()} formatDate={value => value} />);

describe('AdminContentManagementPanel', () => {
  beforeEach(() => {
    mockParams = {};
    mockRouter = { push: jest.fn(), replace: jest.fn() };
    mockOverviewProps = null;
    mockDetailProps = null;
    mockMediaParams = null;
    mockModalProps = {};
    mockRenderSplitPreview = true;
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: jest.fn() });
    originalAnimationFrame = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
    originalCancelAnimationFrame = Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame');
    originalResizeObserver = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver');
    Object.defineProperty(globalThis, 'requestAnimationFrame', {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
    Object.defineProperty(globalThis, 'cancelAnimationFrame', { configurable: true, value: jest.fn() });
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: class {
        constructor(callback: ResizeObserverCallback) {
          mockResizeObserverCallback = callback;
        }
        observe = jest.fn();
        disconnect = jest.fn();
        unobserve = jest.fn();
      },
    });
    mockBrowserState = sectionState({
      errorMessage: 'Load failed',
      successMessage: 'Saved',
      filterCategoryID: 'stale-category',
      filterTopicID: 'stale-topic',
      filterCategoryOptions: [],
      filterTopicOptions: [],
      postDensityMode: 'grid',
      mediaDensityMode: 'grid',
    });
    mockNavigationState = sectionState({
      activeTab: 'posts',
      postEditorTabKey: 'metadata',
      requestedPostEditorTab: 'metadata',
    });
    mockEditorState = sectionState({ postEditorThumbnail: '', postEditorTopicIDs: [] });
    mockCommentsState = sectionState();
    mockTaxonomyState = sectionState({
      categoriesByLocaleAndID: new Map(),
      topicsByLocaleAndID: new Map(),
      filterCategoryOptions: [],
      filterTopicOptions: [],
    });
    mockMediaState = sectionState({ mediaLibraryItems: [] });
  });

  afterEach(() => {
    const restore = (name: string, descriptor: PropertyDescriptor | undefined) => {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    };
    restore('requestAnimationFrame', originalAnimationFrame);
    restore('cancelAnimationFrame', originalCancelAnimationFrame);
    restore('ResizeObserver', originalResizeObserver);
  });

  it('renders overview feedback, falls back from grid density and clears stale taxonomy filters', () => {
    renderPanel();

    expect(screen.getByText('Load failed')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByTestId('content-overview')).toBeInTheDocument();
    expect(mockOverviewProps?.resolvedPostDensityMode).toBe('default');
    expect(mockOverviewProps?.resolvedMediaDensityMode).toBe('default');
    expect(mockBrowserState.setFilterCategoryID).toHaveBeenCalledWith('');
    expect(mockBrowserState.setFilterTopicID).toHaveBeenCalledWith('');
    expect(mockDetailProps).toBeNull();

    const item = { id: 'item-1', locale: 'en', value: '/images/file.webp' };
    invoke(mockOverviewProps, 'onTabSelect', 'media');
    invoke(mockOverviewProps, 'onClearFilterQuery');
    invoke(mockOverviewProps, 'onPostsPageChange', 2);
    invoke(mockOverviewProps, 'onPostsPageSizeChange', 20);
    invoke(mockOverviewProps, 'onOpenDeletePost', item);
    invoke(mockOverviewProps, 'onClearCategoryFilterQuery');
    invoke(mockOverviewProps, 'onOpenCreateCategory');
    invoke(mockOverviewProps, 'onOpenUpdateCategory', item);
    invoke(mockOverviewProps, 'onOpenDeleteCategory', item);
    invoke(mockOverviewProps, 'onCategoryPageChange', 2);
    invoke(mockOverviewProps, 'onCategoryPageSizeChange', 20);
    invoke(mockOverviewProps, 'onClearTopicFilterQuery');
    invoke(mockOverviewProps, 'onOpenCreateTopic');
    invoke(mockOverviewProps, 'onOpenUpdateTopic', item);
    invoke(mockOverviewProps, 'onOpenDeleteTopic', item);
    invoke(mockOverviewProps, 'onTopicPageChange', 2);
    invoke(mockOverviewProps, 'onTopicPageSizeChange', 20);
    invoke(mockOverviewProps, 'onMediaLibraryQueryChange', 'image');
    invoke(mockOverviewProps, 'onClearMediaLibraryQuery');
    invoke(mockOverviewProps, 'onMediaLibraryFilterChange', 'UPLOADED');
    invoke(mockOverviewProps, 'onMediaLibrarySortChange', 'SIZE');
    invoke(mockOverviewProps, 'onTriggerMediaUpload');
    invoke(mockOverviewProps, 'onUploadFileChange', new File(['x'], 'image.webp'));
    invoke(mockOverviewProps, 'onReplaceFileChange', new File(['x'], 'image.webp'));
    invoke(mockOverviewProps, 'onMediaDensityModeChange', 'grid');
    invoke(mockOverviewProps, 'onCopyMediaPath', item);
    invoke(mockOverviewProps, 'onTriggerReplaceMediaAsset', item);
    invoke(mockOverviewProps, 'onOpenDeleteMediaAsset', item);
    invoke(mockOverviewProps, 'onMediaLibraryPageChange', 2);
    invoke(mockOverviewProps, 'onMediaLibraryPageSizeChange', 20);
    invoke(mockOverviewProps, 'onMediaDensityModeChange', 'editorial');
    invoke(mockOverviewProps, 'formatDateTime', '2026-11-01T12:00:00.000Z');
    invoke(mockOverviewProps, 'formatCount', 100);
    expect((mockOverviewProps?.resolveAccentColor as (value: string) => string)('#abc')).toBe('#abc');
    expect((mockOverviewProps?.imageLoader as (value: { src: string }) => string)({ src: '/image.webp' })).toContain(
      '/image.webp',
    );
    if (mockMediaParams) {
      (mockMediaParams.onMediaValueDeleted as (value: string) => void)('/images/other.webp');
    }
    for (const entries of Object.values(mockModalProps)) {
      for (const props of entries) {
        invoke(props, 'onHide');
        invoke(props, 'onConfirm');
        invoke(props, 'onConfirmDelete');
        invoke(props, 'onSwitchLocale', 'tr');
        invoke(props, 'onSubmit');
      }
      expect(entries.length).toBeGreaterThan(0);
    }
  });

  it('builds medium post previews, canonicalizes tabs and exposes editor actions', () => {
    mockParams = { postLocale: [' EN '], postId: [' post-1 '] };
    mockNavigationState = sectionState({ postEditorTabKey: 'content', requestedPostEditorTab: 'content' });
    const post = {
      id: 'post-1',
      locale: 'EN',
      title: 'Original title',
      summary: ' Original summary ',
      thumbnail: '/images/post.webp',
      source: 'medium',
    };
    mockEditorState = sectionState({
      editingPost: post,
      postEditorCategoryID: 'games',
      postEditorTopicIDs: ['sports', 'missing'],
      postEditorTitle: '',
      postEditorSummary: '',
      postEditorThumbnail: '/images/post.webp',
      postContentViewMode: 'split',
      canSavePostMetadata: true,
      handleUpdatePostMetadata: jest.fn(),
      setPendingPostDelete: jest.fn(),
    });
    mockTaxonomyState = sectionState({
      categoriesByLocaleAndID: new Map([
        ['en|games', { id: 'games', name: 'Games', color: '#123456', icon: 'gamepad' }],
      ]),
      topicsByLocaleAndID: new Map([['en|sports', { id: 'sports', name: 'Sports', color: '#654321' }]]),
      filterCategoryOptions: [],
      filterTopicOptions: [],
    });
    mockMediaState = sectionState({
      mediaLibraryItems: [{ id: 'media-1', value: '/images/post.webp', kind: 'UPLOADED' }],
    });

    renderPanel();

    expect(screen.getByTestId('post-detail')).toBeInTheDocument();
    expect(mockOverviewProps).toBeNull();
    expect(mockDetailProps?.showInlinePostFeedback).toBe(true);
    expect(mockDetailProps?.postEditorPreviewState).toEqual(
      expect.objectContaining({
        localeCode: 'en',
        normalizedSource: 'medium',
        resolvedSummary: 'Original summary',
        resolvedPostCategory: expect.objectContaining({ id: 'games' }),
        resolvedTopicBadges: [expect.objectContaining({ id: 'sports' })],
      }),
    );
    expect(mockDetailProps?.postEditorSeoPreview).toEqual(
      expect.objectContaining({ title: 'Original title', description: 'Original summary' }),
    );
    expect((mockDetailProps?.splitPreviewRef as React.RefObject<HTMLDivElement | null>).current?.scrollTop).toBe(100);
    const preview = (mockDetailProps?.splitPreviewRef as React.RefObject<HTMLDivElement | null>).current;
    if (preview && mockResizeObserverCallback) {
      mockResizeObserverCallback([], {} as ResizeObserver);
      expect(preview.scrollTop).toBe(100);
    }
    expect(mockNavigationState.navigateToPostEditorRoute).toHaveBeenCalledWith(
      '/admin/settings/content/posts/en/post-1',
      'metadata',
      'replace',
    );
    invoke(mockDetailProps, 'onSwitchPostEditorLocale', 'en');
    invoke(mockDetailProps, 'formatDateTime', '2026-11-01T12:00:00.000Z');
    invoke(mockDetailProps, 'formatCount', 100);

    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.actions.updatePost' }));
    expect(mockEditorState.handleUpdatePostMetadata).toHaveBeenCalledTimes(1);
    (mockDetailProps?.onOpenDeletePost as () => void)();
    expect(mockEditorState.setPendingPostDelete).toHaveBeenCalledWith(post);
    (mockDetailProps?.onSwitchPostEditorLocale as (locale: 'en' | 'tr') => void)('tr');
    expect(mockRouter.push).toHaveBeenCalledWith('/admin/settings/content/posts/tr/post-1#metadata');
    if (mockMediaParams) {
      (mockMediaParams.onMediaValueDeleted as (value: string) => void)('/images/post.webp');
      expect(mockEditorState.setPostEditorThumbnail).toHaveBeenCalledWith('');
    }
    invoke(mockDetailProps, 'onPostSeoPreviewTabChange', 'twitter');
    invoke(mockDetailProps, 'onClearPostEditorThumbnail');
    invoke(mockDetailProps, 'onClearPostEditorTopicQuery');
    invoke(mockDetailProps, 'onPostRevisionsPageSizeChange', 25);
    invoke(mockDetailProps, 'onOpenRestoreRevision', { id: 'revision-1' });
    invoke(mockDetailProps, 'onPostCommentsStatusFilterChange', 'APPROVED');
    invoke(mockDetailProps, 'onPostCommentsFilterQueryChange', 'reply');
    invoke(mockDetailProps, 'onClearPostCommentsFilterQuery');
    invoke(mockDetailProps, 'onClearSelectedPostCommentIDs');
    invoke(mockDetailProps, 'onToggleVisiblePostCommentsSelection');
    invoke(mockDetailProps, 'onBulkApprove');
    invoke(mockDetailProps, 'onBulkReject');
    invoke(mockDetailProps, 'onBulkSpam');
    invoke(mockDetailProps, 'onOpenBulkDelete');
    invoke(mockDetailProps, 'onUpdatePostCommentStatus', 'comment-1', 'SPAM');
    invoke(mockDetailProps, 'onOpenDeletePostComment', { id: 'comment-1' });
    invoke(mockDetailProps, 'onPostCommentsPageChange', 2);
    invoke(mockDetailProps, 'onPostCommentsPageSizeChange', 20);
    expect((mockDetailProps?.resolveCommentStatusVariant as (status: string) => string)('APPROVED')).toBe('success');
    expect((mockDetailProps?.resolveCommentStatusVariant as (status: string) => string)('REJECTED')).toBe('secondary');
    expect((mockDetailProps?.resolveCommentStatusVariant as (status: string) => string)('SPAM')).toBe('danger');
    expect((mockDetailProps?.resolveCommentStatusVariant as (status: string) => string)('PENDING')).toBe('warning');
    invoke(mockDetailProps, 'onSplitEditorViewportChange', {
      scrollHeight: 300,
      clientHeight: 100,
      scrollTop: 50,
    });
    invoke(mockDetailProps, 'onSplitEditorViewportChange', {
      scrollHeight: 100,
      clientHeight: 100,
      scrollTop: 50,
    });
    for (const entries of Object.values(mockModalProps)) {
      for (const props of entries) {
        invoke(props, 'onHide');
        invoke(props, 'formatDateTime', '2026-11-01T12:00:00.000Z');
        invoke(props, 'onConfirm');
        invoke(props, 'onConfirmDelete');
        invoke(props, 'onSwitchLocale', 'tr');
        invoke(props, 'onSubmit');
      }
    }
  });

  it('keeps delete and edit dialogs open while their operations are pending', () => {
    mockBrowserState = sectionState({ filterCategoryOptions: [], filterTopicOptions: [] });
    mockEditorState = sectionState({
      isPostRevisionRestoring: true,
      isPostDeleting: true,
    });
    mockCommentsState = sectionState({
      isBulkPostCommentDeleting: true,
      deletingPostCommentID: 'comment-1',
    });
    mockMediaState = sectionState({ isMediaAssetDeleting: true });
    mockTaxonomyState = sectionState({
      isTopicSubmitting: true,
      isTopicDeleting: true,
      isCategorySubmitting: true,
      isCategoryDeleting: true,
      categoriesByLocaleAndID: new Map(),
      topicsByLocaleAndID: new Map(),
      filterCategoryOptions: [],
      filterTopicOptions: [],
    });

    renderPanel();

    for (const props of mockModalProps.mediaDelete ?? []) invoke(props, 'onHide');
    for (const props of mockModalProps.revisionRestore ?? []) invoke(props, 'onHide');
    for (const props of mockModalProps.postDelete ?? []) invoke(props, 'onHide');
    for (const props of mockModalProps.bulkComments ?? []) invoke(props, 'onHide');
    for (const props of mockModalProps.commentDelete ?? []) invoke(props, 'onHide');
    for (const props of mockModalProps.topicEditor ?? []) invoke(props, 'onHide');
    for (const props of mockModalProps.deleteEntity ?? []) invoke(props, 'onHide');
    for (const props of mockModalProps.categoryEditor ?? []) invoke(props, 'onHide');

    expect(mockMediaState.setPendingMediaAssetDelete).not.toHaveBeenCalled();
    expect(mockEditorState.setPendingPostRevisionRestore).not.toHaveBeenCalled();
    expect(mockEditorState.setPendingPostDelete).not.toHaveBeenCalled();
    expect(mockCommentsState.setPendingBulkPostCommentDeleteIDs).not.toHaveBeenCalled();
    expect(mockCommentsState.setPendingPostCommentDelete).not.toHaveBeenCalled();
    expect(mockTaxonomyState.setIsTopicEditorOpen).not.toHaveBeenCalled();
    expect(mockTaxonomyState.setPendingTopicDelete).not.toHaveBeenCalled();
    expect(mockTaxonomyState.setIsCategoryEditorOpen).not.toHaveBeenCalled();
    expect(mockTaxonomyState.setPendingCategoryDelete).not.toHaveBeenCalled();
  });

  it('renders blog comment mode without a save action and falls back to SEO defaults', () => {
    mockParams = { postLocale: 'en', postId: 'post-1' };
    mockNavigationState = sectionState({ postEditorTabKey: 'comments', requestedPostEditorTab: 'comments' });
    const post = {
      id: '  ',
      locale: ' ',
      title: ' ',
      summary: null,
      thumbnail: null,
      source: 'blog',
    };
    const setPendingPostDelete = jest.fn();
    mockEditorState = sectionState({
      editingPost: post,
      postEditorTitle: ' ',
      postEditorSummary: ' ',
      postEditorThumbnail: '',
      postEditorTopicIDs: [],
      postContentViewMode: 'split',
      setPendingPostDelete,
    });
    mockRenderSplitPreview = false;

    renderPanel();

    expect(mockDetailProps?.postSaveAction).toBeNull();
    expect(mockDetailProps?.postEditorPreviewState).toEqual(
      expect.objectContaining({
        normalizedSource: 'blog',
        resolvedSummary: '',
        resolvedPostCategory: null,
        resolvedTopicBadges: [],
      }),
    );
    expect(mockDetailProps?.postEditorSeoPreview).toEqual(
      expect.objectContaining({
        title: 'adminAccount.content.modals.post.seo.placeholderTitle',
        description: 'adminAccount.content.modals.post.seo.placeholderDescription',
        previewImageSrc: null,
      }),
    );

    (mockDetailProps?.onOpenDeletePost as () => void)();
    expect(setPendingPostDelete).toHaveBeenCalledWith(post);
  });
});
