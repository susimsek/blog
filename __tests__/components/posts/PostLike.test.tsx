import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import PostLike from '@/components/posts/PostLike';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import { fetchPost, incrementPostLike } from '@/lib/contentApi';

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="heart-icon" />,
}));

jest.mock('@/lib/contentApi', () => ({
  fetchPost: jest.fn(),
  incrementPostLike: jest.fn(),
}));

const fetchPostMock = fetchPost as jest.MockedFunction<typeof fetchPost>;
const incrementPostLikeMock = incrementPostLike as jest.MockedFunction<typeof incrementPostLike>;

describe('PostLike', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchPostMock.mockResolvedValue({
      status: 'success',
      likes: 1,
      post: null,
    });
    incrementPostLikeMock.mockResolvedValue(2);
    (global as typeof globalThis & { Audio: jest.Mock }).Audio = jest.fn().mockImplementation(() => ({
      play: jest.fn().mockResolvedValue(undefined),
      preload: 'auto',
      volume: 1,
      currentTime: 0,
    }));
  });

  it('loads likes and plays like sound when clicking while voice is enabled', async () => {
    renderWithProviders(<PostLike postId="post-1" />, {
      preloadedState: {
        voice: { isEnabled: true },
      },
    });

    const button = screen.getByRole('button', { name: /post.like.button/i });

    await waitFor(() => expect(button).not.toBeDisabled());
    expect(fetchPostMock).toHaveBeenCalledWith('en', 'post-1');

    fireEvent.click(button);

    await waitFor(() => expect(incrementPostLikeMock).toHaveBeenCalledWith('post-1'));
    expect(global.Audio).toHaveBeenCalledWith('/sounds/pop-light.mp3');
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
