import remarkCodeFilenameAttribute, {
  extractFilename,
  extractMetaAttribute,
  toTrimmed,
  visit,
} from '@/lib/remarkCodeFilenameAttribute';

describe('remarkCodeFilenameAttribute helpers', () => {
  it('trims and extracts metadata values', () => {
    expect(toTrimmed(undefined)).toBeNull();
    expect(toTrimmed('  demo.ts  ')).toBe('demo.ts');
    expect(toTrimmed('   ')).toBeNull();

    expect(extractMetaAttribute('filename="demo.ts"', 'filename')).toBe('demo.ts');
    expect(extractMetaAttribute("{file='demo.js'}", 'file')).toBe('demo.js');
    expect(extractMetaAttribute('path=src/app.tsx', 'path')).toBe('src/app.tsx');
    expect(extractMetaAttribute('lang=ts', 'filename')).toBeNull();
  });

  it('derives filenames from explicit keys and raw paths', () => {
    expect(extractFilename(null)).toBeNull();
    expect(extractFilename('title="Demo.java"')).toBe('Demo.java');
    expect(extractFilename('src/components/App.tsx')).toBe('src/components/App.tsx');
    expect(extractFilename('language=ts')).toBeNull();
  });

  it('adds missing filename attributes while preserving existing values', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'code',
          meta: 'filename="demo.ts"',
          data: {},
        },
        {
          type: 'code',
          meta: 'src/components/App.tsx',
          data: { hProperties: { 'data-filename': 'keep.ts' } },
        },
      ],
    };

    visit(tree);

    expect(tree.children?.[0]?.data?.hProperties?.['data-filename']).toBe('demo.ts');
    expect(tree.children?.[1]?.data?.hProperties?.['data-filename']).toBe('keep.ts');

    const transformer = remarkCodeFilenameAttribute();
    transformer({
      type: 'root',
      children: [{ type: 'code', meta: 'file=demo.go', data: {} }],
    });
  });
});
