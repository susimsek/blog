import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import useBoop from '@/hooks/useBoop';

function BoopProbe(props: Parameters<typeof useBoop>[0]) {
  const [style, trigger] = useBoop(props);
  return (
    <button
      type="button"
      data-testid="boop-trigger"
      data-transform={String(style.transform)}
      data-transition={String(style.transition)}
      onClick={trigger}
    >
      boop
    </button>
  );
}

describe('useBoop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('returns default idle transform style', () => {
    render(<BoopProbe />);

    const button = screen.getByTestId('boop-trigger');
    expect(button).toHaveAttribute('data-transform', 'translate(0px, 0px) rotate(0deg) scale(1)');
    expect(button).toHaveAttribute('data-transition', expect.stringContaining('transform'));
  });

  it('applies boop transform and resets after timing', () => {
    render(<BoopProbe x={4} y={-2} rotation={6} scale={1.1} timing={120} />);

    const button = screen.getByTestId('boop-trigger');
    fireEvent.click(button);
    expect(button).toHaveAttribute('data-transform', 'translate(4px, -2px) rotate(6deg) scale(1.1)');

    act(() => {
      jest.advanceTimersByTime(120);
    });

    expect(button).toHaveAttribute('data-transform', 'translate(0px, 0px) rotate(0deg) scale(1)');
  });

  it('clears previous timeout when triggered repeatedly and on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout');
    const { unmount } = render(<BoopProbe timing={200} />);
    const button = screen.getByTestId('boop-trigger');

    fireEvent.click(button);
    fireEvent.click(button);

    expect(clearTimeoutSpy).toHaveBeenCalled();

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});
