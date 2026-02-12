import type { TFunction } from 'i18next';

export const getWordsFromMarkdown = (markdown: string): string[] => {
  const withoutCodeBlocks = markdown
    .replaceAll(/```[\s\S]*?```/g, ' ')
    .replaceAll(/~~~[\s\S]*?~~~/g, ' ')
    .replaceAll(/`[^`]*`/g, ' ')
    .replaceAll(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replaceAll(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replaceAll(/<\/?[^>]+>/g, ' ');

  const normalized = withoutCodeBlocks.replaceAll(/[^\p{L}\p{N}]+/gu, ' ');
  const matches = normalized.match(/\p{L}[\p{L}\p{N}'’_-]*/gu);
  return matches ?? [];
};

export const formatReadingTime = (minutes: number, t: TFunction, minMinutes: number = 1) => {
  const safeMinutes = Math.max(minMinutes, Math.ceil(minutes));

  // Practical display cap: beyond ~15 minutes, read-through rates typically drop.
  if (safeMinutes >= 15) {
    return t('common.readingTime.fifteenPlus', { ns: 'common' });
  }

  return t('common.readingTime.minute', { ns: 'common', count: safeMinutes });
};

export const parseReadingTimeToMinutes = (readingTime: string): number | null => {
  const normalized = readingTime.trim();
  if (!normalized) {
    return null;
  }

  const match = /(\d+)/.exec(normalized);
  if (!match) {
    return null;
  }

  const minutes = Number(match[1]);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }

  return minutes;
};

export const calculateReadingTimeMinutes = (markdown: string, minMinutes: number = 3) => {
  const words = getWordsFromMarkdown(markdown);
  // Aim for the practical ranges:
  // - ~200–250 words ≈ 1 minute
  // - ~600–1,700 words ≈ 3–7 minutes
  // - ~1,800–3,000 words ≈ 8–12 minutes
  // - 3,500+ words ≈ 15+ minutes
  const wordsPerMinute = 250;
  const minutes = words.length / wordsPerMinute;
  return Math.max(minMinutes, Math.ceil(minutes));
};

// Backward-compatible helper for places still needing a localized display string.
export const calculateReadingTime = (markdown: string, t: TFunction, minMinutes: number = 3) =>
  formatReadingTime(calculateReadingTimeMinutes(markdown, minMinutes), t);
