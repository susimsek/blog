import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppSelector } from '@/config/store';
import CodeBlock from '@/components/common/CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownComponents = (theme: 'light' | 'dark'): Components => ({
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => (
    <CodeBlock className={className} theme={theme}>
      {children}
    </CodeBlock>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <table className="table table-striped table-bordered">{children}</table>
  ),
  th: ({ children }: { children?: React.ReactNode }) => <th>{children}</th>,
  td: ({ children }: { children?: React.ReactNode }) => <td>{children}</td>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-group">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-group-numbered">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="list-group-item">{children}</li>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-decoration-underline">
      {children}
    </a>
  ),
});

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const theme = useAppSelector(state => state.theme.theme) as 'light' | 'dark'; // Assert type

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents(theme)}>
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
