import { patchAdminCommentsForEvent } from '@/lib/adminCommentEvents';
import type { AdminCommentEvent, AdminCommentItem } from '@/lib/adminApi';

const buildComment = (overrides: Partial<AdminCommentItem> = {}): AdminCommentItem => ({
  id: 'comment-1',
  postId: 'alpha-post',
  postTitle: 'Alpha Post',
  parentId: null,
  authorName: 'Alice',
  authorEmail: 'alice@example.com',
  content: 'First comment',
  status: 'PENDING',
  createdAt: '2026-03-16T10:00:00.000Z',
  updatedAt: '2026-03-16T10:00:00.000Z',
  ...overrides,
});

const buildEvent = (overrides: Partial<AdminCommentEvent> = {}): AdminCommentEvent => ({
  type: 'CREATED',
  postId: 'alpha-post',
  commentId: 'comment-1',
  parentId: null,
  status: 'PENDING',
  comment: buildComment(),
  ...overrides,
});

describe('adminCommentEvents', () => {
  it('forces refetch when search or pagination state makes patching unsafe', () => {
    expect(
      patchAdminCommentsForEvent([], 0, buildEvent(), {
        statusFilter: 'all',
        query: 'alice',
        page: 1,
        pageSize: 10,
      }),
    ).toEqual({
      items: [],
      total: 0,
      shouldRefetch: true,
    });

    expect(
      patchAdminCommentsForEvent([], 0, buildEvent(), {
        statusFilter: 'all',
        query: '   ',
        page: 2,
        pageSize: 10,
      }),
    ).toEqual({
      items: [],
      total: 0,
      shouldRefetch: true,
    });
  });

  it('patches created events locally when the comment matches the active filter', () => {
    const result = patchAdminCommentsForEvent([], 1, buildEvent(), {
      statusFilter: 'all',
      query: '',
      page: 1,
      pageSize: 10,
    });

    expect(result).toEqual({
      items: [buildComment()],
      total: 2,
      shouldRefetch: false,
    });
  });

  it('sorts created comments deterministically and trims to page size', () => {
    const older = buildComment({
      id: 'comment-older',
      createdAt: '2026-03-16T09:00:00.000Z',
    });
    const sameTimeHigherId = buildComment({
      id: 'comment-zeta',
      createdAt: '2026-03-16T10:00:00.000Z',
    });
    const sameTimeLowerId = buildComment({
      id: 'comment-alpha',
      createdAt: '2026-03-16T10:00:00.000Z',
    });

    const result = patchAdminCommentsForEvent(
      [older, sameTimeHigherId],
      2,
      buildEvent({ comment: sameTimeLowerId, commentId: 'comment-alpha' }),
      {
        statusFilter: 'all',
        query: '',
        page: 1,
        pageSize: 2,
      },
    );

    expect(result).toEqual({
      items: [sameTimeLowerId, sameTimeHigherId],
      total: 3,
      shouldRefetch: false,
    });
  });

  it('keeps totals stable for duplicate created events and ignores filtered-out statuses', () => {
    const existing = buildComment();

    expect(
      patchAdminCommentsForEvent([existing], 1, buildEvent(), {
        statusFilter: 'all',
        query: '',
        page: 1,
        pageSize: 10,
      }),
    ).toEqual({
      items: [existing],
      total: 1,
      shouldRefetch: false,
    });

    expect(
      patchAdminCommentsForEvent(
        [],
        1,
        buildEvent({ status: 'APPROVED', comment: buildComment({ status: 'APPROVED' }) }),
        {
          statusFilter: 'PENDING',
          query: '',
          page: 1,
          pageSize: 10,
        },
      ),
    ).toEqual({
      items: [],
      total: 1,
      shouldRefetch: false,
    });
  });

  it('refetches when created or updated events do not include a comment payload', () => {
    expect(
      patchAdminCommentsForEvent([], 0, buildEvent({ comment: null }), {
        statusFilter: 'all',
        query: '',
        page: 1,
        pageSize: 10,
      }),
    ).toEqual({
      items: [],
      total: 0,
      shouldRefetch: true,
    });

    expect(
      patchAdminCommentsForEvent([], 0, buildEvent({ type: 'UPDATED', comment: null }), {
        statusFilter: 'all',
        query: '',
        page: 1,
        pageSize: 10,
      }),
    ).toEqual({
      items: [],
      total: 0,
      shouldRefetch: true,
    });
  });

  it('updates, removes, and conditionally refetches for updated events', () => {
    const existing = buildComment();
    const approved = buildComment({
      status: 'APPROVED',
      content: 'Approved comment',
      updatedAt: '2026-03-16T10:10:00.000Z',
    });

    expect(
      patchAdminCommentsForEvent(
        [existing],
        1,
        buildEvent({
          type: 'UPDATED',
          status: 'APPROVED',
          comment: approved,
        }),
        {
          statusFilter: 'all',
          query: '',
          page: 1,
          pageSize: 10,
        },
      ),
    ).toEqual({
      items: [approved],
      total: 1,
      shouldRefetch: false,
    });

    expect(
      patchAdminCommentsForEvent(
        [existing],
        1,
        buildEvent({
          type: 'UPDATED',
          status: 'APPROVED',
          comment: approved,
        }),
        {
          statusFilter: 'PENDING',
          query: '',
          page: 1,
          pageSize: 10,
        },
      ),
    ).toEqual({
      items: [],
      total: 0,
      shouldRefetch: false,
    });

    expect(
      patchAdminCommentsForEvent(
        [],
        1,
        buildEvent({
          type: 'UPDATED',
          status: 'APPROVED',
          comment: approved,
        }),
        {
          statusFilter: 'all',
          query: '',
          page: 1,
          pageSize: 10,
        },
      ),
    ).toEqual({
      items: [],
      total: 1,
      shouldRefetch: false,
    });

    expect(
      patchAdminCommentsForEvent(
        [],
        1,
        buildEvent({
          type: 'UPDATED',
          status: 'APPROVED',
          comment: approved,
        }),
        {
          statusFilter: 'PENDING',
          query: '',
          page: 1,
          pageSize: 10,
        },
      ),
    ).toEqual({
      items: [],
      total: 1,
      shouldRefetch: true,
    });
  });

  it('patches deleted events and leaves count-changed as a no-op', () => {
    const existing = buildComment();

    expect(
      patchAdminCommentsForEvent(
        [existing],
        1,
        buildEvent({
          type: 'DELETED',
          comment: null,
          status: 'PENDING',
        }),
        {
          statusFilter: 'all',
          query: '',
          page: 1,
          pageSize: 10,
        },
      ),
    ).toEqual({
      items: [],
      total: 0,
      shouldRefetch: false,
    });

    expect(
      patchAdminCommentsForEvent(
        [],
        1,
        buildEvent({
          type: 'DELETED',
          comment: null,
          status: 'APPROVED',
        }),
        {
          statusFilter: 'PENDING',
          query: '',
          page: 1,
          pageSize: 10,
        },
      ),
    ).toEqual({
      items: [],
      total: 1,
      shouldRefetch: false,
    });

    expect(
      patchAdminCommentsForEvent(
        [existing],
        1,
        buildEvent({
          type: 'COUNT_CHANGED',
          comment: existing,
        }),
        {
          statusFilter: 'all',
          query: '',
          page: 1,
          pageSize: 10,
        },
      ),
    ).toEqual({
      items: [existing],
      total: 1,
      shouldRefetch: false,
    });
  });
});
