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

export type CommentViewer = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider?: string;
};
