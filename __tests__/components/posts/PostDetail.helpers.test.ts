import {
  buildPostStructuredData,
  buildPostNavigationGridClassName,
  getFenceToken,
  hasSupportedMarkdownHeading,
  resolvePostDetailThumbnailSrc,
  splitMarkdownIntro,
} from '@/components/posts/PostDetail';
import { mockPost } from '@tests/__mocks__/mockPostData';

type StructuredDataGraphNode = {
  '@type'?: string;
  mainEntityOfPage?: unknown;
  author?: unknown;
  image?: unknown;
  itemListElement?: unknown;
};

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

  it('builds BlogPosting structured data for post pages', () => {
    const structuredData = buildPostStructuredData(
      {
        ...mockPost,
        category: { id: 'backend', name: 'Backend', color: 'blue' },
      },
      'en',
    );

    const graph = structuredData['@graph'] as StructuredDataGraphNode[];
    expect(Array.isArray(graph)).toBe(true);
    const blogPosting = graph.find(item => item['@type'] === 'BlogPosting');
    const breadcrumbList = graph.find(item => item['@type'] === 'BreadcrumbList');

    expect(structuredData).toEqual(
      expect.objectContaining({
        '@context': 'https://schema.org',
      }),
    );
    if (!blogPosting || !breadcrumbList) {
      throw new Error('Expected BlogPosting and BreadcrumbList graph nodes');
    }
    expect(structuredData).toEqual(
      expect.not.objectContaining({
        '@type': 'BlogPosting',
      }),
    );
    expect(blogPosting).toEqual(
      expect.objectContaining({
        headline: mockPost.title,
        description: mockPost.summary,
        datePublished: mockPost.publishedDate,
        dateModified: mockPost.updatedDate ?? mockPost.publishedDate,
        inLanguage: 'en',
        articleSection: 'Backend',
        keywords: mockPost.topics?.map(topic => topic.name),
      }),
    );
    expect(blogPosting.mainEntityOfPage).toEqual(
      expect.objectContaining({
        '@type': 'WebPage',
        '@id': expect.stringContaining('/en/posts/1'),
      }),
    );
    expect(blogPosting.author).toEqual(
      expect.objectContaining({
        '@type': 'Person',
        name: 'Şuayb Şimşek',
        url: expect.stringContaining('/en/about'),
      }),
    );
    expect(blogPosting.image).toEqual([expect.stringContaining(mockPost.thumbnail!)]);
    expect(breadcrumbList).toEqual(
      expect.objectContaining({
        '@type': 'BreadcrumbList',
        itemListElement: [
          expect.objectContaining({
            '@type': 'ListItem',
            position: 1,
            name: 'Blog',
            item: expect.stringContaining('/en'),
          }),
          expect.objectContaining({
            '@type': 'ListItem',
            position: 2,
            name: 'Backend',
            item: expect.stringContaining('/en/categories/backend'),
          }),
          expect.objectContaining({
            '@type': 'ListItem',
            position: 3,
            name: mockPost.title,
            item: expect.stringContaining('/en/posts/1'),
          }),
        ],
      }),
    );
  });
});
