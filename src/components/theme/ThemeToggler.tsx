import React, { useCallback } from 'react';
import { resetToSystemTheme, setTheme, type Theme } from '@/reducers/theme';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { THEMES } from '@/config/constants';
import useBoop from '@/hooks/useBoop';

const THEME_SOUND_CONFIG: Record<Theme, { src: string }> = {
  light: { src: '/sounds/switch-on.mp3' },
  dark: { src: '/sounds/switch-off.mp3' },
  oceanic: { src: '/sounds/rising-pops.mp3' },
  forest: { src: '/sounds/pop-down.mp3' },
};

const ThemeToggler = () => {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.theme.theme);
  const hasExplicitTheme = useAppSelector(state => state.theme.hasExplicitTheme);
  const isVoiceEnabled = useAppSelector(state => state.voice.isEnabled);
  const isSystemTheme = !hasExplicitTheme;
  const [themeIconStyle, triggerThemeIconBoop] = useBoop({ rotation: 10, scale: 1.1, timing: 170 });

  const playSound = useCallback((src: string, volume = 1) => {
    try {
      const sound = new Audio(src);
      sound.preload = 'auto';
      sound.volume = volume;
      sound.currentTime = 0;
      const playPromise = sound.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Ignore playback failures (autoplay restrictions / unsupported environments).
        });
      }
    } catch {
      // Ignore playback failures (autoplay restrictions / unsupported environments).
    }
  }, []);

  const playThemeSwitchSound = useCallback(
    (nextTheme: Theme) => {
      if (!isVoiceEnabled) return;
      playSound(THEME_SOUND_CONFIG[nextTheme].src);
    },
    [isVoiceEnabled, playSound],
  );

  const resolveSystemTheme = useCallback((): Theme => {
    if (typeof globalThis.window?.matchMedia !== 'function') {
      return 'light';
    }

    return globalThis.window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const handleThemeChange = useCallback(
    (selectedTheme: Theme) => {
      if (theme !== selectedTheme || !hasExplicitTheme) {
        if (theme !== selectedTheme) {
          playThemeSwitchSound(selectedTheme);
        }
        dispatch(setTheme(selectedTheme));
      }
    },
    [theme, hasExplicitTheme, dispatch, playThemeSwitchSound],
  );

  const handleSystemTheme = useCallback(() => {
    if (isSystemTheme) return;
    const systemTheme = resolveSystemTheme();
    if (theme !== systemTheme) {
      playThemeSwitchSound(systemTheme);
    }
    dispatch(resetToSystemTheme());
  }, [dispatch, isSystemTheme, playThemeSwitchSound, resolveSystemTheme, theme]);

  return (
    <NavDropdown
      title={
        <span className="nav-icon-boop" onMouseEnter={triggerThemeIconBoop}>
          <FontAwesomeIcon icon="palette" className="icon-boop-target" style={themeIconStyle} />
          <span className="visually-hidden">{t('common.theme')}</span>
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
