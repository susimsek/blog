import { splitContentWithTabs } from '@/lib/markdownUtils';

describe('splitContentWithTabs', () => {
  it('should correctly split markdown content into segments', () => {
    const input = `
# Heading

:::tabs
@tab Tab1
Content for Tab1
@tab Tab2
Content for Tab2
:::

Some more markdown content.
`;

    const expectedOutput = [
      { type: 'markdown', content: '# Heading' },
      {
        type: 'tabs',
        content: '@tab Tab1\nContent for Tab1\n@tab Tab2\nContent for Tab2',
      },
      { type: 'markdown', content: 'Some more markdown content.' },
    ];

    const result = splitContentWithTabs(input);

    expect(result).toEqual(expectedOutput);
  });

  it('should handle content without tabs correctly', () => {
    const input = `
# Just Markdown Content
Some text here.
`;

    const expectedOutput = [{ type: 'markdown', content: '# Just Markdown Content\nSome text here.' }];

    const result = splitContentWithTabs(input);

    expect(result).toEqual(expectedOutput);
  });

  it('should handle multiple tabs correctly', () => {
    const input = `
# Heading

:::tabs
@tab Tab1
Content for Tab1
:::

Some text in the middle.

:::tabs
@tab Tab2
Content for Tab2
:::
`;

    const expectedOutput = [
      { type: 'markdown', content: '# Heading' },
      { type: 'tabs', content: '@tab Tab1\nContent for Tab1' },
      { type: 'markdown', content: 'Some text in the middle.' },
      { type: 'tabs', content: '@tab Tab2\nContent for Tab2' },
    ];

    const result = splitContentWithTabs(input);

    expect(result).toEqual(expectedOutput);
  });

  it('should return an empty array for empty input', () => {
    const input = '';
    const expectedOutput: Array<{ type: 'tabs' | 'markdown'; content: string }> = [];
    const result = splitContentWithTabs(input);

    expect(result).toEqual(expectedOutput);
  });
});
