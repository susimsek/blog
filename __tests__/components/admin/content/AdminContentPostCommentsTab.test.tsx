import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import AdminContentPostCommentsTab from '@/components/admin/content/AdminContentPostCommentsTab';
import type { AdminCommentItem } from '@/lib/adminApi';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span aria-hidden="true" />,
}));

jest.mock('@/components/pagination/PaginationBar', () => ({
  __esModule: true,
  default: ({
    currentPage,
    totalPages,
    size,
    onPageChange,
    onSizeChange,
  }: {
    currentPage: number;
    totalPages: number;
    size: number;
    onPageChange: (page: number) => void;
    onSizeChange: (size: number) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}>
        next comment page
      </button>
      <button type="button" onClick={() => onSizeChange(size + 10)}>
        increase comment page size
      </button>
    </div>
  ),
}));

type Props = React.ComponentProps<typeof AdminContentPostCommentsTab>;

const comments: AdminCommentItem[] = [
  {
    id: 'comment-pending',
    postId: 'post-1',
    postTitle: 'Post title',
    parentId: null,
    authorName: 'Pending author',
    authorEmail: 'pending@example.test',
    content: 'Pending comment body',
    status: 'PENDING',
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-02T09:00:00Z',
  },
  {
    id: 'comment-approved',
    postId: 'post-1',
    postTitle: 'Post title',
    parentId: 'comment-pending',
    authorName: 'Approved author',
    authorEmail: 'approved@example.test',
    content: 'Approved reply body',
    status: 'APPROVED',
    createdAt: '2026-10-03T09:00:00Z',
    updatedAt: '2026-10-03T09:00:00Z',
  },
  {
    id: 'comment-rejected',
    postId: 'post-1',
    postTitle: 'Post title',
    parentId: null,
    authorName: 'Rejected author',
    authorEmail: 'rejected@example.test',
    content: 'Rejected comment body',
    status: 'REJECTED',
    createdAt: '2026-10-04T09:00:00Z',
    updatedAt: '2026-10-04T09:00:00Z',
  },
  {
    id: 'comment-spam',
    postId: 'post-1',
    postTitle: 'Post title',
    parentId: 'comment-approved',
    authorName: 'Spam author',
    authorEmail: 'spam@example.test',
    content: 'Spam reply body',
    status: 'SPAM',
    createdAt: '2026-10-05T09:00:00Z',
    updatedAt: '2026-10-06T09:00:00Z',
  },
];

const makeProps = (overrides: Partial<Props> = {}): Props => ({
  t: (key, options) => {
    const values = Object.entries(options ?? {})
      .filter(([option]) => option !== 'ns')
      .map(([, value]) => String(value));
    return values.length > 0 ? `${key}: ${values.join(', ')}` : key;
  },
  formatDate: value => `date:${value}`,
  listTopRef: React.createRef<HTMLDivElement>(),
  postCommentsTotal: 0,
  postCommentsStatusFilter: 'all',
  onPostCommentsStatusFilterChange: jest.fn(),
  postCommentsFilterQuery: 'query',
  onPostCommentsFilterQueryChange: jest.fn(),
  onClearPostCommentsFilterQuery: jest.fn(),
  postCommentsErrorMessage: '',
  postCommentsSuccessMessage: '',
  postComments: [],
  allVisiblePostCommentsSelected: false,
  isPostCommentsLoading: false,
  isBulkPostCommentActionPending: false,
  hasSelectedPostComments: false,
  selectedPostCommentIDs: [],
  onToggleVisiblePostCommentsSelection: jest.fn(),
  onClearSelectedPostCommentIDs: jest.fn(),
  bulkPostCommentActionStatus: null,
  isBulkPostCommentDeleting: false,
  onBulkApprove: jest.fn(),
  onBulkReject: jest.fn(),
  onBulkSpam: jest.fn(),
  onOpenBulkDelete: jest.fn(),
  postCommentActionID: '',
  postCommentActionStatus: null,
  deletingPostCommentID: '',
  onTogglePostCommentSelection: jest.fn(),
  resolveCommentStatusVariant: status => status.toLowerCase(),
  onUpdatePostCommentStatus: jest.fn(),
  onOpenDeletePostComment: jest.fn(),
  postCommentsPage: 1,
  totalPostCommentPages: 1,
  postCommentsPageSize: 10,
  onPostCommentsPageChange: jest.fn(),
  onPostCommentsPageSizeChange: jest.fn(),
  ...overrides,
});

describe('AdminContentPostCommentsTab', () => {
  it('renders feedback, filters, empty content, and loading state', () => {
    const props = makeProps({
      postCommentsErrorMessage: 'Could not load comments',
      postCommentsSuccessMessage: 'Comment updated',
    });
    const { rerender } = render(<AdminContentPostCommentsTab {...props} />);

    expect(screen.getByText('Could not load comments')).toBeInTheDocument();
    expect(screen.getByText('Comment updated')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.modals.post.comments.empty')).toBeInTheDocument();

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'PENDING' },
    });
    fireEvent.change(screen.getByPlaceholderText('adminAccount.content.modals.post.comments.queryPlaceholder'), {
      target: { value: 'author' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.comments.filters.query' }));
    expect(props.onPostCommentsStatusFilterChange).toHaveBeenCalledWith('PENDING');
    expect(props.onPostCommentsFilterQueryChange).toHaveBeenCalledWith('author');
    expect(props.onClearPostCommentsFilterQuery).toHaveBeenCalledTimes(1);

    rerender(<AdminContentPostCommentsTab {...props} isPostCommentsLoading postCommentsTotal={1} />);
    expect(screen.getByRole('status', { name: 'adminAccount.comments.loading' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'next comment page' })).not.toBeInTheDocument();
  });

  it('supports bulk selection and per-comment moderation actions', () => {
    const props = makeProps({
      postCommentsTotal: comments.length,
      postComments: comments,
      hasSelectedPostComments: true,
      selectedPostCommentIDs: ['comment-pending', 'comment-approved'],
      postCommentsPage: 2,
      totalPostCommentPages: 3,
    });
    const { rerender } = render(<AdminContentPostCommentsTab {...props} />);

    expect(screen.getAllByText('adminAccount.comments.list.rootLabel')).toHaveLength(2);
    expect(screen.getAllByText('adminAccount.comments.list.replyLabel')).toHaveLength(2);
    expect(screen.getByText('adminAccount.comments.list.updatedAt: date:2026-10-02T09:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.comments.list.updatedAt: date:2026-10-06T09:00:00Z')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);

    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.comments.bulk.selectAll' }));
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.comments.bulk.clearSelection' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.comments.actions.approve' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.comments.actions.reject' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.comments.actions.spam' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.comments.actions.delete' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'next comment page' }));
    fireEvent.click(screen.getByRole('button', { name: 'increase comment page size' }));
    expect(props.onToggleVisiblePostCommentsSelection).toHaveBeenCalledTimes(1);
    expect(props.onClearSelectedPostCommentIDs).toHaveBeenCalledTimes(1);
    expect(props.onBulkApprove).toHaveBeenCalledTimes(1);
    expect(props.onBulkReject).toHaveBeenCalledTimes(1);
    expect(props.onBulkSpam).toHaveBeenCalledTimes(1);
    expect(props.onOpenBulkDelete).toHaveBeenCalledTimes(1);
    expect(props.onPostCommentsPageChange).toHaveBeenCalledWith(3);
    expect(props.onPostCommentsPageSizeChange).toHaveBeenCalledWith(20);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Pending author' }));
    const pendingCard = screen.getByText('Pending comment body').closest<HTMLElement>('.admin-comments-card');
    expect(pendingCard).not.toBeNull();
    fireEvent.click(within(pendingCard!).getByRole('button', { name: 'adminAccount.comments.actions.approve' }));
    fireEvent.click(within(pendingCard!).getByRole('button', { name: 'adminAccount.comments.actions.reject' }));
    fireEvent.click(within(pendingCard!).getByRole('button', { name: 'adminAccount.comments.actions.spam' }));
    fireEvent.click(within(pendingCard!).getByRole('button', { name: 'adminAccount.comments.actions.delete' }));
    expect(props.onTogglePostCommentSelection).toHaveBeenCalledWith('comment-pending', false);
    expect(props.onUpdatePostCommentStatus).toHaveBeenNthCalledWith(1, 'comment-pending', 'APPROVED');
    expect(props.onUpdatePostCommentStatus).toHaveBeenNthCalledWith(2, 'comment-pending', 'REJECTED');
    expect(props.onUpdatePostCommentStatus).toHaveBeenNthCalledWith(3, 'comment-pending', 'SPAM');
    expect(props.onOpenDeletePostComment).toHaveBeenCalledWith(comments[0]);

    rerender(<AdminContentPostCommentsTab {...props} allVisiblePostCommentsSelected isBulkPostCommentActionPending />);
    expect(screen.getByRole('button', { name: 'adminAccount.comments.bulk.selectAll' })).toBeDisabled();
  });

  it('displays pending bulk and individual actions without invoking disabled controls', () => {
    const props = makeProps({
      postCommentsTotal: comments.length,
      postComments: comments,
      hasSelectedPostComments: true,
      selectedPostCommentIDs: ['comment-pending'],
      isBulkPostCommentActionPending: true,
      bulkPostCommentActionStatus: 'APPROVED',
      isBulkPostCommentDeleting: true,
      postCommentActionID: 'comment-pending',
      postCommentActionStatus: 'APPROVED',
      deletingPostCommentID: 'comment-pending',
    });
    const { rerender } = render(<AdminContentPostCommentsTab {...props} />);

    expect(screen.getAllByText('adminAccount.comments.actions.updating')).toHaveLength(2);
    expect(screen.getAllByText('adminAccount.comments.actions.deleting')).toHaveLength(2);
    expect(screen.getByRole('checkbox', { name: 'Pending author' })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'adminAccount.comments.actions.updating' })[0]).toBeDisabled();

    rerender(
      <AdminContentPostCommentsTab
        {...props}
        bulkPostCommentActionStatus="REJECTED"
        postCommentActionStatus="REJECTED"
        isBulkPostCommentDeleting={false}
        deletingPostCommentID=""
      />,
    );
    expect(screen.getAllByText('adminAccount.comments.actions.updating')).toHaveLength(2);

    rerender(
      <AdminContentPostCommentsTab
        {...props}
        bulkPostCommentActionStatus="SPAM"
        postCommentActionStatus="SPAM"
        isBulkPostCommentDeleting={false}
        deletingPostCommentID=""
      />,
    );
    expect(screen.getAllByText('adminAccount.comments.actions.updating')).toHaveLength(2);
  });
});
