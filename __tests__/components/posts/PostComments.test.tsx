import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import PostComments from '@/components/posts/PostComments';
import { addComment, fetchComments } from '@/lib/commentsApi';

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
}));

const mockedFetchComments = jest.mocked(fetchComments);
const mockedAddComment = jest.mocked(addComment);

describe('PostComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders approved comments and replies', async () => {
    mockedFetchComments.mockResolvedValue({
      status: 'success',
      total: 2,
      threads: [
        {
          root: {
            id: 'root-1',
            authorName: 'Alice',
            content: 'Root comment',
            createdAt: '2026-03-14T10:00:00.000Z',
          },
          replies: [
            {
              id: 'reply-1',
              parentId: 'root-1',
              authorName: 'Bob',
              content: 'Reply comment',
              createdAt: '2026-03-14T10:05:00.000Z',
            },
          ],
        },
      ],
    });

    renderWithProviders(<PostComments locale="en" postId="alpha-post" />);

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Root comment')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Reply comment')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByLabelText('post.comments.replies')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'post.comments.reply' })).toBeInTheDocument();
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
        locale: 'en',
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
        locale: 'en',
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
});
