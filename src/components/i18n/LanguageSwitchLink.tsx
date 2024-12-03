import { useRouter } from 'next/router';
import { Button } from 'react-bootstrap';
import languageDetector from '@/lib/languageDetector';

interface LanguageSwitchLinkProps {
  locale: string;
  href?: string;
}

const LanguageSwitchLink: React.FC<LanguageSwitchLinkProps> = ({ locale, href }) => {
  const router = useRouter();

  let currentHref = href ?? router.asPath;
  let currentPath = router.pathname;

  Object.keys(router.query).forEach(key => {
    if (key === 'locale') {
      currentPath = currentPath.replace(`[${key}]`, locale);
      return;
    }
    currentPath = currentPath.replace(`[${key}]`, String(router.query[key]));
  });

  if (href && !href.startsWith('http')) {
    // Check if the URL is internal
    if (locale) {
      currentHref = `/${locale}${href}`;
    }
  }

  if (!currentHref.startsWith(`/${locale}`) && !href?.startsWith('http')) {
    currentHref = `/${locale}${currentHref}`;
  }

  return (
    <Button
      variant="link"
      size="sm"
      className="button-link"
      onClick={() => {
        languageDetector.cache?.(locale);
        router.push(currentHref);
      }}
    >
      {locale.toUpperCase()}
    </Button>
  );
};

export default LanguageSwitchLink;
