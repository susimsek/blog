import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BackToTop from '@/components/common/BackToTop';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="icon-arrow-up" />,
}));

describe('BackToTop', () => {
  it('toggles visibility based on scroll position', () => {
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    render(<BackToTop />);

    const button = screen.getByRole('button', { name: 'Back to top' });
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
    fireEvent.click(screen.getByRole('button', { name: 'Back to top' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
