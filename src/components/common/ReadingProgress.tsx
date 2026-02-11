import React, { useEffect, useState } from 'react';
import { BACK_TO_TOP_EVENT } from '@/lib/scrollEvents';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const BACK_TO_TOP_HIDE_DELAY_MS = 200;
const scheduleFrame = (cb: FrameRequestCallback) => {
  const win = globalThis.window;
  if (!win) {
    globalThis.setTimeout(() => cb(performance.now()), 0);
    return;
  }

  if (typeof win.requestAnimationFrame === 'function') {
    win.requestAnimationFrame(cb);
    return;
  }

  win.setTimeout(() => cb(performance.now()), 0);
};

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [topOffset, setTopOffset] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isBackToTopActive, setIsBackToTopActive] = useState(false);

  useEffect(() => {
    const win = globalThis.window;
    if (!win) return;

    const headerEl = document.querySelector<HTMLElement>('nav.navbar.sticky-top');

    const updateOffset = () => {
      const next = headerEl?.getBoundingClientRect().height ?? 0;
      setTopOffset(Math.max(0, Math.round(next)));
      setIsReady(true);
    };

    updateOffset();
    win.addEventListener('resize', updateOffset);

    let ro: ResizeObserver | null = null;
    if (headerEl && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateOffset);
      ro.observe(headerEl);
    }

    return () => {
      win.removeEventListener('resize', updateOffset);
      ro?.disconnect();
    };
  }, []);

  useEffect(() => {
    const win = globalThis.window;
    if (!win) return;

    let scheduled = false;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let backToTopActive = false;

    const clearHideTimer = () => {
      if (hideTimer) {
        win.clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const completeBackToTop = () => {
      clearHideTimer();
      hideTimer = win.setTimeout(() => {
        backToTopActive = false;
        setIsBackToTopActive(false);
      }, BACK_TO_TOP_HIDE_DELAY_MS);
    };

    const update = () => {
      scheduled = false;

      const doc = document.documentElement;
      const scrollTop = win.scrollY || doc.scrollTop || 0;
      const scrollHeight = doc.scrollHeight || 0;
      const clientHeight = win.innerHeight || doc.clientHeight || 0;

      const maxScroll = Math.max(1, scrollHeight - clientHeight);
      const next = clamp((scrollTop / maxScroll) * 100, 0, 100);
      setProgress(next);

      if (!backToTopActive) {
        return;
      }

      if (next <= 0.1) {
        completeBackToTop();
        return;
      }

      clearHideTimer();
    };

    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      scheduleFrame(update);
    };

    const onBackToTop = () => {
      backToTopActive = true;
      setIsBackToTopActive(true);
      clearHideTimer();

      if (!scheduled) {
        scheduled = true;
        scheduleFrame(update);
      }
    };

    update();
    win.addEventListener('scroll', onScroll, { passive: true });
    win.addEventListener('resize', onScroll);
    win.addEventListener(BACK_TO_TOP_EVENT, onBackToTop);

    return () => {
      win.removeEventListener('scroll', onScroll);
      win.removeEventListener('resize', onScroll);
      win.removeEventListener(BACK_TO_TOP_EVENT, onBackToTop);
      clearHideTimer();
    };
  }, []);

  if (!isReady) return null;

  return (
    <div
      className={`reading-progress${progress === 0 && !isBackToTopActive ? ' is-hidden' : ''}`}
      style={{ top: topOffset }}
    >
      <progress className="visually-hidden" max={100} value={Math.round(progress)} aria-label="Reading progress" />
      <div className="reading-progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
