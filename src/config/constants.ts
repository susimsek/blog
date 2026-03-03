// config/constants.ts
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

export const isBrowser = globalThis.window !== undefined;

// Use nullish coalescing operator instead of logical OR
export const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? '';

// Google Analytics ID
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

export const AUTHOR_NAME = 'Şuayb Şimşek';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suaybsimsek.com';

// 🆕 Site Logo (for Open Graph, Structured Data, etc.)
export const SITE_LOGO = `${assetPrefix}/images/logo.webp`;

// Constant for avatar link
export const AVATAR_LINK = `${assetPrefix}/images/profile.webp`;

// Static contact links
export const CONTACT_LINKS = {
  email: 'suaybsimsek58@gmail.com',
  linkedin: 'https://linkedin.com/in/şuayb-şimşek-29b077178',
  medium: 'https://medium.com/@suaybsimsek58',
  github: 'https://github.com/susimsek',
};

export const SOCIAL_MEDIA_NAMES = {
  linkedin: 'LinkedIn',
  medium: 'Medium',
  github: 'GitHub',
};

export const LOCALES = {
  tr: { name: 'Türkçe', locale: 'tr', ogLocale: 'tr_TR' },
  en: { name: 'English', locale: 'en', ogLocale: 'en_US' },
};

export type ThemeKey = 'light' | 'dark' | 'oceanic' | 'forest';

type ThemeOption = {
  key: ThemeKey;
  label: string;
  icon: IconProp;
};

export const THEMES: ReadonlyArray<ThemeOption> = [
  {
    key: 'light',
    label: 'common.header.theme.light',
    icon: 'sun',
  },
  {
    key: 'dark',
    label: 'common.header.theme.dark',
    icon: 'moon',
  },
  {
    key: 'oceanic',
    label: 'common.header.theme.oceanic',
    icon: 'water',
  },
  {
    key: 'forest',
    label: 'common.header.theme.forest',
    icon: 'leaf',
  },
] as const;

// Constant for professional experience start year
export const EXPERIENCE_START_YEAR = 2018;

export const LAUNCH_YEAR = 2024;

// Twitter username
export const TWITTER_USERNAME = '@suaybsimsek58';

// 🎨 Fixed color palette for topic badges.
export const TOPIC_COLORS = [
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
] as const;
