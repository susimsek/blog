import { useCallback, useEffect, useRef } from 'react';

type UseHoverSoundOptions = {
  src: string;
  enabled: boolean;
  volume?: number;
  playbackRate?: number;
};

const useHoverSound = ({ src, enabled, volume = 1, playbackRate = 1 }: UseHoverSoundOptions) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (!enabled || typeof globalThis.Audio === 'undefined') {
      return;
    }

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(src);
        audioRef.current.preload = 'auto';
      }

      const sound = audioRef.current;
      sound.volume = volume;
      sound.playbackRate = playbackRate;
      sound.pause();
      sound.currentTime = 0;

      const playPromise = sound.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Ignore playback failures (autoplay restrictions / unsupported environments).
        });
      }
    } catch {
      // Ignore playback failures (autoplay restrictions / unsupported environments).
    }
  }, [enabled, src, volume, playbackRate]);

  useEffect(
    () => () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    },
    [],
  );

  return play;
};

export default useHoverSound;
