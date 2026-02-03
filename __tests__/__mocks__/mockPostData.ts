import { PostSummary, Post, Topic } from '@/types/posts';

export const mockTopic: Topic = {
  id: 'react',
  name: 'React',
  color: 'red',
};

export const mockPost: Post = {
  id: '1',
  title: 'Test Post',
  date: '2024-12-03',
  contentHtml: '<p>Test Content</p>',
  readingTime: '3 min read',
  thumbnail: '/test-thumbnail.jpg',
  topics: [mockTopic, { id: 'testing', name: 'Testing', color: 'green' }],
  summary: 'Test summary',
};

export const mockPost2: Post = {
  id: '1',
  title: 'Another Test Post',
  date: '2024-12-03',
  contentHtml: '<p>Another Test Content</p>',
  readingTime: '3 min read',
  thumbnail: '/test-thumbnail.jpg',
  topics: [mockTopic, { id: 'testing', name: 'Testing', color: 'green' }],
  summary: 'Another Test summary',
};

export const mockPostSummary: PostSummary = {
  id: '1',
  title: 'Test Post',
  date: '2024-12-03',
  thumbnail: '/test-thumbnail.jpg',
  readingTime: '3 min read',
  topics: [mockTopic, { id: 'testing', name: 'Testing', color: 'green' }],
  summary: 'Test summary',
};

export const mockPostWithoutContent: Post = {
  ...mockPost,
  contentHtml: undefined,
};

export const mockPosts: Post[] = [mockPost, mockPost2];

export const mockTopicVue: Topic = {
  id: 'vue',
  name: 'Vue.js',
  color: 'purple',
};

export const mockTopics: Topic[] = [mockTopic, mockTopicVue];

export const mockPostSummaries: PostSummary[] = [
  {
    id: '1',
    title: 'Post 1',
    summary: 'Summary 1',
    date: '2024-12-03',
    readingTime: '3 min read',
    topics: [mockTopic, { id: 'testing', name: 'Testing', color: 'green' }],
  },
  { id: '2', title: 'Post 2', summary: 'Summary 2', date: '2023-11-03', readingTime: '3 min read' },
  { id: '3', title: 'Post 3', summary: 'Summary 3', date: '2023-10-01', readingTime: '3 min read' },
  { id: '4', title: 'Post 4', summary: 'Summary 4', date: '2023-09-15', readingTime: '3 min read' },
  { id: '5', title: 'Post 5', summary: 'Summary 5', date: '2023-08-20', readingTime: '3 min read' },
  { id: '6', title: 'Post 6', summary: 'Summary 6', date: '2023-07-10', readingTime: '3 min read' },
];

export const mockTopicIds: { params: { id: string; locale: string } }[] = [
  {
    params: {
      id: 'react',
      locale: 'en',
    },
  },
  {
    params: {
      id: 'react',
      locale: 'fr',
    },
  },
  {
    params: {
      id: 'react',
      locale: 'de',
    },
  },
  {
    params: {
      id: 'testing',
      locale: 'en',
    },
  },
  {
    params: {
      id: 'testing',
      locale: 'fr',
    },
  },
  {
    params: {
      id: 'testing',
      locale: 'de',
    },
  },
];
