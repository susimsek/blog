import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppSelector } from '@/config/store';
import CodeBlock from '@/components/common/CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<Readonly<MarkdownRendererProps>> = ({ content }) => {
  const theme = useAppSelector(state => state.theme.theme);

  const components = {
    code: ({ className, children }: React.HTMLAttributes<HTMLElement>) => (
      <CodeBlock className={className} theme={theme}>
        {children}
      </CodeBlock>
    ),
    table: ({ children }: React.HTMLAttributes<HTMLTableElement>) => (
      <table className="table table-striped table-bordered">{children}</table>
    ),
    th: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => <th>{children}</th>,
    td: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => <td>{children}</td>,
    ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => <ul className="list-group">{children}</ul>,
    ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => <ol className="list-group-numbered">{children}</ol>,
    li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => <li className="list-group-item">{children}</li>,
    a: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-decoration-underline" {...rest}>
        {children}
      </a>
    ),
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
