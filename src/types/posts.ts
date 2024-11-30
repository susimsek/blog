export type PostMeta = {
  title: string;
  date: string;
  summary: string;
  thumbnail?: string;
  topics?: string[];
};

export type Post = PostMeta & {
  id: string;
  contentHtml?: string;
};
