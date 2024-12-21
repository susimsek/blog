import React, { useCallback } from 'react';
import { toggleTheme } from '@/reducers/theme';
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
    (selectedTheme: 'light' | 'dark') => {
      if (theme !== selectedTheme) {
        dispatch(toggleTheme());
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
      align="start"
    >
      {THEMES.map(({ key, label, icon }) => (
        <NavDropdown.Item
          key={key}
          onClick={() => handleThemeChange(key as 'light' | 'dark')}
          aria-label={t(label)}
          className={`d-flex justify-content-between align-items-center ${theme === key ? 'active-theme' : ''}`}
        >
          <div>
            <FontAwesomeIcon icon={icon as IconProp} className={`me-2 ${icon === 'moon' ? 'ms-1' : ''}`} />
            {t(label)}
          </div>
          {theme === key && <FontAwesomeIcon icon="circle-check" className="circle-check" />}
        </NavDropdown.Item>
      ))}
    </NavDropdown>
  );
};

export default ThemeToggler;
