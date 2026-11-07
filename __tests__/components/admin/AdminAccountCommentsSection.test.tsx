import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import AdminAccountCommentsSection from '@/components/admin/account/AdminAccountCommentsSection';
import type { AdminCommentItem } from '@/lib/adminApi';

type CommentsSectionProps = React.ComponentProps<typeof AdminAccountCommentsSection>;

const comments: AdminCommentItem[] = [
  {
    id: 'pending-1',
    postId: 'first-post',
    postTitle: 'First post',
    parentId: null,
    authorName: 'Ava Reader',
    authorEmail: 'ava@example.com',
    content: 'Please review this comment.',
    status: 'PENDING',
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-02T10:00:00Z',
  },
  {
    id: 'approved-2',
    postId: 'second-post',
    postTitle: '',
    parentId: 'parent-1',
    authorName: 'Ben Reader',
    authorEmail: 'ben@example.com',
    content: 'A reply.',
    status: 'APPROVED',
    createdAt: '2026-11-01T11:00:00Z',
    updatedAt: '2026-11-01T11:00:00Z',
  },
  {
    id: 'rejected-3',
    postId: 'third-post',
    postTitle: 'Third post',
    parentId: null,
    authorName: 'Cora Reader',
    authorEmail: 'cora@example.com',
    content: 'A rejected comment.',
    status: 'REJECTED',
    createdAt: '2026-11-03T10:00:00Z',
    updatedAt: '2026-11-03T10:00:00Z',
  },
  {
    id: 'spam-4',
    postId: 'fourth-post',
    postTitle: 'Fourth post',
    parentId: null,
    authorName: 'Drew Reader',
    authorEmail: 'drew@example.com',
    content: 'A spam comment.',
    status: 'SPAM',
    createdAt: '2026-11-04T10:00:00Z',
    updatedAt: '2026-11-04T10:00:00Z',
  },
];

const createProps = (overrides: Partial<CommentsSectionProps> = {}): CommentsSectionProps => ({
  t: key => key,
  locale: 'en',
  formatSessionDate: value => value,
  commentsErrorMessage: '',
  commentsSuccessMessage: '',
  commentsListTopRef: React.createRef<HTMLDivElement>(),
  commentFilterStatus: 'all',
  onCommentFilterStatusChange: jest.fn(),
  commentFilterQuery: '',
  onCommentFilterQueryChange: jest.fn(),
  onClearCommentFilterQuery: jest.fn(),
  comments: [],
  isCommentsLoading: false,
  totalComments: 0,
  renderAsyncSectionContent: ({ isLoading, isEmpty, emptyMessage, children }) =>
    isLoading ? <p>loading-comments</p> : isEmpty ? <p>{emptyMessage}</p> : children,
  allVisibleCommentsSelected: false,
  hasSelectedComments: false,
  selectedCommentCount: 0,
  isBulkCommentActionPending: false,
  bulkCommentActionStatus: null,
  isBulkCommentDeleting: false,
  onToggleVisibleCommentsSelection: jest.fn(),
  onClearSelectedComments: jest.fn(),
  onBulkCommentStatusUpdate: jest.fn(),
  onOpenBulkCommentDelete: jest.fn(),
  selectedCommentIDs: [],
  onToggleCommentSelection: jest.fn(),
  resolveCommentStatusVariant: status => status.toLowerCase(),
  commentActionID: '',
  commentActionStatus: null,
  deletingCommentID: '',
  onCommentStatusUpdate: jest.fn(),
  onOpenCommentDelete: jest.fn(),
  commentsPage: 1,
  totalCommentPages: 1,
  commentsPageSize: 10,
  onCommentsPageChange: jest.fn(),
  onCommentsPageSizeChange: jest.fn(),
  pendingBulkCommentDeleteCount: 0,
  onCloseBulkCommentDelete: jest.fn(),
  onConfirmBulkCommentDelete: jest.fn(),
  pendingCommentDelete: null,
  onCloseCommentDelete: jest.fn(),
  onConfirmCommentDelete: jest.fn(),
  ...overrides,
});

describe('AdminAccountCommentsSection', () => {
  it('shows loading, empty, and feedback states and forwards filter changes', () => {
    const props = createProps({
      isCommentsLoading: true,
      commentsErrorMessage: 'Load failed',
      commentsSuccessMessage: 'Saved',
      commentFilterQuery: '  search  ',
    });
    const { rerender } = render(<AdminAccountCommentsSection {...props} />);
    expect(screen.getByText('loading-comments')).toBeInTheDocument();
    expect(screen.getByText('Load failed')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('adminAccount.comments.filters.status'), {
      target: { value: 'SPAM' },
    });
    fireEvent.change(screen.getByPlaceholderText('adminAccount.comments.filters.queryPlaceholder'), {
      target: { value: 'updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.comments.filters.query' }));
    expect(props.onCommentFilterStatusChange).toHaveBeenCalledWith('SPAM');
    expect(props.onCommentFilterQueryChange).toHaveBeenCalledWith('updated');
    expect(props.onClearCommentFilterQuery).toHaveBeenCalledTimes(1);

    rerender(<AdminAccountCommentsSection {...createProps()} />);
    expect(screen.getByText('adminAccount.comments.empty')).toBeInTheDocument();
  });

  it('renders all moderation states and forwards selection, bulk, row, and pagination actions', () => {
    const props = createProps({
      commentsErrorMessage: 'One request failed',
      commentsSuccessMessage: 'Updated comments',
      comments,
      totalComments: 21,
      totalCommentPages: 3,
      hasSelectedComments: true,
      selectedCommentCount: 2,
      selectedCommentIDs: ['pending-1'],
      bulkCommentActionStatus: 'REJECTED',
      commentActionID: 'pending-1',
      commentActionStatus: 'APPROVED',
    });
    render(<AdminAccountCommentsSection {...props} />);

    expect(screen.getByText('Ava Reader')).toBeInTheDocument();
    expect(screen.getByText('Ben Reader')).toBeInTheDocument();
    expect(screen.getAllByText('adminAccount.comments.list.rootLabel')).toHaveLength(3);
    expect(screen.getByText('adminAccount.comments.list.replyLabel')).toBeInTheDocument();
    expect(screen.getAllByText('adminAccount.comments.list.post')).toHaveLength(comments.length);
    expect(screen.getAllByText('adminAccount.comments.actions.updating')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Ava Reader' }));
    expect(props.onToggleCommentSelection).toHaveBeenCalledWith('pending-1', false);
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.comments.bulk.selectAll' }));
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.comments.bulk.clearSelection' }));
    expect(props.onToggleVisibleCommentsSelection).toHaveBeenCalledTimes(1);
    expect(props.onClearSelectedComments).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.comments.actions.approve' })[0]!);
    expect(props.onBulkCommentStatusUpdate).toHaveBeenCalledWith('APPROVED');
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.comments.actions.approve' }).at(-1)!);
    expect(props.onCommentStatusUpdate).toHaveBeenCalledWith('spam-4', 'APPROVED');
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.comments.actions.spam' })[0]!);
    expect(props.onBulkCommentStatusUpdate).toHaveBeenCalledWith('SPAM');
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.comments.actions.reject' }).at(-1)!);
    expect(props.onCommentStatusUpdate).toHaveBeenCalledWith('spam-4', 'REJECTED');
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.comments.actions.spam' }).at(-2)!);
    expect(props.onCommentStatusUpdate).toHaveBeenCalledWith('rejected-3', 'SPAM');
    fireEvent.click(screen.getAllByRole('link', { name: 'adminAccount.comments.actions.openPost' })[0]!);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.comments.actions.delete' }).at(-1)!);
    expect(props.onOpenCommentDelete).toHaveBeenCalledWith(comments[3]);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.comments.actions.delete' })[0]!);
    expect(props.onOpenBulkCommentDelete).toHaveBeenCalledTimes(1);
  });

  it('renders bulk and individual delete dialogs and forwards confirmation', () => {
    const props = createProps({
      comments: [comments[0]!],
      totalComments: 1,
      hasSelectedComments: true,
      pendingBulkCommentDeleteCount: 3,
      pendingCommentDelete: comments[0]!,
    });
    render(<AdminAccountCommentsSection {...props} />);
    expect(screen.getByText('adminAccount.comments.bulk.deleteConfirmCopy')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.comments.deleteConfirm.copy')).toBeInTheDocument();
    expect(screen.getAllByText('Ava Reader')).toHaveLength(2);

    const dialogs = screen.getAllByRole('dialog');
    fireEvent.click(within(dialogs[0]!).getByRole('button', { name: 'adminAccount.comments.actions.delete' }));
    fireEvent.click(within(dialogs[1]!).getByRole('button', { name: 'adminAccount.comments.actions.delete' }));
    expect(props.onConfirmBulkCommentDelete).toHaveBeenCalledTimes(1);
    expect(props.onConfirmCommentDelete).toHaveBeenCalledTimes(1);
  });
});
