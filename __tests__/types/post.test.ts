import { Post, PostSummary } from '@/types/posts';

describe('Post and PostSummary Types', () => {
  it('should allow a valid PostSummary object', () => {
    const postSummary: PostSummary = {
      id: '1',
      title: 'Sample Post',
      date: '2024-12-04',
      summary: 'This is a summary of the post.',
      thumbnail: '/images/sample.jpg',
      readingTimeMin: 3,
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
    expect(postSummary.readingTimeMin).toBe(3);
    expect(postSummary.topics).toHaveLength(2);
    expect(postSummary.topics?.[0].id).toBe('typescript');
    expect(postSummary.topics?.[0].name).toBe('TypeScript');
    expect(postSummary.topics?.[0].color).toBe('blue');
    expect(postSummary.topics?.[1].id).toBe('testing');
    expect(postSummary.topics?.[1].name).toBe('Testing');
    expect(postSummary.topics?.[1].color).toBe('green');
  });

  it('should allow a PostSummary with nullable thumbnail', () => {
    const postSummary: PostSummary = {
      id: '2',
      title: 'Another Post',
      date: '2024-12-04',
      summary: 'Another summary.',
      thumbnail: null,
      readingTimeMin: 4,
    };

    expect(postSummary.thumbnail).toBeNull();
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
      readingTimeMin: 5,
      topics: [
        { id: 'spring-boot', name: 'Spring Boot', color: 'blue' },
        { id: 'react', name: 'React', color: 'green' },
      ],
    };

    expect(post.contentHtml).toBe('<p>Full content of the post.</p>');
    expect(post.thumbnail).toBe('/images/full.jpg');
    expect(post.readingTimeMin).toBe(5);
    expect(post.topics).toHaveLength(2);
    expect(post.topics?.[0].id).toBe('spring-boot');
    expect(post.topics?.[0].name).toBe('Spring Boot');
    expect(post.topics?.[0].color).toBe('blue');
    expect(post.topics?.[1].id).toBe('react');
    expect(post.topics?.[1].name).toBe('React');
    expect(post.topics?.[1].color).toBe('green');
  });

  it('should allow a Post with nullable thumbnail', () => {
    const post: Post = {
      id: '4',
      title: 'Minimal Post',
      date: '2024-12-04',
      summary: 'Just the essentials.',
      thumbnail: null,
      readingTimeMin: 2,
    };

    expect(post.contentHtml).toBeUndefined();
    expect(post.thumbnail).toBeNull();
    expect(post.topics).toBeUndefined();
  });
});
