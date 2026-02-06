export type Topic = {
  id: string;
  name: string;
  color: string;
  link?: string;
};

export type PostSummary = {
  id: string;
  title: string;
  date: string;
  summary: string;
  thumbnail: string | null;
  topics?: Topic[];
  readingTime: string;
  link?: string;
};

export type Post = PostSummary & {
  contentHtml?: string;
  contentCompressed?: string;
  contentEncoding?: 'lz-string-uri';
};
