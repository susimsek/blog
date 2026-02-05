import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

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
    try {
      win.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      win.scrollTo(0, 0);
    }
  };

  return (
    <button
      type="button"
      className={`back-to-top ${visible ? 'show' : ''}`}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      <FontAwesomeIcon icon="arrow-up" />
    </button>
  );
}
