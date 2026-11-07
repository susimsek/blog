import React from 'react';
import { buildHeadingIdMap, createHeadingSlugger, flattenHeadingText, slugifyHeading } from '@/lib/markdownHeadings';

describe('markdown heading helpers', () => {
  it('creates normalized slugs and uses a fallback for headings without ASCII text', () => {
    expect(slugifyHeading("  Captain's Tsubasa: Rise!  ")).toBe('captains-tsubasa-rise');
    expect(slugifyHeading('東京')).toBe('section');
  });

  it('adds stable suffixes to duplicate heading slugs', () => {
    const slug = createHeadingSlugger();
    expect(slug('Same heading')).toBe('same-heading');
    expect(slug('Same heading')).toBe('same-heading-1');
  });

  it('flattens nested React children and ignores unsupported values', () => {
    const strong = React.createElement('strong', { key: 'bold' }, 'world');
    expect(flattenHeadingText(['hello ', 7, strong, null])).toBe('hello 7world');
    expect(flattenHeadingText(null)).toBe('');
  });

  it('builds ids from formatted headings and ignores fenced code and invalid headings', () => {
    const content = [
      '# **Bold** heading',
      '## [Guide](https://example.com)',
      '### ![Cover](cover.png)',
      '#### <em>HTML</em> heading',
      '#####',
      '######   ',
      '####### Too many',
      '#No space',
      '```md',
      '# Hidden heading',
      '```',
      '~~~md',
      '## Also hidden',
      '~~~',
      '# **Bold** heading',
    ].join('\n');

    expect([...buildHeadingIdMap(content)]).toEqual([
      [1, 'bold-heading'],
      [2, 'guide'],
      [3, 'cover'],
      [4, 'html-heading'],
      [15, 'bold-heading-1'],
    ]);
  });
});
