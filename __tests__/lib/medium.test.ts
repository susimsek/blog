import type { PostSummary } from '@/types/posts';
import type { GetStaticPropsContext } from 'next';
import * as mediumModule from '@/lib/medium';
import fs from 'fs';
import { getCache, setCache } from '@/lib/cacheUtils';
import { getAllTopics, getSortedPostsData } from '@/lib/posts';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock('@/lib/cacheUtils', () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
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
const getCacheMock = getCache as jest.MockedFunction<typeof getCache>;
const setCacheMock = setCache as jest.MockedFunction<typeof setCache>;
const getAllTopicsMock = getAllTopics as jest.MockedFunction<typeof getAllTopics>;
const getSortedPostsDataMock = getSortedPostsData as jest.MockedFunction<typeof getSortedPostsData>;
const serverSideTranslationsMock = serverSideTranslations as jest.MockedFunction<typeof serverSideTranslations>;

describe('medium utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mediumPostsCache).forEach(key => delete mediumPostsCache[key]);
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
    getCacheMock.mockReturnValueOnce(cachedPosts);

    const result = await fetchRssSummaries('en');

    expect(result).toEqual(cachedPosts);
    expect(fsMock.existsSync).not.toHaveBeenCalled();
    expect(setCacheMock).not.toHaveBeenCalled();
  });

  it('returns empty list and sets cache when feed file is missing', async () => {
    getCacheMock.mockReturnValueOnce(null);
    fsMock.existsSync.mockReturnValueOnce(false);

    const result = await fetchRssSummaries('en');

    expect(result).toEqual([]);
    expect(setCacheMock).toHaveBeenCalledWith('en-all', [], mediumPostsCache, 'mediumPostsData');
  });

  it('parses feed items and stores them in cache', async () => {
    getCacheMock.mockReturnValueOnce(null);
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

    expect(setCacheMock).toHaveBeenCalledWith('en-all', result, mediumPostsCache, 'mediumPostsData');
  });

  it('calculates Turkish reading time format', async () => {
    getCacheMock.mockReturnValueOnce(null);
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
    expect(setCacheMock).toHaveBeenCalledWith('tr-all', result, mediumPostsCache, 'mediumPostsData');
  });

  it('handles JSON parse errors gracefully', async () => {
    getCacheMock.mockReturnValueOnce(null);
    fsMock.existsSync.mockReturnValueOnce(true);
    fsMock.readFileSync.mockReturnValueOnce('not-json');

    const result = await fetchRssSummaries('en');

    expect(result).toEqual([]);
    expect(setCacheMock).toHaveBeenCalledWith('en-all', [], mediumPostsCache, 'mediumPostsData');
  });

  it('creates static props with provided locale', async () => {
    const cachedPosts = [makeCachedPost('cached-tr')];
    getCacheMock.mockReturnValueOnce(cachedPosts);
    getSortedPostsDataMock.mockReturnValueOnce([{ id: '1' } as PostSummary]);
    getAllTopicsMock.mockReturnValueOnce([]);
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
    getCacheMock.mockReturnValueOnce([makeCachedPost('cached-en')]);
    getSortedPostsDataMock.mockReturnValueOnce([]);
    getAllTopicsMock.mockReturnValueOnce([]);
    serverSideTranslationsMock.mockResolvedValueOnce({});

    const getProps = makeMediumPostsProps();
    await getProps({} as GetStaticPropsContext);

    expect(getCacheMock).toHaveBeenCalledWith('en-all', mediumPostsCache, 'mediumPostsData');
  });
});
