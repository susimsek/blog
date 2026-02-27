import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

type MarkdownNode = {
  type: string;
  meta?: string | null;
  position?: {
    start?: {
      line?: number;
    };
  };
  children?: MarkdownNode[];
};

const toTrimmed = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const extractMetaAttribute = (meta: string, key: string): string | null => {
  const quoted = new RegExp(String.raw`(?:^|\s|\{)${key}\s*=\s*("([^"]+)"|'([^']+)')`, 'i').exec(meta);
  if (quoted) {
    return toTrimmed(quoted[2] ?? quoted[3]);
  }

  const unquoted = new RegExp(String.raw`(?:^|\s|\{)${key}\s*=\s*([^\s}]+)`, 'i').exec(meta);
  return toTrimmed(unquoted?.[1] ?? null);
};

const extractFilenameFromMeta = (meta: string | null | undefined): string | null => {
  const normalizedMeta = toTrimmed(meta);
  if (!normalizedMeta) return null;

  const keys = ['filename', 'file', 'title', 'path'];
  for (const key of keys) {
    const value = extractMetaAttribute(normalizedMeta, key);
    if (value) return value;
  }

  if (!normalizedMeta.includes('=') && !normalizedMeta.includes('{') && !normalizedMeta.includes('}')) {
    if (/[./\\]/.test(normalizedMeta)) {
      return normalizedMeta;
    }
  }

  return null;
};

const visit = (node: MarkdownNode, map: Map<number, string>): void => {
  if (node.type === 'code') {
    const line = node.position?.start?.line;
    const filename = extractFilenameFromMeta(node.meta);
    if (typeof line === 'number' && filename) {
      map.set(line, filename);
    }
  }

  for (const child of node.children ?? []) {
    visit(child, map);
  }
};

export const extractCodeFilenameByStartLine = (markdown: string): Map<number, string> => {
  if (!markdown.trim()) return new Map<number, string>();

  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MarkdownNode;
  const map = new Map<number, string>();
  visit(tree, map);
  return map;
};
