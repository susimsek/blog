import { getPostData, getAllPostIds, getSortedPostsData, makePostProps, makePostDetailProps } from '@/lib/posts';
import fs from 'fs';
import { GetStaticPropsContext } from 'next';

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
  jest.fn().mockImplementation((content: string) => ({
    data: {
      id: 'mock-post',
      title: 'Mock Post Title',
      date: '2024-01-01',
      summary: 'Mock summary',
      topics: ['React', 'Next.js'],
    },
    content: 'Mock Markdown Content',
  })),
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
  });

  describe('getPostData', () => {
    it('returns parsed and processed post data', async () => {
      const result = await getPostData('mock-post', 'en');
      expect(result).toEqual({
        id: 'mock-post',
        title: 'Mock Post Title',
        date: '2024-01-01',
        summary: 'Mock summary',
        topics: ['React', 'Next.js'],
        contentHtml: '<p>Mocked HTML Content</p>',
      });
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
  });

  describe('makePostProps', () => {
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
  });

  describe('makePostDetailProps', () => {
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
  });
});
