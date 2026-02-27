import React from 'react';
import { act, render, screen } from '@testing-library/react';
import useMediaQuery from '@/hooks/useMediaQuery';

function TestComponent({ query }: Readonly<{ query: string }>) {
  const matches = useMediaQuery(query);
  return <div data-testid="matches">{String(matches)}</div>;
}

describe('useMediaQuery', () => {
  it('returns false when matchMedia is unavailable', () => {
    const originalMatchMedia = window.matchMedia;
    // Simulate environments that do not provide matchMedia.
    window.matchMedia = undefined as unknown as typeof window.matchMedia;

    render(<TestComponent query="(min-width: 768px)" />);
    expect(screen.getByTestId('matches')).toHaveTextContent('false');

    window.matchMedia = originalMatchMedia;
  });

  it('subscribes to media query changes and cleans up listeners', () => {
    const originalMatchMedia = window.matchMedia;
    let changeHandler: (() => void) | undefined;
    const addEventListener = jest.fn((_event: string, handler: () => void) => {
      changeHandler = handler;
    });
    const removeEventListener = jest.fn();
    const mediaQueryList = {
      matches: false,
      addEventListener,
      removeEventListener,
    };

    window.matchMedia = jest.fn().mockReturnValue(mediaQueryList) as unknown as typeof window.matchMedia;

    const { rerender, unmount } = render(<TestComponent query="(min-width: 768px)" />);
    expect(screen.getByTestId('matches')).toHaveTextContent('false');
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    act(() => {
      mediaQueryList.matches = true;
      changeHandler?.();
    });
    expect(screen.getByTestId('matches')).toHaveTextContent('true');

    rerender(<TestComponent query="(prefers-reduced-motion: reduce)" />);
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();
    expect(removeEventListener).toHaveBeenCalledTimes(2);

    window.matchMedia = originalMatchMedia;
  });
});
