// next-i18next.config.js
const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  debug: isDev,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr'],
  },
  localePath: typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales',
  reloadOnPrerender: isDev,
};
