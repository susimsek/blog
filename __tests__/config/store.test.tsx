// __tests__/config/store.test.ts
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store, { useAppSelector, useAppDispatch } from '@/config/store';
import themeReducer from '@/reducers/theme';

describe('Redux Store', () => {
  it('should initialize with the correct state shape', () => {
    const state = store.getState();
    expect(state).toHaveProperty('theme');
    expect(state.theme).toBeDefined();
  });

  it('should have the theme reducer correctly integrated', () => {
    const initialState = themeReducer(undefined, { type: '@@INIT' });
    expect(store.getState().theme).toEqual(initialState);
  });

  it('should allow useAppSelector to access state', () => {
    const TestComponent = () => {
      const theme = useAppSelector(state => state.theme);
      return <div data-testid="theme">{JSON.stringify(theme)}</div>;
    };

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    const themeElement = screen.getByTestId('theme');
    expect(themeElement.textContent).toEqual(JSON.stringify(store.getState().theme));
  });

  it('should allow useAppDispatch to dispatch actions', () => {
    const TestComponent = () => {
      const dispatch = useAppDispatch();

      return (
        <button
          onClick={() =>
            dispatch({
              type: 'theme/setTheme',
              payload: 'dark',
            })
          }
        >
          Set Theme
        </button>
      );
    };

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    const stateBefore = store.getState().theme;
    expect(stateBefore).toBeDefined();

    const button = screen.getByRole('button', { name: 'Set Theme' });
    button.click();

    const stateAfter = store.getState().theme;
    expect(stateAfter).not.toEqual(stateBefore);
  });
});
