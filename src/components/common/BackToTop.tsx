import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BACK_TO_TOP_EVENT } from '@/lib/scrollEvents';
import { useTranslation } from 'react-i18next';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation('common');

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
      aria-label={t('common.backToTop')}
    >
      <FontAwesomeIcon icon="arrow-up" />
    </button>
  );
}
