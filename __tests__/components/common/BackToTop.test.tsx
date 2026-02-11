import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BackToTop from '@/components/common/BackToTop';
import { BACK_TO_TOP_EVENT } from '@/lib/scrollEvents';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="icon-arrow-up" />,
}));

describe('BackToTop', () => {
  it('toggles visibility based on scroll position', () => {
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    render(<BackToTop />);

    const button = screen.getByRole('button', { name: 'common.backToTop' });
    expect(button.className).not.toContain('show');

    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    fireEvent.scroll(window);
    expect(button.className).toContain('show');
  });

  it('falls back when smooth scroll throws', () => {
    const scrollTo = jest.fn((arg1?: ScrollToOptions | number) => {
      if (typeof arg1 === 'object') {
        throw new Error('not supported');
      }
    });
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;

    render(<BackToTop />);
    fireEvent.click(screen.getByRole('button', { name: 'common.backToTop' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('dispatches a back-to-top event when clicked', () => {
    const listener = jest.fn();
    window.addEventListener(BACK_TO_TOP_EVENT, listener);

    render(<BackToTop />);
    fireEvent.click(screen.getByRole('button', { name: 'common.backToTop' }));

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(BACK_TO_TOP_EVENT, listener);
  });
});
