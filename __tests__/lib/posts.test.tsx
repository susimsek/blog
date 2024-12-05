import { getAllPostIds, getPostData, getSortedPostsData, makePostDetailProps, makePostProps } from '@/lib/posts';
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
jest.mock('gray-matter', () => {
  return jest.fn((content: string = 'Mock Markdown Content') => ({
    data: {
      id: 'mock-post',
      title: 'Mock Post Title',
      date: '2024-01-01',
      summary: 'Mock summary',
      topics: ['React', 'Next.js'],
    },
    content,
  }));
});
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
    beforeEach(() => {
      jest.clearAllMocks();

      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath.includes('mock-post.md');
      });

      (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('mock-post.md')) {
          return `
          ---
          title: Mock Post Title
          date: "2024-01-01"
          summary: Mock summary
          topics: ["React", "Next.js"]
          ---
          Mock Markdown Content
        `;
        }
        if (filePath.includes('empty-file.md')) {
          return '';
        }
        if (filePath.includes('no-front-matter.md')) {
          return 'No front matter here';
        }
        throw new Error('File not found');
      });
    });

    it('returns parsed and processed post data with valid content', async () => {
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

    it('throws an error if file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(getPostData('non-existent-post', 'en')).rejects.toThrow(
        'Post "non-existent-post" not found in "en" or fallback "en".',
      );
    });

    it('handles empty file content gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('');

      const result = await getPostData('empty-file', 'en');

      expect(result).toEqual({
        id: 'mock-post',
        title: 'Mock Post Title',
        date: '2024-01-01',
        summary: 'Mock summary',
        topics: ['React', 'Next.js'],
        contentHtml: '<p>Mocked HTML Content</p>',
      });
    });

    it('handles missing content gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(`
    ---
    title: Mock Post Title
    date: "2024-01-01"
    summary: Mock summary
    ---
  `);

      // Remark Mock
      const remarkMock = jest.spyOn(require('remark'), 'remark').mockReturnValue({
        use: jest.fn().mockReturnThis(),
        process: jest.fn().mockResolvedValue({
          toString: jest.fn().mockReturnValue(''),
        }),
      });

      const result = await getPostData('mock-post', 'en');

      expect(result).toEqual({
        id: 'mock-post',
        title: 'Mock Post Title',
        date: '2024-01-01',
        summary: 'Mock summary',
        topics: ['React', 'Next.js'],
        contentHtml: '',
      });

      remarkMock.mockRestore();
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
