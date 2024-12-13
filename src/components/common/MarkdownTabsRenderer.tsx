import React, { useEffect, useState } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

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
      const titleRegEx = /^(.*?)(?:\s+\[icon=(.*?)])?$/; // Match title and optional icon attribute
      const titleMatch = titleRegEx.exec(rawTitle); // Using exec instead of match
      const title = titleMatch?.[1]?.trim() ?? '';
      const iconName = titleMatch?.[2]; // Either 'java' or 'kotlin' or undefined

      return {
        key: `tab-${index}`,
        title: title,
        content: rest.join('\n').trim(),
        iconName: iconName,
      };
    });
};

const MarkdownTabsRenderer: React.FC<Readonly<MarkdownTabsRendererProps>> = ({ content, components }) => {
  const [icons, setIcons] = useState<{ [key: string]: React.ReactNode }>({});

  const tabs = parseTabs(content);

  useEffect(() => {
    const loadIcons = async () => {
      const newIcons: { [key: string]: React.ReactNode } = {};

      for (const tab of tabs) {
        if (tab.iconName) {
          try {
            const IconComponent = (await import(`../../assets/icons/${tab.iconName}.svg`)).ReactComponent;
            newIcons[tab.key] = <IconComponent style={{ height: '20px', marginRight: '8px' }} />;
          } catch (e) {
            console.warn(`Icon for "${tab.iconName}" not found.`);
          }
        }
      }

      setIcons(newIcons);
    };

    loadIcons();
  }, [tabs]);

  return (
    <Tabs defaultActiveKey={tabs[0]?.key || 'tab-0'} className="mb-3">
      {tabs.map(tab => (
        <Tab
          eventKey={tab.key}
          key={tab.key}
          title={
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {icons[tab.key]}
              {tab.title}
            </span>
          }
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
            {tab.content}
          </ReactMarkdown>
        </Tab>
      ))}
    </Tabs>
  );
};

export default MarkdownTabsRenderer;
