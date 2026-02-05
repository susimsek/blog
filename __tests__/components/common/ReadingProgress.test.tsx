import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReadingProgress from '@/components/common/ReadingProgress';

describe('ReadingProgress', () => {
  beforeEach(() => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
    window.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    };
  });

  it('positions progress bar under the sticky header', async () => {
    const header = document.createElement('nav');
    header.className = 'navbar sticky-top';
    header.getBoundingClientRect = () => ({ height: 64 }) as DOMRect;
    document.body.appendChild(header);

    render(<ReadingProgress />);

    const progressbar = await screen.findByRole('progressbar', { name: 'Reading progress' });
    const container = progressbar.closest('.reading-progress');

    await waitFor(() => {
      expect(container).toHaveStyle({ top: '64px' });
    });
  });

  it('updates progress width and visibility on scroll', async () => {
    const header = document.createElement('nav');
    header.className = 'navbar sticky-top';
    header.getBoundingClientRect = () => ({ height: 40 }) as DOMRect;
    document.body.appendChild(header);

    render(<ReadingProgress />);
    const progressbar = await screen.findByRole('progressbar', { name: 'Reading progress' });
    const container = progressbar.closest('.reading-progress') as HTMLElement;
    expect(container.className).toContain('is-hidden');

    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 600 });
    fireEvent.scroll(window);

    await waitFor(() => {
      expect(container.className).not.toContain('is-hidden');
      const bar = container.querySelector('.reading-progress-bar') as HTMLElement;
      expect(bar.style.width).toContain('%');
    });
  });

  it('observes header size when ResizeObserver is available', async () => {
    const observe = jest.fn();
    const disconnect = jest.fn();
    (global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
      observe,
      disconnect,
    }));

    const header = document.createElement('nav');
    header.className = 'navbar sticky-top';
    header.getBoundingClientRect = () => ({ height: 52 }) as DOMRect;
    document.body.appendChild(header);

    const { unmount } = render(<ReadingProgress />);
    await screen.findByRole('progressbar', { name: 'Reading progress' });
    expect(observe).toHaveBeenCalledWith(header);

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
