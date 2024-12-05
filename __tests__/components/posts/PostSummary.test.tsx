import React from 'react';
import { render, screen } from '@testing-library/react';
import PostSummary from '@/components/posts/PostSummary';
import { Post } from '@/types/posts';

jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => key),
  })),
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

const mockPost: Post = {
  id: '1',
  title: 'Test Post',
  date: '2024-12-03',
  summary: 'This is a summary of the test post.',
  thumbnail: '/test-thumbnail.jpg',
  topics: [
    { name: 'React', color: 'blue' },
    { name: 'Testing', color: 'green' },
  ],
};

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
      expect(thumbnail).toHaveAttribute('src', expectedThumbnailPath);
    }

    expect(thumbnail).toHaveAttribute('alt', mockPost.title);
  });

  it('renders the summary text', () => {
    render(<PostSummary post={mockPost} />);
    const summaryElement = screen.getByText(mockPost.summary);
    expect(summaryElement).toBeInTheDocument();
    expect(summaryElement).toHaveClass('text-muted');
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
});
