import languageDetector from 'next-language-detector';
import i18nextConfig, { locales } from '@/i18n/settings';

// Configures the language detector with types
export default languageDetector({
  fallbackLng: i18nextConfig.i18n.defaultLocale, // Type inference handles this
  supportedLngs: locales, // Type inference handles this
});
