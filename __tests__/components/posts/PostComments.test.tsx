import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import PostComments from '@/components/posts/PostComments';
import { beginCommentOAuthLogin, fetchCommentAuthSession, logoutCommentViewer } from '@/lib/commentAuthApi';
import { addComment, fetchComments, subscribeToCommentEvents } from '@/lib/commentsApi';

const translate = (key: string, options?: { count?: number; date?: string }) => {
  if (typeof options?.date === 'string') {
    return `${key} ${options.date}`;
  }
  if (typeof options?.count === 'number' && key === 'post.comments.title') {
    return `${options.count} comments`;
  }
  return key;
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: translate,
  }),
}));

jest.mock('@/lib/commentsApi', () => ({
  fetchComments: jest.fn(),
  addComment: jest.fn(),
  subscribeToCommentEvents: jest.fn(),
}));

jest.mock('@/lib/commentAuthApi', () => ({
  fetchCommentAuthSession: jest.fn(),
  logoutCommentViewer: jest.fn(),
  beginCommentOAuthLogin: jest.fn(),
}));

const mockedFetchComments = jest.mocked(fetchComments);
const mockedAddComment = jest.mocked(addComment);
const mockedSubscribeToCommentEvents = jest.mocked(subscribeToCommentEvents);
const mockedFetchCommentAuthSession = jest.mocked(fetchCommentAuthSession);
const mockedLogoutCommentViewer = jest.mocked(logoutCommentViewer);
const mockedBeginCommentOAuthLogin = jest.mocked(beginCommentOAuthLogin);

describe('PostComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetchCommentAuthSession.mockResolvedValue({
      authenticated: false,
      providers: {
        google: true,
        github: true,
      },
    });
    mockedLogoutCommentViewer.mockResolvedValue(true);
    mockedSubscribeToCommentEvents.mockImplementation(() => () => undefined);
    window.history.replaceState({}, '', '/en/posts/alpha-post');
  });

  it('renders approved comments and toggles replies on demand', async () => {
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 2,
      threads: [
        {
          root: {
            id: 'root-1',
            authorName: 'Alice',
            avatarUrl: 'https://example.com/alice.png',
            content: 'Root comment',
            createdAt: '2026-03-14T10:00:00.000Z',
          },
          replies: [
            {
              id: 'reply-1',
              parentId: 'root-1',
              authorName: 'Bob',
              avatarUrl: 'https://example.com/bob.png',
              content: 'Reply comment',
              createdAt: '2026-03-14T10:05:00.000Z',
            },
          ],
        },
      ],
    });

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(document.querySelector('.post-comment-avatar-image')).toHaveAttribute(
      'src',
      'https://example.com/alice.png',
    );
    expect(screen.getByText('Root comment')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByLabelText('post.comments.replies')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'post.comments.reply' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'post.comments.viewReplies' })).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    expect(screen.queryByText('Reply comment')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'post.comments.viewReplies' }));

    expect(await screen.findByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Reply comment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'post.comments.hideReplies' })).toBeInTheDocument();
  });

  it('shows empty and load error states', async () => {
    mockedFetchComments.mockResolvedValueOnce({
      status: 'success',
      total: 0,
      threads: [],
    });

    const { rerender } = renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    expect(await screen.findByText('post.comments.empty')).toBeInTheDocument();

    mockedFetchComments.mockResolvedValueOnce({
      status: 'failed',
      total: 0,
      threads: [],
    });

    rerender(<PostComments locale="en" postId="beta-post" />);

    expect(await screen.findByText('post.comments.errors.load')).toBeInTheDocument();
  });

  it('uses preloaded threads without fetching comments on first render', async () => {
    renderWithProviders(
      <PostComments
        locale="en"
        postId="alpha-post"
        initialStatus="success"
        initialTotal={1}
        initialThreads={[
          {
            root: {
              id: 'root-preloaded',
              authorName: 'Preloaded Reader',
              content: 'Loaded from post detail',
              createdAt: '2026-03-14T10:00:00.000Z',
            },
            replies: [],
          },
        ]}
        skipInitialFetch
      />,
    );

    expect(await screen.findByText('Preloaded Reader')).toBeInTheDocument();
    expect(screen.getByText('Loaded from post detail')).toBeInTheDocument();
    expect(mockedFetchComments).not.toHaveBeenCalled();
  });

  it('starts public OAuth login for Google and GitHub comments', async () => {
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 0,
      threads: [],
    });

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    await screen.findByText('post.comments.empty');

    fireEvent.click(screen.getByRole('button', { name: 'post.comments.auth.google' }));
    expect(mockedBeginCommentOAuthLogin).toHaveBeenCalledWith('google', 'en', '/en/posts/alpha-post');

    fireEvent.click(screen.getByRole('button', { name: 'post.comments.auth.github' }));
    expect(mockedBeginCommentOAuthLogin).toHaveBeenCalledWith('github', 'en', '/en/posts/alpha-post');
  });

  it('shows auth callback feedback for successful and cancelled logins', async () => {
    mockedFetchCommentAuthSession.mockResolvedValueOnce({
      authenticated: true,
      providers: {
        google: true,
        github: true,
      },
      viewer: {
        id: 'reader-1',
        name: 'Alice Reader',
        email: 'alice@example.com',
        provider: 'google',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 0,
      threads: [],
    });
    window.history.replaceState({}, '', '/en/posts/alpha-post?commentAuth=connected&commentProvider=google');

    const { unmount } = renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    expect(await screen.findByText('post.comments.auth.connected')).toBeInTheDocument();
    expect(window.location.search).toBe('');

    unmount();
    mockedFetchCommentAuthSession.mockResolvedValueOnce({
      authenticated: false,
      providers: {
        google: true,
        github: true,
      },
    });
    window.history.replaceState({}, '', '/en/posts/alpha-post?commentAuth=cancelled&commentProvider=github');

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    expect(await screen.findByText('post.comments.auth.cancelled')).toBeInTheDocument();
    expect(window.location.search).toBe('');
  });

  it('uses the authenticated reader for composer submissions', async () => {
    mockedFetchCommentAuthSession.mockResolvedValue({
      authenticated: true,
      providers: {
        google: true,
        github: true,
      },
      viewer: {
        id: 'reader-1',
        name: 'Alice Reader',
        email: 'alice@example.com',
        provider: 'google',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 0,
      threads: [],
    });
    mockedAddComment.mockResolvedValue({
      status: 'success',
      postId: 'alpha-post',
      moderationStatus: 'pending',
    });

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    await screen.findByText('post.comments.empty');
    expect(screen.queryByLabelText('post.comments.form.nameLabel')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('post.comments.form.emailLabel')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('post.comments.form.contentLabel'), {
      target: { value: 'Signed in comment' },
    });
    fireEvent.submit(screen.getByLabelText('post.comments.form.contentLabel').closest('form')!);

    await waitFor(() => {
      expect(mockedAddComment).toHaveBeenCalledWith({
        postId: 'alpha-post',
        authorName: '',
        authorEmail: '',
        content: 'Signed in comment',
      });
    });
  });

  it('switches between provider and email modes and signs out with feedback', async () => {
    mockedFetchCommentAuthSession.mockResolvedValue({
      authenticated: true,
      providers: {
        google: true,
        github: true,
      },
      viewer: {
        id: 'reader-1',
        name: 'Alice Reader',
        email: 'alice@example.com',
        provider: 'google',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 0,
      threads: [],
    });

    const { unmount } = renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    await screen.findByText('post.comments.auth.signedInAs');

    fireEvent.click(screen.getByRole('button', { name: 'post.comments.auth.google' }));
    expect(mockedBeginCommentOAuthLogin).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'post.comments.auth.signOut' }));

    await waitFor(() => {
      expect(mockedLogoutCommentViewer).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('post.comments.auth.signedOut')).toBeInTheDocument();
    expect(screen.getByLabelText('post.comments.form.nameLabel')).toBeInTheDocument();

    unmount();
    mockedFetchCommentAuthSession.mockResolvedValue({
      authenticated: true,
      providers: {
        google: true,
        github: true,
      },
      viewer: {
        id: 'reader-1',
        name: 'Alice Reader',
        email: 'alice@example.com',
        provider: 'google',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });
    window.history.replaceState({}, '', '/en/posts/alpha-post');

    renderWithProviders(<PostComments locale="en" postId="beta-post" />);

    await screen.findByText('post.comments.auth.signedInAs');
    fireEvent.click(screen.getByRole('button', { name: 'post.comments.auth.useEmail' }));
    expect(await screen.findByLabelText('post.comments.form.nameLabel')).toBeInTheDocument();
  });

  it('shows inline validation feedback before submit', async () => {
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 0,
      threads: [],
    });

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    await screen.findByText('post.comments.empty');

    fireEvent.submit(screen.getByLabelText('post.comments.form.contentLabel').closest('form')!);

    expect(await screen.findAllByText('common.validation.required')).toHaveLength(3);
    expect(mockedAddComment).not.toHaveBeenCalled();
  });

  it('revalidates fields while typing after submit attempt', async () => {
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 0,
      threads: [],
    });

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    await screen.findByText('post.comments.empty');

    fireEvent.submit(screen.getByLabelText('post.comments.form.contentLabel').closest('form')!);
    expect(await screen.findAllByText('common.validation.required')).toHaveLength(3);

    fireEvent.change(screen.getByLabelText('post.comments.form.nameLabel'), {
      target: { value: 'Alice' },
    });
    expect(screen.getAllByText('common.validation.required')).toHaveLength(2);

    fireEvent.change(screen.getByLabelText('post.comments.form.emailLabel'), {
      target: { value: 'wrong' },
    });
    expect(await screen.findByText('post.comments.errors.invalid-email')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('post.comments.form.emailLabel'), {
      target: { value: 'alice@example.com' },
    });
    expect(screen.queryByText('post.comments.errors.invalid-email')).not.toBeInTheDocument();
  });

  it('shows field validation while typing before submit', async () => {
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 0,
      threads: [],
    });

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    await screen.findByText('post.comments.empty');

    fireEvent.change(screen.getByLabelText('post.comments.form.emailLabel'), {
      target: { value: 'wrong' },
    });
    expect(await screen.findByText('post.comments.errors.invalid-email')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('post.comments.form.contentLabel'), {
      target: { value: 'hi' },
    });
    expect(await screen.findByText('post.comments.errors.invalid-content')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('post.comments.form.emailLabel'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByLabelText('post.comments.form.contentLabel'), {
      target: { value: 'Hello there' },
    });

    await waitFor(() => {
      expect(screen.queryByText('post.comments.errors.invalid-email')).not.toBeInTheDocument();
      expect(screen.queryByText('post.comments.errors.invalid-content')).not.toBeInTheDocument();
    });
  });

  it('submits a guest comment and shows pending moderation feedback', async () => {
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 0,
      threads: [],
    });
    mockedAddComment.mockResolvedValue({
      status: 'success',
      postId: 'alpha-post',
      moderationStatus: 'pending',
    });

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    await screen.findByText('post.comments.empty');

    fireEvent.change(screen.getByLabelText('post.comments.form.nameLabel'), {
      target: { value: 'Alice' },
    });
    fireEvent.change(screen.getByLabelText('post.comments.form.emailLabel'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByLabelText('post.comments.form.contentLabel'), {
      target: { value: 'First guest comment' },
    });
    fireEvent.submit(screen.getByLabelText('post.comments.form.contentLabel').closest('form')!);

    await waitFor(() => {
      expect(mockedAddComment).toHaveBeenCalledWith({
        postId: 'alpha-post',
        authorName: 'Alice',
        authorEmail: 'alice@example.com',
        content: 'First guest comment',
      });
    });

    expect(await screen.findByText('post.comments.success.pending')).toBeInTheDocument();
  });

  it('auto hides success feedback after a short delay', async () => {
    jest.useFakeTimers();
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 0,
      threads: [],
    });
    mockedAddComment.mockResolvedValue({
      status: 'success',
      postId: 'alpha-post',
      moderationStatus: 'pending',
    });

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    await screen.findByText('post.comments.empty');

    fireEvent.change(screen.getByLabelText('post.comments.form.nameLabel'), {
      target: { value: 'Alice' },
    });
    fireEvent.change(screen.getByLabelText('post.comments.form.emailLabel'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByLabelText('post.comments.form.contentLabel'), {
      target: { value: 'First guest comment' },
    });
    fireEvent.submit(screen.getByLabelText('post.comments.form.contentLabel').closest('form')!);

    expect(await screen.findByText('post.comments.success.pending')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(3500);
    });

    await waitFor(() => {
      expect(screen.queryByText('post.comments.success.pending')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('refreshes comments when a submitted comment is approved immediately', async () => {
    mockedFetchComments
      .mockResolvedValueOnce({
        status: 'success',
        total: 0,
        threads: [],
      })
      .mockResolvedValueOnce({
        status: 'success',
        total: 1,
        threads: [
          {
            root: {
              id: 'root-1',
              authorName: 'Bob',
              content: 'Approved comment',
              createdAt: '2026-03-14T10:00:00.000Z',
            },
            replies: [],
          },
        ],
      });
    mockedAddComment.mockResolvedValue({
      status: 'success',
      postId: 'alpha-post',
      moderationStatus: 'approved',
    });

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    await screen.findByText('post.comments.empty');

    fireEvent.change(screen.getByLabelText('post.comments.form.nameLabel'), {
      target: { value: 'Bob' },
    });
    fireEvent.change(screen.getByLabelText('post.comments.form.emailLabel'), {
      target: { value: 'bob@example.com' },
    });
    fireEvent.change(screen.getByLabelText('post.comments.form.contentLabel'), {
      target: { value: 'Approved comment' },
    });
    fireEvent.submit(screen.getByLabelText('post.comments.form.contentLabel').closest('form')!);

    await waitFor(() => {
      expect(mockedAddComment).toHaveBeenCalledWith({
        postId: 'alpha-post',
        authorName: 'Bob',
        authorEmail: 'bob@example.com',
        content: 'Approved comment',
      });
    });

    expect(await screen.findByText('post.comments.success.approved')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockedFetchComments).toHaveBeenCalledTimes(2);
    });
  });

  it('shows mutation error feedback when submission fails', async () => {
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 0,
      threads: [],
    });
    mockedAddComment.mockResolvedValue({
      status: 'rate-limited',
      postId: 'alpha-post',
    });

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    await screen.findByText('post.comments.empty');

    fireEvent.change(screen.getByLabelText('post.comments.form.nameLabel'), {
      target: { value: 'Alice' },
    });
    fireEvent.change(screen.getByLabelText('post.comments.form.emailLabel'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByLabelText('post.comments.form.contentLabel'), {
      target: { value: 'Rate limited comment' },
    });
    fireEvent.submit(screen.getByLabelText('post.comments.form.contentLabel').closest('form')!);

    expect(await screen.findByText('post.comments.errors.rate-limited')).toBeInTheDocument();
  });

  it('opens a reply composer with a contextual banner', async () => {
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 1,
      threads: [
        {
          root: {
            id: 'root-1',
            authorName: 'Alice',
            content: 'Root comment',
            createdAt: '2026-03-14T10:00:00.000Z',
          },
          replies: [],
        },
      ],
    });

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    await screen.findByText('Root comment');
    fireEvent.click(screen.getByRole('button', { name: 'post.comments.reply' }));

    expect(await screen.findByText('post.comments.form.replyingTo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'post.comments.closeReply' })).toBeInTheDocument();
  });

  it('patches threads from subscription events and refetches after reconnect', async () => {
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 0,
      threads: [],
    });

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    await screen.findByText('post.comments.empty');

    const subscriptionCallbacks = mockedSubscribeToCommentEvents.mock.calls.at(-1)?.[1];
    expect(subscriptionCallbacks).toBeDefined();

    act(() => {
      subscriptionCallbacks?.next({
        type: 'created',
        postId: 'alpha-post',
        commentId: 'root-live',
        total: 1,
        comment: {
          id: 'root-live',
          authorName: 'Live Reader',
          content: 'Live root comment',
          createdAt: '2026-03-16T10:00:00.000Z',
        },
      });
    });

    expect(await screen.findByText('Live Reader')).toBeInTheDocument();
    expect(screen.getByText('Live root comment')).toBeInTheDocument();
    expect(screen.getByText('1 comments')).toBeInTheDocument();

    act(() => {
      subscriptionCallbacks?.next({
        type: 'created',
        postId: 'alpha-post',
        commentId: 'reply-live',
        parentId: 'root-live',
        total: 2,
        comment: {
          id: 'reply-live',
          parentId: 'root-live',
          authorName: 'Reply Reader',
          content: 'Live reply comment',
          createdAt: '2026-03-16T10:05:00.000Z',
        },
      });
    });

    expect(await screen.findByText('Reply Reader')).toBeInTheDocument();
    expect(screen.getByText('Live reply comment')).toBeInTheDocument();

    act(() => {
      subscriptionCallbacks?.next({
        type: 'deleted',
        postId: 'alpha-post',
        commentId: 'reply-live',
        parentId: 'root-live',
        status: 'approved',
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('Live reply comment')).not.toBeInTheDocument();
    });

    act(() => {
      subscriptionCallbacks?.next({
        type: 'count-changed',
        postId: 'alpha-post',
        commentId: 'root-live',
        total: 5,
      });
      subscriptionCallbacks?.connected?.(true);
    });

    await waitFor(() => {
      expect(screen.getByText('5 comments')).toBeInTheDocument();
      expect(mockedFetchComments).toHaveBeenCalledTimes(2);
    });
  });
});
