// components/i18n/LanguageSwitcher.tsx
import { NavDropdown } from 'react-bootstrap';
import i18nextConfig from '../../../next-i18next.config';
import LanguageSwitchLink from './LanguageSwitchLink';
import { useTranslation } from 'next-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const LanguageSwitcher = () => {
  const { t } = useTranslation('common');

  return (
    <NavDropdown
      title={
        <span>
          <FontAwesomeIcon icon="globe" className="me-2" />
          {t('common.language')}
        </span>
      }
      id="language-selector"
      className="text-center"
      align="end"
    >
      {i18nextConfig.i18n.locales.map(locale => (
        <NavDropdown.Item key={locale}>
          <LanguageSwitchLink locale={locale} />
        </NavDropdown.Item>
      ))}
    </NavDropdown>
  );
};

export default LanguageSwitcher;
