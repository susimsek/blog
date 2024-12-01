// components/theme/ThemeToggler.tsx
import { toggleTheme } from '@/reducers/theme';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';

const ThemeToggler = () => {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.theme.theme);

  return (
    <button
      className={`btn theme-toggle-btn d-flex align-items-center gap-2 ${theme}`}
      onClick={() => dispatch(toggleTheme())}
      aria-label={t('common.header.themeToggle')}
    >
      <FontAwesomeIcon icon={theme === 'light' ? 'moon' : 'sun'} />
      <span>{t(`common.header.theme.${theme}`)}</span>
    </button>
  );
};

export default ThemeToggler;
