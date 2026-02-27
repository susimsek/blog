import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { escapeRegExp, highlight, resolvePostThumbnailSrc } from '@/components/posts/PostSummary';

describe('PostSummary helpers', () => {
  it('escapes regex tokens safely', () => {
    expect(escapeRegExp('a+b?')).toBe('a\\+b\\?');
  });

  it('highlights multi-token queries and skips short or missing tokens', () => {
    expect(highlight('React patterns', 'r')).toBe('React patterns');

    const markup = renderToStaticMarkup(<>{highlight('React patterns for search', 'React search')}</>);
    expect(markup).toContain('<mark');
    expect(markup).toContain('React');
    expect(markup).toContain('search');
  });

  it('resolves thumbnail sources for remote, relative, and prefixed assets', () => {
    expect(resolvePostThumbnailSrc('https://cdn.example.com/image.png')).toBe('https://cdn.example.com/image.png');
    expect(resolvePostThumbnailSrc('images/demo.png', '')).toBe('/images/demo.png');
    expect(resolvePostThumbnailSrc('/images/demo.png', 'https://cdn.example.com/')).toBe(
      'https://cdn.example.com/images/demo.png',
    );
    expect(resolvePostThumbnailSrc('images/demo.png', 'https://cdn.example.com')).toBe(
      'https://cdn.example.com/images/demo.png',
    );
  });
});
