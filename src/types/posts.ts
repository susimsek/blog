export type Topic = {
  id: string;
  name: string;
  color: string;
  link?: string;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  link?: string;
};

export type PostCategoryRef = {
  id: string;
  name: string;
};

export type PostSource = 'blog' | 'medium';

export type PostSummary = {
  id: string;
  title: string;
  category?: PostCategoryRef;
  publishedDate: string;
  updatedDate?: string;
  summary: string;
  searchText: string;
  thumbnail: string | null;
  topics?: Topic[];
  readingTimeMin: number;
  source?: PostSource;
  link?: string;
};

export type LayoutPostSummary = Pick<PostSummary, 'id' | 'title' | 'publishedDate' | 'updatedDate'> & {
  topics?: Topic[];
};

export type Post = PostSummary & {
  contentHtml?: string;
  contentCompressed?: string;
  contentEncoding?: 'lz-string-uri';
};
