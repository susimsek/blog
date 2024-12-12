import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface TabsRendererProps {
  content: string;
  components: Components;
}

const parseTabs = (content: string) => {
  return content
    .split('@tab')
    .slice(1)
    .map(tab => {
      const [title, ...rest] = tab.trim().split('\n');
      return { title: title.trim(), content: rest.join('\n').trim() };
    });
};

const TabsRenderer: React.FC<Readonly<TabsRendererProps>> = ({ content, components }) => {
  const tabs = parseTabs(content);

  return (
    <Tabs defaultActiveKey={tabs[0]?.title || 'tab-0'} className="mb-3">
      {tabs.map(tab => (
        <Tab eventKey={tab.title} title={tab.title} key={tab.title}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
            {tab.content}
          </ReactMarkdown>
        </Tab>
      ))}
    </Tabs>
  );
};

export default TabsRenderer;
