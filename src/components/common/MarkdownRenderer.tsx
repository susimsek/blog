import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { materialLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useAppSelector } from '@/config/store';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<Readonly<MarkdownRendererProps>> = ({ content }) => {
  const theme = useAppSelector(state => state.theme.theme);

  const syntaxTheme = theme === 'dark' ? materialDark : materialLight;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className ?? '');
          return match ? (
            <SyntaxHighlighter style={syntaxTheme} language={match[1]}>
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className}>{children}</code>
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
