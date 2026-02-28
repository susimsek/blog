import React from 'react';
import { render, screen } from '@testing-library/react';
import AboutPage from '@/views/AboutPage';
import CategoryPage from '@/views/CategoryPage';
import ContactPage from '@/views/ContactPage';
import HomePage from '@/views/HomePage';
import LocaleNotFoundPage from '@/views/LocaleNotFoundPage';
import MediumPage from '@/views/MediumPage';
import PostPage from '@/views/PostPage';
import SearchPage from '@/views/SearchPage';
import SchulteTablePage from '@/views/SchulteTablePage';
import StroopTestPage from '@/views/StroopTestPage';
import TopicPage from '@/views/TopicPage';
import VisualMemoryPage from '@/views/VisualMemoryPage';
import { useAppSelector } from '@/config/store';

const layoutMock = jest.fn(({ children }: { children?: React.ReactNode }) => (
  <div data-testid="layout">{children}</div>
));
const postListMock = jest.fn((_props: unknown) => <div data-testid="post-list">post-list</div>);
const postCarouselMock = jest.fn((_props: unknown) => <div data-testid="post-carousel">post-carousel</div>);
const postDetailMock = jest.fn((_props: unknown) => <div data-testid="post-detail">post-detail</div>);
const contactInfoMock = jest.fn(() => <div data-testid="contact-info">contact-info</div>);
const thumbnailMock = jest.fn((_props: unknown) => <div data-testid="thumbnail">thumbnail</div>);
const schulteTrainerMock = jest.fn(() => <div data-testid="schulte-trainer">schulte-trainer</div>);
const stroopTrainerMock = jest.fn(() => <div data-testid="stroop-trainer">stroop-trainer</div>);
const visualMemoryTrainerMock = jest.fn(() => <div data-testid="visual-memory-trainer">visual-memory-trainer</div>);
const linkMock = jest.fn(({ children, href }: { children: React.ReactNode; href: string }) => (
  <a href={href}>{children}</a>
));
const useAppSelectorMock = useAppSelector as unknown as jest.Mock;

jest.mock('@/components/common/Layout', () => ({
  __esModule: true,
  default: (props: { children?: React.ReactNode }) => layoutMock(props),
}));

jest.mock('@/components/posts/PostList', () => ({
  __esModule: true,
  default: (props: unknown) => postListMock(props),
}));

jest.mock('@/components/posts/PostCarousel', () => ({
  __esModule: true,
  default: (props: unknown) => postCarouselMock(props),
}));

jest.mock('@/components/posts/PostDetail', () => ({
  __esModule: true,
  default: (props: unknown) => postDetailMock(props),
}));

jest.mock('@/components/common/ContactInfo', () => ({
  __esModule: true,
  default: () => contactInfoMock(),
}));

jest.mock('@/components/common/Thumbnail', () => ({
  __esModule: true,
  default: (props: unknown) => thumbnailMock(props),
}));

jest.mock('@/components/games/SchulteTableTrainer', () => ({
  __esModule: true,
  default: () => schulteTrainerMock(),
}));

jest.mock('@/components/games/StroopTestTrainer', () => ({
  __esModule: true,
  default: () => stroopTrainerMock(),
}));

jest.mock('@/components/games/VisualMemoryTrainer', () => ({
  __esModule: true,
  default: () => visualMemoryTrainerMock(),
}));

jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: (props: { children: React.ReactNode; href: string }) => linkMock(props),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string | number>) => {
      if (key === 'about.description') return `About ${String(options?.experienceYears ?? '')}`;
      if (key === 'topic.title') return `Topic ${String(options?.topic ?? '')}`;
      if (key === 'category.title') return `Category ${String(options?.category ?? '')}`;
      if (key === 'topic.meta.description') return `Topic description ${String(options?.topic ?? '')}`;
      if (key === 'category.meta.description') return `Category description ${String(options?.category ?? '')}`;
      if (key === 'topic.subtitle') return `Topic subtitle ${String(options?.topic ?? '')}`;
      if (key === 'category.subtitle') return `Category subtitle ${String(options?.category ?? '')}`;
      if (key === 'topic.no_posts') return `No topic posts ${String(options?.topic ?? '')}`;
      if (key === 'category.no_posts') return `No category posts ${String(options?.category ?? '')}`;
      return key;
    },
  }),
}));

jest.mock('@/config/store', () => ({
  useAppSelector: jest.fn(),
}));

const layoutPosts = [{ id: 'layout-post', title: 'Layout', publishedDate: '2025-01-01' }];
const topics = [{ id: 'react', name: 'React', color: '#fff' }];
const posts = [
  {
    id: 'post-1',
    title: 'Post 1',
    summary: 'Summary',
    searchText: 'summary post 1',
    publishedDate: '2025-01-01',
    readingTimeMin: 3,
    thumbnail: null,
  },
];

describe('View pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppSelectorMock.mockImplementation((selector: (state: { postsQuery: { query: string } }) => unknown) =>
      selector({ postsQuery: { query: ' react ' } }),
    );
  });

  it('renders AboutPage with person schema and contact section', () => {
    render(<AboutPage layoutPosts={layoutPosts} topics={topics} preFooterTopTopics={topics} />);

    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('contact-info')).toBeInTheDocument();
    expect(document.querySelector('script[type="application/ld+json"]')).toHaveTextContent('"@type":"Person"');
  });

  it('renders ContactPage with contact schema', () => {
    render(<ContactPage layoutPosts={layoutPosts} topics={topics} preFooterTopTopics={topics} />);

    expect(screen.getByTestId('contact-info')).toBeInTheDocument();
    expect(document.querySelector('script[type="application/ld+json"]')).toHaveTextContent('"@type":"ContactPage"');
  });

  it('renders HomePage with carousel, post list, and website schema', () => {
    render(<HomePage posts={posts} topics={topics} locale="en" />);

    expect(screen.getByTestId('post-carousel')).toBeInTheDocument();
    expect(screen.getByTestId('post-list')).toBeInTheDocument();
    expect(document.querySelector('script[type="application/ld+json"]')).toHaveTextContent('"@type":"WebSite"');
  });

  it('renders MediumPage and passes medium posts to PostList', () => {
    render(<MediumPage mediumPosts={posts} layoutPosts={layoutPosts} topics={topics} preFooterTopTopics={topics} />);

    expect(postListMock).toHaveBeenCalledWith(expect.objectContaining({ posts }));
    expect(document.querySelector('script[type="application/ld+json"]')).toHaveTextContent('"@type":"WebSite"');
  });

  it('renders SearchPage with trimmed query from store', () => {
    render(<SearchPage posts={posts} topics={topics} />);

    expect(screen.getByText('search.subtitle')).toBeInTheDocument();
    expect(postListMock).toHaveBeenCalledWith(expect.objectContaining({ posts, showLikes: true }));
  });

  it('renders CategoryPage with breadcrumb and collection schema', () => {
    render(
      <CategoryPage
        category={{ id: 'frontend', name: 'Frontend', color: '#fff' }}
        posts={posts}
        layoutPosts={layoutPosts}
        topics={topics}
        preFooterTopTopics={topics}
        locale="en"
      />,
    );

    expect(screen.getByText('Category Frontend')).toBeInTheDocument();
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(2);
  });

  it('renders TopicPage with breadcrumb and collection schema', () => {
    render(
      <TopicPage
        topic={{ id: 'react', name: 'React', color: '#fff' }}
        posts={posts}
        layoutPosts={layoutPosts}
        topics={topics}
        preFooterTopTopics={topics}
        locale="en"
      />,
    );

    expect(screen.getByText('Topic React')).toBeInTheDocument();
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(2);
  });

  it('renders PostPage with json-ld scripts and resolved content', () => {
    render(
      <PostPage
        locale="en"
        post={{
          id: 'post-1',
          title: 'Post Title',
          summary: 'Summary',
          searchText: 'summary post title',
          publishedDate: '2025-01-01',
          readingTimeMin: 4,
          thumbnail: null,
          topics,
          contentHtml: '<p>Hello</p>',
        }}
        relatedPosts={posts}
        previousPost={{ id: 'prev', title: 'Prev' }}
        nextPost={{ id: 'next', title: 'Next' }}
        layoutPosts={layoutPosts}
        preFooterTopTopics={topics}
      />,
    );

    expect(screen.getByTestId('post-detail')).toBeInTheDocument();
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(2);
    expect(postDetailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        post: expect.objectContaining({ contentHtml: '<p>Hello</p>' }),
      }),
    );
  });

  it('renders PostPage defaults without thumbnail/category and includes image/category metadata when provided', () => {
    render(
      <PostPage
        locale="tr"
        post={{
          id: 'post-2',
          title: 'Rich Post',
          summary: 'Rich Summary',
          searchText: 'rich summary post',
          publishedDate: '2025-02-01',
          updatedDate: '2025-02-02',
          readingTimeMin: 5,
          thumbnail: '/images/rich-post.jpg',
          topics,
          category: { id: 'programming', name: 'Programming', color: 'blue' },
          contentHtml: '<p>Rich content</p>',
        }}
      />,
    );

    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
      node => node.textContent ?? '',
    );

    expect(scripts[0]).toContain('"articleSection":"Programlama"');
    expect(scripts[0]).toContain('"image"');
    expect(scripts[1]).toContain('categories/programming');
    expect(postDetailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        relatedPosts: [],
        previousPost: null,
        nextPost: null,
      }),
    );
  });

  it('renders SchulteTablePage, StroopTestPage, and VisualMemoryPage with thumbnails and trainers', () => {
    render(<SchulteTablePage layoutPosts={layoutPosts} topics={topics} preFooterTopTopics={topics} />);
    render(<StroopTestPage layoutPosts={layoutPosts} topics={topics} preFooterTopTopics={topics} />);
    render(<VisualMemoryPage layoutPosts={layoutPosts} topics={topics} preFooterTopTopics={topics} />);

    expect(screen.getAllByTestId('thumbnail').length).toBeGreaterThan(2);
    expect(screen.getByTestId('schulte-trainer')).toBeInTheDocument();
    expect(screen.getByTestId('stroop-trainer')).toBeInTheDocument();
    expect(screen.getByTestId('visual-memory-trainer')).toBeInTheDocument();
  });

  it('renders the locale not found page with a localized home link', () => {
    render(<LocaleNotFoundPage locale="tr" />);

    expect(screen.getByText('404.header')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '404.backToHome' })).toHaveAttribute('href', '/tr');
  });
});
