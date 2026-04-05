'use client';

export type LocaleFilterValue = 'all' | 'en' | 'tr';
export type SupportedContentLocale = 'en' | 'tr';
export type TopicEditorMode = 'create' | 'update';
export type CategoryEditorMode = 'create' | 'update';

export const CONTENT_LOCALES: SupportedContentLocale[] = ['en', 'tr'];
export const CONTENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,127}$/;
export const FILTER_QUERY_DEBOUNCE_MS = 220;

export const normalizeLocaleValue = (value: string): LocaleFilterValue => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'tr') {
    return 'tr';
  }
  if (normalized === 'en') {
    return 'en';
  }

  return 'all';
};
