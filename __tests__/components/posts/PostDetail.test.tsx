import { fireEvent, screen, waitFor } from '@testing-library/react';
import { mockPost, mockPostWithoutContent } from '@tests/__mocks__/mockPostData';
import { registerDynamicMock } from '@tests/utils/dynamicMockRegistry';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import { fetchPostRuntime } from '@/lib/contentApi';

let PostDetail: typeof import('@/components/posts/PostDetail').default;
const postTocMock = jest.fn((_props?: unknown) => <div data-testid="post-toc" />);
const postHitMock = jest.fn((_props?: unknown) => <div data-testid="post-hit" />);

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
  return jest.fn(({ content }: { content: string }) => (
    <div data-testid="markdown-renderer">
      {content}
      {content.includes('Jump target') ? <h2 id="jump-target">Jump target</h2> : null}
    </div>
  ));
});

jest.mock('@/components/posts/PostHit', () => ({
  __esModule: true,
  default: (props: unknown) => postHitMock(props),
}));

jest.mock('@/components/posts/PostToc', () => ({
  __esModule: true,
  default: (props: unknown) => postTocMock(props),
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

jest.mock('@/components/posts/PostComments', () => ({
  __esModule: true,
  default: () => <div data-testid="post-comments" />,
}));

jest.mock('@/lib/contentApi', () => ({
  fetchPostRuntime: jest.fn(),
}));

const fetchPostRuntimeMock = fetchPostRuntime as jest.MockedFunction<typeof fetchPostRuntime>;

describe('PostDetail Component', () => {
  beforeAll(() => {
    const markdownRenderer = jest.requireMock('@/components/common/MarkdownRenderer');
    registerDynamicMock('MarkdownRenderer', markdownRenderer);
    registerDynamicMock('@/components/common/MarkdownRenderer', markdownRenderer);
    PostDetail = require('@/components/posts/PostDetail').default;
  });

  const setup = (post = mockPost) => renderWithProviders(<PostDetail post={post} />);
  const getLastProps = (mockFn: jest.Mock) => mockFn.mock.calls.at(-1)?.[0];

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
    window.history.replaceState({}, '', '/');
    fetchPostRuntimeMock.mockReturnValue(new Promise(() => undefined));
  });

  it('renders the post title', () => {
    setup();
    const titleElement = screen.getByRole('heading', { level: 1, name: mockPost.title });
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass('fw-bold');
  });

  it('renders BlogPosting JSON-LD for the post', () => {
    setup();

    const structuredDataScript = document.querySelector('script[type="application/ld+json"]');
    expect(structuredDataScript).toBeInTheDocument();

    const structuredData = JSON.parse(structuredDataScript?.textContent ?? '{}') as {
      '@graph'?: Array<{
        '@type'?: string;
        headline?: string;
        description?: string;
        datePublished?: string;
        mainEntityOfPage?: { '@id'?: string };
        itemListElement?: Array<{ name?: string; position?: number; item?: string }>;
      }>;
    };
    const blogPosting = structuredData['@graph']?.find(item => item['@type'] === 'BlogPosting');
    const breadcrumbList = structuredData['@graph']?.find(item => item['@type'] === 'BreadcrumbList');

    expect(blogPosting).toBeDefined();
    expect(structuredData).toEqual(
      expect.objectContaining({
        '@context': 'https://schema.org',
      }),
    );
    expect(blogPosting).toEqual(
      expect.objectContaining({
        headline: mockPost.title,
        description: mockPost.summary,
        datePublished: mockPost.publishedDate,
      }),
    );
    expect(blogPosting?.mainEntityOfPage?.['@id']).toContain('/posts/1');
    expect(breadcrumbList?.itemListElement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ position: 1, name: 'common.searchSource.blog' }),
        expect.objectContaining({ position: 2, name: mockPost.title, item: expect.stringContaining('/posts/1') }),
      ]),
    );
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
    expect(blogLink).toHaveAttribute('href', '/');

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

  it.each([
    {
      description: 'splits intro and rest when a section heading exists',
      contentHtml: 'Intro paragraph.\n\n## Section Title\nSection content.',
      firstSection: 'Intro paragraph.',
      secondSection: '## Section Title',
    },
    {
      description: 'does not split headings inside code fences',
      contentHtml: '```md\n## In code\n```\n\n## Actual section\nBody',
      firstSection: '```md',
      secondSection: '## Actual section',
    },
    {
      description: 'does not treat tilde code fences as real headings',
      contentHtml: '~~~md\n## In code\n~~~\n\n### Actual section\nBody',
      firstSection: '~~~md',
      secondSection: '### Actual section',
    },
  ])('$description', ({ contentHtml, firstSection, secondSection }) => {
    setup({ ...mockPost, contentHtml });
    const markdownElements = screen.getAllByTestId('markdown-renderer');
    expect(markdownElements).toHaveLength(2);
    expect(markdownElements[0]).toHaveTextContent(firstSection);
    expect(markdownElements[1]).toHaveTextContent(secondSection);
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
    fetchPostRuntimeMock.mockResolvedValue({
      postStatus: 'success',
      commentsStatus: 'success',
      likes: 7,
      hits: 19,
      commentsTotal: 0,
      commentsThreads: [],
    });

    const post = {
      ...mockPost,
      category: { id: 'frontend', name: 'Frontend', color: 'blue' },
    };

    renderWithProviders(
      <PostDetail
        post={post}
        previousPost={{ id: 'prev-post', title: 'Previous post' }}
        nextPost={{ id: 'next-post', title: 'Next post' }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Frontend' })).toHaveAttribute('href', '/categories/frontend');
    expect(screen.getByRole('link', { name: /post.navigation.previous/i })).toHaveAttribute('href', '/posts/prev-post');
    expect(screen.getByRole('link', { name: /post.navigation.next/i })).toHaveAttribute('href', '/posts/next-post');

    fireEvent.click(screen.getByRole('button', { name: 'post.share.copyLink' }));

    await waitFor(() => {
      expect(fetchPostRuntimeMock).toHaveBeenCalledWith('en', '1');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/posts/1'));
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

  it('passes runtime engagement data to toc and hit widgets after load', async () => {
    fetchPostRuntimeMock.mockResolvedValue({
      postStatus: 'success',
      commentsStatus: 'success',
      likes: 7,
      hits: 19,
      commentsTotal: 0,
      commentsThreads: [],
    });

    setup();

    await waitFor(() => {
      expect(fetchPostRuntimeMock).toHaveBeenCalledWith('en', '1');
      expect(getLastProps(postTocMock)).toEqual(
        expect.objectContaining({
          postId: '1',
          initialLikes: 7,
          skipLikeFetch: true,
          likeLoading: false,
        }),
      );
      expect(getLastProps(postHitMock)).toEqual(
        expect.objectContaining({
          postId: '1',
          initialHits: 19,
          skipInitialFetch: true,
          initialLoading: false,
        }),
      );
    });
  });

  it('keeps side widgets in loading mode while runtime data is pending', () => {
    fetchPostRuntimeMock.mockReturnValue(new Promise(() => undefined));

    setup();

    expect(getLastProps(postTocMock)).toEqual(
      expect.objectContaining({
        initialLikes: undefined,
        skipLikeFetch: true,
        likeLoading: true,
      }),
    );
    expect(getLastProps(postHitMock)).toEqual(
      expect.objectContaining({
        initialHits: undefined,
        skipInitialFetch: true,
        initialLoading: true,
      }),
    );
  });

  it('falls back to client fetch mode when runtime loading fails', async () => {
    fetchPostRuntimeMock.mockResolvedValueOnce(null);

    setup();

    await waitFor(() => {
      expect(getLastProps(postTocMock)).toEqual(
        expect.objectContaining({
          initialLikes: undefined,
          skipLikeFetch: false,
          likeLoading: false,
        }),
      );
      expect(getLastProps(postHitMock)).toEqual(
        expect.objectContaining({
          initialHits: undefined,
          skipInitialFetch: false,
          initialLoading: false,
        }),
      );
    });
  });

  it('keeps the copy action idle when the clipboard is unavailable or rejects', async () => {
    Object.assign(navigator, { clipboard: undefined });
    const unavailable = setup();
    fireEvent.click(screen.getByRole('button', { name: 'post.share.copyLink' }));
    expect(screen.getByRole('button', { name: 'post.share.copyLink' })).toBeInTheDocument();
    unavailable.unmount();

    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockRejectedValue(new Error('denied')) } });
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'post.share.copyLink' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'post.share.copyLink' })).toBeInTheDocument());
  });

  it('scrolls to an in-article hash target and ignores malformed or missing targets', async () => {
    const scrollIntoView = jest.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    window.history.replaceState({}, '', '/posts/1#jump-target');
    const validTarget = setup({ ...mockPost, contentHtml: '## Jump target\nBody' });
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' }));
    validTarget.unmount();

    scrollIntoView.mockClear();
    window.history.replaceState({}, '', '/posts/1#%E0%A4%A');
    const malformedHashView = setup();
    expect(scrollIntoView).not.toHaveBeenCalled();
    malformedHashView.unmount();

    window.history.replaceState({}, '', '/posts/1#missing-target');
    const missingTargetView = setup();
    expect(scrollIntoView).not.toHaveBeenCalled();
    missingTargetView.unmount();
  });
});
