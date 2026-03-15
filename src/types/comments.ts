export type CommentItem = {
  id: string;
  parentId?: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export type CommentThread = {
  root: CommentItem;
  replies: CommentItem[];
};
