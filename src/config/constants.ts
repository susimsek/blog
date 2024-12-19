// config/constants.ts

export const isBrowser = typeof window !== 'undefined';

export const isDev = process.env.NODE_ENV === 'development';

export const isProd = process.env.NODE_ENV === 'production';

// Use nullish coalescing operator instead of logical OR
export const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? '';

export const AUTHOR_NAME = 'Şuayb Şimşek';

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
  tr: { name: 'Türkçe', flagCode: 'tr' },
  en: { name: 'English', flagCode: 'gb' },
};
