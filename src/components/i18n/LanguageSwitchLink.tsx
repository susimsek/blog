import { usePathname, useRouter } from 'next/navigation';
import { isSupportedLocale } from '@/i18n/settings';
import { useLocale } from '@/i18n/useLocale';
import { localizePathname } from '@/components/common/Link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { LOCALES } from '@/config/constants';
import FlagIcon from '@/components/common/FlagIcon';

interface LanguageSwitchLinkProps {
  locale: string;
  href?: string;
}

const LanguageSwitchLink: React.FC<LanguageSwitchLinkProps> = ({ locale, href }) => {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const activeLocale = useLocale();
  const localeEntry = isSupportedLocale(locale) ? LOCALES[locale] : null;

  const handleClick = () => {
    if (!isSupportedLocale(locale)) {
      return;
    }

    const sourceUrl = new URL(href ?? pathname, globalThis.window.location.origin);
    const targetPath = localizePathname(sourceUrl.pathname, locale);
    const query = new URLSearchParams(href ? sourceUrl.search : globalThis.window.location.search);
    query.delete('locale');
    const queryString = query.toString();
    const hash = href ? sourceUrl.hash : globalThis.window.location.hash;

    router.replace(`${targetPath}${queryString ? `?${queryString}` : ''}${hash}`);
  };

  return (
    <button
      type="button"
      className="d-flex justify-content-between align-items-center w-100 px-2 border-0 bg-transparent"
      onClick={handleClick}
    >
      <span className="d-flex align-items-center">
        <FlagIcon
          className="language-switch-flag me-2"
          code={localeEntry?.locale ?? locale}
          alt={`${localeEntry?.name ?? locale} flag`}
        />
        {localeEntry?.name ?? locale}
      </span>
      {activeLocale === locale && <FontAwesomeIcon icon="circle-check" className="circle-check" />}
    </button>
  );
};

export default LanguageSwitchLink;
