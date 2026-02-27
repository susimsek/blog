import { buildPostSearchText, normalizeSearchText, topicMatchesQuery } from '@/lib/searchText';

describe('searchText helpers', () => {
  it('normalizes Turkish characters and punctuation', () => {
    expect(normalizeSearchText('IĞDIR, Çeşme!')).toBe('igdir cesme');
  });

  it('builds post search text and ignores invalid topic entries', () => {
    const searchText = buildPostSearchText({
      title: 'React 19',
      summary: 'Compiler updates',
      topics: [null as unknown as { name: string }, { name: '' } as { name: string }, { name: 'Hooks' }],
    });

    expect(searchText).toBe('react 19 compiler updates hooks');
  });

  it('builds post search text when topics are missing', () => {
    expect(
      buildPostSearchText({
        title: 'React 19',
        summary: 'Compiler updates',
        topics: undefined,
      }),
    ).toBe('react 19 compiler updates');
  });

  it('matches topics with normalized queries and treats empty query as wildcard', () => {
    expect(topicMatchesQuery({ name: 'Çeşme İpuçları' }, 'cesme')).toBe(true);
    expect(topicMatchesQuery({ name: 'React' }, '')).toBe(true);
    expect(topicMatchesQuery({ name: 'React' }, 'vue')).toBe(false);
  });
});
