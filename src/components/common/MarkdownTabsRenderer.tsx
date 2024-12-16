import React, { useMemo } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

import { ReactComponent as JavaIcon } from '@/assets/icons/java.svg';
import { ReactComponent as KotlinIcon } from '@/assets/icons/kotlin.svg';
import { ReactComponent as GoIcon } from '@/assets/icons/go.svg';

interface MarkdownTabsRendererProps {
  content: string;
  components: Components;
}

// İkonları bir haritada saklama
const icons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  java: JavaIcon,
  kotlin: KotlinIcon,
  go: GoIcon,
};

const parseTabs = (content: string) => {
  return content
    .split('@tab')
    .slice(1)
    .map((tab, index) => {
      const [rawTitle, ...rest] = tab.trim().split('\n');
      const titleRegEx = /^([a-zA-Z0-9\s]+?)(?:\s+\[icon=([a-zA-Z0-9_-]+)])?$/;
      const titleMatch = titleRegEx.exec(rawTitle);
      const title = titleMatch?.[1]?.trim() ?? '';
      const iconName = titleMatch?.[2]; // İkon adı (ör. java, kotlin)

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
        const IconComponent = tab.iconName ? icons[tab.iconName] : null;

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
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
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
