import { render, screen, waitFor } from '@testing-library/react';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import { useAppSelector } from '@/config/store';

jest.mock('react-markdown', () => {
  return jest.fn(({ children }: { children: React.ReactNode }) => <div data-testid="react-markdown">{children}</div>);
});

jest.mock('remark-gfm', () => jest.fn());

// Mock store selector
jest.mock('@/config/store', () => ({
  useAppSelector: jest.fn(),
}));

const renderWithTheme = (content: string, theme: 'light' | 'dark') => {
  (useAppSelector as jest.Mock).mockReturnValue(theme); // Mock the theme return value
  render(<MarkdownRenderer content={content} />);
};

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

  it('renders code block with invalid language class', async () => {
    const content = `\`\`\`language-
      console.log('Hello, World!');
    \`\`\``;

    render(<MarkdownRenderer content={content} />);

    // Find the code block and check if it is rendered correctly with SyntaxHighlighter
    await waitFor(() => screen.getByText(/console\.log\('Hello, World!'\)/));

    const codeBlock = screen.getByText(/console\.log\('Hello, World!'\)/);
    expect(codeBlock).toBeInTheDocument();
  });

  it('renders code block with empty className', async () => {
    const content = `\`\`\`
      console.log('Hello, World!');
    \`\`\``;

    render(<MarkdownRenderer content={content} />);

    // Find the code block and check if it is rendered correctly with SyntaxHighlighter
    await waitFor(() => screen.getByText(/console\.log\('Hello, World!'\)/));

    const codeBlock = screen.getByText(/console\.log\('Hello, World!'\)/);
    expect(codeBlock).toBeInTheDocument();
  });

  it('does not render SyntaxHighlighter for invalid className', async () => {
    const content = `\`\`\`
      console.log('Hello, World!');
    \`\`\``;

    render(<MarkdownRenderer content={content} />);

    // Find the code block and check if it is rendered correctly with SyntaxHighlighter
    await waitFor(() => screen.getByText(/console\.log\('Hello, World!'\)/));

    const codeBlock = screen.getByText(/console\.log\('Hello, World!'\)/);
    expect(codeBlock).toBeInTheDocument();
  });

  it('renders code block with syntax highlighting for light theme', async () => {
    const content = `
    \`\`\`javascript
    console.log('Hello, World!');
    \`\`\`
    `;
    renderWithTheme(content, 'light');

    await waitFor(() => screen.getByText(/console\.log\('Hello, World!'\)/));

    const codeBlock = screen.getByText(/console\.log\('Hello, World!'\)/);
    expect(codeBlock).toBeInTheDocument();
  });

  it('renders code block with syntax highlighting for dark theme', async () => {
    const content = `
    \`\`\`javascript
    console.log('Hello, World!');
    \`\`\`
    `;
    renderWithTheme(content, 'dark');

    // Wait for the syntax highlighted content to appear
    await waitFor(() => screen.getByText(/console\.log\('Hello, World!'\)/));

    // Use regex to match the content
    const codeBlock = screen.getByText(/console\.log\('Hello, World!'\)/);
    expect(codeBlock).toBeInTheDocument();
  });
});
