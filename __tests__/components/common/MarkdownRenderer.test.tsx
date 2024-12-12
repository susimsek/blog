import { render, screen, waitFor } from '@testing-library/react';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

jest.mock('react-markdown', () => {
  return jest.fn(({ children }: { children: React.ReactNode }) => <div data-testid="react-markdown">{children}</div>);
});

jest.mock('remark-gfm', () => jest.fn());

jest.mock('rehype-raw', () => jest.fn());

// Mock store selector
jest.mock('@/config/store', () => ({
  useAppSelector: jest.fn(),
}));

jest.mock('@/components/common/MarkdownTabsRenderer', () => {
  return jest.fn(({ content }: { content: string }) => (
    <div data-testid="tabs-renderer">
      <span>{content}</span>
    </div>
  ));
});

jest.mock('@/components/common/CodeBlock', () => {
  return ({ children, className, theme, inline, node, ...props }: any) => (
    <pre
      data-testid="code-block"
      className={className}
      data-theme={theme}
      data-inline={inline ? 'true' : 'false'}
      {...props}
    >
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

  it('renders tabs content with MarkdownTabsRenderer', () => {
    const content = `
      :::tabs
      @tab Tab1
      Content for Tab 1
      @tab Tab2
      Content for Tab 2
      :::`;

    render(<MarkdownRenderer content={content} />);

    const tabsRenderer = screen.getByTestId('tabs-renderer');
    expect(tabsRenderer).toBeInTheDocument();
    expect(tabsRenderer).toHaveTextContent('@tab Tab1 Content for Tab 1 @tab Tab2 Content for Tab 2');
  });

  it('renders markdown outside of tabs correctly', () => {
    const content = `
      This is markdown outside of tabs.

      :::tabs
      @tab Tab1
      Content for Tab 1
      :::`;

    render(<MarkdownRenderer content={content} />);

    const markdownElement = screen.getByTestId('react-markdown');
    expect(markdownElement).toBeInTheDocument();
    expect(markdownElement).toHaveTextContent('This is markdown outside of tabs.');
  });
});
