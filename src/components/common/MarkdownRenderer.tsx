import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppSelector } from '@/config/store';
import { useTranslation } from 'next-i18next';
import CodeBlock from '@/components/common/CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownComponents = (theme: 'light' | 'dark', t: (key: string) => string): Components => ({
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
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-group list-group-flush">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-group list-group-numbered">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="list-group-item">{children}</li>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-primary">
      {children}
    </a>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="translated-text">
      {t('common.textPrefix')}
      {children}
    </p>
  ),
});

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const { t } = useTranslation('common');
  const theme = useAppSelector(state => state.theme.theme); // Assert type

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents(theme, t)}>
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
