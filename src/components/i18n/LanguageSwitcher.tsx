// components/i18n/LanguageSwitcher.tsx
import NavDropdown from 'react-bootstrap/NavDropdown';
import i18nextConfig from '@/i18n/settings';
import LanguageSwitchLink from './LanguageSwitchLink';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useBoop from '@/hooks/useBoop';

const LanguageSwitcher = () => {
  const { t } = useTranslation('common');
  const [languageIconStyle, triggerLanguageIconBoop] = useBoop({ rotation: 10, scale: 1.08, timing: 170 });

  return (
    <NavDropdown
      title={
        <span className="nav-icon-boop" onMouseEnter={triggerLanguageIconBoop}>
          <FontAwesomeIcon icon="globe" className="icon-boop-target" style={languageIconStyle} />
          <span className="visually-hidden">{t('common.language')}</span>
        </span>
      }
      id="language-selector"
      className="text-center"
      align="start"
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
