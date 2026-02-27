import {
  __resetSearchContainerCacheForTests,
  filterSearchResults,
  getStaticLocalePosts,
  normalizeSearchPosts,
} from '@/components/search/SearchContainer';

jest.mock('@/lib/basePath', () => ({
  withBasePath: (value: string) => `/base${value}`,
}));

describe('SearchContainer helpers', () => {
  beforeEach(() => {
    __resetSearchContainerCacheForTests();
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('normalizes valid posts and discards invalid payloads', () => {
    expect(
      normalizeSearchPosts([
        null,
        {
          id: 'post-1',
          title: 'Post 1',
          publishedDate: '2024-01-01',
          updatedDate: '2024-01-02',
          summary: 'Summary',
          searchText: 'Search text',
          readingTimeMin: 5,
          source: 'medium',
          thumbnail: null,
          category: { id: ' Frontend ', name: ' Frontend ' },
          topics: [],
          link: 'https://medium.com/post-1',
        },
        {
          id: 'bad-post',
          title: 'Bad',
          publishedDate: '2024-01-01',
          summary: 'Bad',
          searchText: 'Bad',
          readingTimeMin: 0,
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        id: 'post-1',
        source: 'medium',
        category: { id: 'frontend', name: 'Frontend' },
      }),
    ]);
  });

  it('caches locale post fetches and handles empty or failed responses', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'post-1',
          title: 'Post 1',
          publishedDate: '2024-01-01',
          summary: 'Summary',
          searchText: 'Summary',
          readingTimeMin: 5,
          thumbnail: null,
          topics: [],
        },
      ],
    } as Response);

    await expect(getStaticLocalePosts('en')).resolves.toHaveLength(1);
    await expect(getStaticLocalePosts('en')).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockResolvedValueOnce({ ok: false } as Response);
    await expect(getStaticLocalePosts('tr')).resolves.toEqual([]);

    fetchMock.mockRejectedValueOnce(new Error('network'));
    await expect(getStaticLocalePosts('de')).resolves.toEqual([]);
    await expect(getStaticLocalePosts('   ')).resolves.toEqual([]);
  });

  it('filters and orders search results by source priority', () => {
    const posts = normalizeSearchPosts([
      {
        id: 'blog-1',
        title: 'React Blog',
        publishedDate: '2024-01-01',
        summary: 'UI patterns',
        searchText: 'React UI',
        readingTimeMin: 5,
        source: 'blog',
        thumbnail: null,
        topics: [],
      },
      {
        id: 'medium-1',
        title: 'React Medium',
        publishedDate: '2024-01-01',
        summary: 'Remote article',
        searchText: 'React remote',
        readingTimeMin: 5,
        source: 'medium',
        thumbnail: null,
        topics: [],
      },
    ]);

    expect(filterSearchResults(posts, ' ')).toEqual([]);
    expect(filterSearchResults(posts, 'react').map(post => post.id)).toEqual(['blog-1', 'medium-1']);
  });
});
