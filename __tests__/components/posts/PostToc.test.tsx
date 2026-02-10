import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PostToc from '@/components/posts/PostToc';

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

describe('PostToc', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('returns null when there are fewer than two headings', () => {
    const root = createRoot([{ tag: 'h2', text: 'Only heading' }]);
    render(<PostToc content="content" rootRef={{ current: root }} />);

    expect(screen.queryByText('post.tocTitle')).not.toBeInTheDocument();
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

    render(<PostToc content="content" rootRef={{ current: root }} />);

    const headings = root.querySelectorAll('h2');
    expect(headings[0].id).toBe('section');
    expect(headings[1].id).toBe('section-1');

    const links = screen.getAllByRole('link');
    fireEvent.click(links[1]);

    expect(scrollIntoViewMock).toHaveBeenCalled();
    expect(pushStateSpy).toHaveBeenCalledWith(null, '', '#section-1');
  });

  it('skips hash update when target is outside root or missing', () => {
    const root = createRoot([
      { tag: 'h2', text: 'Section A' },
      { tag: 'h2', text: 'Section B' },
    ]);

    const pushStateSpy = jest.spyOn(window.history, 'pushState');
    render(<PostToc content="content" rootRef={{ current: root }} />);

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

  it('renders only h2 headings in toc', () => {
    const headings = Array.from({ length: 10 }, (_, index) => ({
      tag: (index % 2 === 0 ? 'h2' : 'h3') as 'h2' | 'h3',
      text: `Heading ${index + 1}`,
    }));
    const root = createRoot(headings);

    render(<PostToc content="content" rootRef={{ current: root }} />);

    expect(screen.getAllByRole('link')).toHaveLength(5);
  });
});
