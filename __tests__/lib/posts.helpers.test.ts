import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { normalizePostCategoryRef, readIdsFromIndexFile, toLayoutPostSummary } from '@/lib/posts';

describe('posts helpers', () => {
  it('normalizes category references safely', () => {
    expect(normalizePostCategoryRef(null)).toBeUndefined();
    expect(normalizePostCategoryRef({ id: ' Frontend ', name: ' Frontend ' })).toEqual({
      color: 'blue',
      id: 'frontend',
      name: 'Frontend',
    });
    expect(normalizePostCategoryRef({ id: 'frontend', name: '' })).toBeUndefined();
  });

  it('reads ids from index files and filters by source', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'blog-posts-helper-'));
    const filePath = path.join(tempDir, 'posts.json');

    await fs.writeFile(
      filePath,
      JSON.stringify([
        { id: ' post-1 ', source: 'blog' },
        { id: 'post-2', source: 'medium' },
        { id: '', source: 'blog' },
        null,
      ]),
    );

    await expect(readIdsFromIndexFile(filePath, 'posts index')).resolves.toEqual(['post-1', 'post-2']);
    await expect(readIdsFromIndexFile(filePath, 'posts index', { source: 'blog' })).resolves.toEqual(['post-1']);
    await expect(readIdsFromIndexFile(filePath, 'posts index', { source: 'medium' })).resolves.toEqual(['post-2']);
  });

  it('returns empty arrays for missing, invalid, and malformed index files', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'blog-posts-helper-invalid-'));
    const invalidJsonPath = path.join(tempDir, 'invalid.json');
    const objectJsonPath = path.join(tempDir, 'object.json');
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await fs.writeFile(invalidJsonPath, '{');
    await fs.writeFile(objectJsonPath, JSON.stringify({ id: 'nope' }));

    await expect(readIdsFromIndexFile(path.join(tempDir, 'missing.json'), 'missing')).resolves.toEqual([]);
    await expect(readIdsFromIndexFile(invalidJsonPath, 'invalid')).resolves.toEqual([]);
    await expect(readIdsFromIndexFile(objectJsonPath, 'object')).resolves.toEqual([]);

    errorSpy.mockRestore();
  });

  it('maps post summaries for layout usage', () => {
    expect(
      toLayoutPostSummary({
        id: 'post-1',
        title: 'Post 1',
        publishedDate: '2024-01-01',
        updatedDate: '2024-01-02',
        summary: 'Summary',
        searchText: 'summary',
        thumbnail: null,
        readingTimeMin: 5,
        source: 'blog',
      }),
    ).toEqual({
      id: 'post-1',
      title: 'Post 1',
      publishedDate: '2024-01-01',
      updatedDate: '2024-01-02',
    });
  });
});
