import React from 'react';
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
      const titleMatch = rawTitle.match(/^(.*?)(?:\s+\[icon=(.*?)])?$/); // Match title and optional icon attribute
      const title = titleMatch?.[1]?.trim() || '';
      const iconName = titleMatch?.[2]; // Either 'java' or 'kotlin' or undefined

      let icon: React.ReactNode = null;
      if (iconName) {
        try {
          const IconComponent = require(`../../assets/icons/${iconName}.svg`).ReactComponent;
          icon = <IconComponent style={{ height: '20px', marginRight: '8px' }} />;
        } catch (e) {
          console.warn(`Icon for "${iconName}" not found.`);
        }
      }
      return {
        key: `tab-${index}`,
        title: (
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {icon}
            {title}
          </span>
        ),
        content: rest.join('\n').trim(),
      };
    });
};

const MarkdownTabsRenderer: React.FC<Readonly<MarkdownTabsRendererProps>> = ({ content, components }) => {
  const tabs = parseTabs(content);

  return (
    <Tabs defaultActiveKey={tabs[0]?.key || 'tab-0'} className="mb-3">
      {tabs.map(tab => (
        <Tab eventKey={tab.key} key={tab.key} title={tab.title}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
            {tab.content}
          </ReactMarkdown>
        </Tab>
      ))}
    </Tabs>
  );
};

export default MarkdownTabsRenderer;
