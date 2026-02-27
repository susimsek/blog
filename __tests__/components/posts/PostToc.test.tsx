import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PostToc from '@/components/posts/PostToc';

jest.mock('@/components/posts/PostLike', () => () => <div data-testid="post-like" />);

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => key),
  })),
}));

jest.mock('react-bootstrap', () => {
  const Accordion = ({ children }: { children: React.ReactNode }) => <div data-testid="accordion">{children}</div>;
  Accordion.Item = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  Accordion.Header = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  Accordion.Body = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return { Accordion };
});

const createRoot = (headings: Array<{ tag: 'h2' | 'h3'; text: string; id?: string }>) => {
  const root = document.createElement('article');
  for (const heading of headings) {
    const el = document.createElement(heading.tag);
    el.textContent = heading.text;
    if (heading.id) {
      el.id = heading.id;
    }
    root.appendChild(el);
  }
  document.body.appendChild(root);
  return root;
};

const originalMutationObserver = globalThis.MutationObserver;

describe('PostToc', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;

  beforeEach(() => {
    class NoopMutationObserver {
      observe() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }

    Object.defineProperty(globalThis, 'MutationObserver', {
      configurable: true,
      writable: true,
      value: NoopMutationObserver,
    });

    class NoopIntersectionObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = '0px';
      thresholds = [];
    }

    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: NoopIntersectionObserver,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(globalThis, 'MutationObserver', {
      configurable: true,
      writable: true,
      value: originalMutationObserver,
    });
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: originalIntersectionObserver,
    });
    jest.restoreAllMocks();
  });

  it('handles missing root ref gracefully', () => {
    render(<PostToc postId="sample-post" content="content" rootRef={{ current: null }} />);

    expect(screen.queryByText('post.tocTitle')).not.toBeInTheDocument();
    expect(screen.getByTestId('post-like')).toBeInTheDocument();
  });

  it('renders like block when there are no supported headings', () => {
    const root = document.createElement('article');
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Just paragraph';
    root.appendChild(paragraph);
    document.body.appendChild(root);
    render(<PostToc postId="sample-post" content="content" rootRef={{ current: root }} />);

    expect(screen.queryByText('post.tocTitle')).not.toBeInTheDocument();
    expect(screen.getByTestId('post-like')).toBeInTheDocument();
  });

  it('creates slugs from h2 headings and updates hash on click', () => {
    const root = createRoot([
      { tag: 'h2', text: 'Section' },
      { tag: 'h2', text: 'Section' },
      { tag: 'h3', text: 'Child', id: 'preset-id' },
    ]);

    const scrollIntoViewMock = jest.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewMock,
    });

    const pushStateSpy = jest.spyOn(window.history, 'pushState');

    render(<PostToc postId="sample-post" content="content" rootRef={{ current: root }} />);

    const sectionHeadings = root.querySelectorAll('h2');
    expect(sectionHeadings[0].id).toBe('section');
    expect(sectionHeadings[1].id).toBe('section-1');

    const links = screen.getAllByRole('link');
    fireEvent.click(links[1]);

    expect(scrollIntoViewMock).toHaveBeenCalled();
    expect(pushStateSpy).toHaveBeenCalledWith(null, '', '#section-1');
  });

  it('uses auto scroll behavior when reduced motion is preferred', () => {
    const root = createRoot([{ tag: 'h2', text: 'Section' }]);
    const scrollIntoViewMock = jest.fn();
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewMock,
    });
    window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;

    render(<PostToc postId="sample-post" content="content" rootRef={{ current: root }} />);
    fireEvent.click(screen.getByRole('link', { name: 'Section' }));

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
    window.matchMedia = originalMatchMedia;
  });

  it('skips hash update when target is outside root or missing', () => {
    const root = createRoot([
      { tag: 'h2', text: 'Section A' },
      { tag: 'h2', text: 'Section B' },
    ]);

    const pushStateSpy = jest.spyOn(window.history, 'pushState');
    render(<PostToc postId="sample-post" content="content" rootRef={{ current: root }} />);

    const links = screen.getAllByRole('link');
    const target = root.querySelector('#section-b');
    if (target) {
      root.removeChild(target);
      document.body.appendChild(target);
    }
    fireEvent.click(links[1]);
    expect(pushStateSpy).not.toHaveBeenCalled();

    if (target) {
      target.remove();
    }
    fireEvent.click(links[1]);
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it('renders h2 and h3 headings in toc', () => {
    const headings = Array.from({ length: 10 }, (_, index) => ({
      tag: (index % 2 === 0 ? 'h2' : 'h3') as 'h2' | 'h3',
      text: `Heading ${index + 1}`,
    }));
    const root = createRoot(headings);

    render(<PostToc postId="sample-post" content="content" rootRef={{ current: root }} />);

    expect(screen.getAllByRole('link')).toHaveLength(10);
  });

  it('excludes headings rendered inside tab panes', () => {
    const root = document.createElement('article');
    const h2 = document.createElement('h2');
    h2.textContent = 'Main section';
    root.appendChild(h2);

    const tabPane = document.createElement('div');
    tabPane.className = 'tab-pane';
    const h3 = document.createElement('h3');
    h3.textContent = 'Tab heading';
    tabPane.appendChild(h3);
    root.appendChild(tabPane);

    document.body.appendChild(root);
    render(<PostToc postId="sample-post" content="content" rootRef={{ current: root }} />);

    expect(screen.getByRole('link', { name: 'Main section' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tab heading' })).not.toBeInTheDocument();
  });

  it('updates toc when headings are added after initial mount', async () => {
    let mutationCallback: MutationCallback | null = null;

    class MockMutationObserver {
      constructor(callback: MutationCallback) {
        mutationCallback = callback;
      }
      observe() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }

    Object.defineProperty(globalThis, 'MutationObserver', {
      configurable: true,
      writable: true,
      value: MockMutationObserver,
    });

    const root = createRoot([]);
    try {
      render(<PostToc postId="sample-post" content="content" rootRef={{ current: root }} />);

      expect(screen.queryByText('post.tocTitle')).not.toBeInTheDocument();

      await act(async () => {
        const first = document.createElement('h2');
        first.textContent = 'First section';
        root.appendChild(first);

        mutationCallback?.([], {} as MutationObserver);
      });

      await waitFor(() => {
        expect(screen.getByText('post.tocTitle')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'First section' })).toBeInTheDocument();
      });
    } finally {
      Object.defineProperty(globalThis, 'MutationObserver', {
        configurable: true,
        writable: true,
        value: originalMutationObserver,
      });
    }
  });

  it('works without MutationObserver support', () => {
    delete (globalThis as { MutationObserver?: unknown }).MutationObserver;
    const root = createRoot([{ tag: 'h2', text: 'No Observer Heading' }]);

    render(<PostToc postId="sample-post" content="content" rootRef={{ current: root }} />);

    expect(screen.getByRole('link', { name: 'No Observer Heading' })).toBeInTheDocument();
  });

  it('tracks active heading and observes headings when IntersectionObserver is available', async () => {
    const root = createRoot([
      { tag: 'h2', text: 'First' },
      { tag: 'h2', text: 'Second' },
    ]);
    const [first, second] = Array.from(root.querySelectorAll('h2'));

    let firstTop = 80;
    let secondTop = 200;
    jest.spyOn(first, 'getBoundingClientRect').mockImplementation(() => ({ top: firstTop }) as DOMRect);
    jest.spyOn(second, 'getBoundingClientRect').mockImplementation(() => ({ top: secondTop }) as DOMRect);

    const observe = jest.fn();
    const disconnect = jest.fn();
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: jest.fn(() => ({ observe, disconnect })),
    });

    const { unmount } = render(<PostToc postId="sample-post" content="content" rootRef={{ current: root }} />);

    const firstLink = screen.getByRole('link', { name: 'First' });
    const secondLink = screen.getByRole('link', { name: 'Second' });
    expect(firstLink).toHaveClass('is-active');
    expect(observe).toHaveBeenCalledTimes(2);

    firstTop = 80;
    secondTop = 100;
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    await waitFor(() => {
      expect(secondLink).toHaveClass('is-active');
    });

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('clears active heading when heading ids cannot be resolved', async () => {
    const root = createRoot([{ tag: 'h2', text: 'Section' }]);
    const getElementByIdSpy = jest.spyOn(document, 'getElementById').mockImplementation(() => null);

    render(<PostToc postId="sample-post" content="content" rootRef={{ current: root }} />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'Section' });
      expect(link).not.toHaveClass('is-active');
      expect(link).not.toHaveAttribute('aria-current');
    });

    getElementByIdSpy.mockRestore();
  });
});
