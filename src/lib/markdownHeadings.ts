import React from 'react';
import { stripHtmlTags, stripMarkdownFormatting, stripMarkdownLinks } from '@/lib/markdownText';

export const slugifyHeading = (value: string) => {
  const normalized = value.trim().toLowerCase().normalize('NFKD');
  const slug: string[] = [];
  let previousWasSeparator = false;

  for (const character of normalized) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint >= 0x300 && codePoint <= 0x36f) {
      continue;
    }
    if (character === "'" || character === '"') {
      continue;
    }
    if ((codePoint >= 97 && codePoint <= 122) || (codePoint >= 48 && codePoint <= 57)) {
      slug.push(character);
      previousWasSeparator = false;
    } else if (slug.length > 0 && !previousWasSeparator) {
      slug.push('-');
      previousWasSeparator = true;
    }
  }

  if (slug.at(-1) === '-') {
    slug.pop();
  }
  return slug.join('') || 'section';
};

export const createHeadingSlugger = () => {
  const counts = new Map<string, number>();
  return (text: string) => {
    const base = slugifyHeading(text);
    const current = counts.get(base) ?? 0;
    counts.set(base, current + 1);
    return current === 0 ? base : `${base}-${current}`;
  };
};

export const flattenHeadingText = (value: React.ReactNode): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(flattenHeadingText).join('');
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(value)) {
    return flattenHeadingText(value.props.children);
  }

  return '';
};

export const buildHeadingIdMap = (content: string): Map<number, string> => {
  const slugHeading = createHeadingSlugger();
  const lines = content.split(/\r?\n/);
  const headingIds = new Map<number, string>();
  let inFence = false;
  let fenceToken: '```' | '~~~' | null = null;

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trimStart();
    const currentFence = trimmed.startsWith('```') ? '```' : trimmed.startsWith('~~~') ? '~~~' : null;

    if (currentFence) {
      if (!inFence) {
        inFence = true;
        fenceToken = currentFence;
      } else if (fenceToken === currentFence) {
        inFence = false;
        fenceToken = null;
      }
      continue;
    }

    if (inFence) {
      continue;
    }

    let headingLevel = 0;
    while (trimmed[headingLevel] === '#') {
      headingLevel += 1;
    }
    if (headingLevel === 0 || headingLevel > 6 || trimmed[headingLevel]?.trim() !== '') {
      continue;
    }
    let headingStart = headingLevel;
    while (trimmed[headingStart]?.trim() === '') {
      headingStart += 1;
    }
    const rawHeadingText = trimmed.slice(headingStart).trimEnd();
    if (!rawHeadingText) {
      continue;
    }

    const headingText = stripHtmlTags(
      stripMarkdownFormatting(stripMarkdownLinks(rawHeadingText, { allowEmptyDestination: true })),
    ).trim();
    if (!headingText) {
      continue;
    }

    headingIds.set(index + 1, slugHeading(headingText));
  }

  return headingIds;
};
