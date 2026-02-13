import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { isBrowser } from '@/config/constants';

export type VoiceState = {
  isEnabled: boolean;
};

const VOICE_STORAGE_KEY = 'voiceEnabled';

const getInitialVoiceEnabled = (): boolean => {
  if (!isBrowser) return true;

  try {
    const storedValue = localStorage.getItem(VOICE_STORAGE_KEY);
    if (storedValue === 'false') return false;
    if (storedValue === 'true') return true;
  } catch {
    // Ignore storage errors (private mode / blocked storage).
  }

  return true;
};

const initialState: VoiceState = {
  isEnabled: getInitialVoiceEnabled(),
};

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    toggleVoice: state => {
      state.isEnabled = !state.isEnabled;
      if (isBrowser) {
        try {
          localStorage.setItem(VOICE_STORAGE_KEY, String(state.isEnabled));
        } catch {
          // Ignore storage errors.
        }
      }
    },
    setVoiceEnabled: (state, action: PayloadAction<boolean>) => {
      state.isEnabled = action.payload;
      if (isBrowser) {
        try {
          localStorage.setItem(VOICE_STORAGE_KEY, String(state.isEnabled));
        } catch {
          // Ignore storage errors.
        }
      }
    },
  },
});

export const { toggleVoice, setVoiceEnabled } = voiceSlice.actions;
export default voiceSlice.reducer;
