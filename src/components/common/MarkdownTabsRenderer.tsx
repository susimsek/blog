import React, { Suspense } from 'react';
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
      const titleRegEx = /^([a-zA-Z0-9\s]+?)(?:\s+\[icon=([a-zA-Z0-9_-]+)])?$/;
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
  const tabs = parseTabs(content);

  // Dynamic icon loading using React.lazy and import()
  const loadIcon = (iconName: string): React.ComponentType<React.SVGProps<SVGSVGElement>> => {
    return React.lazy(() =>
      import(`../../assets/icons/${iconName}.svg`).then(module => ({ default: module.ReactComponent })),
    );
  };

  return (
    <Tabs defaultActiveKey={tabs[0]?.key ?? 'tab-0'} className="mb-3">
      {tabs.map(tab => {
        const IconComponent = tab.iconName ? loadIcon(tab.iconName) : null;

        return (
          <Tab
            eventKey={tab.key}
            key={tab.key}
            title={
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {IconComponent && (
                  <Suspense fallback={<span>Loading...</span>}>
                    <IconComponent style={{ height: '20px', marginRight: '8px' }} />
                  </Suspense>
                )}
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
};

export default MarkdownTabsRenderer;
