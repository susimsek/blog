import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { setVoiceEnabled } from '@/reducers/voice';
import { useAppDispatch, useAppSelector } from '@/config/store';
import useBoop from '@/hooks/useBoop';

const VOICE_TOGGLE_SOUND_CONFIG = {
  enable: { src: '/sounds/enable-sound.mp3', volume: 0.4 },
  disable: { src: '/sounds/disable-sound.mp3', volume: 0.25 },
} as const;

const VoiceToggler = () => {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const isVoiceEnabled = useAppSelector(state => state.voice.isEnabled);
  const [voiceIconStyle, triggerVoiceIconBoop] = useBoop({ x: 2, rotation: 8, scale: 1.08, timing: 170 });

  const playSound = useCallback((nextVoiceEnabled: boolean) => {
    const config = nextVoiceEnabled ? VOICE_TOGGLE_SOUND_CONFIG.enable : VOICE_TOGGLE_SOUND_CONFIG.disable;
    try {
      const sound = new Audio(config.src);
      sound.preload = 'auto';
      sound.volume = config.volume;
      sound.currentTime = 0;
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Ignore playback failures (autoplay restrictions / unsupported environments).
        });
      }
    } catch {
      // Ignore playback failures (autoplay restrictions / unsupported environments).
    }
  }, []);

  const handleToggleVoice = useCallback(() => {
    const nextVoiceEnabled = !isVoiceEnabled;
    playSound(nextVoiceEnabled);
    dispatch(setVoiceEnabled(nextVoiceEnabled));
  }, [dispatch, isVoiceEnabled, playSound]);

  const voiceLabel = t(isVoiceEnabled ? 'common.header.voice.enabled' : 'common.header.voice.disabled');

  return (
    <button
      type="button"
      onClick={handleToggleVoice}
      onMouseEnter={triggerVoiceIconBoop}
      className="nav-link nav-icon-boop d-flex align-items-center bg-transparent border-0"
      aria-label={voiceLabel}
    >
      <FontAwesomeIcon
        icon={isVoiceEnabled ? 'volume-high' : 'volume-xmark'}
        className="icon-boop-target"
        style={voiceIconStyle}
      />
    </button>
  );
};

export default VoiceToggler;
