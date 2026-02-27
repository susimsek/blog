import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PostHit from '@/components/posts/PostHit';
import { fetchPost, incrementPostHit } from '@/lib/contentApi';

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => (options?.count !== undefined ? `${key}:${options.count}` : key),
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="eye-icon" />,
}));

jest.mock('@/lib/contentApi', () => ({
  fetchPost: jest.fn(),
  incrementPostHit: jest.fn(),
}));

const fetchPostMock = fetchPost as jest.MockedFunction<typeof fetchPost>;
const incrementPostHitMock = incrementPostHit as jest.MockedFunction<typeof incrementPostHit>;

describe('PostHit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading output then formatted hit count', async () => {
    fetchPostMock.mockResolvedValue({
      status: 'success',
      hits: 8,
      post: null,
    });
    incrementPostHitMock.mockResolvedValue(9);

    render(<PostHit postId="post-1" />);

    expect(screen.getByText('post.hit.loading')).toBeInTheDocument();

    await waitFor(() => expect(incrementPostHitMock).toHaveBeenCalledWith('post-1'));
    expect(screen.getByLabelText('post.hit.aria:9')).toBeInTheDocument();
    expect(screen.getByText('000009')).toBeInTheDocument();
  });
});
