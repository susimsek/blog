import languageDetector from 'next-language-detector';
import i18nextConfig from '../../next-i18next.config';

// Configures the language detector with types
export default languageDetector({
  fallbackLng: i18nextConfig.i18n.defaultLocale, // Type inference handles this
  supportedLngs: i18nextConfig.i18n.locales, // Type inference handles this
});
