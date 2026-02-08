import {
  getAllPostIds,
  getSortedPostsData,
  getPostData,
  getTopicData,
  getAllTopicIds,
  getAllTopics,
  postsCache,
  postDataCache,
  topicsCache,
  postIdsCache,
  topicIdsCache,
  readingTimeCache,
} from '@/lib/posts';
import fs from 'fs';
import path from 'path';
import { mockPost, mockPostSummary, mockTopic } from '@tests/__mocks__/mockPostData';

// Mock `fs` module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
  },
}));

const clearCaches = () => {
  postsCache.clear();
  postDataCache.clear();
  topicsCache.clear();
  postIdsCache.clear();
  topicIdsCache.clear();
  readingTimeCache.clear();
};

const fsMock = fs as unknown as {
  existsSync: jest.Mock;
  readFileSync: jest.Mock;
  promises: {
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
          date: '2024-01-01',
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
          date: '2024-01-01',
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
          date: '2024-01-02',
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
          date: '2024-01-01',
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
        date: mockPost.date,
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
    fsMock.promises.readFile.mockImplementation((filePath: string, encoding: string) =>
      Promise.resolve((fs.readFileSync as jest.Mock)(filePath, encoding)),
    );

    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.includes('posts.json')) {
        return JSON.stringify([mockPostSummary]);
      }
      if (filePath.includes('topics.json')) {
        return JSON.stringify([mockTopic]);
      }
      return `
      ---
      id: ${mockPost.id}
      title: ${mockPost.title}
      date: "${mockPost.date}"
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
        if (filePath.includes('posts.json')) {
          return JSON.stringify([
            {
              id: 'post1',
              title: 'Post 1',
              date: '2024-01-01',
              summary: 'Summary 1',
              topics: [{ id: 'react', name: 'React', color: 'blue' }],
              thumbnail: '/thumb1.jpg',
            },
            {
              id: 'post2',
              title: 'Post 2',
              date: '2024-01-01',
              summary: 'Summary 2',
              topics: [{ id: 'nextjs', name: 'Next.js', color: 'green' }],
              thumbnail: '/thumb2.jpg',
            },
            {
              id: 'post3',
              title: 'Post 3',
              date: '2024-01-02',
              summary: 'Summary 3',
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
        if (filePath.includes('posts.json')) {
          return JSON.stringify([mockPostSummary]);
        }
        return 'Some markdown content';
      });

      const result = await getSortedPostsData('fr', 'non_existing_topic');
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

    it('falls back to post summary when markdown files do not exist', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => p.includes('posts.json'));
      const result = await getSortedPostsData('en');
      expect(result).toHaveLength(1);
      expect(result[0].readingTime).toBeDefined();
    });

    it('uses fallback markdown path and reuses cached reading time between cache keys', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
        if (p.includes('/fr/posts.json')) return true;
        if (p.includes('/fr/fallback-post.md')) return false;
        if (p.includes('/en/fallback-post.md')) return true;
        return false;
      });

      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('/fr/posts.json')) {
          return JSON.stringify([
            {
              id: 'fallback-post',
              title: 'Fallback Post',
              date: '2024-01-10',
              summary: 'Fallback summary',
              topics: [{ id: 'react', name: 'React', color: 'blue' }],
              thumbnail: '/thumb.jpg',
            },
          ]);
        }
        if (filePath.includes('/en/fallback-post.md')) {
          return `---
title: Fallback Post
---
Fallback markdown content`;
        }
        return '';
      });

      const first = await getSortedPostsData('fr');
      const second = await getSortedPostsData('fr', 'react');

      expect(first).toHaveLength(1);
      expect(second).toHaveLength(1);

      const fallbackFileChecks = (fs.existsSync as jest.Mock).mock.calls
        .map(call => call[0] as string)
        .filter(p => p.includes('/en/fallback-post.md'));

      expect(fallbackFileChecks).toHaveLength(1);
    });

    it('handles malformed posts.json gracefully', async () => {
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('posts.json')) {
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

  describe('getPostData', () => {
    it('uses localizedPath if it exists', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => p.includes('en/mock-post.md'));
      const result = await getPostData('mock-post', 'en');
      expect(result).toEqual(mockPost);
      expect(path.join).toHaveBeenCalledWith(expect.anything(), 'en', 'mock-post.md');
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('en/mock-post.md'));
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('en/mock-post.md'), 'utf8');
    });

    it('uses fallbackPath if localizedPath does not exist', async () => {
      const mockedJoin = require('path').join as jest.Mock;
      mockedJoin.mockImplementation((...args: string[]) => {
        const joinedPath = args.join('/');
        if (joinedPath.includes('/fr/mock-post.md')) {
          return 'localized/fr/mock-post.md';
        }
        if (joinedPath.includes('/en/mock-post.md')) {
          return 'fallback/en/mock-post.md';
        }
        return joinedPath;
      });
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
        if (p === 'localized/fr/mock-post.md') return false;
        if (p === 'fallback/en/mock-post.md') return true;
        return false;
      });
      const result = await getPostData('mock-post', 'fr');
      expect(result).toEqual(mockPost);
      expect(mockedJoin).toHaveBeenCalledWith(expect.stringContaining('content/posts'), 'fr', 'mock-post.md');
      expect(mockedJoin).toHaveBeenCalledWith(expect.stringContaining('content/posts'), 'en', 'mock-post.md');
      expect(fs.existsSync).toHaveBeenCalledWith('localized/fr/mock-post.md');
      expect(fs.existsSync).toHaveBeenCalledWith('fallback/en/mock-post.md');
      expect(fs.readFileSync).toHaveBeenCalledWith('fallback/en/mock-post.md', 'utf8');
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
      date: "${mockPost.date}"
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
        expect.stringContaining(path.join('content', 'topics', 'en', 'topics.json')),
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

    it('returns union of IDs found across locales', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/content/posts/en/posts.json')) return true;
        if (filePath.endsWith('/content/posts/fr/posts.json')) return true;
        if (filePath.endsWith('/content/posts/de/posts.json')) return false;
        return false;
      });
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/content/posts/en/posts.json')) {
          return JSON.stringify([{ id: 'post-en' }]);
        }
        if (filePath.endsWith('/content/posts/fr/posts.json')) {
          return JSON.stringify([{ id: 'post-fr' }]);
        }
        return '';
      });

      const result = await getAllPostIds();
      expect(result).toEqual([
        { params: { id: 'post-en', locale: 'en' } },
        { params: { id: 'post-en', locale: 'fr' } },
        { params: { id: 'post-en', locale: 'de' } },
        { params: { id: 'post-fr', locale: 'en' } },
        { params: { id: 'post-fr', locale: 'fr' } },
        { params: { id: 'post-fr', locale: 'de' } },
      ]);
    });

    it('returns an empty list when directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = await getAllPostIds();
      expect(result).toEqual([]);
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/en'));
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
        if (filePath.endsWith('/content/topics/en/topics.json')) {
          return JSON.stringify(mockEnglishTopics);
        }
        if (filePath.endsWith('/content/topics/tr/topics.json')) {
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
      expect(console.error).toHaveBeenCalledWith('Error reading or parsing topics.json:', expect.any(SyntaxError));
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
        if (filePath.endsWith('/content/topics/en/topics.json')) {
          return JSON.stringify(mockEnglishTopics);
        }
        if (filePath.endsWith('/content/topics/fr/topics.json')) {
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
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/content/topics/en/topics.json'));
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('/content/topics/en/topics.json'), 'utf8');
    });

    it('returns an empty array if topics.json does not exist for any locale', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = await getAllTopicIds();
      expect(result).toEqual([]);
    });

    it('returns union of topic IDs found across locales', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/content/topics/en/topics.json')) return true;
        if (filePath.endsWith('/content/topics/fr/topics.json')) return true;
        if (filePath.endsWith('/content/topics/de/topics.json')) return false;
        return false;
      });
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/content/topics/en/topics.json')) {
          return JSON.stringify([{ id: 'react', name: 'React', color: 'red' }]);
        }
        if (filePath.endsWith('/content/topics/fr/topics.json')) {
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
        expect.stringContaining('Error reading/parsing topics.json'),
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
        filePath.includes('/content/topics/en/topics.json'),
      );
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/content/topics/en/topics.json')) {
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
});
