import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import Table from 'react-bootstrap/Table';
import { useAppSelector } from '@/config/store';
import { useTranslation } from 'react-i18next';
import CodeBlock from '@/components/common/CodeBlock';
import { splitContentWithTabs } from '@/lib/markdownUtils';
import markdownSchema from '@/config/markdownSchema';
import type { Theme } from '@/reducers/theme';
import { useRouter } from '@/navigation/router';
import i18nextConfig from '@/i18n/settings';
import Link from '@/components/common/Link';

const MarkdownTabsRenderer = dynamic(() => import('./MarkdownTabsRenderer'), {
  loading: () => null,
});

interface MarkdownRendererProps {
  content: string;
}

const isExternalHttpUrl = (href: string) => href.startsWith('http://') || href.startsWith('https://');

const localizeInternalPath = (href: string, locale: string) => {
  if (href === '/') {
    return `/${locale}`;
  }
  const hasLocalePrefix = i18nextConfig.i18n.locales.some(lng => href === `/${lng}` || href.startsWith(`/${lng}/`));
  if (hasLocalePrefix) {
    return href;
  }
  const normalized = href.startsWith('/') ? href : `/${href}`;
  return `/${locale}${normalized}`;
};

const createMarkdownComponents = (theme: Theme, t: (key: string) => string, currentLocale: string): Components => ({
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
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
    if (!href) {
      return <span className="text-decoration-none text-primary">{children}</span>;
    }

    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return (
        <a href={href} className="text-decoration-none text-primary">
          {children}
        </a>
      );
    }

    if (isExternalHttpUrl(href)) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-primary">
          {children}
        </a>
      );
    }

    if (!href.startsWith('/')) {
      // Keep relative links as-is (same tab).
      return (
        <a href={href} className="text-decoration-none text-primary">
          {children}
        </a>
      );
    }

    const localizedHref = localizeInternalPath(href, currentLocale);
    return (
      <Link href={localizedHref} skipLocaleHandling className="text-decoration-none text-primary">
        {children}
      </Link>
    );
  },
});

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const { t } = useTranslation('common');
  const theme = useAppSelector(state => state.theme.theme);
  const router = useRouter();
  const currentLocale = (router.query.locale as string) || i18nextConfig.i18n.defaultLocale;

  const MarkdownComponents = useMemo(
    () => createMarkdownComponents(theme, t, currentLocale),
    [theme, t, currentLocale],
  );

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
