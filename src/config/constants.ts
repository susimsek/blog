// config/constants.ts

export const isBrowser = typeof window !== 'undefined';

export const isDev = process.env.NODE_ENV === 'development';

export const isProd = process.env.NODE_ENV === 'production';

export const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || '';
