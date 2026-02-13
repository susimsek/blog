import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

type UseBoopOptions = {
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
  timing?: number;
};

export type BoopStyle = CSSProperties & Record<string, string | undefined>;

const useBoop = ({ x = 0, y = 0, rotation = 0, scale = 1, timing = 150 }: UseBoopOptions = {}): [
  BoopStyle,
  () => void,
] => {
  const timeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const [isBooped, setIsBooped] = useState(false);

  const style = useMemo<BoopStyle>(
    () => ({
      transform: isBooped
        ? `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`
        : 'translate(0px, 0px) rotate(0deg) scale(1)',
      transition: 'transform 220ms cubic-bezier(0.23, 0.62, 0.41, 1.01)',
      backfaceVisibility: 'hidden',
      transformOrigin: 'center center',
    }),
    [isBooped, rotation, scale, x, y],
  );

  const trigger = useCallback(() => {
    setIsBooped(true);
    if (timeoutRef.current) {
      globalThis.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = globalThis.setTimeout(() => {
      setIsBooped(false);
    }, timing);
  }, [timing]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        globalThis.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return [style, trigger];
};

export default useBoop;
