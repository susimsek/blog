// config/constants.ts

export const isBrowser = typeof window !== 'undefined';

export const isDev = process.env.NODE_ENV === 'development';

export const isProd = process.env.NODE_ENV === 'production';

// Use nullish coalescing operator instead of logical OR
export const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? '';

export const cacheTTL = 3600000;

export const AUTHOR_NAME = 'Şuayb Şimşek';

export const SITE_URL = 'https://suaybsimsek.com';

// Constant for avatar link
export const AVATAR_LINK = 'https://avatars.githubusercontent.com/u/46258776?v=4';

// Static contact links
export const CONTACT_LINKS = {
  email: 'mailto:suaybsimsek58@gmail.com',
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
  tr: { name: 'Türkçe', locale: 'tr' },
  en: { name: 'English', locale: 'en' },
};

export const THEMES = [
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
];

// Constant for professional experience start year
export const EXPERIENCE_START_YEAR = 2018;

export const LAUNCH_YEAR = 2024;
