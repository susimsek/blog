import { render, screen } from '@testing-library/react';
import PostDetail from '@/components/posts/PostDetail';
import { mockPost, mockPostWithoutContent } from '../../__mocks__/mockPostData';

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
    const markdownElement = screen.getByTestId('markdown-renderer');
    expect(markdownElement).toBeInTheDocument();
    expect(markdownElement).toHaveTextContent(mockPost.contentHtml || '');
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
    const markdownElement = screen.getByTestId('markdown-renderer');
    expect(markdownElement).toBeInTheDocument();
    expect(markdownElement).toHaveTextContent('');
  });
});
