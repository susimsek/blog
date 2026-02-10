import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from '@/config/store';
import type { RootState } from '@/config/store';

type TestPreloadedState = Partial<RootState>;

export const createTestStore = (preloadedState?: TestPreloadedState) => makeStore(preloadedState);

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
