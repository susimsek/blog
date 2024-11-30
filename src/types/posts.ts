// types/posts.ts
export type Post = {
  id: string;
  title: string;
  date: string;
  summary: string;
  contentHtml?: string;
  thumbnail?: string;
  topics?: string[];
};
