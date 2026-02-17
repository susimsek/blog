import React from 'react';
import { render, screen } from '@testing-library/react';
import PostListItem from '@/components/posts/PostListItem';

jest.mock('next/image', () => (props: any) => <img alt={props.alt} data-testid="thumbnail" />);
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number; ns?: string }) => {
      if (key === 'common.readingTime.minute' && options?.ns === 'common') {
        return `${options?.count ?? 0} min read`;
      }
      if (key === 'common.readingTime.fifteenPlus' && options?.ns === 'common') {
        return '15+ min read';
      }
      return key;
    },
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string | [string, string] }) => (
    <span data-testid={`icon-${Array.isArray(icon) ? icon.join('-') : icon}`} />
  ),
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
    searchText: 'sample post summary javascript react',
    publishedDate: '2024-05-01',
    thumbnail: '/thumb.webp',
    topics: [
      { id: 'js', name: 'JavaScript', color: 'yellow' },
      { id: 'react', name: 'React', color: 'blue' },
    ],
    readingTimeMin: 2,
  };

  it('renders thumbnail, date, reading time, and topics', () => {
    render(<PostListItem post={basePost} />);

    expect(screen.getByTestId('thumbnail')).toBeInTheDocument();
    expect(screen.getByText(basePost.title)).toBeInTheDocument();
    expect(screen.getByText(basePost.publishedDate)).toBeInTheDocument();
    expect(screen.getByText('2 min read')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('common.searchSource.blog')).toBeInTheDocument();
    expect(screen.getByTestId('icon-book')).toBeInTheDocument();
  });

  it('omits thumbnail section when thumbnail is missing', () => {
    render(<PostListItem post={{ ...basePost, thumbnail: null }} />);

    expect(screen.queryByTestId('thumbnail')).not.toBeInTheDocument();
    expect(screen.getByText('Sample Post')).toBeInTheDocument();
  });

  it('shows medium source badge when source is medium', () => {
    render(<PostListItem post={{ ...basePost, source: 'medium' }} />);

    expect(screen.getByText('common.searchSource.medium')).toBeInTheDocument();
    expect(screen.getByTestId('icon-fab-medium')).toBeInTheDocument();
  });
});
