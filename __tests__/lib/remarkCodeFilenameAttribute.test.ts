import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkCodeFilenameAttribute from '@/lib/remarkCodeFilenameAttribute';

type MdNode = {
  type: string;
  meta?: string | null;
  data?: { hProperties?: Record<string, unknown> };
  children?: MdNode[];
};

const findFirstCode = (node: MdNode): MdNode | null => {
  if (node.type === 'code') return node;
  for (const child of node.children ?? []) {
    const found = findFirstCode(child);
    if (found) return found;
  }
  return null;
};

const transform = (markdown: string): MdNode => {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkCodeFilenameAttribute);
  const tree = processor.parse(markdown);
  return processor.runSync(tree) as MdNode;
};

describe('remarkCodeFilenameAttribute', () => {
  it('maps filename metadata to data-filename', () => {
    const tree = transform(`
\`\`\`yaml filename="application.yml"
app:
  name: demo
\`\`\`
`);
    const code = findFirstCode(tree);
    expect(code?.data?.hProperties?.['data-filename']).toBe('application.yml');
  });

  it('maps title metadata to data-filename', () => {
    const tree = transform(`
\`\`\`java title="SecurityConfig.java"
public class SecurityConfig {}
\`\`\`
`);
    const code = findFirstCode(tree);
    expect(code?.data?.hProperties?.['data-filename']).toBe('SecurityConfig.java');
  });

  it('keeps missing metadata untouched', () => {
    const tree = transform(`
\`\`\`java
public class SecurityConfig {}
\`\`\`
`);
    const code = findFirstCode(tree);
    expect(code?.data?.hProperties?.['data-filename']).toBeUndefined();
  });
});
