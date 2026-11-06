import { getAllCategoryIds, getAllPostIds, getAllTopicIds } from '@/lib/posts';
import { buildLocalizedPath } from '@/lib/metadata';

describe('static localized routes', () => {
  it('provides locale-specific static parameters for translated content', async () => {
    const [posts, categories, topics] = await Promise.all([getAllPostIds(), getAllCategoryIds(), getAllTopicIds()]);

    for (const paths of [posts, categories, topics]) {
      const routeKeys = paths.map(path => `${path.params.locale}:${path.params.id}`);
      expect(new Set(routeKeys).size).toBe(routeKeys.length);
      expect(paths.every(path => Object.keys(path.params).sort().join(',') === 'id,locale')).toBe(true);
      expect(paths.some(path => path.params.locale === 'en')).toBe(true);
      expect(paths.some(path => path.params.locale === 'tr')).toBe(true);
    }

    expect(posts.length).toBeGreaterThan(0);
    expect(categories.length).toBeGreaterThan(0);
    expect(topics.length).toBeGreaterThan(0);
  });

  it('uses the English root and a Turkish locale prefix for canonical URLs', () => {
    expect(buildLocalizedPath('en', 'posts/example')).toBe('/posts/example');
    expect(buildLocalizedPath('tr', 'posts/example')).toBe('/tr/posts/example');
  });
});
