import { resolveThumbnailSrc } from '@/components/posts/RelatedPosts';

describe('RelatedPosts helpers', () => {
  it('keeps absolute thumbnail URLs unchanged', () => {
    expect(resolveThumbnailSrc('https://cdn.example.com/post.webp', '')).toBe('https://cdn.example.com/post.webp');
  });

  it('normalizes relative thumbnails without an asset prefix', () => {
    expect(resolveThumbnailSrc('images/post.webp', '')).toBe('/images/post.webp');
    expect(resolveThumbnailSrc('/images/post.webp', '')).toBe('/images/post.webp');
  });

  it('joins asset prefixes without adding duplicate slashes', () => {
    expect(resolveThumbnailSrc('images/post.webp', 'https://cdn.example.com')).toBe(
      'https://cdn.example.com/images/post.webp',
    );
    expect(resolveThumbnailSrc('/images/post.webp', 'https://cdn.example.com/')).toBe(
      'https://cdn.example.com/images/post.webp',
    );
  });
});
