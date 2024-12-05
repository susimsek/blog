export type Topic = {
  name: string;
  color: string;
};

export type PostSummary = {
  id: string;
  title: string;
  date: string;
  summary: string;
  thumbnail?: string;
  topics?: Topic[];
};

export type Post = PostSummary & {
  contentHtml?: string;
};
