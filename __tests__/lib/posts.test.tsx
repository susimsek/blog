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
} from '@/lib/posts';
import fs from 'fs';
import { GetStaticPropsContext } from 'next';
import path from 'path';
import { mockPost, mockPostSummary, mockTopic, mockTopicIds, mockTopics } from '../__mocks__/mockPostData';

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
          topics: [{ name: 'Next.js', color: 'blue' }],
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
          topics: [{ name: 'Boostrap', color: 'green' }],
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
          topics: [{ name: 'Spring Boot', color: 'orange' }],
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

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(`
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
    (fs.readdirSync as jest.Mock).mockReturnValue(['mock-post.md']);
  });

  describe('getSortedPostsData', () => {
    it('returns sorted posts data', () => {
      const result = getSortedPostsData('en');
      expect(result).toEqual([mockPostSummary]);
    });

    it('filters posts by topicId', () => {
      (fs.readdirSync as jest.Mock).mockReturnValue(['post1.md', 'post2.md', 'post3.md']);
      (fs.readFileSync as jest.Mock).mockImplementation(path => {
        if (path.includes('post1.md')) {
          return `
          ---
          id: post1
          title: Post 1
          date: "2024-01-01"
          topics: [{ id: 'react', name: 'React', color: 'blue' }]
          ---
          `;
        }
        if (path.includes('post2.md')) {
          return `
          ---
          id: post2
          title: Post 2
          date: "2024-01-01"
          topics: [{ id: 'nextjs', name: 'Next.js', color: 'green' }]
          ---
          `;
        }
        return '';
      });

      const result = getSortedPostsData('en', 'react');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
    });

    it('sorts posts with the same date', () => {
      // Mock posts with the same date

      // Mock return values for `fs` functions
      (fs.readdirSync as jest.Mock).mockReturnValue(['post1.md', 'post2.md', 'post3.md', 'post4.md']);
      (fs.readFileSync as jest.Mock).mockImplementation(path => {
        if (path.includes('post1.md')) {
          return `
    ---
    id: post1
    title: Post 1
    date: "2024-01-01"
    summary: Summary 1
    topics: [{"name": "React", "color": "red"}]
    ---
    # Content 1
    `;
        }
        if (path.includes('post2.md')) {
          return `
    ---
    id: post2
    title: Post 2
    date: "2024-01-01"
    summary: Summary 2
    topics: [{ name: 'Next.js', color: 'blue' }]
    ---
    # Content 2
    `;
        }
        if (path.includes('post3.md')) {
          return `
    ---
    id: post3
    title: Post 3
    date: "2024-01-02"
    summary: Summary 3
    topics: [{ name: 'React', color: 'green' }]
    ---
    # Content 3
    `;
        }
        if (path.includes('post4.md')) {
          return `
    ---
    id: post4
    title: Post 4
    date: "2024-01-01"
    summary: Summary 4
    topics: [{"name": "Spring Boot", "color": "orange"}]
    ---
    # Content 4
    `;
        }
        return '';
      });

      const result = getSortedPostsData('en');

      // Expect posts to be sorted by date in descending order
      expect(result).toEqual([
        {
          id: 'post3',
          title: 'Post 3',
          date: '2024-01-02',
          summary: 'Summary 3',
          topics: [{ name: 'Boostrap', color: 'green' }],
        },
        {
          id: 'post4',
          title: 'Post 4',
          date: '2024-01-01',
          summary: 'Summary 4',
          topics: [{ name: 'Spring Boot', color: 'orange' }],
        },
        {
          id: 'post2',
          title: 'Post 2',
          date: '2024-01-01',
          summary: 'Summary 2',
          topics: [{ name: 'Next.js', color: 'blue' }],
        },
        {
          id: 'post1',
          title: 'Post 1',
          date: '2024-01-01',
          summary: 'Summary 1',
          topics: [{ id: 'react', name: 'React', color: 'red' }],
        },
      ]);
    });

    it('loads posts from fallback directory if locale is different', () => {
      // Mock `fs.existsSync` to simulate fallback directory exists
      (fs.existsSync as jest.Mock).mockImplementation(path => {
        if (path.includes('/fr')) return true; // Localized directory exists
        if (path.includes('/en')) return true; // Fallback directory exists
        return false;
      });

      // Mock `fs.readdirSync` to return file names for fallback directory
      (fs.readdirSync as jest.Mock).mockImplementation(path => {
        if (path.includes('/en')) {
          return ['fallback-post.md'];
        }
        return [];
      });

      const result = getSortedPostsData('fr');

      expect(result).toEqual([mockPostSummary]);

      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/en'));
      expect(fs.readdirSync).toHaveBeenCalledWith(expect.stringContaining('/en'));
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('fallback-post.md'), 'utf8');
    });

    it('filters posts matching the topicId', () => {
      // Mock `fs.existsSync` to simulate fallback directory exists
      (fs.existsSync as jest.Mock).mockImplementation(path => {
        if (path.includes('/fr')) return true; // Localized directory exists
        if (path.includes('/en')) return true; // Fallback directory exists
        return false;
      });

      // Mock `fs.readdirSync` to return file names for fallback directory
      (fs.readdirSync as jest.Mock).mockImplementation(path => {
        if (path.includes('/en')) {
          return ['fallback-post.md'];
        }
        return [];
      });

      const result = getSortedPostsData('fr', 'react');

      expect(result).toEqual([mockPostSummary]);

      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/en'));
      expect(fs.readdirSync).toHaveBeenCalledWith(expect.stringContaining('/en'));
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('fallback-post.md'), 'utf8');
    });

    it('excludes posts not matching the topicId', () => {
      // Mock `fs.existsSync` to simulate fallback directory exists
      (fs.existsSync as jest.Mock).mockImplementation(path => {
        if (path.includes('/fr')) return true; // Localized directory exists
        if (path.includes('/en')) return true; // Fallback directory exists
        return false;
      });

      // Mock `fs.readdirSync` to return file names for fallback directory
      (fs.readdirSync as jest.Mock).mockImplementation(path => {
        if (path.includes('/en')) {
          return ['fallback-post.md'];
        }
        return [];
      });

      const result = getSortedPostsData('fr', 'non_existing_topic');

      expect(result).toEqual([]);

      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/en'));
      expect(fs.readdirSync).toHaveBeenCalledWith(expect.stringContaining('/en'));
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('fallback-post.md'), 'utf8');
    });
  });

  describe('getPostData', () => {
    it('uses localizedPath if it exists', async () => {
      // Mock `fs.existsSync` to return true for localized path
      (fs.existsSync as jest.Mock).mockImplementation(path => path.includes('en/mock-post.md'));

      // Mock `fs.readFileSync` to return content for localized path

      const result = await getPostData('mock-post', 'en');

      // Assert the result
      expect(result).toEqual(mockPost);

      // Verify the localized path was used
      expect(path.join).toHaveBeenCalledWith(expect.anything(), 'en', 'mock-post.md');
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('en/mock-post.md'));
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('en/mock-post.md'), 'utf8');
    });

    it('uses fallbackPath if localizedPath does not exist', async () => {
      // Mock `path.join` to simulate paths for localized and fallback
      const mockedJoin = require('path').join as jest.Mock;
      mockedJoin.mockImplementation((...args) => {
        const joinedPath = args.join('/');
        if (joinedPath.includes('/fr/mock-post.md')) {
          return 'localized/fr/mock-post.md'; // Localized path
        }
        if (joinedPath.includes('/en/mock-post.md')) {
          return 'fallback/en/mock-post.md'; // Fallback path
        }
        return joinedPath;
      });

      // Mock `fs.existsSync` to return false for localized and true for fallback path
      (fs.existsSync as jest.Mock).mockImplementation(path => {
        if (path === 'localized/fr/mock-post.md') {
          return false; // Localized does not exist
        }
        if (path === 'fallback/en/mock-post.md') {
          return true; // Fallback exists
        }
        return false;
      });

      const result = await getPostData('mock-post', 'fr');

      // Verify the result matches the fallback content
      expect(result).toEqual(mockPost);

      // Verify `path.join` was called correctly
      expect(mockedJoin).toHaveBeenCalledWith(expect.stringContaining('content/posts'), 'fr', 'mock-post.md');
      expect(mockedJoin).toHaveBeenCalledWith(expect.stringContaining('content/posts'), 'en', 'mock-post.md');

      // Verify `fs.existsSync` was called for both paths
      expect(fs.existsSync).toHaveBeenCalledWith('localized/fr/mock-post.md');
      expect(fs.existsSync).toHaveBeenCalledWith('fallback/en/mock-post.md');

      // Verify `fs.readFileSync` was only called for the fallback
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
      jest.clearAllMocks();

      (fs.promises.readdir as jest.Mock).mockReturnValue(['mock-post.md']);

      (fs.promises.readFile as jest.Mock).mockReturnValue(`
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
    });

    it('does not collect topics if directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await getTopicData('en', 'react'); // Assuming 'react' topic id
      // Verify result is null as no topics are collected
      expect(result).toBeNull();
    });

    it('collects topics from both directory and fallbackDirectory when they exist', async () => {
      const result = await getTopicData('tr', 'react');

      expect(fs.promises.readdir).toHaveBeenCalledWith(expect.stringContaining('/content/posts/en'));
      expect(fs.promises.readdir).toHaveBeenCalledWith(expect.stringContaining('/content/posts/tr'));
      expect(result).toEqual(mockTopic);
    });

    it('collects topics from only directory when fallbackDirectory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockImplementation(path => path.includes('/en')); // fallbackDirectory missing

      const result = await getTopicData('en', 'react');

      expect(fs.promises.readdir).toHaveBeenCalledWith(expect.stringContaining('/content/posts/en'));
      expect(result).toEqual(mockTopic);
    });

    it('returns null when both directory and fallbackDirectory are empty', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValue([]); // Empty directories

      const result = await getTopicData('en', 'react');

      expect(fs.promises.readdir).toHaveBeenCalledWith(expect.stringContaining('/content/posts/en'));
      expect(result).toBeNull();
    });
  });

  describe('getAllPostIds', () => {
    it('returns all post IDs with locales', () => {
      const result = getAllPostIds();
      expect(result).toEqual([
        { params: { id: 'mock-post', locale: 'en' } },
        { params: { id: 'mock-post', locale: 'fr' } },
        { params: { id: 'mock-post', locale: 'de' } },
      ]);
    });

    it('returns an empty list when no posts are found', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = getAllPostIds();
      expect(result).toEqual([]);
    });

    it('returns an empty list when directory does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = getAllPostIds();

      expect(result).toEqual([]);
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/en'));
      expect(fs.readdirSync).not.toHaveBeenCalled();
    });

    it('handles a mix of directories with and without posts', () => {
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => path.includes('/en'));
      (fs.readdirSync as jest.Mock).mockReturnValue(['post1.md']);

      const result = getAllPostIds();

      expect(result).toEqual([
        { params: { id: 'post1', locale: 'en' } },
        { params: { id: 'post1', locale: 'fr' } },
        { params: { id: 'post1', locale: 'de' } },
      ]);

      expect(fs.existsSync).toHaveBeenCalledTimes(1);
      expect(fs.readdirSync).toHaveBeenCalledWith(expect.stringContaining('/en'));
    });
  });

  describe('getAllTopics', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const mockTopics = [
      { id: 'react', name: 'React', color: 'red' },
      { name: 'Next.js', color: 'blue' },
    ];

    it('collects topics from localized directory', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['post1.md', 'post2.md']);
      (fs.promises.readFile as jest.Mock).mockImplementation(filePath => {
        if (filePath.includes('post1.md')) {
          return `
    ---
    id: post1
    title: Post 1
    date: "2024-01-01"
    summary: Summary 1
    topics: [{"name": "React", "color": "red"}]
    ---
    # Content 1
    `;
        }
        if (filePath.includes('post2.md')) {
          return `
    ---
    id: post2
    title: Post 2
    date: "2024-01-01"
    summary: Summary 2
    topics: [{ name: 'Next.js', color: 'blue' }]
    ---
    # Content 2
    `;
        }
        return '';
      });

      const result = await getAllTopics('en');
      expect(result).toEqual(mockTopics);
      expect(fs.promises.readdir).toHaveBeenCalledWith(expect.stringContaining('/content/posts/en'));
      expect(fs.promises.readFile).toHaveBeenCalledTimes(2);
    });

    it('collects topics from fallback directory if localized directory is empty', async () => {
      (fs.existsSync as jest.Mock).mockImplementation(
        path => path.includes('/content/posts/en') || path.includes('/content/posts/en'),
      );

      (fs.promises.readdir as jest.Mock).mockImplementation(dirPath => {
        if (dirPath.includes('/content/posts/tr')) {
          return []; // Localized directory boş
        }
        if (dirPath.includes('/content/posts/en')) {
          return ['post3.md'];
        }
        return [];
      });

      (fs.promises.readFile as jest.Mock).mockReturnValue(`
  ---
  id: post3
  title: Post 3
  topics:
    - id: "vue"
      name: "Vue.js"
      color: "purple"
  ---
  `);

      const result = await getAllTopics('tr');
      expect(result).toEqual([{ name: 'Boostrap', color: 'green' }]);
      expect(fs.promises.readdir).toHaveBeenCalledWith(expect.stringContaining('/content/posts/en'));
    });

    it('returns an empty array if no topics are found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readdir as jest.Mock).mockResolvedValue([]);
      const result = await getAllTopics('en');
      expect(result).toEqual([]);
    });

    it('handles missing directories gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await getAllTopics('en');
      expect(result).toEqual([]);
      expect(fs.promises.readdir).not.toHaveBeenCalled();
      expect(fs.promises.readFile).not.toHaveBeenCalled();
    });
  });

  describe('makePostProps', () => {
    it('returns props with default namespace', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['post1.md']);
      (fs.promises.readFile as jest.Mock).mockImplementation(filePath => {
        if (filePath.includes('post1.md')) {
          return `
    ---
    id: post1
    title: Post 1
    date: "2024-01-01"
    summary: Summary 1
    topics: [{"name": "React", "color": "red"}]
    ---
    # Content 1
    `;
        }
        return '';
      });
      const context: GetStaticPropsContext = {
        params: { locale: 'en' },
      };

      const result = await makePostProps()(context); // `ns` defaults to []
      expect(result.props._nextI18Next?.initialLocale).toBe('en');
      expect(result.props.posts).toEqual([mockPostSummary]);
    });

    it('returns props for post list', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['post1.md']);
      (fs.promises.readFile as jest.Mock).mockImplementation(filePath => {
        if (filePath.includes('post1.md')) {
          return `
    ---
    id: post1
    title: Post 1
    date: "2024-01-01"
    summary: Summary 1
    topics: [{"name": "React", "color": "red"}]
    ---
    # Content 1
    `;
        }
        return '';
      });
      const context: GetStaticPropsContext = {
        params: { locale: 'en' },
      };
      const result = await makePostProps(['common', 'post'])(context);
      expect(result).toEqual({
        props: {
          _nextI18Next: {
            initialI18nStore: {},
            initialLocale: 'en',
            userConfig: {},
          },
          posts: [mockPostSummary],
          topics: mockTopics,
        },
      });
    });

    it('uses default locale when locale is missing', async () => {
      const context: GetStaticPropsContext = {
        params: {},
      };
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['post1.md']);
      (fs.promises.readFile as jest.Mock).mockImplementation(filePath => {
        if (filePath.includes('post1.md')) {
          return `
    ---
    id: post1
    title: Post 1
    date: "2024-01-01"
    summary: Summary 1
    topics: [{"name": "React", "color": "red"}]
    ---
    # Content 1
    `;
        }
        return '';
      });
      const result = await makePostProps(['common', 'post'])(context);

      expect(result.props).toBeDefined();
      expect(result.props?._nextI18Next).toBeDefined();
      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
    });

    it('returns empty list when no posts exist for the locale', async () => {
      // Mock the directory listing for both the locale and fallback
      (fs.readdirSync as jest.Mock).mockImplementation((dirPath: string) => {
        if (dirPath.includes('/fr')) return []; // No posts in 'fr' directory
        if (dirPath.includes('/en')) return []; // No posts in fallback 'en' directory
        return [];
      });

      const context: GetStaticPropsContext = {
        params: { locale: 'fr' },
      };

      const result = await makePostProps(['common', 'post'])(context);

      // Verify the posts list is empty
      expect(result.props.posts).toEqual([]); // Empty array
    });

    it('includes correct i18nProps', async () => {
      const context: GetStaticPropsContext = {
        params: { locale: 'en' },
      };
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['post1.md']);
      (fs.promises.readFile as jest.Mock).mockImplementation(filePath => {
        if (filePath.includes('post1.md')) {
          return `
    ---
    id: post1
    title: Post 1
    date: "2024-01-01"
    summary: Summary 1
    topics: [{"name": "React", "color": "red"}]
    ---
    # Content 1
    `;
        }
        return '';
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
      const context: GetStaticPropsContext = {
        params: { id: 'mock-post', locale: 'en' },
      };

      const result = await makePostDetailProps()(context); // `ns` defaults to []
      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
      expect(result.props?.post).toEqual(mockPost);
    });

    it('returns props for a specific post', async () => {
      const context: GetStaticPropsContext = {
        params: { id: 'mock-post', locale: 'en' },
      };
      const result = await makePostDetailProps(['common', 'post'])(context);
      expect(result).toEqual({
        props: {
          _nextI18Next: {
            initialI18nStore: {},
            initialLocale: 'en',
            userConfig: {},
          },
          post: mockPost,
        },
      });
    });

    it('uses default locale when locale is missing', async () => {
      const context: GetStaticPropsContext = {
        params: { id: '1' }, // `locale` missing
      };

      const result = await makePostDetailProps(['common', 'post'])(context);

      expect(result.props?._nextI18Next?.initialLocale).toBe('en'); // Default locale
      expect(result.props?.post.id).toBe('1');
    });

    it('returns props with default values when id is missing', async () => {
      const context: GetStaticPropsContext = {
        params: { locale: 'en' }, // `id` yok
      };

      const result = await makePostDetailProps(['common', 'post'])(context);

      expect(result.props).toBeDefined();
      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
      expect(result.props?.post).toEqual(mockPost);
    });

    it('returns notFound when post is undefined', async () => {
      const context: GetStaticPropsContext = {
        params: { id: 'non-existent-post', locale: 'en' },
      };

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await makePostDetailProps(['common', 'post'])(context);

      expect(result).toEqual({ notFound: true });
    });
  });

  describe('makeTopicProps', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns props with default namespace', async () => {
      (fs.promises.readdir as jest.Mock).mockReturnValue(['mock-post.md']);

      (fs.promises.readFile as jest.Mock).mockReturnValue(`
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

      const context: GetStaticPropsContext = {
        params: { locale: 'en', id: 'react' },
      };

      const result = await makeTopicProps()(context); // `ns` defaults to []
      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
    });

    it('returns props when locale and topicId are valid', async () => {
      (fs.promises.readdir as jest.Mock).mockReturnValue(['mock-post.md']);

      (fs.promises.readFile as jest.Mock).mockReturnValue(`
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

      const context: GetStaticPropsContext = {
        params: { locale: 'en', id: 'react' },
      };

      const result = await makeTopicProps(['common', 'topic'])(context);

      expect(result.props).toBeDefined();
      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
    });

    it('returns notFound: true when topic does not exist', async () => {
      const context: GetStaticPropsContext = {
        params: { locale: 'en', id: 'missing-topic' },
      };

      (fs.promises.readdir as jest.Mock).mockReturnValue(['mock-post.md']);

      (fs.promises.readFile as jest.Mock).mockReturnValue(`
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

      const result = await makeTopicProps(['common', 'topic'])(context);

      expect(result).toEqual({ notFound: true });
    });

    it('uses default locale when locale is missing', async () => {
      const context: GetStaticPropsContext = {
        params: { id: 'react' },
      };
      (fs.promises.readdir as jest.Mock).mockReturnValue(['mock-post.md']);

      (fs.promises.readFile as jest.Mock).mockReturnValue(`
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
      const result = await makeTopicProps(['common', 'topic'])(context);

      expect(result.props?._nextI18Next?.initialLocale).toBe('en');
    });

    it('returns props with default values when id is missing', async () => {
      const context: GetStaticPropsContext = {
        params: { locale: 'en' }, // `id` yok
      };

      (fs.promises.readdir as jest.Mock).mockReturnValue(['mock-post.md']);

      (fs.promises.readFile as jest.Mock).mockReturnValue(`
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
      const result = await makeTopicProps(['common', 'topic'])(context);

      expect(result).toEqual({ notFound: true });
    });
  });

  describe('getAllTopicIds', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns an empty array if directory does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = getAllTopicIds();

      expect(result).toEqual([]);
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/en'));
      expect(fs.readdirSync).not.toHaveBeenCalled();
    });

    it('returns topic IDs with locales if directory exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(['mock-post.md']);

      (fs.promises.readFile as jest.Mock).mockReturnValue(`
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

      const result = getAllTopicIds();

      expect(result).toEqual(mockTopicIds);

      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/en'));
    });
  });
});
