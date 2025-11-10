import React, { useCallback } from 'react';
import { setTheme, type Theme } from '@/reducers/theme';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { THEMES } from '@/config/constants';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

const ThemeToggler = () => {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.theme.theme);

  const handleThemeChange = useCallback(
    (selectedTheme: Theme) => {
      if (theme !== selectedTheme) {
        dispatch(setTheme(selectedTheme));
      }
    },
    [theme, dispatch],
  );

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
      {THEMES.map(({ key, label, icon }) => (
        <NavDropdown.Item
          key={key}
          onClick={() => handleThemeChange(key)}
          aria-label={t(label)}
          className={`d-flex align-items-center justify-content-between gap-2 ${theme === key ? 'active-theme' : ''}`}
        >
          <div className="d-flex align-items-center flex-grow-1 gap-2">
            <FontAwesomeIcon icon={icon as IconProp} className={icon === 'moon' ? 'ms-1' : ''} />
            <span className="text-truncate">{t(label)}</span>
          </div>
          <FontAwesomeIcon
            icon="circle-check"
            className={`circle-check ms-2 flex-shrink-0 ${theme === key ? '' : 'opacity-0'}`}
            aria-hidden={theme === key ? undefined : true}
          />
        </NavDropdown.Item>
      ))}
    </NavDropdown>
  );
};

export default ThemeToggler;
