import { calculateReadingTime, formatReadingTime, getWordsFromMarkdown } from '@/lib/readingTime';

describe('readingTime utilities', () => {
  const t = ((key: string, options?: { count?: number; ns?: string }) => {
    if (key === 'common.readingTime.fifteenPlus' && options?.ns === 'common') {
      return '15+ min read';
    }
    if (key === 'common.readingTime.minute' && options?.ns === 'common') {
      return `${options?.count ?? 0} min read`;
    }
    return key;
  }) as any;

  const tTr = ((key: string, options?: { count?: number; ns?: string }) => {
    if (key === 'common.readingTime.fifteenPlus' && options?.ns === 'common') {
      return '15+ dk okuma';
    }
    if (key === 'common.readingTime.minute' && options?.ns === 'common') {
      return `${options?.count ?? 0} dk okuma`;
    }
    return key;
  }) as any;

  describe('getWordsFromMarkdown', () => {
    it('strips code blocks, inline code, links and html tags', () => {
      const markdown = `
# Title

\`\`\`ts
const hidden = true;
\`\`\`

Inline \`code\` should be removed.
![alt-text](https://example.com/img.png)
[visible link](https://example.com)
<strong>bold html</strong>
`;

      const words = getWordsFromMarkdown(markdown);

      expect(words).toContain('Title');
      expect(words).toContain('Inline');
      expect(words).toContain('alt');
      expect(words).toContain('text');
      expect(words).toContain('visible');
      expect(words).toContain('bold');
      expect(words).not.toContain('hidden');
    });

    it('returns empty array when markdown has no valid words', () => {
      expect(getWordsFromMarkdown('### --- ...')).toEqual([]);
    });
  });

  describe('formatReadingTime', () => {
    it('returns capped value for long reads', () => {
      expect(formatReadingTime(20, t)).toBe('15+ min read');
      expect(formatReadingTime(20, tTr)).toBe('15+ dk okuma');
    });

    it('returns i18n-based non-capped values and respects minimum', () => {
      expect(formatReadingTime(3.2, t)).toBe('4 min read');
      expect(formatReadingTime(2.1, tTr)).toBe('3 dk okuma');
      expect(formatReadingTime(1, t, 1)).toBe('1 min read');
    });
  });

  describe('calculateReadingTime', () => {
    it('calculates reading time from markdown content', () => {
      const words = Array.from({ length: 1000 }, () => 'word').join(' ');
      expect(calculateReadingTime(words, t)).toBe('4 min read');
    });
  });
});
