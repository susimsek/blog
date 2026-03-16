export type CommentItem = {
  id: string;
  parentId?: string;
  authorName: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
};

export type CommentThread = {
  root: CommentItem;
  replies: CommentItem[];
};

export type CommentEventType = 'created' | 'updated' | 'deleted' | 'count-changed';

export type CommentEvent = {
  type: CommentEventType;
  postId: string;
  commentId: string;
  parentId?: string;
  status?: string;
  total?: number;
  comment?: CommentItem;
};

export type CommentViewer = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider?: string;
};
