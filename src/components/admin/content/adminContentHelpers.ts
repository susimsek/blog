import { assetPrefix, LOCALES } from '@/config/constants';
import type { AdminContentPostItem } from '@/lib/adminApi';

export type PostEditorTab = 'metadata' | 'content' | 'comments';
export type SupportedContentLocale = 'en' | 'tr';

export const CONTENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,127}$/;

const BOOTSTRAP_THEME_COLORS = new Set([
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'light',
  'dark',
]);

export const resolveLocaleLabel = (value: string) => {
  const resolved = value.trim().toLowerCase();
  if (resolved === 'tr') {
    return LOCALES.tr.name;
  }
  if (resolved === 'en') {
    return LOCALES.en.name;
  }
  return value.toUpperCase();
};

export const toTaxonomyKey = (item: { locale: string; id: string }) =>
  `${item.locale.toLowerCase()}|${item.id.toLowerCase()}`;

export const resolvePostEditorTab = (value?: string | null, allowContent = true): PostEditorTab => {
  const normalizedValue = value?.trim().toLowerCase();
  if (normalizedValue === 'comments') {
    return 'comments';
  }
  if (normalizedValue === 'content' && allowContent) {
    return 'content';
  }
  return 'metadata';
};

export const resolvePostLifecycleBadgeVariant = (status: AdminContentPostItem['status']) => {
  if (status === 'DRAFT') {
    return 'secondary';
  }
  if (status === 'SCHEDULED') {
    return 'warning';
  }
  return 'success';
};

export const resolveAdminContentThumbnailSrc = (value: string | null) => {
  const resolved = value?.trim() ?? '';
  if (!resolved) {
    return null;
  }
  if (/^https?:\/\//i.test(resolved)) {
    return resolved;
  }

  const normalizedPath = resolved.startsWith('/') ? resolved : `/${resolved}`;
  if (!assetPrefix) {
    return normalizedPath;
  }
  const normalizedPrefix = assetPrefix.endsWith('/') ? assetPrefix.slice(0, -1) : assetPrefix;
  return `${normalizedPrefix}${normalizedPath}`;
};

export const resolveAdminContentAccentColor = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'var(--active-color)';
  }
  const lowered = trimmed.toLowerCase();
  if (BOOTSTRAP_THEME_COLORS.has(lowered)) {
    return `var(--bs-${lowered})`;
  }
  return trimmed;
};

export const parseISODateInput = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!matched) {
    return null;
  }

  const [, yearRaw, monthRaw, dayRaw] = matched;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

export const toDateTimeLocalInputValue = (value: string | null) => {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsed.getDate()}`.padStart(2, '0');
  const hours = `${parsed.getHours()}`.padStart(2, '0');
  const minutes = `${parsed.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const fromDateTimeLocalInputValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

export const adminPreviewImageLoader = ({ src }: { src: string }) => src;

export const formatMediaSize = (sizeBytes: number, locale: string) => {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return '';
  }
  const numberFormatter = new Intl.NumberFormat(locale);
  if (sizeBytes < 1024) {
    return `${numberFormatter.format(sizeBytes)} B`;
  }
  if (sizeBytes < 1024 * 1024) {
    return `${numberFormatter.format(Math.max(1, Math.round(sizeBytes / 1024)))} KB`;
  }
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(sizeBytes / (1024 * 1024))} MB`;
};
