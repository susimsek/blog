import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BACK_TO_TOP_EVENT } from '@/lib/scrollEvents';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/config/store';
import useBoop from '@/hooks/useBoop';

const BACK_TO_TOP_SOUND_CONFIG = {
  src: '/sounds/up-whoosh.mp3',
  volume: 0.25,
} as const;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation('common');
  const isVoiceEnabled = useAppSelector(state => state.voice.isEnabled);
  const [iconStyle, triggerIconBoop] = useBoop({ y: -3, rotation: -8, scale: 1.08, timing: 170 });

  useEffect(() => {
    const win = globalThis.window;
    if (!win) return;

    const update = () => {
      setVisible(win.scrollY > 500);
    };

    update();
    win.addEventListener('scroll', update, { passive: true });
    return () => win.removeEventListener('scroll', update);
  }, []);

  const scrollToTop = () => {
    const win = globalThis.window;
    if (!win) return;

    if (isVoiceEnabled && globalThis.Audio !== undefined) {
      try {
        const sound = new Audio(BACK_TO_TOP_SOUND_CONFIG.src);
        sound.preload = 'auto';
        sound.volume = BACK_TO_TOP_SOUND_CONFIG.volume;
        sound.currentTime = 0;
        const playPromise = sound.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Ignore playback failures (autoplay restrictions / unsupported environments).
          });
        }
      } catch {
        // Ignore playback failures (autoplay restrictions / unsupported environments).
      }
    }

    win.dispatchEvent(new Event(BACK_TO_TOP_EVENT));

    const prefersReducedMotion =
      typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      win.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    } catch {
      win.scrollTo(0, 0);
    }
  };

  return (
    <button
      type="button"
      className={`back-to-top ${visible ? 'show' : ''}`}
      onClick={scrollToTop}
      onMouseEnter={triggerIconBoop}
      onFocus={triggerIconBoop}
      aria-label={t('common.backToTop')}
    >
      <FontAwesomeIcon icon="arrow-up" style={iconStyle} />
    </button>
  );
}
