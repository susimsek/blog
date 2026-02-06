import React, { useMemo } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { customIcons } from '@/config/customIcons';
import markdownSchema from '@/config/markdownSchema';

interface MarkdownTabsRendererProps {
  content: string;
  components: Components;
}

const parseTabs = (content: string) => {
  return content
    .split('@tab')
    .slice(1)
    .map((tab, index) => {
      const [rawTitle, ...rest] = tab.trim().split('\n');
      const titleRegEx = /^([a-zA-Z0-9\s]+?)(?:\s+\[icon=([a-zA-Z0-9_-]+)])?$/;
      const titleMatch = titleRegEx.exec(rawTitle);
      const title = titleMatch?.[1]?.trim() ?? '';
      const iconName = titleMatch?.[2];

      return {
        key: `tab-${index}`,
        title: title,
        content: rest.join('\n').trim(),
        iconName: iconName,
      };
    });
};

const MarkdownTabsRenderer: React.FC<Readonly<MarkdownTabsRendererProps>> = React.memo(({ content, components }) => {
  const tabs = useMemo(() => parseTabs(content), [content]);

  return (
    <Tabs defaultActiveKey={tabs[0]?.key ?? 'tab-0'} className="mb-3">
      {tabs.map(tab => {
        const IconComponent = tab.iconName ? customIcons[tab.iconName] : null;

        return (
          <Tab
            eventKey={tab.key}
            key={tab.key}
            title={
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {IconComponent && <IconComponent style={{ height: '20px', marginRight: '8px' }} />}
                {tab.title}
              </span>
            }
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
              components={components}
            >
              {tab.content}
            </ReactMarkdown>
          </Tab>
        );
      })}
    </Tabs>
  );
});

MarkdownTabsRenderer.displayName = 'MarkdownTabsRenderer';
export default MarkdownTabsRenderer;
