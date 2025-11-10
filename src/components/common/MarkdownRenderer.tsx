import React, { useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Table } from 'react-bootstrap';
import { useAppSelector } from '@/config/store';
import { useTranslation } from 'next-i18next';
import CodeBlock from '@/components/common/CodeBlock';
import MarkdownTabsRenderer from './MarkdownTabsRenderer';
import { splitContentWithTabs } from '@/lib/markdownUtils';
import markdownSchema from '@/config/markdownSchema';

interface MarkdownRendererProps {
  content: string;
}

const createMarkdownComponents = (theme: 'light' | 'dark' | 'oceanic', t: (key: string) => string): Components => ({
  code: ({
    inline,
    className,
    children,
    ...rest
  }: {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
  }) => (
    <CodeBlock inline={inline} className={className} theme={theme} t={t} {...rest}>
      {children}
    </CodeBlock>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <Table striped bordered>
      {children}
    </Table>
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

  const segments = splitContentWithTabs(content);

  return (
    <>
      {segments.map(segment => {
        if (segment.type === 'tabs') {
          return <MarkdownTabsRenderer key={segment.id} content={segment.content} components={MarkdownComponents} />;
        }

        return (
          <ReactMarkdown
            key={segment.id}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
            components={MarkdownComponents}
          >
            {segment.content}
          </ReactMarkdown>
        );
      })}
    </>
  );
};

export default MarkdownRenderer;
