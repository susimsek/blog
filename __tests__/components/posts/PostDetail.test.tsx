import { fireEvent, screen, waitFor } from '@testing-library/react';
import { mockPost, mockPostWithoutContent } from '@tests/__mocks__/mockPostData';
import { registerDynamicMock } from '@tests/utils/dynamicMockRegistry';
import { renderWithProviders } from '@tests/utils/renderWithProviders';

let PostDetail: typeof import('@/components/posts/PostDetail').default;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { date?: string }) => {
      if (typeof options?.date === 'string') {
        return `${key} ${options.date}`;
      }
      return key;
    },
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

jest.mock('@/components/posts/PostHit', () => ({
  __esModule: true,
  default: () => <div data-testid="post-hit" />,
}));

jest.mock('@/components/posts/PostToc', () => ({
  __esModule: true,
  default: () => <div data-testid="post-toc" />,
}));

jest.mock('@/components/common/ReadingProgress', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/common/BackToTop', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/posts/PostAuthorBox', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/posts/RelatedPosts', () => ({
  __esModule: true,
  default: () => null,
}));

describe('PostDetail Component', () => {
  beforeAll(() => {
    const markdownRenderer = jest.requireMock('@/components/common/MarkdownRenderer');
    registerDynamicMock('MarkdownRenderer', markdownRenderer);
    registerDynamicMock('@/components/common/MarkdownRenderer', markdownRenderer);
    PostDetail = require('@/components/posts/PostDetail').default;
  });

  const setup = (post = mockPost) => renderWithProviders(<PostDetail post={post} />);

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders the post title', () => {
    setup();
    const titleElement = screen.getByRole('heading', { level: 1, name: mockPost.title });
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass('fw-bold');
  });

  it('renders published and updated post dates', () => {
    setup();
    const dateElements = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && content.includes('December 3, 2024');
    });
    expect(screen.getByText('common.postMeta.published')).toBeInTheDocument();
    expect(screen.getByText('common.postMeta.updated')).toBeInTheDocument();
    expect(screen.getByText('common.postMeta.readingTime')).toBeInTheDocument();
    expect(dateElements).toHaveLength(2);
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
    expect(thumbnailElement).toHaveAttribute('src', expect.stringContaining(mockPost.thumbnail!));
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

  it('renders updated notice after article when updatedDate differs from published date', () => {
    const updatedPost = {
      ...mockPost,
      updatedDate: '2025-01-05',
    };

    setup(updatedPost);
    expect(screen.getByText('post.updatedNoticeLabel')).toBeInTheDocument();
    const updatedDateElement = screen.getByText('January 5, 2025', { selector: 'time' });
    expect(updatedDateElement).toBeInTheDocument();
    expect(updatedDateElement).toHaveAttribute('datetime', '2025-01-05');
  });

  it('does not render updated notice when updatedDate is missing or same as published date', () => {
    setup();
    expect(screen.queryByText(content => content.startsWith('post.updatedNotice'))).not.toBeInTheDocument();
  });

  it('renders category breadcrumb, adjacent navigation, and copies the share link', async () => {
    const post = {
      ...mockPost,
      category: { id: 'Frontend', name: 'Frontend' },
    };

    renderWithProviders(
      <PostDetail
        post={post}
        previousPost={{ id: 'prev-post', title: 'Previous post' }}
        nextPost={{ id: 'next-post', title: 'Next post' }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Frontend' })).toHaveAttribute('href', '/en/categories/frontend');
    expect(screen.getByRole('link', { name: /post.navigation.previous/i })).toHaveAttribute(
      'href',
      '/en/posts/prev-post',
    );
    expect(screen.getByRole('link', { name: /post.navigation.next/i })).toHaveAttribute('href', '/en/posts/next-post');

    fireEvent.click(screen.getByRole('button', { name: 'post.share.copyLink' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/en/posts/1'));
      expect(screen.getByRole('button', { name: 'post.share.copied' })).toBeInTheDocument();
    });
  });

  it('renders raw updated date, no thumbnail, and single-side navigation when metadata is sparse', () => {
    const sparsePost = {
      ...mockPost,
      thumbnail: null,
      topics: undefined,
      category: undefined,
      updatedDate: 'not-a-date',
      contentHtml: 'Plain intro without headings',
    };

    renderWithProviders(
      <PostDetail post={sparsePost} previousPost={{ id: 'prev-post', title: 'Previous post' }} nextPost={null} />,
    );

    expect(screen.queryByAltText(sparsePost.title)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Frontend' })).not.toBeInTheDocument();
    expect(screen.getByText('not-a-date')).toBeInTheDocument();
    expect(document.querySelector('.post-navigation-grid')).toHaveClass('has-only-previous');
  });

  it('does not treat tilde code fences as real headings', () => {
    const post = {
      ...mockPost,
      contentHtml: '~~~md\n## In code\n~~~\n\n### Actual section\nBody',
    };

    setup(post);
    const markdownElements = screen.getAllByTestId('markdown-renderer');
    expect(markdownElements).toHaveLength(2);
    expect(markdownElements[0]).toHaveTextContent('~~~md');
    expect(markdownElements[1]).toHaveTextContent('### Actual section');
  });
});
