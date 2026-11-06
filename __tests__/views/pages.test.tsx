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
import type { Localized } from '@/i18n/settings';
import type {
  CategoryPageData,
  LayoutPageData,
  MediumPageData,
  PostPageData,
  SearchPageData,
  TopicPageData,
} from '@/lib/localizedPageData';
import type { PostSummary, Topic } from '@/types/posts';

const mockI18n = { language: 'en', resolvedLanguage: 'en' };
const mockLayout = jest.fn(({ children }: { children?: React.ReactNode }) => (
  <div data-testid="layout">{children}</div>
));
const mockPostList = jest.fn((_props: unknown) => <div data-testid="post-list">post-list</div>);
const mockPostCarousel = jest.fn((_props: unknown) => <div data-testid="post-carousel">post-carousel</div>);
const mockPostDetail = jest.fn((_props: unknown) => <div data-testid="post-detail">post-detail</div>);
const mockContactInfo = jest.fn(() => <div data-testid="contact-info">contact-info</div>);
const mockThumbnail = jest.fn((_props: unknown) => <div data-testid="thumbnail">thumbnail</div>);
const mockSchulteTrainer = jest.fn(() => <div data-testid="schulte-trainer">schulte-trainer</div>);
const mockStroopTrainer = jest.fn(() => <div data-testid="stroop-trainer">stroop-trainer</div>);
const mockVisualMemoryTrainer = jest.fn(() => <div data-testid="visual-memory-trainer">visual-memory-trainer</div>);
const mockLink = jest.fn(({ children, href }: { children: React.ReactNode; href: string }) => (
  <a href={href}>{children}</a>
));
const mockUseSearchParams = jest.fn();
const mockUseParams = jest.fn(() => ({ locale: 'en' }));

jest.mock('@/components/common/Layout', () => ({
  __esModule: true,
  default: (props: { children?: React.ReactNode }) => mockLayout(props),
}));
jest.mock('@/components/posts/PostList', () => ({
  __esModule: true,
  default: (props: unknown) => mockPostList(props),
}));
jest.mock('@/components/posts/PostCarousel', () => ({
  __esModule: true,
  default: (props: unknown) => mockPostCarousel(props),
}));
jest.mock('@/components/posts/PostDetail', () => ({
  __esModule: true,
  default: (props: unknown) => mockPostDetail(props),
}));
jest.mock('@/components/common/ContactInfo', () => ({
  __esModule: true,
  default: () => mockContactInfo(),
}));
jest.mock('@/components/common/Thumbnail', () => ({
  __esModule: true,
  default: (props: unknown) => mockThumbnail(props),
}));
jest.mock('@/components/games/SchulteTableTrainer', () => ({
  __esModule: true,
  default: () => mockSchulteTrainer(),
}));
jest.mock('@/components/games/StroopTestTrainer', () => ({
  __esModule: true,
  default: () => mockStroopTrainer(),
}));
jest.mock('@/components/games/VisualMemoryTrainer', () => ({
  __esModule: true,
  default: () => mockVisualMemoryTrainer(),
}));
jest.mock('@/components/common/Link', () => ({ __esModule: true, default: (props: never) => mockLink(props) }));
jest.mock('next/image', () => ({ __esModule: true, default: ({ alt }: { alt: string }) => <img alt={alt} /> }));
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: mockI18n,
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
jest.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useSearchParams: () => mockUseSearchParams(),
}));

const topic: Topic = { id: 'react', name: 'React', color: '#fff' };
const layoutPosts = [{ id: 'layout-post', title: 'Layout', publishedDate: '2025-01-01' }];
const summary = (id: string): PostSummary => ({
  id,
  title: `Post ${id}`,
  summary: 'Summary',
  searchText: `summary post ${id}`,
  publishedDate: '2025-01-01',
  readingTimeMin: 3,
  thumbnail: null,
  topics: [topic],
});
const layoutData: LayoutPageData = { layoutPosts, topics: [topic], preFooterTopTopics: [topic] };
const localized = <T,>(en: T, tr: T = en): Localized<T> => ({ en, tr });
const layoutContent = localized(layoutData);
const postList = [summary('post-1')];
const categoryData: CategoryPageData = {
  ...layoutData,
  category: { id: 'frontend', name: 'Frontend', color: '#fff' },
  posts: postList,
};
const topicData: TopicPageData = { ...layoutData, topic, posts: postList };
const mediumData: MediumPageData = { ...layoutData, mediumPosts: postList };
const searchData: SearchPageData = { posts: postList, topics: [topic] };
const postData: PostPageData = {
  ...layoutData,
  post: { ...summary('post-1'), contentHtml: '<p>Hello</p>' },
  relatedPosts: [],
  previousPost: null,
  nextPost: null,
};

describe('localized page views', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockI18n.resolvedLanguage = 'en';
    mockUseParams.mockReturnValue({ locale: 'en' });
    mockUseSearchParams.mockReturnValue(new URLSearchParams('q=react'));
  });

  it('renders About and Contact with their structured data and shared layout', () => {
    render(<AboutPage contentByLocale={layoutContent} />);
    expect(mockContactInfo).toHaveBeenCalled();
    expect(document.querySelector('script[type="application/ld+json"]')).toHaveTextContent('"@type":"Person"');

    render(<ContactPage contentByLocale={layoutContent} />);
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(2);
    expect(document.querySelectorAll('script[type="application/ld+json"]')[1]).toHaveTextContent(
      '"@type":"ContactPage"',
    );
  });

  it('selects the matching locale payload for home and list views', () => {
    render(
      <HomePage
        contentByLocale={localized(
          { posts: [summary('english')], topics: [topic] },
          { posts: [summary('turkish')], topics: [topic] },
        )}
      />,
    );
    expect(mockPostList).toHaveBeenLastCalledWith(expect.objectContaining({ posts: [summary('english')] }));
    expect(document.querySelector('script[type="application/ld+json"]')).toHaveTextContent('"@type":"WebSite"');

    mockI18n.resolvedLanguage = 'tr';
    mockUseParams.mockReturnValue({ locale: 'tr' });
    render(
      <HomePage
        contentByLocale={localized(
          { posts: [summary('english')], topics: [topic] },
          {
            posts: [summary('turkish')],
            topics: [topic],
          },
        )}
      />,
    );
    expect(mockPostList).toHaveBeenLastCalledWith(expect.objectContaining({ posts: [summary('turkish')] }));
  });

  it('renders Medium and Search with language-specific content', () => {
    render(<MediumPage contentByLocale={localized(mediumData)} />);
    expect(mockPostList).toHaveBeenLastCalledWith(expect.objectContaining({ posts: postList }));

    render(<SearchPage contentByLocale={localized(searchData)} />);
    expect(screen.getByText('search.subtitle')).toBeInTheDocument();
    expect(mockPostList).toHaveBeenLastCalledWith(expect.objectContaining({ posts: postList, showLikes: true }));
  });

  it('renders category and topic breadcrumbs and structured data', () => {
    render(<CategoryPage contentByLocale={localized(categoryData)} />);
    expect(screen.getByText('Category Frontend')).toBeInTheDocument();

    render(<TopicPage contentByLocale={localized(topicData)} />);
    expect(screen.getByText('Topic React')).toBeInTheDocument();
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(4);
  });

  it('resolves selected post content and related links', () => {
    render(<PostPage contentByLocale={localized(postData)} />);

    expect(screen.getByTestId('post-detail')).toBeInTheDocument();
    expect(mockPostDetail).toHaveBeenCalledWith(
      expect.objectContaining({ post: expect.objectContaining({ contentHtml: '<p>Hello</p>' }) }),
    );
  });

  it('renders the three static games and the prefixless not-found link', () => {
    render(<SchulteTablePage contentByLocale={layoutContent} />);
    render(<StroopTestPage contentByLocale={layoutContent} />);
    render(<VisualMemoryPage contentByLocale={layoutContent} />);
    expect(screen.getByTestId('schulte-trainer')).toBeInTheDocument();
    expect(screen.getByTestId('stroop-trainer')).toBeInTheDocument();
    expect(screen.getByTestId('visual-memory-trainer')).toBeInTheDocument();

    render(<LocaleNotFoundPage />);
    expect(screen.getByText('404.header')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '404.backToHome' })).toHaveAttribute('href', '/');
  });
});
