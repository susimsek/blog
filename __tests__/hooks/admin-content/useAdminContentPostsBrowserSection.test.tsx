import { act, renderHook, waitFor } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { fetchAdminContentPosts, isAdminSessionError, resolveAdminError } from '@/lib/adminApi';
import { useAdminContentPostsBrowserSection } from '@/hooks/admin-content/useAdminContentPostsBrowserSection';

jest.mock('@/lib/adminApi', () => ({
  fetchAdminContentPosts: jest.fn(),
  isAdminSessionError: jest.fn(() => false),
  resolveAdminError: jest.fn((error: unknown) => ({
    kind: 'unknown',
    message: error instanceof Error ? error.message : '',
  })),
}));

const payload = (overrides: Record<string, unknown> = {}) => ({ items: [], total: 0, page: 1, size: 10, ...overrides });
const makeParams = (overrides: Partial<Parameters<typeof useAdminContentPostsBrowserSection>[0]> = {}) => ({
  currentDatePickerLocale: 'en',
  isPostDetailRoute: false,
  onSessionExpired: jest.fn(),
  t: ((key: string) => key) as TFunction,
  ...overrides,
});

describe('useAdminContentPostsBrowserSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchAdminContentPosts).mockResolvedValue(payload() as never);
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockImplementation((error: unknown) => ({
      kind: 'unknown',
      message: error instanceof Error ? error.message : '',
    }));
  });

  it('loads default posts and applies server pagination corrections', async () => {
    jest.mocked(fetchAdminContentPosts).mockResolvedValue(
      payload({
        items: [{ id: 'post-1' }],
        total: 35,
        page: 2,
        size: 20,
      }) as never,
    );
    const { result } = renderHook(() =>
      useAdminContentPostsBrowserSection(makeParams({ currentDatePickerLocale: 'tr' })),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchAdminContentPosts).toHaveBeenCalledWith({
      locale: undefined,
      preferredLocale: 'tr',
      source: undefined,
      query: '',
      categoryId: undefined,
      topicId: undefined,
      page: 1,
      size: 10,
    });
    expect(result.current.posts).toEqual([{ id: 'post-1' }]);
    expect(result.current.total).toBe(35);
    expect(result.current.page).toBe(2);
    expect(result.current.pageSize).toBe(20);
    expect(result.current.totalPages).toBe(2);
  });

  it('applies filters, preferred locale, density modes and explicit reloads', async () => {
    const { result } = renderHook(() =>
      useAdminContentPostsBrowserSection(
        makeParams({
          currentDatePickerLocale: 'en',
          isPostDetailRoute: true,
        }),
      ),
    );
    expect(fetchAdminContentPosts).not.toHaveBeenCalled();
    expect(result.current.preferredContentLocale).toBe('en');

    act(() => {
      result.current.setFilterLocale('tr');
      result.current.setFilterSource('medium');
      result.current.setFilterQuery('  captain  ');
      result.current.setFilterCategoryID('sports');
      result.current.setFilterTopicID('anime');
      result.current.setPageSize(25);
      result.current.setPostDensityMode('grid');
      result.current.setMediaDensityMode('editorial');
      result.current.setSuccessMessage('Saved');
    });
    expect(result.current.preferredContentLocale).toBe('tr');
    expect(result.current.postDensityMode).toBe('grid');
    expect(result.current.mediaDensityMode).toBe('editorial');

    await act(async () => result.current.reloadPosts());
    expect(fetchAdminContentPosts).toHaveBeenCalledWith({
      locale: 'tr',
      preferredLocale: 'tr',
      source: 'medium',
      query: '',
      categoryId: 'sports',
      topicId: 'anime',
      page: 1,
      size: 25,
    });

    act(() => result.current.setFilterLocale('en'));
    await act(async () => result.current.reloadPosts());
    expect(fetchAdminContentPosts).toHaveBeenLastCalledWith(
      expect.objectContaining({
        locale: 'en',
        preferredLocale: 'en',
        source: 'medium',
        categoryId: 'sports',
        topicId: 'anime',
      }),
    );
    jest.mocked(fetchAdminContentPosts).mockRejectedValueOnce(new Error('unavailable'));
    jest.mocked(resolveAdminError).mockReturnValueOnce({ kind: 'unknown', message: '' } as never);
    await act(async () => result.current.reloadPosts());
    expect(result.current.errorMessage).toBe('adminAccount.content.errors.postLoad');
    expect(result.current.posts).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('redirects expired sessions and ignores stale request completions', async () => {
    const expired = makeParams();
    jest.mocked(fetchAdminContentPosts).mockRejectedValueOnce(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValueOnce(true);
    const sessionHook = renderHook(() => useAdminContentPostsBrowserSection(expired));
    await waitFor(() => expect(expired.onSessionExpired).toHaveBeenCalled());
    sessionHook.unmount();

    let resolveOld!: (value: never) => void;
    const oldRequest = new Promise<never>(resolve => {
      resolveOld = resolve;
    });
    jest.mocked(fetchAdminContentPosts).mockReturnValueOnce(oldRequest);
    const { result } = renderHook(() => useAdminContentPostsBrowserSection(makeParams({ isPostDetailRoute: true })));
    let staleReload!: Promise<void>;
    act(() => {
      staleReload = result.current.reloadPosts();
    });
    await act(async () => result.current.reloadPosts());
    resolveOld(payload({ items: [{ id: 'stale' }] }) as never);
    await act(async () => staleReload);
    expect(result.current.posts).toEqual([]);
  });
});
