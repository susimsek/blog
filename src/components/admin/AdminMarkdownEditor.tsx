import React from 'react';
import Form from 'react-bootstrap/Form';

type AdminMarkdownEditorProps = {
  id: string;
  label: string;
  hint?: string;
  value: string;
  rows?: number;
  className?: string;
  onViewportChange?: (viewport: AdminMarkdownEditorViewport) => void;
  onChange: (value: string) => void;
};

export type AdminMarkdownEditorViewport = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

const LINE_SPLIT_REGEX = /\r\n|\r|\n/;

export default function AdminMarkdownEditor({
  id,
  label,
  hint,
  value,
  rows = 18,
  className,
  onViewportChange,
  onChange,
}: Readonly<AdminMarkdownEditorProps>) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = React.useRef<HTMLDivElement | null>(null);
  const [activeLine, setActiveLine] = React.useState<number | null>(null);

  const lineNumbers = React.useMemo(() => {
    const total = Math.max(rows, value.split(LINE_SPLIT_REGEX).length);
    return Array.from({ length: total }, (_, index) => index + 1);
  }, [rows, value]);

  const resolveLineFromCaret = React.useCallback((text: string, caretPosition: number) => {
    const safePosition = Math.max(0, Math.min(caretPosition, text.length));
    const slice = text.slice(0, safePosition);
    const line = slice.split(LINE_SPLIT_REGEX).length;
    return line;
  }, []);

  const resolveActiveCaretPosition = React.useCallback((text: string, selectionStart: number, selectionEnd: number) => {
    const safeStart = Math.max(0, Math.min(selectionStart, text.length));
    const safeEnd = Math.max(0, Math.min(selectionEnd, text.length));
    let caretPosition = safeEnd;

    if (safeEnd > safeStart) {
      const previousIndex = safeEnd - 1;
      if (previousIndex >= 0) {
        const previousCharCode = text.charCodeAt(previousIndex);
        if (previousCharCode === 10 || previousCharCode === 13) {
          caretPosition = previousIndex;
        }
      }
    }

    return caretPosition;
  }, []);

  const resolveCaretFromLine = React.useCallback((text: string, lineNumber: number) => {
    if (lineNumber <= 1) {
      return 0;
    }

    let currentLine = 1;
    for (let index = 0; index < text.length; index += 1) {
      const charCode = text.charCodeAt(index);
      if (charCode === 13) {
        if (text.charCodeAt(index + 1) === 10) {
          index += 1;
        }
        currentLine += 1;
        if (currentLine === lineNumber) {
          return index + 1;
        }
      } else if (charCode === 10) {
        currentLine += 1;
        if (currentLine === lineNumber) {
          return index + 1;
        }
      }
    }

    return text.length;
  }, []);

  const updateActiveLineFromSelection = React.useCallback(
    (text: string, selectionStart: number, selectionEnd: number) => {
      const caretPosition = resolveActiveCaretPosition(text, selectionStart, selectionEnd);
      const nextLine = resolveLineFromCaret(text, caretPosition);
      setActiveLine(previous => (previous === nextLine ? previous : nextLine));
    },
    [resolveActiveCaretPosition, resolveLineFromCaret],
  );

  const syncGutterScroll = React.useCallback(() => {
    if (!textareaRef.current || !gutterRef.current) {
      return;
    }
    const textarea = textareaRef.current;
    gutterRef.current.scrollTop = textarea.scrollTop;
    onViewportChange?.({
      scrollTop: textarea.scrollTop,
      scrollHeight: textarea.scrollHeight,
      clientHeight: textarea.clientHeight,
    });
  }, [onViewportChange]);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || activeLine === null) {
      return;
    }
    updateActiveLineFromSelection(
      value,
      textarea.selectionStart ?? 0,
      textarea.selectionEnd ?? textarea.selectionStart ?? 0,
    );
  }, [activeLine, updateActiveLineFromSelection, value]);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    onViewportChange?.({
      scrollTop: textarea.scrollTop,
      scrollHeight: textarea.scrollHeight,
      clientHeight: textarea.clientHeight,
    });
  }, [onViewportChange, value]);

  const syncActiveLineFromTextarea = React.useCallback(
    (textarea: HTMLTextAreaElement) => {
      updateActiveLineFromSelection(
        textarea.value,
        textarea.selectionStart ?? 0,
        textarea.selectionEnd ?? textarea.selectionStart ?? 0,
      );
    },
    [updateActiveLineFromSelection],
  );

  const handleGutterMouseDown = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();

      const textarea = textareaRef.current;
      const gutter = gutterRef.current;
      if (!textarea || !gutter) {
        return;
      }

      const style = window.getComputedStyle(textarea);
      const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.58 || 24;
      const paddingTop = Number.parseFloat(style.paddingTop) || 0;
      const gutterRect = gutter.getBoundingClientRect();
      const offsetY = event.clientY - gutterRect.top + textarea.scrollTop - paddingTop;
      const rawLine = Math.floor(offsetY / lineHeight) + 1;
      const targetLine = Math.max(1, Math.min(rawLine, lineNumbers.length));
      const caretPosition = resolveCaretFromLine(textarea.value, targetLine);

      textarea.focus();
      textarea.setSelectionRange(caretPosition, caretPosition);
      updateActiveLineFromSelection(textarea.value, caretPosition, caretPosition);
    },
    [lineNumbers.length, resolveCaretFromLine, updateActiveLineFromSelection],
  );

  return (
    <Form.Group className={`h-100 d-flex flex-column${className ? ` ${className}` : ''}`} controlId={id}>
      <Form.Label>{label}</Form.Label>
      <div className="admin-markdown-editor-shell">
        <div
          className="admin-markdown-editor-gutter"
          ref={gutterRef}
          aria-hidden="true"
          onMouseDown={handleGutterMouseDown}
        >
          <div className="admin-markdown-editor-gutter-lines">
            {lineNumbers.map(line => (
              <span
                key={`${id}-line-${line}`}
                className={activeLine !== null && line === activeLine ? 'is-active' : undefined}
              >
                {line}
              </span>
            ))}
          </div>
        </div>
        <Form.Control
          ref={textareaRef}
          as="textarea"
          wrap="off"
          rows={rows}
          className="admin-markdown-editor-textarea flex-grow-1"
          value={value}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          onScroll={syncGutterScroll}
          onChange={event => {
            const nextValue = event.currentTarget.value;
            updateActiveLineFromSelection(
              nextValue,
              event.currentTarget.selectionStart ?? nextValue.length,
              event.currentTarget.selectionEnd ?? event.currentTarget.selectionStart ?? nextValue.length,
            );
            onChange(nextValue);
          }}
          onSelect={event => {
            const target = event.currentTarget as HTMLTextAreaElement;
            requestAnimationFrame(() => {
              syncActiveLineFromTextarea(target);
            });
          }}
          onMouseUp={event => {
            const target = event.currentTarget as HTMLTextAreaElement;
            requestAnimationFrame(() => {
              syncActiveLineFromTextarea(target);
            });
          }}
          onKeyUp={event => {
            const target = event.currentTarget as HTMLTextAreaElement;
            requestAnimationFrame(() => {
              syncActiveLineFromTextarea(target);
            });
          }}
          onFocus={event => {
            const target = event.currentTarget as HTMLTextAreaElement;
            requestAnimationFrame(() => {
              syncActiveLineFromTextarea(target);
            });
          }}
          onBlur={() => {
            setActiveLine(null);
          }}
        />
      </div>
      {hint ? <Form.Text>{hint}</Form.Text> : null}
    </Form.Group>
  );
}
