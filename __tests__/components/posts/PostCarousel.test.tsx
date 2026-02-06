import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostCarousel from '@/components/posts/PostCarousel';
import { mockPostSummaries } from '@tests/__mocks__/mockPostData';

const useParamsMock = jest.fn().mockReturnValue({ locale: 'en' });

jest.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height,
    style,
    priority,
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    priority?: boolean;
  }) => (
    <img src={src} alt={alt} width={width} height={height} style={style} data-priority={priority ? 'true' : 'false'} />
  ),
}));

// Mock `FontAwesomeIcon` component
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <i data-testid={`font-awesome-icon-${icon}`} />,
}));

describe('PostCarousel Component', () => {
  it('renders the carousel with posts', () => {
    render(<PostCarousel posts={mockPostSummaries} />);

    // Check if all posts are rendered
    const carouselItems = screen.getAllByRole('button', { name: /slide/i });
    expect(carouselItems).toHaveLength(mockPostSummaries.length);

    // Check the first post title
    expect(screen.getByText(mockPostSummaries[0].title)).toBeInTheDocument();
  });

  it('renders topics as badges when topics are available', () => {
    render(<PostCarousel posts={mockPostSummaries} />);

    // Check if topics are rendered as badges for a post with topics
    const postWithTopics = mockPostSummaries.find(post => post.topics && post.topics.length > 0);
    if (postWithTopics) {
      postWithTopics.topics?.forEach(topic => {
        expect(screen.getByText(topic.name)).toBeInTheDocument();
      });
    }
  });

  it('does not render badges when no topics are available', () => {
    const postsWithoutTopics = mockPostSummaries.map(post => ({
      ...post,
      topics: [], // Force no topics
    }));

    render(<PostCarousel posts={postsWithoutTopics} />);

    // Ensure no topic badges are rendered
    const badges = screen.queryAllByRole('link', { name: /topic/i });
    expect(badges).toHaveLength(0);
  });

  it('navigates to the next slide when the next button is clicked', () => {
    render(<PostCarousel posts={mockPostSummaries} />);

    const nextButton = screen.getByRole('button', { name: /next/i });

    fireEvent.click(nextButton);

    expect(screen.getByText(mockPostSummaries[1].title)).toBeInTheDocument();
  });

  it('navigates to the previous slide when the previous button is clicked', () => {
    render(<PostCarousel posts={mockPostSummaries} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevButton);

    expect(screen.getByText(mockPostSummaries[0].title)).toBeInTheDocument();
  });

  it('displays topics as badges for each post', () => {
    render(<PostCarousel posts={mockPostSummaries} />);

    // Check if topics are rendered as badges
    const firstPostTopics = mockPostSummaries[0].topics;
    if (firstPostTopics) {
      firstPostTopics.forEach(topic => {
        expect(screen.getByText(topic.name)).toBeInTheDocument();
      });
    }
  });

  it('renders a clickable link for each post', () => {
    render(<PostCarousel posts={mockPostSummaries} />);

    // Check if the post titles are clickable links
    const firstPostLink = screen.getByText(mockPostSummaries[0].title).closest('a');
    expect(firstPostLink).toHaveAttribute('href', expect.stringContaining(`/posts/${mockPostSummaries[0].id}`));
  });

  it('applies the "active" class to the correct slide indicator', () => {
    render(<PostCarousel posts={mockPostSummaries} />);

    const indicators = screen.getAllByRole('button', { name: /go to slide/i });
    expect(indicators[0]).toHaveClass('active');
    expect(indicators[1]).not.toHaveClass('active');

    fireEvent.click(indicators[1]);
    expect(indicators[1]).toHaveClass('active');
    expect(indicators[0]).not.toHaveClass('active');
  });

  it('does not apply the "active" class to inactive slides', () => {
    render(<PostCarousel posts={mockPostSummaries} />);

    const indicators = screen.getAllByRole('button', { name: /go to slide/i });

    indicators.forEach((indicator, index) => {
      if (index !== 0) {
        expect(indicator).not.toHaveClass('active');
      }
    });
  });
});
