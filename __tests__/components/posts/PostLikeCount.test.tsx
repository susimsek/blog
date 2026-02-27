import React from 'react';
import { render, screen } from '@testing-library/react';
import PostLikeCount from '@/components/posts/PostLikeCount';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="heart-icon" />,
}));

describe('PostLikeCount', () => {
  it('renders loading output when likes are loading', () => {
    render(<PostLikeCount likes={null} isLoading />);

    expect(screen.getByLabelText('post.like.loading')).toBeInTheDocument();
  });

  it('renders formatted likes when available', () => {
    render(<PostLikeCount likes={1234} />);

    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
  });
});
