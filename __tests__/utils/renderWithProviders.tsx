import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { AnyAction, configureStore } from '@reduxjs/toolkit';
import themeReducer, { type ThemeState } from '@/reducers/theme';
import postsQueryReducer, { type PostsQueryState } from '@/reducers/postsQuery';

type TestPreloadedState = Partial<{
  theme: ThemeState;
  postsQuery: PostsQueryState;
}>;

export const createTestStore = (preloadedState?: TestPreloadedState) =>
  configureStore({
    reducer: {
      theme: themeReducer as (state: ThemeState | undefined, action: AnyAction) => ThemeState,
      postsQuery: postsQueryReducer as (state: PostsQueryState | undefined, action: AnyAction) => PostsQueryState,
    },
    preloadedState,
  });

type TestStore = ReturnType<typeof createTestStore>;

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: TestPreloadedState;
  store?: TestStore;
}

export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, store = createTestStore(preloadedState), ...renderOptions }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
