import { Post, PostSummary } from '@/types/posts';

describe('Post and PostSummary Types', () => {
  it('should allow a valid PostSummary object', () => {
    const postSummary: PostSummary = {
      id: '1',
      title: 'Sample Post',
      date: '2024-12-04',
      summary: 'This is a summary of the post.',
      thumbnail: '/images/sample.jpg',
      topics: [
        { id: 'typescript', name: 'TypeScript', color: 'blue' },
        { id: 'testing', name: 'Testing', color: 'green' },
      ],
    };

    expect(postSummary.id).toBe('1');
    expect(postSummary.title).toBe('Sample Post');
    expect(postSummary.date).toBe('2024-12-04');
    expect(postSummary.summary).toBe('This is a summary of the post.');
    expect(postSummary.thumbnail).toBe('/images/sample.jpg');
    expect(postSummary.topics).toHaveLength(2);
    expect(postSummary.topics?.[0].id).toBe('typescript');
    expect(postSummary.topics?.[0].name).toBe('TypeScript');
    expect(postSummary.topics?.[0].color).toBe('blue');
    expect(postSummary.topics?.[1].id).toBe('testing');
    expect(postSummary.topics?.[1].name).toBe('Testing');
    expect(postSummary.topics?.[1].color).toBe('green');
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
      topics: [
        { id: 'javascript', name: 'JavaScript', color: 'blue' },
        { id: 'react', name: 'React', color: 'green' },
      ],
    };

    expect(post.contentHtml).toBe('<p>Full content of the post.</p>');
    expect(post.thumbnail).toBe('/images/full.jpg');
    expect(post.topics).toHaveLength(2);
    expect(post.topics?.[0].id).toBe('javascript');
    expect(post.topics?.[0].name).toBe('JavaScript');
    expect(post.topics?.[0].color).toBe('blue');
    expect(post.topics?.[1].id).toBe('react');
    expect(post.topics?.[1].name).toBe('React');
    expect(post.topics?.[1].color).toBe('green');
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
