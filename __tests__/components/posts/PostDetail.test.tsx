import { render, screen } from '@testing-library/react';
import PostDetail from '@/components/posts/PostDetail';
import { mockPost, mockPostWithoutContent } from '@tests/__mocks__/mockPostData';

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`fa-icon-${icon}`} />,
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    asPath: '/',
    pathname: '/',
    query: { locale: 'en' },
    push: jest.fn(),
  }),
}));

jest.mock('@/components/common/MarkdownRenderer', () => {
  return jest.fn(({ content }: { content: string }) => <div data-testid="markdown-renderer">{content}</div>);
});

describe('PostDetail Component', () => {
  const setup = (post = mockPost) => render(<PostDetail post={post} />);

  it('renders the post title', () => {
    setup();
    const titleElement = screen.getByText(mockPost.title);
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
