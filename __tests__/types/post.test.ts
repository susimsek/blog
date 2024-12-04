import { Post, PostSummary } from '@/types/posts';

describe('Post and PostSummary Types', () => {
  it('should allow a valid PostSummary object', () => {
    const postSummary: PostSummary = {
      id: '1',
      title: 'Sample Post',
      date: '2024-12-04',
      summary: 'This is a summary of the post.',
      thumbnail: '/images/sample.jpg',
      topics: ['TypeScript', 'Testing'],
    };

    expect(postSummary.id).toBe('1');
    expect(postSummary.title).toBe('Sample Post');
    expect(postSummary.date).toBe('2024-12-04');
    expect(postSummary.summary).toBe('This is a summary of the post.');
    expect(postSummary.thumbnail).toBe('/images/sample.jpg');
    expect(postSummary.topics).toEqual(['TypeScript', 'Testing']);
  });

  it('should allow a PostSummary without optional fields', () => {
    const postSummary: PostSummary = {
      id: '2',
      title: 'Another Post',
      date: '2024-12-04',
      summary: 'Another summary.',
    };

    expect(postSummary.thumbnail).toBeUndefined();
    expect(postSummary.topics).toBeUndefined();
  });

  it('should allow a valid Post object', () => {
    const post: Post = {
      id: '3',
      title: 'Full Post',
      date: '2024-12-04',
      summary: 'A detailed post summary.',
      contentHtml: '<p>Full content of the post.</p>',
      thumbnail: '/images/full.jpg',
      topics: ['JavaScript', 'React'],
    };

    expect(post.contentHtml).toBe('<p>Full content of the post.</p>');
    expect(post.thumbnail).toBe('/images/full.jpg');
    expect(post.topics).toEqual(['JavaScript', 'React']);
  });

  it('should allow a Post without optional fields', () => {
    const post: Post = {
      id: '4',
      title: 'Minimal Post',
      date: '2024-12-04',
      summary: 'Just the essentials.',
    };

    expect(post.contentHtml).toBeUndefined();
    expect(post.thumbnail).toBeUndefined();
    expect(post.topics).toBeUndefined();
  });
});