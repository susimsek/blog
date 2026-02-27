describe('basePath helpers', () => {
  const previousBasePath = process.env.NEXT_PUBLIC_BASE_PATH;

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_PATH = previousBasePath;
  });

  it('returns empty prefix when base path is not set', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '';
    const { getBasePathPrefix, withBasePath } = require('@/lib/basePath');

    expect(getBasePathPrefix()).toBe('');
    expect(withBasePath('/posts')).toBe('/posts');
    expect(withBasePath('posts')).toBe('/posts');
  });

  it('normalizes slashes and prefixes paths', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/blog/';
    const { getBasePathPrefix, withBasePath } = require('@/lib/basePath');

    expect(getBasePathPrefix()).toBe('/blog');
    expect(withBasePath('/')).toBe('/blog');
    expect(withBasePath('/posts')).toBe('/blog/posts');
  });

  it('does not double-prefix already prefixed paths', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = 'blog';
    const { withBasePath } = require('@/lib/basePath');

    expect(withBasePath('/blog')).toBe('/blog');
    expect(withBasePath('/blog/posts')).toBe('/blog/posts');
  });
});
