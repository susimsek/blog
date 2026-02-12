import { render, screen } from '@testing-library/react';
import { mockPost, mockPostWithoutContent } from '@tests/__mocks__/mockPostData';
import { registerDynamicMock } from '@tests/utils/dynamicMockRegistry';

let PostDetail: typeof import('@/components/posts/PostDetail').default;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`fa-icon-${icon}`} />,
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/common/MarkdownRenderer', () => {
  return jest.fn(({ content }: { content: string }) => <div data-testid="markdown-renderer">{content}</div>);
});

describe('PostDetail Component', () => {
  beforeAll(() => {
    const markdownRenderer = jest.requireMock('@/components/common/MarkdownRenderer');
    registerDynamicMock('MarkdownRenderer', markdownRenderer);
    registerDynamicMock('@/components/common/MarkdownRenderer', markdownRenderer);
    PostDetail = require('@/components/posts/PostDetail').default;
  });

  const setup = (post = mockPost) => render(<PostDetail post={post} />);

  it('renders the post title', () => {
    setup();
    const titleElement = screen.getByRole('heading', { level: 1, name: mockPost.title });
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass('fw-bold');
  });

  it('renders the post date', () => {
    setup();
    const dateElement = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && content.includes('December 3, 2024');
    });
    expect(dateElement).toBeInTheDocument();
  });

  it('renders breadcrumb with blog link and current post title', () => {
    setup();
    const blogLink = screen.getByRole('link', { name: 'common.searchSource.blog' });
    expect(blogLink).toBeInTheDocument();
    expect(blogLink).toHaveAttribute('href', '/en');

    const activeBreadcrumbItem = screen.getByText(mockPost.title, { selector: '.breadcrumb-item.active' });
    expect(activeBreadcrumbItem).toHaveAttribute('aria-current', 'page');
  });

  it('renders the post content using MarkdownRenderer', () => {
    setup();
    const markdownElements = screen.getAllByTestId('markdown-renderer');
    expect(markdownElements.length).toBeGreaterThan(0);
    expect(markdownElements.map(el => el.textContent).join('\n')).toContain(mockPost.contentHtml || '');
  });

  it('renders the topics as badges', () => {
    setup();
    (mockPost.topics || []).forEach(topic => {
      expect(screen.getByText(topic.name)).toBeInTheDocument();
    });
  });

  it('renders the thumbnail when provided', () => {
    setup();
    const thumbnailElement = screen.getByAltText(mockPost.title);
    expect(thumbnailElement).toBeInTheDocument();
    expect(thumbnailElement).toHaveAttribute('src', expect.stringContaining(encodeURIComponent(mockPost.thumbnail!)));
  });

  it('renders an empty article when contentHtml is null or undefined', () => {
    setup(mockPostWithoutContent);
    expect(screen.queryByTestId('markdown-renderer')).not.toBeInTheDocument();
  });

  it('splits intro and rest when a section heading exists', () => {
    const post = {
      ...mockPost,
      contentHtml: 'Intro paragraph.\n\n## Section Title\nSection content.',
    };

    setup(post);
    const markdownElements = screen.getAllByTestId('markdown-renderer');
    expect(markdownElements).toHaveLength(2);
    expect(markdownElements[0]).toHaveTextContent('Intro paragraph.');
    expect(markdownElements[1]).toHaveTextContent('## Section Title');
  });

  it('does not split headings inside code fences', () => {
    const post = {
      ...mockPost,
      contentHtml: '```md\n## In code\n```\n\n## Actual section\nBody',
    };

    setup(post);
    const markdownElements = screen.getAllByTestId('markdown-renderer');
    expect(markdownElements).toHaveLength(2);
    expect(markdownElements[0]).toHaveTextContent('```md');
    expect(markdownElements[1]).toHaveTextContent('## Actual section');
  });
});
