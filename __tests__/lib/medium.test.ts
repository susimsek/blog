import type { PostSummary } from '@/types/posts';
import type { GetStaticPropsContext } from 'next';
import * as mediumModule from '@/lib/medium';
import fs from 'fs';
import { getAllTopics, getSortedPostsData } from '@/lib/posts';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock('@/lib/posts', () => ({
  getAllTopics: jest.fn(),
  getSortedPostsData: jest.fn(),
}));

jest.mock('next-i18next/serverSideTranslations', () => ({
  serverSideTranslations: jest.fn(),
}));

const { mediumPostsCache, fetchRssSummaries, makeMediumPostsProps } = mediumModule;

const fsMock = fs as jest.Mocked<typeof fs>;
const readFileMock = fsMock.promises.readFile as jest.Mock;
const getAllTopicsMock = getAllTopics as jest.MockedFunction<typeof getAllTopics>;
const getSortedPostsDataMock = getSortedPostsData as jest.MockedFunction<typeof getSortedPostsData>;
const serverSideTranslationsMock = serverSideTranslations as jest.MockedFunction<typeof serverSideTranslations>;

describe('medium utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mediumPostsCache.clear();
    readFileMock.mockImplementation((filePath: string, encoding: string) =>
      Promise.resolve(fsMock.readFileSync(filePath, encoding)),
    );
  });

  const makeCachedPost = (id: string): PostSummary => ({
    id,
    title: `Post ${id}`,
    summary: 'Summary',
    date: '2024-05-01',
    readingTime: '1 min',
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

    const result = await fetchRssSummaries('en');

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

  it('calculates Turkish reading time format', async () => {
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
    expect(result[0].readingTime).toMatch(/dk okuma$/);
    expect(mediumPostsCache.get('tr-all')).toEqual(result);
  });

  it('handles JSON parse errors gracefully', async () => {
    fsMock.existsSync.mockReturnValueOnce(true);
    fsMock.readFileSync.mockReturnValueOnce('not-json');

    const result = await fetchRssSummaries('en');

    expect(result).toEqual([]);
    expect(mediumPostsCache.get('en-all')).toEqual([]);
  });

  it('creates static props with provided locale', async () => {
    const cachedPosts = [makeCachedPost('cached-tr')];
    mediumPostsCache.set('tr-all', cachedPosts);
    getSortedPostsDataMock.mockResolvedValueOnce([{ id: '1' } as PostSummary]);
    getAllTopicsMock.mockResolvedValueOnce([]);
    serverSideTranslationsMock.mockResolvedValueOnce({ common: 'test' } as any);

    const getProps = makeMediumPostsProps(['common']);
    const result = await getProps({ params: { locale: 'tr' } } as unknown as GetStaticPropsContext);

    expect(result.props).toMatchObject({
      common: 'test',
      posts: [{ id: '1' }],
      topics: [],
      mediumPosts: cachedPosts,
    });
  });

  it('falls back to default locale when locale param is missing', async () => {
    const cachedPosts = [makeCachedPost('cached-en')];
    mediumPostsCache.set('en-all', cachedPosts);
    getSortedPostsDataMock.mockResolvedValueOnce([]);
    getAllTopicsMock.mockResolvedValueOnce([]);
    serverSideTranslationsMock.mockResolvedValueOnce({});

    const getProps = makeMediumPostsProps();
    const getSpy = jest.spyOn(mediumPostsCache, 'get');
    await getProps({} as GetStaticPropsContext);
    expect(getSpy).toHaveBeenCalledWith('en-all');
    getSpy.mockRestore();
  });
});
