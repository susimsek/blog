import {
  buildPostNavigationGridClassName,
  getFenceToken,
  hasSupportedMarkdownHeading,
  resolvePostDetailThumbnailSrc,
  splitMarkdownIntro,
} from '@/components/posts/PostDetail';

describe('PostDetail helpers', () => {
  it('detects supported fence tokens', () => {
    expect(getFenceToken('```ts')).toBe('```');
    expect(getFenceToken('  ~~~md')).toBe('~~~');
    expect(getFenceToken('plain text')).toBeNull();
  });

  it('detects headings only outside matching code fences', () => {
    expect(hasSupportedMarkdownHeading('')).toBe(false);
    expect(hasSupportedMarkdownHeading('```md\n## inside\n```')).toBe(false);
    expect(hasSupportedMarkdownHeading('~~~md\n## inside\n~~~\n\n## outside')).toBe(true);
    expect(hasSupportedMarkdownHeading('```md\n## inside\n~~~\nno heading')).toBe(false);
  });

  it('splits intro content before the first heading and ignores fenced headings', () => {
    expect(splitMarkdownIntro('Intro\n\n## Heading\nBody')).toEqual({
      intro: 'Intro',
      rest: '## Heading\nBody',
    });

    expect(splitMarkdownIntro('```md\n## inside\n```\n\n### Outside\nBody')).toEqual({
      intro: '```md\n## inside\n```',
      rest: '### Outside\nBody',
    });

    expect(splitMarkdownIntro('~~~md\n## inside\n```')).toEqual({
      intro: '~~~md\n## inside\n```',
      rest: '',
    });
  });

  it('builds navigation classes for single-sided navigation states', () => {
    expect(buildPostNavigationGridClassName(true, true)).toBe('post-navigation-grid');
    expect(buildPostNavigationGridClassName(false, true)).toContain('has-only-next');
    expect(buildPostNavigationGridClassName(true, false)).toContain('has-only-previous');
  });

  it('resolves post detail thumbnail sources safely', () => {
    expect(resolvePostDetailThumbnailSrc(null)).toBeNull();
    expect(resolvePostDetailThumbnailSrc('https://cdn.example.com/image.png')).toBe(
      'https://cdn.example.com/image.png',
    );
    expect(resolvePostDetailThumbnailSrc('images/demo.png', '')).toBe('/images/demo.png');
    expect(resolvePostDetailThumbnailSrc('/images/demo.png', 'https://cdn.example.com/')).toBe(
      'https://cdn.example.com/images/demo.png',
    );
  });
});
