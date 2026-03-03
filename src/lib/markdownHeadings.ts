import React from 'react';

export const slugifyHeading = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '');

  const collapsed = normalized
    .replaceAll(/['"]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+/g, '')
    .replaceAll(/-+$/g, '')
    .replaceAll(/-+/g, '-');

  return collapsed || 'section';
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

const stripMarkdownFormatting = (value: string) =>
  value
    .replaceAll(/!\[([^\]]*)]\([^)]*\)/g, '$1')
    .replaceAll(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replaceAll(/`([^`]+)`/g, '$1')
    .replaceAll(/(\*\*|__)(.*?)\1/g, '$2')
    .replaceAll(/(\*|_)(.*?)\1/g, '$2')
    .replaceAll(/~~(.*?)~~/g, '$1')
    .replaceAll(/<[^>]+>/g, '')
    .trim();

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

    const headingMatch = /^(#{1,6})\s+(.+?)\s*$/.exec(trimmed);
    if (!headingMatch) {
      continue;
    }

    const headingText = stripMarkdownFormatting(headingMatch[2] ?? '');
    if (!headingText) {
      continue;
    }

    headingIds.set(index + 1, slugHeading(headingText));
  }

  return headingIds;
};
