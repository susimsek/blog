import React, { useMemo } from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { customIcons } from '@/config/customIcons';
import markdownSchema from '@/config/markdownSchema';
import remarkCodeFilenameAttribute from '@/lib/remarkCodeFilenameAttribute';

interface MarkdownTabsRendererProps {
  content: string;
  components: Components;
  createComponents?: (content: string) => Components;
}

const isAsciiLetterOrDigit = (character: string) => {
  const code = character.codePointAt(0) ?? 0;
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
};

const parseTabTitle = (rawTitle: string) => {
  const iconStart = rawTitle.lastIndexOf('[icon=');
  const hasIcon = iconStart > 0 && rawTitle.endsWith(']') && rawTitle[iconStart - 1]?.trim() === '';
  const title = hasIcon ? rawTitle.slice(0, iconStart).trimEnd() : rawTitle;
  const iconName = hasIcon ? rawTitle.slice(iconStart + 6, -1) : undefined;
  const isValidTitle = [...title].every(character => isAsciiLetterOrDigit(character) || character.trim() === '');
  const isValidIcon =
    iconName !== undefined &&
    iconName.length > 0 &&
    [...iconName].every(character => isAsciiLetterOrDigit(character) || character === '_' || character === '-');

  if (!isValidTitle || (hasIcon && !isValidIcon)) {
    return { title: '', iconName: undefined };
  }

  return { title: title.trim(), iconName: isValidIcon ? iconName : undefined };
};

const parseTabs = (content: string) => {
  return content
    .split('@tab')
    .slice(1)
    .map((tab, index) => {
      const [rawTitle, ...rest] = tab.trim().split('\n');
      const { title, iconName } = parseTabTitle(rawTitle);

      return {
        key: `tab-${index}`,
        title: title,
        content: rest.join('\n').trim(),
        iconName: iconName,
      };
    });
};

const MarkdownTabsRenderer: React.FC<Readonly<MarkdownTabsRendererProps>> = React.memo(
  ({ content, components, createComponents }) => {
    const tabs = useMemo(() => parseTabs(content), [content]);

    return (
      <Tabs defaultActiveKey={tabs[0]?.key ?? 'tab-0'} className="mb-3">
        {tabs.map(tab => {
          const IconComponent = tab.iconName ? customIcons[tab.iconName] : null;
          const tabComponents = createComponents ? createComponents(tab.content) : components;

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
                remarkPlugins={[remarkGfm, remarkCodeFilenameAttribute]}
                rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
                components={tabComponents}
              >
                {tab.content}
              </ReactMarkdown>
            </Tab>
          );
        })}
      </Tabs>
    );
  },
);

MarkdownTabsRenderer.displayName = 'MarkdownTabsRenderer';
export default MarkdownTabsRenderer;
