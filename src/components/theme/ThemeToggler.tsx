import React, { useCallback } from 'react';
import { resetToSystemTheme, setTheme, type Theme } from '@/reducers/theme';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { THEMES } from '@/config/constants';

const ThemeToggler = () => {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.theme.theme);
  const hasExplicitTheme = useAppSelector(state => state.theme.hasExplicitTheme);
  const isSystemTheme = !hasExplicitTheme;

  const handleThemeChange = useCallback(
    (selectedTheme: Theme) => {
      if (theme !== selectedTheme || !hasExplicitTheme) {
        dispatch(setTheme(selectedTheme));
      }
    },
    [theme, hasExplicitTheme, dispatch],
  );

  const handleSystemTheme = useCallback(() => {
    if (isSystemTheme) return;
    dispatch(resetToSystemTheme());
  }, [dispatch, isSystemTheme]);

  return (
    <NavDropdown
      title={
        <span>
          <FontAwesomeIcon icon="palette" className="me-2" />
          {t('common.theme')}
        </span>
      }
      id="theme-toggler-dropdown"
      className="text-center"
      align="end"
    >
      <NavDropdown.Item
        onClick={handleSystemTheme}
        aria-label={t('common.header.theme.system')}
        className={`d-flex align-items-center justify-content-between gap-2 ${isSystemTheme ? 'active-theme' : ''}`}
      >
        <div className="d-flex align-items-center flex-grow-1 gap-2">
          <FontAwesomeIcon icon="desktop" />
          <span className="text-truncate">{t('common.header.theme.system')}</span>
        </div>
        <FontAwesomeIcon
          icon="circle-check"
          className={`circle-check ms-2 flex-shrink-0 ${isSystemTheme ? '' : 'opacity-0'}`}
          aria-hidden={isSystemTheme ? undefined : true}
        />
      </NavDropdown.Item>
      <NavDropdown.Divider />
      {THEMES.map(({ key, label, icon }) => {
        const isActive = hasExplicitTheme && theme === key;

        return (
          <NavDropdown.Item
            key={key}
            onClick={() => handleThemeChange(key)}
            aria-label={t(label)}
            className={`d-flex align-items-center justify-content-between gap-2 ${isActive ? 'active-theme' : ''}`}
          >
            <div className="d-flex align-items-center flex-grow-1 gap-2">
              <FontAwesomeIcon icon={icon} className={icon === 'moon' ? 'ms-1' : ''} />
              <span className="text-truncate">{t(label)}</span>
            </div>
            <FontAwesomeIcon
              icon="circle-check"
              className={`circle-check ms-2 flex-shrink-0 ${isActive ? '' : 'opacity-0'}`}
              aria-hidden={isActive ? undefined : true}
            />
          </NavDropdown.Item>
        );
      })}
    </NavDropdown>
  );
};

export default ThemeToggler;
