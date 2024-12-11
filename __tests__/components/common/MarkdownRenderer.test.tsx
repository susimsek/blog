import { render, screen, waitFor } from '@testing-library/react';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

jest.mock('react-markdown', () => {
  return jest.fn(({ children }: { children: React.ReactNode }) => <div data-testid="react-markdown">{children}</div>);
});

jest.mock('remark-gfm', () => jest.fn());

// Mock store selector
jest.mock('@/config/store', () => ({
  useAppSelector: jest.fn(),
}));

jest.mock('@/components/common/CodeBlock', () => {
  return ({ children, className, theme }: any) => (
    <pre data-testid="code-block" className={className} data-theme={theme}>
      {children}
    </pre>
  );
});

describe('MarkdownRenderer Component', () => {
  it('renders headings correctly', () => {
    const content = '# Heading 1\n## Heading 2\n### Heading 3';
    render(<MarkdownRenderer content={content} />);

    const markdownElement = screen.getByTestId('react-markdown');
    expect(markdownElement).toHaveTextContent('# Heading 1 ## Heading 2 ### Heading 3', { normalizeWhitespace: true });
  });

  it('renders plain text correctly', () => {
    const content = 'This is plain text.';
    render(<MarkdownRenderer content={content} />);

    const markdownElement = screen.getByTestId('react-markdown');
    expect(markdownElement).toBeInTheDocument();
    expect(markdownElement).toHaveTextContent(content);
  });

  it('renders inline code correctly', () => {
    const content = '`inline code`';
    render(<MarkdownRenderer content={content} />);

    const markdownElement = screen.getByTestId('react-markdown');
    expect(markdownElement).toBeInTheDocument();
    expect(markdownElement).toHaveTextContent(content);
  });

  it('renders code block with language-javascript correctly', async () => {
    const content = `\`\`\`javascript
      console.log('Hello, World!');
    \`\`\``;

    render(<MarkdownRenderer content={content} />);

    // Find the code block and check if it is rendered correctly with SyntaxHighlighter
    await waitFor(() => screen.getByText(/console\.log\('Hello, World!'\)/));

    const codeBlock = screen.getByText(/console\.log\('Hello, World!'\)/);
    expect(codeBlock).toBeInTheDocument();
  });
});
