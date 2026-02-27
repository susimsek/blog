import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import useHoverSound from '@/hooks/useHoverSound';

function TestHoverSoundButton() {
  const playHoverSound = useHoverSound({
    src: '/sounds/hover.mp3',
    enabled: true,
    volume: 0.4,
    playbackRate: 1.2,
  });

  return (
    <button type="button" onMouseEnter={playHoverSound}>
      Hover me
    </button>
  );
}

describe('useHoverSound', () => {
  it('creates audio, plays on hover, and pauses on unmount', () => {
    const pause = jest.fn();
    const play = jest.fn().mockResolvedValue(undefined);

    (global as typeof globalThis & { Audio: jest.Mock }).Audio = jest.fn().mockImplementation(() => ({
      play,
      pause,
      preload: 'auto',
      volume: 1,
      playbackRate: 1,
      currentTime: 0,
    }));

    const { unmount } = render(<TestHoverSoundButton />);

    fireEvent.mouseEnter(screen.getByRole('button', { name: /hover me/i }));

    expect(global.Audio).toHaveBeenCalledWith('/sounds/hover.mp3');
    expect(play).toHaveBeenCalled();

    unmount();

    expect(pause).toHaveBeenCalled();
  });
});
