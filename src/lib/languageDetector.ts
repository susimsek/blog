import languageDetector from 'next-language-detector';
import i18nextConfig from '../../next-i18next.config';

// Configures the language detector with types
export default languageDetector({
  fallbackLng: i18nextConfig.i18n.defaultLocale as string, // Ensuring it's a string type
  supportedLngs: i18nextConfig.i18n.locales as string[], // Ensuring it's an array of strings
});
