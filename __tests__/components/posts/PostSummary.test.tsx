import React from 'react';
import { render, screen } from '@testing-library/react';
import PostSummary from '@/components/posts/PostSummary';
import { mockPost } from '@tests/__mocks__/mockPostData';

jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => key),
  })),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string | [string, string] }) => (
    <span data-testid={`icon-${Array.isArray(icon) ? icon.join('-') : icon}`} />
  ),
}));

jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  ),
}));

jest.mock('@/components/common/Thumbnail', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img data-testid="thumbnail" src={src} alt={alt} />,
}));

jest.mock('@/components/common/DateDisplay', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <span data-testid="date-display">{date}</span>,
}));

describe('PostSummary Component', () => {
  it('renders the post title with a link', () => {
    render(<PostSummary post={mockPost} />);
    const titleLink = screen.getByText(mockPost.title);
    expect(titleLink).toBeInTheDocument();
    expect(titleLink.closest('a')).toHaveAttribute('href', `/posts/${mockPost.id}`);
  });

  it('renders the post date', () => {
    render(<PostSummary post={mockPost} />);
    const dateElement = screen.getByTestId('date-display');
    expect(dateElement).toBeInTheDocument();
    expect(dateElement).toHaveTextContent(mockPost.date);
  });

  it('renders the topics as badges', () => {
    render(<PostSummary post={mockPost} />);
    mockPost.topics?.forEach(topic => {
      const badge = screen.getByText(topic.name);
      expect(badge).toBeInTheDocument();
    });
  });

  it('renders the thumbnail with correct attributes when provided', () => {
    render(<PostSummary post={mockPost} />);
    const thumbnail = screen.getByTestId('thumbnail');

    expect(thumbnail).toBeInTheDocument();

    if (mockPost.thumbnail) {
      const expectedThumbnailPath = mockPost.thumbnail.startsWith('/') ? mockPost.thumbnail : `/${mockPost.thumbnail}`;
      expect(thumbnail).toHaveAttribute('src', expect.stringContaining(expectedThumbnailPath));
    }

    expect(thumbnail).toHaveAttribute('alt', mockPost.title);
  });

  it('renders the summary text', () => {
    render(<PostSummary post={mockPost} />);
    const summaryElement = screen.getByText(mockPost.summary);
    expect(summaryElement).toBeInTheDocument();
  });

  it('renders the "Read More" button with correct link', () => {
    render(<PostSummary post={mockPost} />);
    const button = screen.getByText('post.readMore');
    expect(button).toBeInTheDocument();
    const link = button.closest('a');
    expect(link).toHaveAttribute('href', `/posts/${mockPost.id}`);
  });

  it('handles undefined topics gracefully', () => {
    const postWithoutTopics = { ...mockPost, topics: undefined };
    render(<PostSummary post={postWithoutTopics} />);
    expect(screen.queryByText('badge')).not.toBeInTheDocument();
  });

  it('handles undefined thumbnail gracefully', () => {
    const postWithoutThumbnail = { ...mockPost, thumbnail: undefined };
    render(<PostSummary post={postWithoutThumbnail} />);
    expect(screen.queryByTestId('thumbnail')).not.toBeInTheDocument();
  });

  it('highlights matched query tokens in title and summary', () => {
    const { container } = render(<PostSummary post={mockPost} highlightQuery="Test summary" />);
    expect(container.querySelectorAll('mark')).toHaveLength(3);
  });

  it('does not highlight single-character tokens', () => {
    const { container } = render(<PostSummary post={mockPost} highlightQuery="t" />);
    expect(container.querySelector('mark')).toBeNull();
  });

  it('escapes regex special chars in highlight query', () => {
    const post = { ...mockPost, title: 'How to use C++ safely', summary: 'C++ tips' };
    const { container } = render(<PostSummary post={post} highlightQuery="C++" />);
    expect(container.querySelectorAll('mark').length).toBeGreaterThan(0);
  });

  it('uses external post link when provided', () => {
    const post = { ...mockPost, link: 'https://example.com/post' };
    render(<PostSummary post={post} />);

    const titleLink = screen.getByText(post.title).closest('a');
    expect(titleLink).toHaveAttribute('href', 'https://example.com/post');
  });
});
