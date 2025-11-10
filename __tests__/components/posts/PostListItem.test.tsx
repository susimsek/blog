import React from 'react';
import { render, screen } from '@testing-library/react';
import PostListItem from '@/components/posts/PostListItem';

jest.mock('next/image', () => (props: any) => <img alt={props.alt} data-testid="thumbnail" />);

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

jest.mock('@/components/common/DateDisplay', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <time>{date}</time>,
}));

describe('PostListItem', () => {
  const basePost = {
    id: '1',
    title: 'Sample Post',
    summary: 'Summary',
    date: '2024-05-01',
    thumbnail: '/thumb.webp',
    topics: [
      { id: 'js', name: 'JavaScript', color: 'yellow' },
      { id: 'react', name: 'React', color: 'blue' },
    ],
    readingTime: '2 min',
  };

  it('renders thumbnail, date, reading time, and topics', () => {
    render(<PostListItem post={basePost} />);

    expect(screen.getByTestId('thumbnail')).toBeInTheDocument();
    expect(screen.getByText(basePost.title)).toBeInTheDocument();
    expect(screen.getByText(basePost.date)).toBeInTheDocument();
    expect(screen.getByText(basePost.readingTime)).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('omits thumbnail section when thumbnail is missing', () => {
    render(<PostListItem post={{ ...basePost, thumbnail: null }} />);

    expect(screen.queryByTestId('thumbnail')).not.toBeInTheDocument();
    expect(screen.getByText('Sample Post')).toBeInTheDocument();
  });
});
