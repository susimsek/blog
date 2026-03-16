import type { AdminCommentEvent, AdminCommentItem } from '@/lib/adminApi';

type AdminCommentStatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';

type AdminCommentEventContext = {
  statusFilter: AdminCommentStatusFilter;
  query: string;
  page: number;
  pageSize: number;
};

type AdminCommentEventPatch = {
  items: AdminCommentItem[];
  total: number;
  shouldRefetch: boolean;
};

const matchesStatusFilter = (
  status: AdminCommentItem['status'] | null | undefined,
  filter: AdminCommentStatusFilter,
) => {
  if (filter === 'all') {
    return Boolean(status);
  }

  return status === filter;
};

const sortComments = (items: AdminCommentItem[]) =>
  [...items].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();

    if (leftTime === rightTime) {
      return left.id.localeCompare(right.id);
    }

    return rightTime - leftTime;
  });

const upsertComment = (items: AdminCommentItem[], comment: AdminCommentItem, pageSize: number) => {
  const existingIndex = items.findIndex(item => item.id === comment.id);
  const nextItems =
    existingIndex >= 0 ? items.map(item => (item.id === comment.id ? comment : item)) : [comment, ...items];

  return sortComments(nextItems).slice(0, Math.max(1, pageSize));
};

export const patchAdminCommentsForEvent = (
  items: AdminCommentItem[],
  total: number,
  event: AdminCommentEvent,
  context: AdminCommentEventContext,
): AdminCommentEventPatch => {
  const normalizedQuery = context.query.trim();
  if (normalizedQuery !== '' || context.page > 1) {
    return {
      items,
      total,
      shouldRefetch: true,
    };
  }

  switch (event.type) {
    case 'CREATED': {
      if (!event.comment) {
        return { items, total, shouldRefetch: true };
      }

      if (!matchesStatusFilter(event.comment.status, context.statusFilter)) {
        return { items, total, shouldRefetch: false };
      }

      const exists = items.some(item => item.id === event.comment!.id);
      return {
        items: upsertComment(items, event.comment, context.pageSize),
        total: exists ? total : total + 1,
        shouldRefetch: false,
      };
    }

    case 'UPDATED': {
      if (!event.comment) {
        return { items, total, shouldRefetch: true };
      }

      const existingIndex = items.findIndex(item => item.id === event.comment!.id);
      const matchesFilter = matchesStatusFilter(event.comment.status, context.statusFilter);

      if (existingIndex >= 0) {
        if (!matchesFilter) {
          return {
            items: items.filter(item => item.id !== event.comment!.id),
            total: Math.max(0, total - 1),
            shouldRefetch: false,
          };
        }

        return {
          items: upsertComment(items, event.comment, context.pageSize),
          total,
          shouldRefetch: false,
        };
      }

      if (context.statusFilter === 'all') {
        return {
          items,
          total,
          shouldRefetch: false,
        };
      }

      return {
        items,
        total,
        shouldRefetch: true,
      };
    }

    case 'DELETED': {
      const removedItem = items.find(item => item.id === event.commentId);
      const matchesFilter = matchesStatusFilter(event.status ?? event.comment?.status, context.statusFilter);

      return {
        items: removedItem ? items.filter(item => item.id !== event.commentId) : items,
        total: matchesFilter ? Math.max(0, total - 1) : total,
        shouldRefetch: false,
      };
    }

    case 'COUNT_CHANGED':
    default:
      return {
        items,
        total,
        shouldRefetch: false,
      };
  }
};
