import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ReactComponent as JavaIcon } from '../../assets/icons/java.svg';
import { ReactComponent as KotlinIcon } from '../../assets/icons/kotlin.svg';

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
      const title = rawTitle.trim();

      const icon =
        title.toLowerCase() === 'java' ? (
          <JavaIcon style={{ height: '20px', marginRight: '8px' }} />
        ) : title.toLowerCase() === 'kotlin' ? (
          <KotlinIcon style={{ height: '20px', marginRight: '8px' }} />
        ) : null;

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
