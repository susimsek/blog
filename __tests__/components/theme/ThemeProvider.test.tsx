import React from 'react';
import { render } from '@testing-library/react';
import ThemeProvider from '@/components/theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '@/config/store';

const useAppDispatchMock = useAppDispatch as unknown as jest.Mock;
const useAppSelectorMock = useAppSelector as unknown as jest.Mock;

jest.mock('@/config/store', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn(),
}));

describe('ThemeProvider', () => {
  const addEventListener = jest.fn();
  const removeEventListener = jest.fn();
  const matchMediaMock = jest.fn();
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.className = '';
    useAppDispatchMock.mockReturnValue(dispatch);

    matchMediaMock.mockImplementation((query: string) => ({
      matches: query.includes('prefers-color-scheme'),
      media: query,
      addEventListener,
      removeEventListener,
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  it('renders children', () => {
    useAppSelectorMock.mockReturnValue({ theme: 'light', hasExplicitTheme: true });

    render(
      <ThemeProvider>
        <div>Child Content</div>
      </ThemeProvider>,
    );
  });

  it('applies the selected theme class', () => {
    useAppSelectorMock.mockReturnValue({ theme: 'dark', hasExplicitTheme: true });
    render(<ThemeProvider>Child</ThemeProvider>);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
  });

  it('adds transition class on theme change when reduced motion is disabled', () => {
    jest.useFakeTimers();
    useAppSelectorMock
      .mockReturnValueOnce({ theme: 'light', hasExplicitTheme: true })
      .mockReturnValueOnce({ theme: 'forest', hasExplicitTheme: true });

    const { rerender } = render(<ThemeProvider>Child</ThemeProvider>);
    rerender(<ThemeProvider>Child</ThemeProvider>);

    expect(document.documentElement.classList.contains('forest-theme')).toBe(true);
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(true);

    jest.advanceTimersByTime(321);
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false);
    jest.useRealTimers();
  });

  it('skips transition class when reduced motion is enabled', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener,
      removeEventListener,
    }));
    useAppSelectorMock
      .mockReturnValueOnce({ theme: 'light', hasExplicitTheme: true })
      .mockReturnValueOnce({ theme: 'oceanic', hasExplicitTheme: true });

    const { rerender } = render(<ThemeProvider>Child</ThemeProvider>);
    rerender(<ThemeProvider>Child</ThemeProvider>);

    expect(document.documentElement.classList.contains('oceanic-theme')).toBe(true);
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false);
  });

  it('dispatches system theme and subscribes to preference changes', () => {
    useAppSelectorMock.mockReturnValue({ theme: 'light', hasExplicitTheme: false });
    const { unmount } = render(<ThemeProvider>Child</ThemeProvider>);

    expect(dispatch).toHaveBeenCalledWith({ type: 'theme/setThemeFromSystem', payload: 'dark' });
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('does not subscribe to system theme when explicit theme is set', () => {
    useAppSelectorMock.mockReturnValue({ theme: 'light', hasExplicitTheme: true });
    render(<ThemeProvider>Child</ThemeProvider>);
    expect(addEventListener).not.toHaveBeenCalled();
  });

  it('handles missing matchMedia safely', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined,
    });
    useAppSelectorMock.mockReturnValue({ theme: 'light', hasExplicitTheme: false });

    expect(() => render(<ThemeProvider>Child</ThemeProvider>)).not.toThrow();
  });
});
