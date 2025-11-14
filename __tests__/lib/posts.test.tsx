import {
  getAllPostIds,
  getSortedPostsData,
  makePostProps,
  makePostDetailProps,
  getPostData,
  getTopicData,
  makeTopicProps,
  getAllTopicIds,
  getAllTopics,
  postsCache,
  postDataCache,
  topicsCache,
  postIdsCache,
  topicIdsCache,
} from '@/lib/posts';
import fs from 'fs';
import { GetStaticPropsContext } from 'next';
import path from 'path';
import { mockPost, mockPostSummary, mockTopic } from '../__mocks__/mockPostData';

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

jest.mock('next-i18next/serverSideTranslations', () => ({
  serverSideTranslations: jest.fn((locale, namespaces) => ({
    _nextI18Next: {
      initialI18nStore: {},
      initialLocale: locale,
      userConfig: {},
    },
  })),
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

// Mock config
jest.mock('@/lib/getStatic', () => ({
  getI18nProps: jest.fn().mockResolvedValue({
    _nextI18Next: {
      initialLocale: 'en',
      ns: ['common', 'post', 'topic'],
    },
  }),
}));

jest.mock('../../next-i18next.config', () => ({
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

    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string, encoding: string) => {
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
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string, encoding: string) => {
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
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string, encoding: string) => {
        if (filePath.includes('posts.json')) {
          return JSON.stringify([mockPostSummary]);
        }
        return 'Some markdown content';
      });

      const result = await getSortedPostsData('fr', 'non_existing_topic');
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
      const result = await getTopicData('en', 'react');
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
  });

  describe('makePostProps', () => {
    it('returns props with default namespace', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['post1.md']);
      const originalReadFile = (fs.promises.readFile as jest.Mock).getMockImplementation();
      (fs.promises.readFile as jest.Mock).mockImplementation((filePath: string, encoding: string) => {
        if (filePath.includes('post1.md')) {
          return Promise.resolve(`
    ---
    id: post1
    title: Post 1
    date: "2024-01-01"
    summary: Summary 1
    topics: [{"name": "React", "color": "red"}]
    ---
    # Content 1
    `);
        }
        return originalReadFile ? originalReadFile(filePath, encoding) : Promise.resolve('');
      });
      const context: GetStaticPropsContext = { params: { locale: 'en' } };
      const result = await makePostProps()(context);
      expect(result.props._nextI18Next?.initialLocale).toBe('en');
      expect(result.props.posts).toEqual([mockPostSummary]);
    });

    it('returns props for post list', async () => {
      const mockEnglishTopics = [
        { id: 'react', name: 'React', color: 'red' },
        { id: 'nextjs', name: 'Next.js', color: 'blue' },
      ];
      const mockTurkishTopics = [
        { id: 'react', name: 'React', color: 'red' },
        { id: 'nextjs', name: 'Sonraki.js', color: 'mavi' },
      ];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['post1.md']);
      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.endsWith('/content/topics/en/topics.json')) {
          return JSON.stringify(mockEnglishTopics);
        }
        if (filePath.endsWith('/content/topics/tr/topics.json')) {
          return JSON.stringify(mockTurkishTopics);
        }

        if (filePath.includes('posts.json')) {
          return JSON.stringify([mockPostSummary]);
        }
        return '';
      });
      const originalReadFile = (fs.promises.readFile as jest.Mock).getMockImplementation();
      (fs.promises.readFile as jest.Mock).mockImplementation((filePath: string, encoding: string) => {
        if (filePath.includes('post1.md')) {
          return Promise.resolve(`
  ---
  id: post1
  title: Post 1
  date: "2024-01-01"
  summary: Summary 1
  topics: [{"name": "React", "color": "red"}]
  ---
  # Content 1
  `);
        }
        return originalReadFile ? originalReadFile(filePath, encoding) : Promise.resolve('');
      });
      const context: GetStaticPropsContext = { params: { locale: 'en' } };
      const result = await makePostProps(['common', 'post'])(context);
      expect(result).toEqual({
        props: {
          _nextI18Next: {
            initialI18nStore: {},
            initialLocale: 'en',
            userConfig: {},
          },
          posts: [mockPostSummary],
          topics: [
            { color: 'red', id: 'react', name: 'React' },
            { color: 'blue', id: 'nextjs', name: 'Next.js' },
          ],
        },
      });
    });

    it('uses default locale when locale is missing', async () => {
      const context: GetStaticPropsContext = { params: {} };
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['post1.md']);
      const originalReadFile = (fs.promises.readFile as jest.Mock).getMockImplementation();
      (fs.promises.readFile as jest.Mock).mockImplementation((filePath: string, encoding: string) => {
        if (filePath.includes('post1.md')) {
          return Promise.resolve(`
    ---
    id: post1
    title: Post 1
    date: "2024-01-01"
    summary: Summary 1
    topics: [{"name": "React", "color": "red"}]
    ---
    # Content 1
    `);
        }
        return originalReadFile ? originalReadFile(filePath, encoding) : Promise.resolve('');
      });
      const result = await makePostProps(['common', 'post'])(context);
      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
    });

    it('returns empty list when no posts exist for the locale', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((dirPath: string) => {
        if (dirPath.includes('/content/topics/fr/topics.json')) return false;
        if (dirPath.includes('/content/posts/fr')) return false;
        return false;
      });
      (fs.readdirSync as jest.Mock).mockImplementation((dirPath: string) => []);
      const context: GetStaticPropsContext = { params: { locale: 'fr' } };
      const result = await makePostProps(['common', 'post'])(context);
      expect(result.props.posts).toEqual([]);
    });

    it('includes correct i18nProps', async () => {
      const context: GetStaticPropsContext = { params: { locale: 'en' } };
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['post1.md']);
      const originalReadFile = (fs.promises.readFile as jest.Mock).getMockImplementation();
      (fs.promises.readFile as jest.Mock).mockImplementation((filePath: string, encoding: string) => {
        if (filePath.includes('post1.md')) {
          return Promise.resolve(`
    ---
    id: post1
    title: Post 1
    date: "2024-01-01"
    summary: Summary 1
    topics: [{"name": "React", "color": "red"}]
    ---
    # Content 1
    `);
        }
        return originalReadFile ? originalReadFile(filePath, encoding) : Promise.resolve('');
      });
      const result = await makePostProps(['common', 'post'])(context);
      expect(result.props._nextI18Next).toEqual({
        initialI18nStore: {},
        initialLocale: 'en',
        userConfig: {},
      });
    });
  });

  describe('makePostDetailProps', () => {
    it('returns props with default namespace', async () => {
      const context: GetStaticPropsContext = { params: { id: 'mock-post', locale: 'en' } };
      const result = await makePostDetailProps()(context);
      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
      expect(result.props?.post).toEqual(mockPost);
    });

    it('returns props for a specific post', async () => {
      const context: GetStaticPropsContext = { params: { id: 'mock-post', locale: 'en' } };
      const result = await makePostDetailProps(['common', 'post'])(context);
      expect(result).toEqual({
        props: {
          _nextI18Next: {
            initialI18nStore: {},
            initialLocale: 'en',
            userConfig: {},
          },
          post: mockPost,
          posts: [mockPostSummary],
        },
      });
    });

    it('uses default locale when locale is missing', async () => {
      const context: GetStaticPropsContext = { params: { id: '1' } };
      const result = await makePostDetailProps(['common', 'post'])(context);
      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
      expect(result.props?.post.id).toBe('1');
    });

    it('returns props with default values when id is missing', async () => {
      const context: GetStaticPropsContext = { params: { locale: 'en' } };
      const result = await makePostDetailProps(['common', 'post'])(context);
      expect(result.props).toBeDefined();
      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
      expect(result.props?.post).toEqual(mockPost);
    });

    it('returns notFound when post is undefined', async () => {
      const context: GetStaticPropsContext = { params: { id: 'non-existent-post', locale: 'en' } };
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = await makePostDetailProps(['common', 'post'])(context);
      expect(result).toEqual({ notFound: true });
    });
  });

  describe('makeTopicProps', () => {
    beforeEach(() => {
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

    it('returns props with default namespace', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['mock-post.md']);
      const context: GetStaticPropsContext = { params: { locale: 'en', id: 'react' } };
      const result = await makeTopicProps()(context);
      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
    });

    it('returns props when locale and topicId are valid', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['mock-post.md']);
      const context: GetStaticPropsContext = { params: { locale: 'en', id: 'react' } };
      const result = await makeTopicProps(['common', 'topic'])(context);
      expect(result.props).toBeDefined();
      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
    });

    it('returns notFound: true when topic does not exist', async () => {
      const context: GetStaticPropsContext = { params: { locale: 'en', id: 'missing-topic' } };
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['mock-post.md']);
      const result = await makeTopicProps(['common', 'topic'])(context);
      expect(result).toEqual({ notFound: true });
    });

    it('uses default locale when locale is missing', async () => {
      const context: GetStaticPropsContext = { params: { id: 'react' } };
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['mock-post.md']);
      const result = await makeTopicProps(['common', 'topic'])(context);
      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
    });

    it('returns props with default values when id is missing', async () => {
      const context: GetStaticPropsContext = { params: { locale: 'en' } };
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['mock-post.md']);
      const result = await makeTopicProps(['common', 'topic'])(context);
      expect(result).toEqual({ notFound: true });
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
      ]);
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/content/topics/en/topics.json'));
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('/content/topics/en/topics.json'), 'utf8');
    });

    it('returns an empty array if topics.json does not exist for any locale', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = await getAllTopicIds();
      expect(result).toEqual([]);
    });

    it('handles JSON parse errors gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockImplementation(() => '{ invalid json }');
      const result = await getAllTopicIds();
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error reading or parsing topics.json'),
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
      ]);
    });
  });
});
