import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@/config/store';
import Home, { getStaticProps } from '@/pages/[locale]/index';
import '@testing-library/jest-dom';
import { useTranslation } from 'next-i18next';
import { PostSummary, Topic } from '@/types/posts';
import { mockPosts, mockPostSummaries } from '../../__mocks__/mockPostData';
// Mock `next/router`
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    route: '/',
    pathname: '/',
    query: { locale: 'en' },
    asPath: '/',
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

// Mock `PostList` component
jest.mock('@/components/posts/PostList', () => ({
  __esModule: true,
  default: ({ posts }: { posts: PostSummary[] }) => (
    <div data-testid="post-list">
      {posts.map(post => (
        <div key={post.id} data-testid="post-item">
          <h3>{post.title}</h3>
          <p>{post.summary}</p>
          <p>{post.date}</p>
          {post.thumbnail && <img src={post.thumbnail} alt={post.title} />}
          {post.topics && (
            <ul>
              {post.topics.map((topic: Topic, index) => (
                <li key={index}>{topic.name}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/posts/PostCarousel', () => ({
  __esModule: true,
  default: ({ posts }: { posts: PostSummary[] }) => (
    <div data-testid="post-carousel">
      {posts.map(post => (
        <div key={post.id} data-testid="carousel-item">
          <h3>{post.title}</h3>
          <p>{post.summary}</p>
        </div>
      ))}
    </div>
  ),
}));

// Mock `makePostProps` function
jest.mock('@/lib/posts', () => ({
  makePostProps: jest.fn().mockImplementation(() => async () => ({
    props: {
      posts: mockPosts,
    },
  })),
}));

describe('Home Page', () => {
  it('renders mocked post list correctly', async () => {
    render(
      <Provider store={store}>
        <Home posts={mockPostSummaries} />
      </Provider>,
    );

    // Verify post list content
    expect(screen.getByTestId('post-list')).toBeInTheDocument();
    const postItems = screen.getAllByTestId('post-item');
    expect(postItems).toHaveLength(6);

    // Check first post details
    expect(postItems[0]).toHaveTextContent('Post 1Summary 12024-12-03');
    expect(postItems[0]).toHaveTextContent('Post 1Summary 12024-12-03');
  });

  it('renders PostCarousel and PostList components', async () => {
    render(
      <Provider store={store}>
        <Home posts={mockPostSummaries} />
      </Provider>,
    );

    // Verify carousel content
    expect(screen.getByTestId('post-carousel')).toBeInTheDocument();
    const carouselItems = screen.getAllByTestId('carousel-item');
    expect(carouselItems).toHaveLength(3); // Check for first 3 posts

    // Verify post list content
    expect(screen.getByTestId('post-list')).toBeInTheDocument();
    const postItems = screen.getAllByTestId('post-item');
    expect(postItems).toHaveLength(6);

    // Check first post details
    expect(postItems[0]).toHaveTextContent('Post 1');
    expect(postItems[0]).toHaveTextContent('Summary 1');
  });
});

describe('getStaticProps', () => {
  it('returns props with posts only', async () => {
    const context = {
      params: { locale: 'en' },
    };

    const result = await getStaticProps(context);

    expect(result).toEqual({
      props: {
        posts: mockPosts,
      },
    });
  });
});
