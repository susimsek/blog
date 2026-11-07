import { act, renderHook } from '@testing-library/react';
import { useAdminContentNavigation } from '@/hooks/admin-content/useAdminContentNavigation';

describe('useAdminContentNavigation', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/en/admin/settings/content#topics');
  });

  it('hydrates content and editor tabs from the URL hash and responds to hash changes', () => {
    const { result } = renderHook(() => useAdminContentNavigation({ routeLocale: 'en' }));
    expect(result.current.activeTab).toBe('topics');
    expect(result.current.postEditorTabKey).toBe('metadata');

    act(() => {
      window.history.replaceState(null, '', '/en/admin/settings/content#media');
      window.dispatchEvent(new Event('hashchange'));
    });
    expect(result.current.activeTab).toBe('media');

    act(() => {
      window.history.replaceState(null, '', '/en/admin/settings/content#comments');
      window.dispatchEvent(new Event('hashchange'));
    });
    expect(result.current.postEditorTabKey).toBe('comments');
    expect(result.current.requestedPostEditorTab).toBe('comments');

    act(() => {
      window.history.replaceState(null, '', '/en/admin/settings/content#content');
      window.dispatchEvent(new Event('hashchange'));
    });
    expect(result.current.postEditorTabKey).toBe('content');
  });

  it('selects valid and fallback content tabs and avoids redundant URL changes', () => {
    const replaceState = jest.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useAdminContentNavigation({ routeLocale: 'tr' }));
    act(() => result.current.handleTabSelect('posts'));
    expect(result.current.activeTab).toBe('posts');
    expect(window.location.hash).toBe('#posts');
    expect(replaceState).toHaveBeenCalledTimes(1);

    act(() => result.current.handleTabSelect('unknown'));
    expect(result.current.activeTab).toBe('categories');
    expect(window.location.hash).toBe('#categories');
    act(() => result.current.handleTabSelect('categories'));
    expect(replaceState).toHaveBeenCalledTimes(2);
    replaceState.mockRestore();
  });

  it('navigates to localized editor routes with push, replace, and same-route updates', () => {
    const pushState = jest.spyOn(window.history, 'pushState');
    const replaceState = jest.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useAdminContentNavigation({ routeLocale: 'tr' }));

    act(() => result.current.navigateToPostEditorRoute('/admin/settings/content/posts/en/post-id', 'content'));
    expect(pushState).toHaveBeenCalledWith(null, '', '/admin/settings/content/posts/en/post-id#content');
    expect(result.current.postEditorTabKey).toBe('content');

    act(() =>
      result.current.navigateToPostEditorRoute('/admin/settings/content/posts/en/post-id', 'comments', 'replace'),
    );
    expect(replaceState).toHaveBeenCalledWith(null, '', '/admin/settings/content/posts/en/post-id#comments');
    expect(result.current.postEditorTabKey).toBe('comments');

    act(() => {
      window.history.replaceState(null, '', '/admin/settings/content/posts/en/post-id#metadata');
      result.current.navigateToPostEditorRoute('/admin/settings/content/posts/en/post-id', 'metadata');
    });
    expect(result.current.postEditorTabKey).toBe('metadata');
    expect(pushState).toHaveBeenCalledTimes(1);
    pushState.mockRestore();
    replaceState.mockRestore();
  });
});
