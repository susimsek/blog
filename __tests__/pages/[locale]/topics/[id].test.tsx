import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@/config/store';
import TopicPage, { getStaticPaths } from '@/pages/[locale]/topics/[id]';
import { Topic, PostSummary } from '@/types/posts';
import '@testing-library/jest-dom';
import { useTranslation } from 'next-i18next';

// Mock `next/router`
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    query: { id: '1', locale: 'en' },
    route: '/topics/1',
    pathname: '/topics/1',
    asPath: '/topics/1',
    replace: jest.fn(),
  }),
}));

// Mock `next/head`
jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock `next-i18next`
jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(),
}));

// Mock FontAwesome icons
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <i data-testid={`font-awesome-icon-${icon}`} />,
}));

// Mock `PostList` component
jest.mock('@/components/posts/PostList', () => ({
  __esModule: true,
  default: ({ posts, noPostsFoundMessage }: { posts: PostSummary[]; noPostsFoundMessage: string }) => (
    <div data-testid="post-list">
      {posts.length > 0 ? (
        posts.map(post => (
          <div key={post.id} data-testid="post">
            <h2>{post.title}</h2>
          </div>
        ))
      ) : (
        <p>{noPostsFoundMessage}</p>
      )}
    </div>
  ),
}));

// Mock the posts and topics functions
jest.mock('@/lib/posts', () => ({
  makeTopicProps: jest.fn().mockImplementation(() => async (context: any) => {
    const topicId = (context?.params?.id as string) || '';

    const mockedTopics = {
      '1': { id: '1', name: 'React', color: 'blue' },
      '2': { id: '2', name: 'Next.js', color: 'green' },
    };

    const mockedPosts = {
      '1': [
        {
          id: '1',
          title: 'React Basics',
          date: '2024-01-01',
          summary: 'Learn the basics of React.',
          topics: [{ id: '1', name: 'React', color: 'blue' }],
        },
      ],
      '2': [
        {
          id: '2',
          title: 'Next.js Introduction',
          date: '2024-02-01',
          summary: 'Intro to Next.js.',
          topics: [{ id: '2', name: 'Next.js', color: 'green' }],
        },
      ],
    };

    const topic = mockedTopics[topicId] || null;
    const posts = mockedPosts[topicId] || [];

    if (!topic) {
      return { notFound: true };
    }

    return {
      props: {
        topic,
        posts,
      },
    };
  }),

  getAllTopicIds: jest
    .fn()
    .mockReturnValue([{ params: { id: '1', locale: 'en' } }, { params: { id: '2', locale: 'en' } }]),
}));

// Helper function
const renderTopicPage = (topic: Topic, posts: PostSummary[]) => {
  render(
    <Provider store={store}>
      <TopicPage topic={topic} posts={posts} />
    </Provider>,
  );
};

// Mock translations
beforeEach(() => {
  (useTranslation as jest.Mock).mockReturnValue({
    t: (key: string) => key, // Mock translation function
  });
});

// Mock data
const mockTopic: Topic = {
  id: '1',
  name: 'React',
  color: 'blue',
};

const mockPosts: PostSummary[] = [
  {
    id: '1',
    title: 'React Basics',
    date: '2024-01-01',
    summary: 'Learn the basics of React.',
    topics: [{ id: '1', name: 'React', color: 'blue' }],
  },
];

describe('TopicPage', () => {
  it('renders correctly with posts', () => {
    renderTopicPage(mockTopic, mockPosts);

    // Check header elements
    expect(screen.getByRole('heading', { name: 'topic.title' })).toBeInTheDocument();
    expect(screen.getByText('topic.subtitle')).toBeInTheDocument();

    // Check post list
    const postList = screen.getByTestId('post-list');
    expect(postList).toBeInTheDocument();
    expect(screen.getByText('React Basics')).toBeInTheDocument();
  });

  it('renders correctly without posts', () => {
    renderTopicPage(mockTopic, []);

    // Check no posts message
    expect(screen.getByText('topic.no_posts')).toBeInTheDocument();
  });

  it('sets correct meta tags', () => {
    renderTopicPage(mockTopic, mockPosts);

    const metaDescription = document.querySelector('meta[name="description"]');
    const metaKeywords = document.querySelector('meta[name="keywords"]');

    expect(metaDescription).toHaveAttribute('content', 'topic.meta.description');
    expect(metaKeywords).toHaveAttribute('content', 'topic.meta.keywords');
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
