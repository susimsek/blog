import { defaultLocale, type Locale } from '@/i18n/settings';
import type { PostCategoryRef } from '@/types/posts';
import categoriesEN from '@root/public/data/categories.en.json';
import categoriesTR from '@root/public/data/categories.tr.json';

type CategoryRecord = {
  id: string;
  name: string;
  color: string;
  icon?: string;
};

type CategoryPresentation = {
  slug: string;
  label: string;
  color: string;
  icon?: string;
};

export type PostCategoryItem = {
  id: string;
  name: string;
  color: string;
  icon?: string;
};

const allowedCategoryColors = new Set([
  'red',
  'green',
  'blue',
  'orange',
  'yellow',
  'purple',
  'gray',
  'brown',
  'pink',
  'cyan',
]);

const toCategoryMap = (raw: CategoryRecord[]): Map<string, CategoryRecord> => {
  const map = new Map<string, CategoryRecord>();

  for (const item of raw) {
    const id = typeof item?.id === 'string' ? item.id.trim().toLowerCase() : '';
    const name = typeof item?.name === 'string' ? item.name.trim() : '';
    const color = typeof item?.color === 'string' ? item.color.trim().toLowerCase() : '';
    const icon = typeof item?.icon === 'string' ? item.icon.trim() : '';
    if (!id || !name || !allowedCategoryColors.has(color)) {
      continue;
    }
    map.set(id, { id, name, color, icon: icon || undefined });
  }

  return map;
};

const categoryMapByLocale: Record<Locale, Map<string, CategoryRecord>> = {
  en: toCategoryMap(categoriesEN as CategoryRecord[]),
  tr: toCategoryMap(categoriesTR as CategoryRecord[]),
};

const categoryListByLocale: Record<Locale, PostCategoryItem[]> = {
  en: [...categoryMapByLocale.en.values()].map(category => ({
    id: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon,
  })),
  tr: [...categoryMapByLocale.tr.values()].map(category => ({
    id: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon,
  })),
};

export const normalizePostCategory = (value?: PostCategoryRef | string | null): string | null => {
  const rawID =
    typeof value === 'string'
      ? value
      : value && typeof value === 'object' && typeof value.id === 'string'
        ? value.id
        : null;
  if (typeof rawID !== 'string') {
    return null;
  }

  const normalized = rawID.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
};

export const getPostCategoryPresentation = (
  category?: PostCategoryRef | string | null,
  locale: string = defaultLocale,
) => {
  const normalized = normalizePostCategory(category);
  if (!normalized) {
    return null;
  }

  const language: Locale = locale.startsWith('tr') ? 'tr' : 'en';
  const categoryRecord = categoryMapByLocale[language].get(normalized);
  if (!categoryRecord) {
    return null;
  }

  const presentation: CategoryPresentation = {
    slug: categoryRecord.id,
    label: categoryRecord.name,
    color: categoryRecord.color,
    icon: categoryRecord.icon,
  };

  return presentation;
};

export const getPostCategoryLabel = (category?: PostCategoryRef | string | null, locale?: string): string | null =>
  getPostCategoryPresentation(category, locale)?.label ?? null;

export const getAllPostCategories = (locale: string = defaultLocale): PostCategoryItem[] => {
  const language: Locale = locale.startsWith('tr') ? 'tr' : 'en';
  return categoryListByLocale[language];
};
