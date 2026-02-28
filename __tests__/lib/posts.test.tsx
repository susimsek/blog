import {
  getAllPostsData,
  getAllPostIds,
  getSortedPostsData,
  getPostData,
  getTopicData,
  getAllTopicIds,
  getAllTopics,
  getAllCategories,
  getCategoryData,
  getAllCategoryIds,
  getLayoutPosts,
  getTopTopicsFromPosts,
  postsCache,
  postDataCache,
  topicsCache,
  categoriesCache,
  categoryDataCache,
  postIdsCache,
  topicIdsCache,
  categoryIdsCache,
  readingTimeCache,
} from '@/lib/posts';
import fs from 'fs';
import path from 'path';
import { mockPost, mockPostSummary, mockTopic } from '@tests/__mocks__/mockPostData';

// Mock `fs` module
jest.mock('fs', () => ({
  constants: {
    F_OK: 0,
  },
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
  promises: {
    access: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn(),
  },
}));

const clearCaches = () => {
  postsCache.clear();
  postDataCache.clear();
  topicsCache.clear();
  categoriesCache.clear();
  categoryDataCache.clear();
  postIdsCache.clear();
  topicIdsCache.clear();
  categoryIdsCache.clear();
  readingTimeCache.clear();
};

const fsMock = fs as unknown as {
  existsSync: jest.Mock;
  readFileSync: jest.Mock;
  readdirSync: jest.Mock;
  promises: {
    access: jest.Mock;
    readdir: jest.Mock;
    readFile: jest.Mock;
  };
};

// Mock `path` module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  basename: jest.fn((filePath: string) => filePath.split('/').pop()?.split('.')[0] || ''),
}));

// Mock `gray-matter`
jest.mock('gray-matter', () =>
  jest.fn().mockImplementation((content: string) => {
    if (content.includes('Post 1')) {
      return {
        data: {
          id: 'post1',
          title: 'Post 1',
          publishedDate: '2024-01-01',
          summary: 'Summary 1',
          topics: [{ id: 'react', name: 'React', color: 'red' }],
        },
        content: 'Content 1',
      };
    }
    if (content.includes('Post 2')) {
      return {
        data: {
          id: 'post2',
          title: 'Post 2',
          publishedDate: '2024-01-01',
          summary: 'Summary 2',
          topics: [{ id: 'nextjs', name: 'Next.js', color: 'blue' }],
        },
        content: 'Content 2',
      };
    }
    if (content.includes('Post 3')) {
      return {
        data: {
          id: 'post3',
          title: 'Post 3',
          publishedDate: '2024-01-02',
          summary: 'Summary 3',
          topics: [{ id: 'react', name: 'React', color: 'red' }],
        },
        content: 'Content 3',
      };
    }
    if (content.includes('Post 4')) {
      return {
        data: {
          id: 'post4',
          title: 'Post 4',
          publishedDate: '2024-01-01',
          summary: 'Summary 4',
          topics: [{ id: 'spring', name: 'Spring Boot', color: 'orange' }],
        },
        content: 'Content 4',
      };
    }
    return {
      data: {
        id: mockPost.id,
        title: mockPost.title,
        publishedDate: mockPost.publishedDate,
        summary: mockPost.summary,
        topics: mockPost.topics,
        thumbnail: mockPost.thumbnail,
      },
      content: mockPost.contentHtml,
    };
  }),
);

jest.mock('@/i18n/settings', () => ({
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'de'],
  },
}));

describe('Posts Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCaches();

    fsMock.existsSync.mockReturnValue(true);
    fsMock.promises.access.mockImplementation((filePath: string) => {
      if (fsMock.existsSync(filePath)) {
        return Promise.resolve();
      }

      const err = new Error(`ENOENT: no such file or directory, access '${filePath}'`) as Error & { code?: string };
      err.code = 'ENOENT';
      return Promise.reject(err);
    });
    fsMock.promises.readFile.mockImplementation((filePath: string, encoding: string) =>
      Promise.resolve((fs.readFileSync as jest.Mock)(filePath, encoding)),
    );

    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.includes('/public/data/posts.')) {
        return JSON.stringify([mockPostSummary]);
      }
      if (filePath.includes('topics.json')) {
        return JSON.stringify([mockTopic]);
      }
      return `
      ---
      id: ${mockPost.id}
      title: ${mockPost.title}
      publishedDate: "${mockPost.publishedDate}"
      summary: ${mockPost.summary}
      thumbnail: ${mockPost.thumbnail}
      topics: ${JSON.stringify(mockPost.topics)}
      ---
      # Mock Markdown Content
    `;
    });
    (fs.readdirSync as jest.Mock).mockReturnValue(['mock-post.md']);
  });

  describe('getSortedPostsData', () => {
    it('returns sorted posts data', async () => {
      const result = await getSortedPostsData('en');
      expect(result).toEqual([mockPostSummary]);
    });

    it('filters posts by topicId', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue(['post1.md', 'post2.md', 'post3.md']);
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('/public/data/posts.')) {
          return JSON.stringify([
            {
              id: 'post1',
              title: 'Post 1',
              publishedDate: '2024-01-01',
              summary: 'Summary 1',
              searchText: 'post 1 summary 1 react',
              readingTimeMin: 3,
              topics: [{ id: 'react', name: 'React', color: 'blue' }],
              thumbnail: '/thumb1.jpg',
            },
            {
              id: 'post2',
              title: 'Post 2',
              publishedDate: '2024-01-01',
              summary: 'Summary 2',
              searchText: 'post 2 summary 2 nextjs',
              readingTimeMin: 3,
              topics: [{ id: 'nextjs', name: 'Next.js', color: 'green' }],
              thumbnail: '/thumb2.jpg',
            },
            {
              id: 'post3',
              title: 'Post 3',
              publishedDate: '2024-01-02',
              summary: 'Summary 3',
              searchText: 'post 3 summary 3 react',
              readingTimeMin: 4,
              topics: [{ id: 'react', name: 'React', color: 'red' }],
              thumbnail: '/thumb3.jpg',
            },
          ]);
        }
        return 'Some markdown content';
      });

      const result = await getSortedPostsData('en', 'react');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('post3');
    });

    it('excludes posts not matching the topicId', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
        if (p.includes('/fr')) return true;
        if (p.includes('/en')) return true;
        return false;
      });
      (fs.readdirSync as jest.Mock).mockImplementation((p: string) => {
        if (p.includes('/en')) return ['fallback-post.md'];
        return [];
      });
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('/public/data/posts.')) {
          return JSON.stringify([mockPostSummary]);
        }
        return 'Some markdown content';
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await getSortedPostsData('fr', 'non_existing_topic');
      consoleSpy.mockRestore();

      expect(result).toEqual([]);
    });

    it('returns cached posts without re-reading files', async () => {
      const first = await getSortedPostsData('en');
      expect(first).toHaveLength(1);

      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('should not read from fs when cached');
      });

      const second = await getSortedPostsData('en');
      expect(second).toEqual(first);
    });

    it('uses index metadata directly without markdown fallback', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => p.includes('/public/data/posts.'));
      const result = await getSortedPostsData('en');
      expect(result).toHaveLength(1);
      expect(result[0].readingTimeMin).toBeDefined();
      expect(result[0].searchText).toBeDefined();
    });

    it('skips posts missing strict metadata fields', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => p.includes('/public/data/posts.fr.json'));
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('/public/data/posts.fr.json')) {
          return JSON.stringify([
            {
              id: 'valid-post',
              title: 'Valid Post',
              publishedDate: '2024-01-10',
              summary: 'Valid summary',
              searchText: 'valid post valid summary react',
              readingTimeMin: 3,
              topics: [{ id: 'react', name: 'React', color: 'blue' }],
              thumbnail: '/thumb.jpg',
            },
            {
              id: 'invalid-post',
              title: 'Invalid Post',
              publishedDate: '2024-01-09',
              summary: 'Invalid summary',
              topics: [{ id: 'react', name: 'React', color: 'blue' }],
              thumbnail: '/thumb.jpg',
            },
          ]);
        }
        return '';
      });

      const result = await getSortedPostsData('fr');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('valid-post');
    });

    it('handles malformed posts index gracefully', async () => {
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('/public/data/posts.')) {
          return '{invalid json}';
        }
        return '';
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await getSortedPostsData('en');
      consoleSpy.mockRestore();

      expect(result).toEqual([]);
    });
  });

  describe('getAllPostsData', () => {
    it('normalizes category ids and source values from index metadata', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) =>
        filePath.endsWith('/public/data/posts.en.json'),
      );
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/public/data/posts.en.json')) {
          return JSON.stringify([
            {
              id: 'normalized-medium',
              title: 'Normalized Medium',
              publishedDate: '2024-03-01',
              summary: 'summary',
              searchText: 'normalized medium summary',
              readingTimeMin: 6,
              thumbnail: null,
              source: 'medium',
              category: { id: '  JavaScript  ', name: ' JavaScript ' },
            },
            {
              id: 'fallback-blog',
              title: 'Fallback Blog',
              publishedDate: '2024-02-01',
              summary: 'summary',
              searchText: 'fallback blog summary',
              readingTimeMin: 4,
              thumbnail: null,
              source: 'rss',
              category: { id: ' ', name: 'Empty Id' },
            },
          ]);
        }
        return '';
      });

      const result = await getAllPostsData('en');
      expect(result).toHaveLength(2);

      const mediumPost = result.find(post => post.id === 'normalized-medium');
      const blogPost = result.find(post => post.id === 'fallback-blog');

      expect(mediumPost?.source).toBe('medium');
      expect(mediumPost?.category).toEqual({ id: 'javascript', name: 'JavaScript', color: 'blue' });
      expect(blogPost?.source).toBe('blog');
      expect(blogPost?.category).toBeUndefined();
    });
  });

  describe('getPostData', () => {
    it('uses localizedPath if it exists', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => p.includes('en/mock-post.md'));
      const result = await getPostData('mock-post', 'en');
      expect(result).toEqual(mockPost);
      expect(path.join).toHaveBeenCalledWith(expect.anything(), 'en', 'mock-post.md');
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('en/mock-post.md'));
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('en/mock-post.md'), 'utf8');
    });

    it('returns null when localizedPath does not exist', async () => {
      const mockedJoin = require('path').join as jest.Mock;
      mockedJoin.mockImplementation((...args: string[]) => {
        const joinedPath = args.join('/');
        if (joinedPath.includes('/fr/mock-post.md')) {
          return 'localized/fr/mock-post.md';
        }
        return joinedPath;
      });
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
        if (p === 'localized/fr/mock-post.md') return false;
        return false;
      });
      const result = await getPostData('mock-post', 'fr');
      expect(result).toBeNull();
      expect(mockedJoin).toHaveBeenCalledWith(expect.stringContaining('content/posts'), 'fr', 'mock-post.md');
      expect(fs.existsSync).toHaveBeenCalledWith('localized/fr/mock-post.md');
    });

    it('returns null if file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = await getPostData('missing-post', 'en');
      expect(result).toBeNull();
    });

    it('returns cached post data without fs access', async () => {
      const first = await getPostData('mock-post', 'en');
      expect(first).toBeTruthy();

      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('should not read when cached');
      });

      const second = await getPostData('mock-post', 'en');
      expect(second).toEqual(first);
    });
  });

  describe('getTopicData', () => {
    beforeEach(() => {
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['mock-post.md']);
      const originalReadFile = (fs.promises.readFile as jest.Mock).getMockImplementation();
      (fs.promises.readFile as jest.Mock).mockImplementation((filePath: string, encoding: string) => {
        if (filePath.endsWith('.md')) {
          return Promise.resolve(`
      ---
      id: ${mockPost.id}
      title: ${mockPost.title}
      publishedDate: "${mockPost.publishedDate}"
      summary: ${mockPost.summary}
      thumbnail: ${mockPost.thumbnail}
      topics: ${JSON.stringify(mockPost.topics)}
      ---
      # Mock Markdown Content
    `);
        }
        return originalReadFile ? originalReadFile(filePath, encoding) : Promise.resolve('');
      });
    });

    it('does not collect topics if directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await getTopicData('en', 'react');
      consoleSpy.mockRestore();

      expect(result).toBeNull();
    });

    it('collects topics from only directory', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mockTopic = { id: 'react', name: 'React' };
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([mockTopic]));
      const result = await getTopicData('en', 'react');
      expect(fs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('public', 'data', 'topics.en.json')),
      );
      expect(result).toEqual(mockTopic);
    });
  });

  describe('getAllPostIds', () => {
    it('returns all post IDs with locales', async () => {
      const mockPosts = [{ id: '1' }];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockPosts));
      const result = await getAllPostIds();
      expect(result).toEqual([
        { params: { id: '1', locale: 'en' } },
        { params: { id: '1', locale: 'fr' } },
        { params: { id: '1', locale: 'de' } },
      ]);
    });

    it('returns an empty list when no posts are found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = await getAllPostIds();
      expect(result).toEqual([]);
    });

    it('excludes medium-source IDs from generated post paths', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify([{ id: 'blog-1' }, { id: 'medium-1', source: 'medium' }]),
      );

      const result = await getAllPostIds();
      expect(result).toEqual([
        { params: { id: 'blog-1', locale: 'en' } },
        { params: { id: 'blog-1', locale: 'fr' } },
        { params: { id: 'blog-1', locale: 'de' } },
      ]);
    });

    it('returns union of IDs found across locales', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/public/data/posts.en.json')) return true;
        if (filePath.endsWith('/public/data/posts.fr.json')) return true;
        if (filePath.endsWith('/public/data/posts.de.json')) return false;
        return false;
      });
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/public/data/posts.en.json')) {
          return JSON.stringify([{ id: 'post-en' }]);
        }
        if (filePath.endsWith('/public/data/posts.fr.json')) {
          return JSON.stringify([{ id: 'post-fr' }]);
        }
        return '';
      });

      const result = await getAllPostIds();
      expect(result).toEqual([
        { params: { id: 'post-en', locale: 'en' } },
        { params: { id: 'post-fr', locale: 'fr' } },
      ]);
    });

    it('returns an empty list when directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = await getAllPostIds();
      expect(result).toEqual([]);
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/public/data/posts.en.json'));
      expect(fs.readdirSync).not.toHaveBeenCalled();
    });
  });

  describe('getAllTopics', () => {
    const mockEnglishTopics = [
      { id: 'react', name: 'React', color: 'red' },
      { id: 'nextjs', name: 'Next.js', color: 'blue' },
    ];
    const mockTurkishTopics = [
      { id: 'react', name: 'React', color: 'red' },
      { id: 'nextjs', name: 'Sonraki.js', color: 'mavi' },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns topics from the correct locale file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/public/data/topics.en.json')) {
          return JSON.stringify(mockEnglishTopics);
        }
        if (filePath.endsWith('/public/data/topics.tr.json')) {
          return JSON.stringify(mockTurkishTopics);
        }
        return '';
      });
      const englishTopics = await getAllTopics('en');
      expect(englishTopics).toEqual(mockEnglishTopics);
      const turkishTopics = await getAllTopics('tr');
      expect(turkishTopics).toEqual(mockTurkishTopics);
    });

    it('returns an empty array if topics file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = await getAllTopics('en');
      expect(result).toEqual([]);
    });

    it('handles JSON parse errors gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{ invalid json }');
      const result = await getAllTopics('en');
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error reading or parsing topics index:', expect.any(SyntaxError));
    });

    it('returns an empty array for unsupported locales', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = await getAllTopics('unsupported-locale');
      expect(result).toEqual([]);
    });

    it('returns cached topics on repeated calls', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([{ id: 'react', name: 'React', color: 'red' }]));

      const first = await getAllTopics('en');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const second = await getAllTopics('en');
      expect(second).toEqual(first);
    });
  });

  describe('getAllCategories / getCategoryData / getAllCategoryIds', () => {
    const mockEnglishCategories = [
      { id: 'frontend', name: 'Frontend', color: 'blue' },
      { id: 'backend', name: 'Backend', color: 'green' },
    ];
    const mockFrenchCategories = [{ id: 'frontend', name: 'Interface', color: 'bleu' }];

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns categories from locale file and caches category lookups', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) =>
        filePath.endsWith('/public/data/categories.en.json'),
      );
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/public/data/categories.en.json')) {
          return JSON.stringify(mockEnglishCategories);
        }
        return '';
      });

      const categories = await getAllCategories('en');
      expect(categories).toEqual(mockEnglishCategories);

      const category = await getCategoryData('en', 'frontend');
      expect(category).toEqual(mockEnglishCategories[0]);

      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('should use cache');
      });

      const cachedCategory = await getCategoryData('en', 'frontend');
      expect(cachedCategory).toEqual(mockEnglishCategories[0]);
    });

    it('returns null when requested category is missing', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) =>
        filePath.endsWith('/public/data/categories.en.json'),
      );
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/public/data/categories.en.json')) {
          return JSON.stringify(mockEnglishCategories);
        }
        return '';
      });

      const category = await getCategoryData('en', 'missing');
      expect(category).toBeNull();
    });

    it('returns empty array on missing or malformed category index', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      expect(await getAllCategories('en')).toEqual([]);

      clearCaches();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{ invalid json }');
      expect(await getAllCategories('en')).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error reading or parsing categories index:', expect.any(SyntaxError));
    });

    it('builds category IDs union across locales', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/public/data/categories.en.json')) return true;
        if (filePath.endsWith('/public/data/categories.fr.json')) return true;
        if (filePath.endsWith('/public/data/categories.de.json')) return false;
        return false;
      });
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/public/data/categories.en.json')) {
          return JSON.stringify(mockEnglishCategories);
        }
        if (filePath.endsWith('/public/data/categories.fr.json')) {
          return JSON.stringify(mockFrenchCategories);
        }
        return '';
      });

      const ids = await getAllCategoryIds();
      expect(ids).toEqual([
        { params: { id: 'backend', locale: 'en' } },
        { params: { id: 'backend', locale: 'fr' } },
        { params: { id: 'backend', locale: 'de' } },
        { params: { id: 'frontend', locale: 'en' } },
        { params: { id: 'frontend', locale: 'fr' } },
        { params: { id: 'frontend', locale: 'de' } },
      ]);
    });
  });

  describe('getAllTopicIds', () => {
    const mockEnglishTopics = [
      { id: 'react', name: 'React', color: 'red' },
      { id: 'nextjs', name: 'Next.js', color: 'blue' },
    ];
    const mockFrenchTopics = [
      { id: 'react', name: 'Réagir', color: 'rouge' },
      { id: 'nextjs', name: 'Suivant.js', color: 'bleu' },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns topic IDs for all locales when topics.json exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/public/data/topics.en.json')) {
          return JSON.stringify(mockEnglishTopics);
        }
        if (filePath.endsWith('/public/data/topics.fr.json')) {
          return JSON.stringify(mockFrenchTopics);
        }
        return '';
      });
      const result = await getAllTopicIds();
      expect(result).toEqual([
        {
          params: {
            id: 'nextjs',
            locale: 'en',
          },
        },
        {
          params: {
            id: 'nextjs',
            locale: 'fr',
          },
        },
        {
          params: {
            id: 'nextjs',
            locale: 'de',
          },
        },
        {
          params: {
            id: 'react',
            locale: 'en',
          },
        },
        {
          params: {
            id: 'react',
            locale: 'fr',
          },
        },
        {
          params: {
            id: 'react',
            locale: 'de',
          },
        },
      ]);
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/public/data/topics.en.json'));
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('/public/data/topics.en.json'), 'utf8');
    });

    it('returns an empty array if topics.json does not exist for any locale', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = await getAllTopicIds();
      expect(result).toEqual([]);
    });

    it('returns union of topic IDs found across locales', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/public/data/topics.en.json')) return true;
        if (filePath.endsWith('/public/data/topics.fr.json')) return true;
        if (filePath.endsWith('/public/data/topics.de.json')) return false;
        return false;
      });
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/public/data/topics.en.json')) {
          return JSON.stringify([{ id: 'react', name: 'React', color: 'red' }]);
        }
        if (filePath.endsWith('/public/data/topics.fr.json')) {
          return JSON.stringify([{ id: 'nestjs', name: 'NestJS', color: 'blue' }]);
        }
        return '';
      });

      const result = await getAllTopicIds();
      expect(result).toEqual([
        { params: { id: 'nestjs', locale: 'en' } },
        { params: { id: 'nestjs', locale: 'fr' } },
        { params: { id: 'nestjs', locale: 'de' } },
        { params: { id: 'react', locale: 'en' } },
        { params: { id: 'react', locale: 'fr' } },
        { params: { id: 'react', locale: 'de' } },
      ]);
    });

    it('handles JSON parse errors gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockImplementation(() => '{ invalid json }');
      const result = await getAllTopicIds();
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error reading/parsing topics index'),
        expect.any(SyntaxError),
      );
    });

    it('returns an empty array if no topics are found for any locale', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));
      const result = await getAllTopicIds();
      expect(result).toEqual([]);
    });

    it('handles a mix of existing and missing topics.json files for different locales', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) =>
        filePath.includes('/public/data/topics.en.json'),
      );
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/public/data/topics.en.json')) {
          return JSON.stringify(mockEnglishTopics);
        }
        throw new Error('File not found');
      });
      const result = await getAllTopicIds();
      expect(result).toEqual([
        {
          params: {
            id: 'nextjs',
            locale: 'en',
          },
        },
        {
          params: {
            id: 'nextjs',
            locale: 'fr',
          },
        },
        {
          params: {
            id: 'nextjs',
            locale: 'de',
          },
        },
        {
          params: {
            id: 'react',
            locale: 'en',
          },
        },
        {
          params: {
            id: 'react',
            locale: 'fr',
          },
        },
        {
          params: {
            id: 'react',
            locale: 'de',
          },
        },
      ]);
    });
  });

  describe('layout helpers', () => {
    it('maps layout posts and clamps invalid limits', () => {
      const posts = [
        { ...mockPostSummary, id: 'a', updatedDate: '2024-01-01' },
        { ...mockPostSummary, id: 'b', title: 'B' },
      ];

      expect(getLayoutPosts(posts, 1.9)).toEqual([
        {
          id: 'a',
          title: 'Test Post',
          publishedDate: '2024-12-03',
          updatedDate: '2024-01-01',
        },
      ]);
      expect(getLayoutPosts(posts, -3)).toEqual([]);
      expect(getLayoutPosts(posts, Number.NaN)).toHaveLength(2);
    });

    it('returns top topics sorted by frequency then name and skips unknown topics', () => {
      const posts = [
        {
          ...mockPostSummary,
          id: '1',
          topics: [
            { id: 'react', name: 'React', color: 'red' },
            { id: 'nextjs', name: 'Next.js', color: 'blue' },
          ],
        },
        {
          ...mockPostSummary,
          id: '2',
          topics: [
            { id: 'nextjs', name: 'Next.js', color: 'blue' },
            { id: 'unknown', name: 'Unknown', color: 'gray' },
          ],
        },
        {
          ...mockPostSummary,
          id: '3',
          topics: [{ id: 'angular', name: 'Angular', color: 'red' }],
        },
      ];
      const topics = [
        { id: 'angular', name: 'Angular', color: 'red' },
        { id: 'nextjs', name: 'Next.js', color: 'blue' },
        { id: 'react', name: 'React', color: 'red' },
      ];

      expect(getTopTopicsFromPosts(posts, topics, 2)).toEqual([
        { id: 'nextjs', name: 'Next.js', color: 'blue' },
        { id: 'angular', name: 'Angular', color: 'red' },
      ]);
    });
  });
});
