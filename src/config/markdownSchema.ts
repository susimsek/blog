import type { Schema } from 'hast-util-sanitize';
import { defaultSchema } from 'rehype-sanitize';

const markdownSchema: Schema = {
  ...defaultSchema,
  tagNames: Array.from(
    new Set([...(defaultSchema.tagNames ?? []), 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tfoot']),
  ),
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className'],
    a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel'],
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    pre: [...(defaultSchema.attributes?.pre ?? []), 'className'],
    img: [...(defaultSchema.attributes?.img ?? []), 'src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
  },
};

export default markdownSchema;
