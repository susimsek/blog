import React from 'react';
import { render, screen } from '@testing-library/react';
import MediumPage from '@/pages/[locale]/medium';
import { useTranslation } from 'next-i18next';
import type { PostSummary, Topic } from '@/types/posts';
import { mockPostSummaries, mockTopics } from '../../__mocks__/mockPostData';
import type { GetStaticPropsContext } from 'next';
import { makeMediumPostsProps } from '@/lib/medium';

const layoutSpy = jest.fn();
const postListSpy = jest.fn();

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    route: '/',
    pathname: '/',
    query: { locale: 'en' },
    asPath: '/',
  }),
}));

jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(),
}));

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

jest.mock('@/components/common/SEO', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ title }: { title: string }) => <div data-testid="seo" data-title={title} />,
  };
});

jest.mock('@/components/posts/PostList', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ posts }: { posts: PostSummary[] }) => {
      postListSpy({ posts });
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

jest.mock('@/components/common/Sidebar', () => ({
  __esModule: true,
  default: () => <div data-testid="sidebar" />,
}));

jest.mock('@/lib/medium', () => {
  const actual = jest.requireActual('@/lib/medium');
  return {
    ...actual,
    makeMediumPostsProps: jest.fn(),
  };
});

const mockMediumPosts: PostSummary[] = mockPostSummaries.slice(0, 2);

describe('Medium Page', () => {
  beforeEach(() => {
    layoutSpy.mockClear();
    postListSpy.mockClear();
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('renders header texts and passes posts to PostList', () => {
    render(<MediumPage posts={mockPostSummaries} topics={mockTopics} mediumPosts={mockMediumPosts} />);

    expect(screen.getByText('medium.header.title')).toBeInTheDocument();
    expect(screen.getByText('medium.header.subtitle')).toBeInTheDocument();
    expect(screen.getByTestId('post-list')).toBeInTheDocument();
    expect(postListSpy).toHaveBeenCalledWith({ posts: mockMediumPosts });
    expect(layoutSpy).toHaveBeenCalledWith(expect.objectContaining({ searchEnabled: true, sidebarEnabled: true }));
  });

  it('generates SEO metadata with translated title', () => {
    render(<MediumPage posts={mockPostSummaries} topics={mockTopics} mediumPosts={mockMediumPosts} />);
    expect(screen.getByTestId('seo')).toHaveAttribute('data-title', 'medium.title');
  });
});

describe('getStaticProps', () => {
  it('is created via makeMediumPostsProps with expected namespaces', () => {
    expect(makeMediumPostsProps).toHaveBeenCalledWith(['common', 'medium', 'post', 'topic']);
  });
});
