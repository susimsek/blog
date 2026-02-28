import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import PostLike from '@/components/posts/PostLike';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import { fetchPost, incrementPostLike } from '@/lib/contentApi';

const useParamsMock = jest.fn<
  {
    locale?: string | string[];
  },
  []
>(() => ({ locale: 'en' }));

jest.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
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
    useParamsMock.mockReturnValue({ locale: 'en' });
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

  it('falls back to the default locale and i18n language branches', async () => {
    useParamsMock.mockReturnValue({ locale: undefined });

    renderWithProviders(<PostLike postId="post-array" />, {
      preloadedState: {
        voice: { isEnabled: false },
      },
    });

    await waitFor(() => expect(fetchPostMock).toHaveBeenCalledWith('en', 'post-array'));
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

  it('shows an error state when the initial like count cannot be loaded', async () => {
    fetchPostMock.mockResolvedValue({
      status: 'failed',
      post: null,
    });

    renderWithProviders(<PostLike postId="post-2" />, {
      preloadedState: {
        voice: { isEnabled: false },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('post.like.error')).toBeInTheDocument();
    });

    expect(global.Audio).not.toHaveBeenCalled();
  });

  it('reverts optimistic likes when submitting fails and skips audio when voice is disabled', async () => {
    incrementPostLikeMock.mockResolvedValue(null);

    renderWithProviders(<PostLike postId="post-3" />, {
      preloadedState: {
        voice: { isEnabled: false },
      },
    });

    const button = screen.getByRole('button', { name: /post.like.button/i });
    await waitFor(() => expect(button).not.toBeDisabled());

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('post.like.error')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    expect(global.Audio).not.toHaveBeenCalled();
  });

  it('prevents duplicate submissions while a like request is pending', async () => {
    let resolveIncrement: ((value: number) => void) | undefined;
    incrementPostLikeMock.mockReturnValue(
      new Promise(resolve => {
        resolveIncrement = resolve;
      }),
    );

    renderWithProviders(<PostLike postId="post-4" />, {
      preloadedState: {
        voice: { isEnabled: true },
      },
    });

    const button = screen.getByRole('button', { name: /post.like.button/i });
    await waitFor(() => expect(button).not.toBeDisabled());

    fireEvent.click(button);
    fireEvent.click(button);

    expect(incrementPostLikeMock).toHaveBeenCalledTimes(1);

    resolveIncrement?.(5);
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
  });

  it('clears pending animation timers when liking again after a fast success', async () => {
    jest.useFakeTimers();
    incrementPostLikeMock.mockResolvedValueOnce(2).mockResolvedValueOnce(3);

    renderWithProviders(<PostLike postId="post-5" />, {
      preloadedState: {
        voice: { isEnabled: false },
      },
    });

    const button = screen.getByRole('button', { name: /post.like.button/i });
    await waitFor(() => expect(button).not.toBeDisabled());

    fireEvent.click(button);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('2')).toBeInTheDocument();

    fireEvent.click(button);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('3')).toBeInTheDocument();

    act(() => {
      jest.runAllTimers();
    });

    jest.useRealTimers();
  });
});
