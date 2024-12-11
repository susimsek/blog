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

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }) {
          return (
            <CodeBlock className={className} theme={theme}>
              {children}
            </CodeBlock>
          );
        },
        table({ children }) {
          return <table className="table table-striped table-bordered">{children}</table>;
        },
        th({ children }) {
          return <th>{children}</th>;
        },
        td({ children }) {
          return <td>{children}</td>;
        },
        ul({ children }) {
          return <ul className="list-group">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-group-numbered">{children}</ol>;
        },
        li({ children }) {
          return <li className="list-group-item">{children}</li>;
        },
        a({ href, children }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-decoration-underline">
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
