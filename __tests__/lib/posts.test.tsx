import { getAllPostIds, getSortedPostsData, makePostProps, makePostDetailProps, getPostData } from '@/lib/posts';
import fs from 'fs';
import { GetStaticPropsContext } from 'next';
import path from 'path';

// Mock `fs` module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
}));

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
          topics: ['React', 'Next.js'],
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
          topics: ['React', 'Next.js'],
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
          topics: ['React', 'Next.js'],
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
          topics: ['React', 'Next.js'],
        },
        content: 'Content 4',
      };
    }
    return {
      data: {
        id: 'mock-post',
        title: 'Mock Post Title',
        date: '2024-01-01',
        summary: 'Mock summary',
        topics: ['React', 'Next.js'],
      },
      content: 'Mock Markdown Content',
    };
  }),
);

// Mock `remark` and `remark-html`
jest.mock('remark', () => ({
  remark: jest.fn().mockReturnValue({
    use: jest.fn().mockReturnThis(),
    process: jest.fn().mockResolvedValue({
      toString: jest.fn().mockReturnValue('<p>Mocked HTML Content</p>'),
    }),
  }),
}));

jest.mock('remark-html', () => jest.fn());

// Mock config
jest.mock('@/lib/getStatic', () => ({
  getI18nProps: jest.fn().mockResolvedValue({
    _nextI18Next: {
      initialLocale: 'en',
      ns: ['common', 'post'],
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
      id: mock-post
      title: Mock Post Title
      date: "2024-01-01"
      summary: Mock summary
      topics: ["React", "Next.js"]
      ---
      # Mock Markdown Content
    `);
    (fs.readdirSync as jest.Mock).mockReturnValue(['mock-post.md']);
  });

  describe('getSortedPostsData', () => {
    it('returns sorted posts data', () => {
      const result = getSortedPostsData('en');
      expect(result).toEqual([
        {
          id: 'mock-post',
          title: 'Mock Post Title',
          date: '2024-01-01',
          summary: 'Mock summary',
          topics: ['React', 'Next.js'],
        },
      ]);
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
    topics: ["React"]
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
    topics: ["Next.js"]
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
    topics: ["React", "Next.js"]
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
    topics: ["JavaScript"]
    ---
    # Content 4
    `;
        }
        return '';
      });

      const result = getSortedPostsData('en');

      // Expect posts to be sorted by date in descending order
      expect(result).toEqual([
        { id: 'post3', title: 'Post 3', date: '2024-01-02', summary: 'Summary 3', topics: ['React', 'Next.js'] },
        { id: 'post4', title: 'Post 4', date: '2024-01-01', summary: 'Summary 4', topics: ['React', 'Next.js'] },
        { id: 'post2', title: 'Post 2', date: '2024-01-01', summary: 'Summary 2', topics: ['React', 'Next.js'] },
        { id: 'post1', title: 'Post 1', date: '2024-01-01', summary: 'Summary 1', topics: ['React', 'Next.js'] },
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

      expect(result).toEqual([
        {
          id: 'mock-post',
          title: 'Mock Post Title',
          date: '2024-01-01',
          summary: 'Mock summary',
          topics: ['React', 'Next.js'],
        },
      ]);

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
      expect(result).toEqual({
        id: 'mock-post',
        title: 'Mock Post Title',
        date: '2024-01-01',
        summary: 'Mock summary',
        topics: ['React', 'Next.js'],
        contentHtml: '<p>Mocked HTML Content</p>',
      });

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
      expect(result).toEqual({
        id: 'mock-post',
        title: 'Mock Post Title',
        date: '2024-01-01',
        summary: 'Mock summary',
        topics: ['React', 'Next.js'],
        contentHtml: '<p>Mocked HTML Content</p>',
      });

      // Verify `path.join` was called correctly
      expect(mockedJoin).toHaveBeenCalledWith(expect.stringContaining('content/posts'), 'fr', 'mock-post.md');
      expect(mockedJoin).toHaveBeenCalledWith(expect.stringContaining('content/posts'), 'en', 'mock-post.md');

      // Verify `fs.existsSync` was called for both paths
      expect(fs.existsSync).toHaveBeenCalledWith('localized/fr/mock-post.md');
      expect(fs.existsSync).toHaveBeenCalledWith('fallback/en/mock-post.md');

      // Verify `fs.readFileSync` was only called for the fallback
      expect(fs.readFileSync).toHaveBeenCalledWith('fallback/en/mock-post.md', 'utf8');
    });

    it('throws an error if neither localizedPath nor fallbackPath exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(getPostData('mock-post', 'de')).rejects.toThrow(
        'Post "mock-post" not found in "de" or fallback "en".',
      );

      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('de'));
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('en'));
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

  describe('makePostProps', () => {
    it('returns props with default namespace', async () => {
      const context: GetStaticPropsContext = {
        params: { locale: 'en' },
      };

      const result = await makePostProps()(context); // `ns` defaults to []
      expect(result.props._nextI18Next?.initialLocale).toBe('en');
      expect(result.props.posts).toEqual([
        {
          id: 'mock-post',
          title: 'Mock Post Title',
          date: '2024-01-01',
          summary: 'Mock summary',
          topics: ['React', 'Next.js'],
        },
      ]);
    });

    it('returns props for post list', async () => {
      const context: GetStaticPropsContext = {
        params: { locale: 'en' },
      };
      const result = await makePostProps(['common', 'post'])(context);
      expect(result).toEqual({
        props: {
          _nextI18Next: {
            initialLocale: 'en',
            ns: ['common', 'post'],
          },
          posts: [
            {
              id: 'mock-post',
              title: 'Mock Post Title',
              date: '2024-01-01',
              summary: 'Mock summary',
              topics: ['React', 'Next.js'],
            },
          ],
        },
      });
    });

    it('uses default locale when locale is missing', async () => {
      const context: GetStaticPropsContext = {
        params: {},
      };
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
      const result = await makePostProps(['common', 'post'])(context);
      expect(result.props._nextI18Next).toEqual({
        initialLocale: 'en',
        ns: ['common', 'post'],
      });
    });
  });

  describe('makePostDetailProps', () => {
    it('returns props with default namespace', async () => {
      const context: GetStaticPropsContext = {
        params: { id: 'mock-post', locale: 'en' },
      };

      const result = await makePostDetailProps()(context); // `ns` defaults to []
      expect(result.props._nextI18Next?.initialLocale).toBe('en');
      expect(result.props.post).toEqual({
        id: 'mock-post',
        title: 'Mock Post Title',
        date: '2024-01-01',
        summary: 'Mock summary',
        topics: ['React', 'Next.js'],
        contentHtml: '<p>Mocked HTML Content</p>',
      });
    });

    it('returns props for a specific post', async () => {
      const context: GetStaticPropsContext = {
        params: { id: 'mock-post', locale: 'en' },
      };
      const result = await makePostDetailProps(['common', 'post'])(context);
      expect(result).toEqual({
        props: {
          _nextI18Next: {
            initialLocale: 'en',
            ns: ['common', 'post'],
          },
          post: {
            id: 'mock-post',
            title: 'Mock Post Title',
            date: '2024-01-01',
            summary: 'Mock summary',
            topics: ['React', 'Next.js'],
            contentHtml: '<p>Mocked HTML Content</p>',
          },
        },
      });
    });

    it('uses default locale when locale is missing', async () => {
      const context: GetStaticPropsContext = {
        params: { id: 'mock-post' }, // `locale` missing
      };

      const result = await makePostDetailProps(['common', 'post'])(context);

      expect(result.props._nextI18Next?.initialLocale).toBe('en'); // Default locale
      expect(result.props.post.id).toBe('mock-post');
    });

    it('returns props with default values when id is missing', async () => {
      const context: GetStaticPropsContext = {
        params: { locale: 'en' }, // `id` yok
      };

      const result = await makePostDetailProps(['common', 'post'])(context);

      expect(result.props).toBeDefined();
      expect(result.props._nextI18Next?.initialLocale).toBe('en');
      expect(result.props.post).toEqual({
        id: 'mock-post',
        title: 'Mock Post Title',
        date: '2024-01-01',
        summary: 'Mock summary',
        topics: ['React', 'Next.js'],
        contentHtml: '<p>Mocked HTML Content</p>',
      });
    });
  });
});
