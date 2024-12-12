import React from 'react';
import { render, screen } from '@testing-library/react';
import MarkdownTabsRenderer from '@/components/common/MarkdownTabsRenderer';

jest.mock('react-markdown', () => {
  return ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
});

jest.mock('remark-gfm', () => jest.fn());

jest.mock('rehype-raw', () => jest.fn());

describe('TabsRenderer', () => {
  it('renders tabs with correct titles and content', () => {
    const content = `
      :::tabs
      @tab Java
      \`\`\`java
      public class HelloWorld {
          public static void main(String[] args) {
              System.out.println("Hello, World!");
          }
      }
      \`\`\`
      @tab Kotlin
      \`\`\`kotlin
      fun main() {
          println("Hello, World!")
      }
      \`\`\`
      :::
    `;

    const mockComponents = {
      code: ({ className, children }: { className?: string; children?: React.ReactNode }) => (
        <pre className={className}>{children}</pre>
      ),
    };

    render(<MarkdownTabsRenderer content={content} components={mockComponents} />);

    // Check if the tab titles are rendered
    expect(screen.getByText('Java')).toBeInTheDocument();
    expect(screen.getByText('Kotlin')).toBeInTheDocument();

    // Check the presence of Java code block
    expect(screen.getByText(/public class HelloWorld/)).toBeInTheDocument();

    // Check the presence of Kotlin code block
    expect(screen.getByText(/fun main/)).toBeInTheDocument();
  });

  it('renders with no tabs when content is empty', () => {
    render(<MarkdownTabsRenderer content="" components={{}} />);

    // Ensure no tabs are rendered
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('defaults to the first tab being active', () => {
    const content = `
    :::tabs
    @tab Tab1
    Content for Tab 1
    @tab Tab2
    Content for Tab 2
    :::
  `;

    render(<MarkdownTabsRenderer content={content} components={{}} />);

    expect(screen.getByText('Content for Tab 1')).toBeVisible();
  });
});
