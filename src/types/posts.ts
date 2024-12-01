export type PostSummary = {
  id: string;
  title: string;
  date: string;
  summary: string;
  thumbnail?: string;
  topics?: string[];
};

export type Post = PostSummary & {
  contentHtml?: string;
};
