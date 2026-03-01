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
  afterEach(() => {
    delete (global as typeof globalThis & { Audio?: jest.Mock }).Audio;
    jest.restoreAllMocks();
  });

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

  it('skips playback when sound is disabled or Audio is unavailable', () => {
    const DisabledButton = () => {
      const playHoverSound = useHoverSound({
        src: '/sounds/hover.mp3',
        enabled: false,
      });

      return (
        <button type="button" onMouseEnter={playHoverSound}>
          Disabled hover
        </button>
      );
    };

    (global as typeof globalThis & { Audio?: jest.Mock }).Audio = jest.fn();

    const { rerender } = render(<DisabledButton />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /disabled hover/i }));
    expect(global.Audio).not.toHaveBeenCalled();

    delete (global as typeof globalThis & { Audio?: jest.Mock }).Audio;

    rerender(<TestHoverSoundButton />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /hover me/i }));
  });

  it('handles missing play promises and swallowed playback failures', () => {
    const pause = jest.fn();
    const rejectedPlay = jest.fn().mockReturnValue(Promise.reject(new Error('blocked')));
    (global as typeof globalThis & { Audio: jest.Mock }).Audio = jest
      .fn()
      .mockImplementationOnce(() => ({
        play: jest.fn().mockReturnValue(undefined),
        pause,
        preload: 'auto',
        volume: 1,
        playbackRate: 1,
        currentTime: 0,
      }))
      .mockImplementationOnce(() => ({
        play: rejectedPlay,
        pause,
        preload: 'auto',
        volume: 1,
        playbackRate: 1,
        currentTime: 0,
      }));

    const { rerender } = render(<TestHoverSoundButton />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /hover me/i }));

    rerender(<TestHoverSoundButton key="second" />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /hover me/i }));

    expect(rejectedPlay).toHaveBeenCalled();
  });

  it('swallows constructor failures', () => {
    (global as typeof globalThis & { Audio: jest.Mock }).Audio = jest.fn(() => {
      throw new Error('unsupported');
    });

    render(<TestHoverSoundButton />);

    expect(() => {
      fireEvent.mouseEnter(screen.getByRole('button', { name: /hover me/i }));
    }).not.toThrow();
  });
});
