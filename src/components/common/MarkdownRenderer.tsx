import React, { useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppSelector } from '@/config/store';
import { useTranslation } from 'next-i18next';
import CodeBlock from '@/components/common/CodeBlock';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
}

const createMarkdownComponents = (theme: 'light' | 'dark', t: (key: string) => string): Components => ({
  code: ({
    node,
    inline,
    className,
    children,
    ...rest
  }: {
    node?: unknown;
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
  }) => (
    <CodeBlock node={node} inline={inline} className={className} theme={theme} t={t} {...rest}>
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
});

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const { t } = useTranslation('common');
  const theme = useAppSelector(state => state.theme.theme);

  const MarkdownComponents = useMemo(() => createMarkdownComponents(theme, t), [theme, t]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MarkdownComponents}>
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
