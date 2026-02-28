import type { PostCategoryRef } from '@/types/posts';

export const normalizePostCategoryRef = (value: unknown): PostCategoryRef | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Partial<PostCategoryRef>;
  const id = typeof candidate.id === 'string' ? candidate.id.trim().toLowerCase() : '';
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  const color = typeof candidate.color === 'string' ? candidate.color.trim().toLowerCase() : 'blue';
  const icon = typeof candidate.icon === 'string' ? candidate.icon.trim() : '';

  if (!id || !name) {
    return undefined;
  }

  return { id, name, color: color || 'blue', ...(icon ? { icon } : {}) };
};
