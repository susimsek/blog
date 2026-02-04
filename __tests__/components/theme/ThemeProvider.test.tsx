import React from 'react';
import { render } from '@testing-library/react';
import ThemeProvider from '@/components/theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '@/config/store';

// Mock store selector
jest.mock('@/config/store', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn(),
}));

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.className = '';
  });

  it('renders children', () => {
    (useAppSelector as jest.Mock).mockReturnValue({ theme: 'light', hasExplicitTheme: true });
    (useAppDispatch as jest.Mock).mockReturnValue(jest.fn());

    render(
      <ThemeProvider>
        <div>Child Content</div>
      </ThemeProvider>,
    );
  });

  it('applies the dark theme class to the document element', () => {
    (useAppSelector as jest.Mock).mockReturnValue({ theme: 'dark', hasExplicitTheme: true });
    (useAppDispatch as jest.Mock).mockReturnValue(jest.fn());

    render(
      <ThemeProvider>
        <div>Child Content</div>
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
    expect(document.documentElement.classList.contains('oceanic-theme')).toBe(false);
  });

  it('applies the oceanic theme class to the document element', () => {
    (useAppSelector as jest.Mock).mockReturnValue({ theme: 'oceanic', hasExplicitTheme: true });
    (useAppDispatch as jest.Mock).mockReturnValue(jest.fn());

    render(
      <ThemeProvider>
        <div>Child Content</div>
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains('oceanic-theme')).toBe(true);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });

  it('applies the forest theme class to the document element', () => {
    (useAppSelector as jest.Mock).mockReturnValue({ theme: 'forest', hasExplicitTheme: true });
    (useAppDispatch as jest.Mock).mockReturnValue(jest.fn());

    render(
      <ThemeProvider>
        <div>Child Content</div>
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains('forest-theme')).toBe(true);
    expect(document.documentElement.classList.contains('oceanic-theme')).toBe(false);
  });

  it('dispatches system theme when no explicit theme', () => {
    const dispatch = jest.fn();
    (useAppSelector as jest.Mock).mockReturnValue({ theme: 'light', hasExplicitTheme: false });
    (useAppDispatch as jest.Mock).mockReturnValue(dispatch);

    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockReturnValue({
        matches: true,
        addEventListener,
        removeEventListener,
      }),
    });

    render(
      <ThemeProvider>
        <div>Child Content</div>
      </ThemeProvider>,
    );

    expect(dispatch).toHaveBeenCalledWith({ type: 'theme/setThemeFromSystem', payload: 'dark' });
  });
});
