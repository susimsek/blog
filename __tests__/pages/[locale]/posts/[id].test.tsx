import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@/config/store';
import PostPage from '@/pages/[locale]/posts/[id]';
import '@testing-library/jest-dom';
import { useTranslation } from 'next-i18next';
import { Post } from '@/types/posts';
import { getStaticPaths } from '@/pages/[locale]/posts/[id]';
import { GetStaticPropsContext } from 'next';

const mockPost: Post = {
  id: '1',
  title: 'Mocked Post',
  summary: 'This is a mocked post summary.',
  contentHtml: '<p>Mocked HTML content</p>',
  date: '2024-01-01',
  topics: ['React', 'Next.js'],
};

// Mock `next/router`
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    query: { id: '1', locale: 'en' },
    route: '/posts/1',
    pathname: '/posts/1',
    asPath: '/posts/1',
    replace: jest.fn(),
  }),
}));

// Mock `next-i18next`
jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(),
}));

beforeEach(() => {
  (useTranslation as jest.Mock).mockReturnValue({
    t: (key: string) => key, // Mock translation function
  });
});

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <i data-testid={`font-awesome-icon-${icon}`} />,
}));

// Mock `PostDetail` component
jest.mock('@/components/posts/PostDetail', () => ({
  __esModule: true,
  default: ({ post }: { post: Post }) => (
    <div data-testid="post-detail">
      <h1>{post.title}</h1>
      <p>{post.summary}</p>
    </div>
  ),
}));

// Mock `makePostDetailProps` function
jest.mock('@/lib/posts', () => ({
  makePostDetailProps: jest.fn().mockImplementation(() => async (context: GetStaticPropsContext) => {
    const id = context?.params?.id as string;
    const mockedPosts = {
      '1': {
        id: '1',
        title: 'Mocked Post',
        summary: 'This is a mocked post summary.',
        contentHtml: '<p>Mocked HTML content</p>',
        date: '2024-01-01',
        topics: ['React', 'Next.js'],
      },
      '2': {
        id: '2',
        title: 'Another Mocked Post',
        summary: 'Summary for another mocked post.',
        contentHtml: '<p>Another mocked HTML content</p>',
        date: '2024-01-02',
        topics: ['TypeScript', 'Testing'],
      },
    };

    return {
      props: {
        post: mockedPosts[id],
      },
    };
  }),
  getAllPostIds: jest
    .fn()
    .mockReturnValue([{ params: { id: '1', locale: 'en' } }, { params: { id: '2', locale: 'en' } }]),
}));

describe('Post Page', () => {
  it('renders the post details correctly', () => {
    render(
      <Provider store={store}>
        <PostPage post={mockPost} />
      </Provider>,
    );

    // Verify content
    expect(screen.getByTestId('post-detail')).toBeInTheDocument();
    expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    expect(screen.getByText(mockPost.summary)).toBeInTheDocument();
  });
});

describe('getStaticPaths', () => {
  it('returns all post IDs for static paths', async () => {
    const result = await getStaticPaths();

    expect(result).toEqual({
      paths: [{ params: { id: '1', locale: 'en' } }, { params: { id: '2', locale: 'en' } }],
      fallback: false,
    });
  });
});
