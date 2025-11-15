import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import SearchPage from '@/pages/[locale]/search';
import { useTranslation } from 'next-i18next';
import { mockPostSummaries, mockTopics } from '../../__mocks__/mockPostData';
import { makeSearchProps } from '@/lib/posts';
import type { PostSummary } from '@/types/posts';
import type { GetStaticPropsContext } from 'next';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';

const layoutSpy = jest.fn();
const postListSpy = jest.fn();

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    route: '/search',
    pathname: '/search',
    query: { q: 'Post 1' },
    asPath: '/search?q=Post+1',
    isReady: true,
  }),
}));

jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('@/hooks/useDebounce', () => jest.fn(value => value));

jest.mock('@/components/common/Layout', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => {
      layoutSpy(props);
      return <div data-testid="mock-layout">{props.children}</div>;
    },
  };
});

jest.mock('@/components/posts/PostList', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ posts, searchEnabled }: { posts: PostSummary[]; searchEnabled?: boolean }) => {
      postListSpy({ posts, searchEnabled });
      return (
        <div data-testid="post-list">
          {posts.map(post => (
            <span key={post.id}>{post.title}</span>
          ))}
        </div>
      );
    },
  };
});

jest.mock('@/lib/posts', () => {
  const actual = jest.requireActual('@/lib/posts');
  return {
    ...actual,
    makeSearchProps: jest.fn(),
  };
});

const mockAllPosts = mockPostSummaries;
const mockedUseRouter = require('next/router').useRouter as jest.Mock;

describe('Search Page', () => {
  beforeEach(() => {
    layoutSpy.mockClear();
    postListSpy.mockClear();
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, options?: Record<string, string>) => (options?.query ? `${key}:${options.query}` : key),
    });
  });

  it('renders header and filters posts by query', async () => {
    renderWithProviders(<SearchPage allPosts={mockAllPosts} topics={mockTopics} />);

    expect(screen.getByText('search.title')).toBeInTheDocument();
    expect(await screen.findByText('search.subtitle:Post 1')).toBeInTheDocument();
    expect(layoutSpy).toHaveBeenCalledWith(expect.objectContaining({ sidebarEnabled: true, searchEnabled: true }));

    expect(postListSpy).toHaveBeenCalledWith(expect.objectContaining({ posts: mockAllPosts, searchEnabled: false }));
  });

  it('passes all posts when query is missing', async () => {
    mockedUseRouter.mockReturnValueOnce({
      route: '/search',
      pathname: '/search',
      query: {},
      asPath: '/search',
      isReady: true,
    });

    renderWithProviders(<SearchPage allPosts={mockAllPosts} topics={mockTopics} />);

    await waitFor(() => expect(postListSpy).toHaveBeenCalledWith(expect.objectContaining({ posts: mockAllPosts })));
  });
});

describe('getStaticProps', () => {
  it('is created via makeSearchProps with required namespaces', () => {
    expect(makeSearchProps).toHaveBeenCalledWith(['common', 'search', 'post']);
  });
});
