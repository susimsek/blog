import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

jest.mock('@/navigation/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    query: { locale: 'en' },
  }),
}));

jest.mock('react-markdown', () => {
  return jest.fn(({ children }: { children: React.ReactNode }) => <div data-testid="react-markdown">{children}</div>);
});

jest.mock('remark-gfm', () => jest.fn());

jest.mock('rehype-raw', () => jest.fn());

jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    skipLocaleHandling: _skipLocaleHandling,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock store selector
jest.mock('@/config/store', () => ({
  useAppSelector: jest.fn(),
}));

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

  it('renders tabs content with MarkdownTabsRenderer', async () => {
    const content = `
      :::tabs
      @tab Tab1
      Content for Tab 1
      @tab Tab2
      Content for Tab 2
      :::`;

    render(<MarkdownRenderer content={content} />);

    expect(await screen.findByText('Tab1')).toBeInTheDocument();
    expect(screen.getByText('Tab2')).toBeInTheDocument();
    expect(screen.getByText('Content for Tab 1')).toBeInTheDocument();
  });

  it('renders markdown outside of tabs correctly', () => {
    const content = `
      This is markdown outside of tabs.

      :::tabs
      @tab Tab1
      Content for Tab 1
      :::`;

    render(<MarkdownRenderer content={content} />);

    expect(screen.getByText('This is markdown outside of tabs.')).toBeInTheDocument();
  });

  it('renders all link variants from markdown component map', () => {
    render(<MarkdownRenderer content="links" />);

    const reactMarkdownMock = jest.requireMock('react-markdown') as jest.Mock;
    const firstCallProps = reactMarkdownMock.mock.calls[0][0] as { components: Record<string, any> };
    const LinkRenderer = firstCallProps.components.a;

    const { container } = render(
      <div>
        {LinkRenderer({ children: 'no-href' })}
        {LinkRenderer({ href: '#section', children: 'hash' })}
        {LinkRenderer({ href: 'mailto:test@example.com', children: 'mail' })}
        {LinkRenderer({ href: 'tel:+905551112233', children: 'tel' })}
        {LinkRenderer({ href: 'https://example.com', children: 'external' })}
        {LinkRenderer({ href: 'relative/path', children: 'relative' })}
        {LinkRenderer({ href: '/', children: 'root' })}
        {LinkRenderer({ href: '/tr/about', children: 'localized-path' })}
        {LinkRenderer({ href: '/about', children: 'internal' })}
      </div>,
    );

    expect(screen.getByText('no-href').tagName.toLowerCase()).toBe('span');
    expect(screen.getByText('hash').closest('a')).toHaveAttribute('href', '#section');
    expect(screen.getByText('mail').closest('a')).toHaveAttribute('href', 'mailto:test@example.com');
    expect(screen.getByText('tel').closest('a')).toHaveAttribute('href', 'tel:+905551112233');

    const externalLink = screen.getByText('external').closest('a');
    expect(externalLink).toHaveAttribute('href', 'https://example.com');
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');

    expect(screen.getByText('relative').closest('a')).toHaveAttribute('href', 'relative/path');
    expect(screen.getByText('root').closest('a')).toHaveAttribute('href', '/en');
    expect(screen.getByText('localized-path').closest('a')).toHaveAttribute('href', '/tr/about');
    expect(screen.getByText('internal').closest('a')).toHaveAttribute('href', '/en/about');
    expect(container.querySelectorAll('a').length).toBeGreaterThanOrEqual(8);
  });
});
