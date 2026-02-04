import React, { useEffect, useMemo, useState } from 'react';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [topOffset, setTopOffset] = useState(0);

  const raf = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return window.requestAnimationFrame
      ? (cb: FrameRequestCallback) => window.requestAnimationFrame(cb)
      : (cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 0);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const headerEl = document.querySelector('nav.navbar.sticky-top') as HTMLElement | null;

    const updateOffset = () => {
      const next = headerEl?.getBoundingClientRect().height ?? 0;
      setTopOffset(Math.max(0, Math.round(next)));
    };

    updateOffset();
    window.addEventListener('resize', updateOffset);

    let ro: ResizeObserver | null = null;
    if (headerEl && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateOffset);
      ro.observe(headerEl);
    }

    return () => {
      window.removeEventListener('resize', updateOffset);
      ro?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let scheduled = false;

    const update = () => {
      scheduled = false;

      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const scrollHeight = doc.scrollHeight || 0;
      const clientHeight = window.innerHeight || doc.clientHeight || 0;

      const maxScroll = Math.max(1, scrollHeight - clientHeight);
      const next = clamp((scrollTop / maxScroll) * 100, 0, 100);
      setProgress(next);
    };

    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      (raf ?? (cb => window.setTimeout(() => cb(performance.now()), 0)))(update as FrameRequestCallback);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [raf]);

  return (
    <div
      className="reading-progress"
      style={{ top: topOffset }}
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div className="reading-progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
