import React from 'react';
import {
  extractCodeFileName,
  extractCodeMeta,
  extractMetaAttribute,
  getSyntaxTheme,
  isTerminalSnippet,
  resolveLanguage,
  toCodeText,
  toNonEmptyString,
} from '@/components/common/CodeBlock';

describe('CodeBlock helpers', () => {
  it('normalizes language aliases and preserves unknown languages', () => {
    expect(resolveLanguage(undefined)).toBeNull();
    expect(resolveLanguage('plaintext')).toBeNull();
    expect(resolveLanguage('sh')).toBe('bash');
    expect(resolveLanguage('HTML')).toBe('xml');
    expect(resolveLanguage('tsx')).toBe('tsx');
  });

  it('extracts non-empty string values from strings and arrays', () => {
    expect(toNonEmptyString('  hello  ')).toBe('hello');
    expect(toNonEmptyString('   ')).toBeNull();
    expect(toNonEmptyString([' foo ', null, ' bar '])).toBe('foo bar');
    expect(toNonEmptyString([1, null, false])).toBeNull();
    expect(toNonEmptyString({})).toBeNull();
  });

  it('extracts code metadata from data, properties, and hProperties', () => {
    expect(extractCodeMeta(null)).toBeNull();
    expect(extractCodeMeta({ data: { meta: 'title="demo.ts"' } })).toBe('title="demo.ts"');
    expect(extractCodeMeta({ properties: { metastring: [' file=demo.ts ', 'lang=ts'] } })).toBe('file=demo.ts lang=ts');
    expect(extractCodeMeta({ data: { hProperties: { 'data-filename': 'nested/path.ts' } } })).toBe('nested/path.ts');
  });

  it('extracts quoted and unquoted metadata attributes', () => {
    expect(extractMetaAttribute('filename="demo.ts"', 'filename')).toBe('demo.ts');
    expect(extractMetaAttribute("{file='demo.js'}", 'file')).toBe('demo.js');
    expect(extractMetaAttribute('path=src/app.tsx', 'path')).toBe('src/app.tsx');
    expect(extractMetaAttribute('lang=ts', 'filename')).toBeNull();
  });

  it('derives display file names from metadata and paths', () => {
    expect(extractCodeFileName(null)).toBeNull();
    expect(extractCodeFileName('filename="application.yml"')).toBe('application.yml');
    expect(extractCodeFileName('path=src/app.tsx')).toBe('src/app.tsx');
    expect(extractCodeFileName('src/components/App.tsx')).toBe('src/components/App.tsx');
    expect(extractCodeFileName('language=ts')).toBeNull();
  });

  it('detects terminal snippets from language or prompt text', () => {
    expect(isTerminalSnippet('bash', 'bash', 'pnpm test')).toBe(true);
    expect(isTerminalSnippet('text', null, '$ pnpm lint')).toBe(true);
    expect(isTerminalSnippet('text', null, 'PS C:\\Users> pnpm build')).toBe(true);
    expect(isTerminalSnippet('json', 'json', '{"ok":true}')).toBe(false);
  });

  it('flattens supported React nodes into copyable code text', () => {
    expect(toCodeText('plain')).toBe('plain');
    expect(toCodeText(42)).toBe('42');
    expect(toCodeText(['a', 1, <span key="x">ignored</span>, ['b']])).toBe('a1b');
    expect(toCodeText(<div>ignored</div>)).toBe('');
  });

  it('selects the expected syntax theme for each theme variant', () => {
    const themes = {
      dark: { dark: { color: 'black' } },
      light: { light: { color: 'white' } },
      oceanic: { oceanic: { color: 'blue' } },
      forest: { forest: { color: 'green' } },
    };

    expect(getSyntaxTheme('dark', themes as never)).toBe(themes.dark);
    expect(getSyntaxTheme('oceanic', themes as never)).toBe(themes.oceanic);
    expect(getSyntaxTheme('forest', themes as never)).toBe(themes.forest);
    expect(getSyntaxTheme('light', themes as never)).toBe(themes.light);
  });
});
