import React, { useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppSelector } from '@/config/store';
import { useTranslation } from 'next-i18next';
import CodeBlock from '@/components/common/CodeBlock';
import rehypeRaw from 'rehype-raw';
import { ListGroup, Table } from 'react-bootstrap';

interface MarkdownRendererProps {
  content: string;
}

const createMarkdownComponents = (theme: 'light' | 'dark', t: (key: string) => string): Components => ({
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
  ul: ({ children }: { children?: React.ReactNode }) => <ListGroup variant="flush">{children}</ListGroup>,
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ListGroup as="ol" numbered>
      {children}
    </ListGroup>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <ListGroup.Item as="li">{children}</ListGroup.Item>,
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
