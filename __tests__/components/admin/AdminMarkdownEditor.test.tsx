import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import AdminMarkdownEditor from '@/components/admin/AdminMarkdownEditor';

describe('AdminMarkdownEditor', () => {
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;

  beforeEach(() => {
    globalThis.requestAnimationFrame = callback => {
      callback(0);
      return 1;
    };
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
  });

  it('renders labels, hints, custom classes, and the minimum line count', () => {
    const props = {
      id: 'editor-content',
      label: 'Post content',
      hint: 'Markdown supported',
      value: 'A single line',
      rows: 4,
      className: 'custom-editor',
      onChange: jest.fn(),
    };
    const { container } = render(<AdminMarkdownEditor {...props} />);
    const gutter = container.querySelector<HTMLElement>('.admin-markdown-editor-gutter');

    expect(screen.getByLabelText('Post content')).toHaveAttribute('rows', '4');
    expect(screen.getByText('Markdown supported')).toBeInTheDocument();
    expect(container.querySelector('.custom-editor')).toBeInTheDocument();
    expect(gutter).not.toBeNull();
    expect(within(gutter!).getAllByText(/^[1-4]$/)).toHaveLength(4);
  });

  it('numbers all source lines and highlights the caret line for LF and CRLF content', () => {
    const props = {
      id: 'editor-lines',
      label: 'Content',
      value: 'first\r\nsecond\nthird\rfourth',
      rows: 2,
      onChange: jest.fn(),
    };
    const { container } = render(<AdminMarkdownEditor {...props} />);
    const gutter = container.querySelector<HTMLElement>('.admin-markdown-editor-gutter');
    const textarea = screen.getByLabelText('Content') as HTMLTextAreaElement;

    expect(within(gutter!).getAllByText(/^[1-4]$/)).toHaveLength(4);
    textarea.setSelectionRange(15, 15);
    act(() => fireEvent.select(textarea));
    expect(within(gutter!).getByText('3')).toHaveClass('is-active');

    fireEvent.blur(textarea);
    expect(within(gutter!).getByText('3')).not.toHaveClass('is-active');
  });

  it('updates values, follows gutter clicks, and clamps clicks to available source lines', () => {
    const onChange = jest.fn();
    const props = {
      id: 'editor-interaction',
      label: 'Editable content',
      value: 'one\r\ntwo\nthree',
      rows: 3,
      onChange,
    };
    const { container } = render(<AdminMarkdownEditor {...props} />);
    const gutter = container.querySelector('.admin-markdown-editor-gutter') as HTMLDivElement;
    const textarea = screen.getByLabelText('Editable content') as HTMLTextAreaElement;
    jest.spyOn(gutter, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      right: 30,
      bottom: 100,
      width: 30,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.mouseDown(gutter, { clientY: 30 });
    expect(textarea.selectionStart).toBe(4);
    expect(within(gutter).getByText('2')).toHaveClass('is-active');

    fireEvent.mouseDown(gutter, { clientY: 0 });
    expect(textarea.selectionStart).toBe(0);
    expect(within(gutter).getByText('1')).toHaveClass('is-active');

    fireEvent.mouseDown(gutter, { clientY: 1000 });
    expect(textarea.selectionStart).toBe(8);
    const activeLine = within(gutter)
      .getAllByText(/^[1-3]$/)
      .find(line => line.classList.contains('is-active'));
    expect(activeLine).toBeDefined();

    fireEvent.change(textarea, { target: { value: 'updated\ntext' } });
    expect(onChange).toHaveBeenCalledWith('updated\ntext');
  });

  it('synchronizes gutter scrolling and reports viewport changes', () => {
    const onViewportChange = jest.fn();
    const props = {
      id: 'editor-scroll',
      label: 'Scrollable content',
      value: 'one\ntwo',
      onChange: jest.fn(),
      onViewportChange,
    };
    const { container, rerender } = render(<AdminMarkdownEditor {...props} />);
    const gutter = container.querySelector('.admin-markdown-editor-gutter') as HTMLDivElement;
    const textarea = screen.getByLabelText('Scrollable content') as HTMLTextAreaElement;
    Object.defineProperties(textarea, {
      scrollTop: { configurable: true, writable: true, value: 64 },
      scrollHeight: { configurable: true, value: 480 },
      clientHeight: { configurable: true, value: 160 },
    });

    fireEvent.scroll(textarea);
    expect(gutter.scrollTop).toBe(64);
    expect(onViewportChange).toHaveBeenLastCalledWith({ scrollTop: 64, scrollHeight: 480, clientHeight: 160 });

    rerender(<AdminMarkdownEditor {...props} value="one\ntwo\nthree" />);
    expect(onViewportChange).toHaveBeenLastCalledWith({ scrollTop: 64, scrollHeight: 480, clientHeight: 160 });
  });

  it('supports selection and focus events without an optional viewport callback', () => {
    render(
      <AdminMarkdownEditor
        id="editor-selection"
        label="Selection content"
        value={'first\nsecond 😀'}
        rows={1}
        onChange={jest.fn()}
      />,
    );
    const textarea = screen.getByLabelText('Selection content') as HTMLTextAreaElement;
    const gutter = textarea.parentElement?.querySelector('.admin-markdown-editor-gutter') as HTMLDivElement;
    textarea.setSelectionRange(0, 6);

    act(() => {
      fireEvent.focus(textarea);
      fireEvent.mouseUp(textarea);
      fireEvent.keyUp(textarea);
      fireEvent.select(textarea);
    });
    expect(within(gutter).getByText('1')).toHaveClass('is-active');

    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    fireEvent.select(textarea);
    expect(within(gutter).getByText('2')).toHaveClass('is-active');
  });

  it('handles raw CRLF values and gutter rows beyond the content', () => {
    const { container, rerender } = render(
      <AdminMarkdownEditor
        id="editor-crlf"
        label="CRLF content"
        value="first\r\nsecond"
        rows={2}
        onChange={jest.fn()}
      />,
    );
    const textarea = screen.getByLabelText('CRLF content') as HTMLTextAreaElement;
    const gutter = container.querySelector('.admin-markdown-editor-gutter') as HTMLDivElement;
    jest.spyOn(gutter, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      right: 30,
      bottom: 100,
      width: 30,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    Object.defineProperty(textarea, 'value', { configurable: true, writable: true, value: 'first\r\nsecond' });

    fireEvent.mouseDown(gutter, { clientY: 30 });
    expect(
      within(gutter)
        .getAllByText(/^[1-2]$/)
        .some(line => line.classList.contains('is-active')),
    ).toBe(true);

    rerender(
      <AdminMarkdownEditor
        id="editor-short"
        label="Short content"
        value="first\nsecond"
        rows={4}
        onChange={jest.fn()}
      />,
    );
    const shortTextarea = screen.getByLabelText('Short content') as HTMLTextAreaElement;
    const shortGutter = container.querySelector('.admin-markdown-editor-gutter') as HTMLDivElement;
    jest.spyOn(shortGutter, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      right: 30,
      bottom: 100,
      width: 30,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.mouseDown(shortGutter, { clientY: 1000 });
    expect(shortTextarea.selectionStart).toBe(shortTextarea.value.length);
    expect(within(shortGutter).getByText('4')).toBeInTheDocument();
  });
});
