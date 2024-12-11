import React, { useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppSelector } from '@/config/store';
import CodeBlock from '@/components/common/CodeBlock';

interface MarkdownRendererProps {
  content: string;
  theme: 'light' | 'dark';
}

interface MarkdownComponentsProps {
  theme: 'light' | 'dark';
}

const createMarkdownComponents = ({ theme }: MarkdownComponentsProps): Components => ({
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => (
    <CodeBlock className={className}>{children}</CodeBlock>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <table className="table table-striped table-bordered">{children}</table>
  ),
  th: ({ children }: { children?: React.ReactNode }) => <th>{children}</th>,
  td: ({ children }: { children?: React.ReactNode }) => <td>{children}</td>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-group list-group-flush">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-group list-group-numbered">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="list-group-item">{children}</li>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-primary">
      {children}
    </a>
  ),
});

const MarkdownRenderer: React.FC<Readonly<MarkdownRendererProps>> = ({ content, theme }) => {
  const MarkdownComponents = useMemo(() => createMarkdownComponents({ theme }), [theme]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
      {content}
    </ReactMarkdown>
  );
};

// Wrapper Component to Fetch Theme
const MarkdownRendererWrapper: React.FC<Omit<MarkdownRendererProps, 'theme'>> = ({ content }) => {
  const theme = useAppSelector(state => state.theme.theme);
  return <MarkdownRenderer content={content} theme={theme} />;
};

export default MarkdownRendererWrapper;
