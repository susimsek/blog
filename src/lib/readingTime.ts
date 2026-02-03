export const getWordsFromMarkdown = (markdown: string): string[] => {
  const withoutCodeBlocks = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<\/?[^>]+>/g, ' ');

  const normalized = withoutCodeBlocks.replace(/[^\p{L}\p{N}]+/gu, ' ');
  const matches = normalized.match(/\p{L}[\p{L}\p{N}'’_-]*/gu);
  return matches ?? [];
};

export const formatReadingTime = (minutes: number, locale: string, minMinutes: number = 3) => {
  const safeMinutes = Math.max(minMinutes, Math.ceil(minutes));

  // Practical display cap: beyond ~15 minutes, read-through rates typically drop.
  if (safeMinutes >= 15) {
    return locale === 'tr' ? '15+ dk okuma' : '15+ min read';
  }

  if (locale === 'tr') {
    return `${safeMinutes} dk okuma`;
  }
  return `${safeMinutes} min read`;
};

export const calculateReadingTime = (markdown: string, locale: string) => {
  const words = getWordsFromMarkdown(markdown);
  // Aim for the practical ranges:
  // - ~200–250 words ≈ 1 minute
  // - ~600–1,700 words ≈ 3–7 minutes
  // - ~1,800–3,000 words ≈ 8–12 minutes
  // - 3,500+ words ≈ 15+ minutes
  const wordsPerMinute = 250;
  const minutes = words.length / wordsPerMinute;
  return formatReadingTime(minutes, locale, 3);
};
