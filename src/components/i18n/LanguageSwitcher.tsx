// components/i18n/LanguageSwitcher.tsx
import { useRouter } from 'next/router';
import { NavDropdown } from 'react-bootstrap';
import i18nextConfig from '../../../next-i18next.config';
import LanguageSwitchLink from './LanguageSwitchLink';
import { useTranslation } from 'next-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const LanguageSwitcher = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const currentLocale = router.query.locale || i18nextConfig.i18n.defaultLocale;

  return (
    <NavDropdown
      title={
        <span>
          <FontAwesomeIcon icon="globe" className="me-2" />
          {t('common.language')}
        </span>
      }
      id="language-selector"
    >
      {i18nextConfig.i18n.locales
        .filter(locale => locale !== currentLocale)
        .map(locale => (
          <NavDropdown.Item key={locale}>
            <LanguageSwitchLink locale={locale} />
          </NavDropdown.Item>
        ))}
    </NavDropdown>
  );
};

export default LanguageSwitcher;
