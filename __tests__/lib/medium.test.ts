import type { PostSummary } from '@/types/posts';
import * as mediumModule from '@/lib/medium';
import fs from 'fs';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
  },
}));

const { mediumPostsCache, fetchRssSummaries } = mediumModule;

const fsMock = fs as jest.Mocked<typeof fs>;
const readFileMock = fsMock.promises.readFile as jest.Mock;

describe('medium utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mediumPostsCache.clear();
    readFileMock.mockImplementation((filePath: string, encoding: string) =>
      Promise.resolve(fsMock.readFileSync(filePath, encoding as BufferEncoding)),
    );
  });

  const makeCachedPost = (id: string): PostSummary => ({
    id,
    title: `Post ${id}`,
    summary: 'Summary',
    searchText: `post ${id} summary`,
    publishedDate: '2024-05-01',
    readingTimeMin: 1,
    thumbnail: null,
  });

  it('returns cached summaries when present', async () => {
    const cachedPosts = [makeCachedPost('cached')];
    mediumPostsCache.set('en-all', cachedPosts);

    const result = await fetchRssSummaries('en');

    expect(result).toEqual(cachedPosts);
    expect(fsMock.existsSync).not.toHaveBeenCalled();
  });

  it('returns empty list and stores it when feed file is missing', async () => {
    fsMock.existsSync.mockReturnValueOnce(false);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await fetchRssSummaries('en');
    consoleSpy.mockRestore();

    expect(result).toEqual([]);
    expect(mediumPostsCache.get('en-all')).toEqual([]);
  });

  it('parses feed items and stores them in cache', async () => {
    fsMock.existsSync.mockReturnValueOnce(true);

    const feed = {
      items: [
        {
          guid: 'item-1',
          title: 'Medium Post',
          pubDate: '2024-05-01',
          link: 'https://medium.com/@author/post',
          categories: ['tech'],
          'content:encoded': '<p>Hello <strong>world</strong>\nline</p><img src=https://cdn/img.webp> More words',
        },
        {
          guid: 'item-2',
          title: 'Snippet Post',
          pubDate: '2024-05-02',
          link: 'https://medium.com/@author/snippet',
          'content:encodedSnippet': 'Snippet summary',
          'content:encoded': '<p>No image here</p>',
        },
      ],
    };

    fsMock.readFileSync.mockReturnValueOnce(JSON.stringify(feed));

    const result = await fetchRssSummaries('en');

    expect(result).toHaveLength(2);
    const [first, second] = result;
    expect(first.thumbnail).toBe('https://cdn/img.webp');
    expect(first.summary).toContain('Hello world line More words');
    expect(first.topics?.[0]).toMatchObject({
      id: 'tech',
      name: 'tech',
      link: 'https://medium.com/tag/tech',
    });

    expect(second.thumbnail).toBeNull();
    expect(second.summary).toBe('Snippet summary');
    expect(second.topics).toEqual([]);

    expect(mediumPostsCache.get('en-all')).toEqual(result);
  });

  it('calculates numeric reading time minutes', async () => {
    fsMock.existsSync.mockReturnValueOnce(true);

    const feed = {
      items: [
        {
          guid: 'item-tr',
          title: 'TR Post',
          pubDate: '2024-05-01',
          link: 'https://medium.com/@author/tr',
          'content:encoded': '<p>' + 'kelime '.repeat(600) + '</p>',
        },
      ],
    };

    fsMock.readFileSync.mockReturnValueOnce(JSON.stringify(feed));

    const result = await fetchRssSummaries('tr');
    expect(result[0].readingTimeMin).toBe(3);
    expect(mediumPostsCache.get('tr-all')).toEqual(result);
  });

  it('handles JSON parse errors gracefully', async () => {
    fsMock.existsSync.mockReturnValueOnce(true);
    fsMock.readFileSync.mockReturnValueOnce('not-json');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await fetchRssSummaries('en');
    consoleSpy.mockRestore();

    expect(result).toEqual([]);
    expect(mediumPostsCache.get('en-all')).toEqual([]);
  });

  it('continues scanning image tags when first img has no src', async () => {
    fsMock.existsSync.mockReturnValueOnce(true);

    fsMock.readFileSync.mockReturnValueOnce(
      JSON.stringify({
        items: [
          {
            guid: 'item-3',
            title: 'Image scan post',
            pubDate: '2024-05-03',
            link: 'https://medium.com/@author/image-scan',
            'content:encoded': '<p>text</p><img alt="x"><img src="https://cdn/second.webp">',
          },
        ],
      }),
    );

    const result = await fetchRssSummaries('en');
    expect(result[0].thumbnail).toBe('https://cdn/second.webp');
  });

  it('returns null thumbnail for malformed image tag and missing quote in src', async () => {
    fsMock.existsSync.mockReturnValueOnce(true);

    fsMock.readFileSync.mockReturnValueOnce(
      JSON.stringify({
        items: [
          {
            guid: undefined,
            title: undefined,
            pubDate: undefined,
            link: 'https://medium.com/@author/malformed',
            // missing closing quote and no tag close '>' forces null path
            'content:encoded': '<img src="https://cdn/broken.webp',
          },
        ],
      }),
    );

    const result = await fetchRssSummaries('en');
    expect(result[0].thumbnail).toBeNull();
    expect(result[0].id).toBe('rss-0');
    expect(result[0].title).toBe('Untitled');
    expect(result[0].publishedDate).toBeTruthy();
  });
});
