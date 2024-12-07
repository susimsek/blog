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
import { mockPost, mockPost2 } from '../../../__mocks__/mockPostData';

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

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
      {post.contentHtml && <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />}
      {post.topics && (
        <ul>
          {post.topics.map((topic, index) => (
            <li key={index}>{topic.name}</li>
          ))}
        </ul>
      )}
    </div>
  ),
}));

// Mock `makePostDetailProps` function
jest.mock('@/lib/posts', () => ({
  makePostDetailProps: jest.fn().mockImplementation(() => async (context: GetStaticPropsContext) => {
    const id = context?.params?.id as string;
    const mockedPosts = {
      '1': mockPost,
      '2': mockPost2,
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

// Helper function for rendering the PostPage
const renderPostPage = (post: Post) => {
  render(
    <Provider store={store}>
      <PostPage post={post} />
    </Provider>,
  );
};

describe('Post Page', () => {
  it('renders the post details correctly', () => {
    renderPostPage(mockPost);

    // Verify the <h1> title
    const heading = screen.getByText('Test Post', { selector: 'h1' });
    expect(heading).toBeInTheDocument();

    // Verify post detail container
    const detailContainer = screen.getByTestId('post-detail');
    expect(detailContainer).toBeInTheDocument();

    // Verify other details
    expect(screen.getByText(mockPost.summary)).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
    expect(screen.getByText(/Test Content/i)).toBeInTheDocument();
  });

  it('renders keywords when topics are defined and non-empty', () => {
    renderPostPage(mockPost);

    const headElement = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
    expect(headElement).not.toBeNull();

    expect(headElement?.getAttribute('content')).toBe('React, Testing');
  });

  it('renders empty keywords when topics are an empty array', () => {
    const post: Post = {
      ...mockPost,
      topics: [],
    };

    renderPostPage(post);

    const headElement = document.querySelector('meta[name="keywords"]');
    expect(headElement).toBeInTheDocument();
    expect(headElement).toHaveAttribute('content', '');
  });

  it('renders empty keywords when topics are undefined', () => {
    const post: Post = {
      ...mockPost,
      topics: undefined,
      // No topics defined
    };

    renderPostPage(post);

    const headElement = document.querySelector('meta[name="keywords"]');
    expect(headElement).toBeInTheDocument();
    expect(headElement).toHaveAttribute('content', '');
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
