import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostCarousel from '@/components/posts/PostCarousel';
import { mockPostSummaries } from '../../__mocks__/mockPostData';

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    asPath: '/',
    pathname: '/',
    query: { locale: 'en' },
    push: jest.fn(),
  }),
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
});
