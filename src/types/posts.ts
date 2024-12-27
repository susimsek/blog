export type Topic = {
  id: string;
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
  readingTime: string;
};

export type Post = PostSummary & {
  contentHtml?: string;
};
