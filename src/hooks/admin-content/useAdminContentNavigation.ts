'use client';

import React from 'react';
import { buildAdminContentPostDetailHash, withAdminLocalePath } from '@/lib/adminRoutes';

type ContentSectionTab = 'posts' | 'topics' | 'categories' | 'media';
type PostEditorTab = 'metadata' | 'content' | 'comments';

const resolvePostEditorTab = (value?: string | null, allowContent = true): PostEditorTab => {
  const normalizedValue = value?.trim().toLowerCase();
  if (normalizedValue === 'comments') {
    return 'comments';
  }
  if (normalizedValue === 'content' && allowContent) {
    return 'content';
  }
  return 'metadata';
};

const resolveContentSectionTab = (value?: string | null): ContentSectionTab => {
  const resolved = value?.trim().toLowerCase();
  if (resolved === 'topics') {
    return 'topics';
  }
  if (resolved === 'posts') {
    return 'posts';
  }
  if (resolved === 'media') {
    return 'media';
  }
  return 'categories';
};

type UseAdminContentNavigationParams = {
  routeLocale: string;
};

export function useAdminContentNavigation({ routeLocale }: UseAdminContentNavigationParams) {
  const [activeTab, setActiveTab] = React.useState<ContentSectionTab>('categories');
  const [postEditorTabKey, setPostEditorTabKey] = React.useState<PostEditorTab>('metadata');

  const requestedPostEditorTab = resolvePostEditorTab(postEditorTabKey);

  React.useEffect(() => {
    const appWindow = globalThis.window;
    if (!appWindow) {
      return;
    }

    const syncTabFromHash = () => {
      const hashValue = appWindow.location.hash.replace(/^#/, '');
      setActiveTab(resolveContentSectionTab(hashValue));
    };

    syncTabFromHash();
    appWindow.addEventListener('hashchange', syncTabFromHash);
    return () => {
      appWindow.removeEventListener('hashchange', syncTabFromHash);
    };
  }, []);

  React.useEffect(() => {
    const appWindow = globalThis.window;
    if (!appWindow) {
      return;
    }

    const syncPostEditorTabFromHash = () => {
      const hashValue = appWindow.location.hash.replace(/^#/, '');
      setPostEditorTabKey(resolvePostEditorTab(hashValue));
    };

    syncPostEditorTabFromHash();
    appWindow.addEventListener('hashchange', syncPostEditorTabFromHash);
    return () => {
      appWindow.removeEventListener('hashchange', syncPostEditorTabFromHash);
    };
  }, []);

  const handleTabSelect = React.useCallback((nextKey: string | null) => {
    const resolvedTab = resolveContentSectionTab(nextKey);
    setActiveTab(resolvedTab);

    const appWindow = globalThis.window;
    if (!appWindow) {
      return;
    }

    const nextHash = `#${resolvedTab}`;
    if (appWindow.location.hash === nextHash) {
      return;
    }

    const nextURL = `${appWindow.location.pathname}${appWindow.location.search}${nextHash}`;
    appWindow.history.replaceState(appWindow.history.state, '', nextURL);
  }, []);

  const navigateToPostEditorRoute = React.useCallback(
    (nextRoute: string, nextTab: PostEditorTab, mode: 'push' | 'replace' = 'push') => {
      const appWindow = globalThis.window;
      if (!appWindow) {
        return;
      }

      const nextURL = withAdminLocalePath(routeLocale, `${nextRoute}${buildAdminContentPostDetailHash(nextTab)}`);
      if (
        appWindow.location.pathname === withAdminLocalePath(routeLocale, nextRoute) &&
        appWindow.location.hash === `#${nextTab}`
      ) {
        setPostEditorTabKey(nextTab);
        return;
      }

      if (mode === 'replace') {
        appWindow.history.replaceState(appWindow.history.state, '', nextURL);
      } else {
        appWindow.history.pushState(appWindow.history.state, '', nextURL);
      }
      setPostEditorTabKey(nextTab);
    },
    [routeLocale],
  );

  return {
    activeTab,
    handleTabSelect,
    postEditorTabKey,
    requestedPostEditorTab,
    navigateToPostEditorRoute,
  };
}
