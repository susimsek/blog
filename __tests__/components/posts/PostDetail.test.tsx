import { render, screen } from '@testing-library/react';
import PostDetail from '@/components/posts/PostDetail';
import { Post } from '@/types/posts';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockPost: Post = {
  id: '1',
  title: 'Test Post',
  date: '2024-12-03',
  contentHtml: '<p>Test Content</p>',
  thumbnail: '/test-thumbnail.jpg',
  topics: ['React', 'Testing'],
  summary: 'Test summary',
};

describe('PostDetail Component', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      asPath: '/',
      pathname: '/',
      query: { locale: 'en' },
      push: jest.fn(),
    });
  });

  it('renders the post title', () => {
    render(<PostDetail post={mockPost} />);
    const titleElement = screen.getByText(mockPost.title);
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass('fw-bold');
  });

  it('renders the post date', () => {
    render(<PostDetail post={mockPost} />);

    const dateElement = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && content.includes('December 3, 2024');
    });

    expect(dateElement).toBeInTheDocument();
  });

  it('renders the post content', () => {
    render(<PostDetail post={mockPost} />);
    const contentElement = screen.getByText('Test Content');
    expect(contentElement).toBeInTheDocument();
  });

  it('renders the topics as badges', () => {
    render(<PostDetail post={mockPost} />);
    if (mockPost.topics) {
      mockPost.topics.forEach(topic => {
        expect(screen.getByText(topic)).toBeInTheDocument();
      });
    } else {
      expect(screen.queryByRole('badge')).not.toBeInTheDocument();
    }
  });

  it('renders the thumbnail when provided', () => {
    render(<PostDetail post={mockPost} />);
    const thumbnailElement = screen.getByAltText(mockPost.title);
    expect(thumbnailElement).toBeInTheDocument();

    if (mockPost.thumbnail) {
      const expectedThumbnailPath = encodeURIComponent(mockPost.thumbnail);
      expect(thumbnailElement).toHaveAttribute('src', expect.stringContaining(expectedThumbnailPath));
    }
  });

  it('handles locale in the query string', () => {
    render(<PostDetail post={mockPost} />);
    const { query } = useRouter();
    expect(query.locale).toBe('en');
  });
});
