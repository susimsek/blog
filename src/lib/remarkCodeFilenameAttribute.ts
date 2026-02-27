type MarkdownNode = {
  type: string;
  children?: MarkdownNode[];
  meta?: string | null;
  data?: {
    hProperties?: Record<string, unknown>;
  };
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

const extractFilename = (meta: string | null | undefined): string | null => {
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

const visit = (node: MarkdownNode): void => {
  if (node.type === 'code') {
    const filename = extractFilename(node.meta);
    if (filename) {
      node.data ??= {};
      node.data.hProperties ??= {};
      if (!node.data.hProperties['data-filename']) {
        node.data.hProperties['data-filename'] = filename;
      }
    }
  }

  for (const child of node.children ?? []) {
    visit(child);
  }
};

const remarkCodeFilenameAttribute = () => (tree: MarkdownNode) => {
  visit(tree);
};

export default remarkCodeFilenameAttribute;
