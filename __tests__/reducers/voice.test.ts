import voiceReducer, { setVoiceEnabled, toggleVoice, type VoiceState } from '@/reducers/voice';

jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  isBrowser: true,
}));

describe('voice reducer', () => {
  let getItemMock: jest.SpyInstance;
  let setItemMock: jest.SpyInstance;

  beforeEach(() => {
    getItemMock = jest.spyOn(Storage.prototype, 'getItem');
    setItemMock = jest.spyOn(Storage.prototype, 'setItem');
    getItemMock.mockClear();
    setItemMock.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes with sound enabled by default', () => {
    getItemMock.mockReturnValue(null);
    const initialState = voiceReducer(undefined, { type: '@@INIT' });
    expect(initialState.isEnabled).toBe(true);
  });

  it('initializes with sound disabled from localStorage', () => {
    getItemMock.mockReturnValue('false');

    jest.resetModules();
    const voiceReducer = require('@/reducers/voice').default;

    const initialState = voiceReducer(undefined, { type: '@@INIT' });
    expect(initialState.isEnabled).toBe(false);
  });

  it('initializes with sound enabled from localStorage', () => {
    getItemMock.mockReturnValue('true');

    jest.resetModules();
    const voiceReducer = require('@/reducers/voice').default;

    const initialState = voiceReducer(undefined, { type: '@@INIT' });
    expect(initialState.isEnabled).toBe(true);
  });

  it('ignores invalid persisted values and defaults to enabled', () => {
    getItemMock.mockReturnValue('invalid');
    const initialState = voiceReducer(undefined, { type: '@@INIT' });
    expect(initialState.isEnabled).toBe(true);
  });

  it('sets voice enabled value and persists it', () => {
    const initialState: VoiceState = { isEnabled: true };
    const newState = voiceReducer(initialState, setVoiceEnabled(false));

    expect(newState.isEnabled).toBe(false);
    expect(setItemMock).toHaveBeenCalledWith('voiceEnabled', 'false');
  });

  it('toggles voice enabled value and persists it', () => {
    const initialState: VoiceState = { isEnabled: false };
    const newState = voiceReducer(initialState, toggleVoice());

    expect(newState.isEnabled).toBe(true);
    expect(setItemMock).toHaveBeenCalledWith('voiceEnabled', 'true');
  });

  it('ignores localStorage errors while updating voice preference', () => {
    setItemMock.mockImplementation(() => {
      throw new Error('blocked');
    });

    const initialState: VoiceState = { isEnabled: true };
    expect(() => voiceReducer(initialState, setVoiceEnabled(false))).not.toThrow();
  });

  it('defaults to enabled when initialized outside the browser', () => {
    jest.resetModules();

    jest.doMock('@/config/constants', () => ({
      ...jest.requireActual('@/config/constants'),
      isBrowser: false,
    }));

    const isolatedVoiceReducer = require('@/reducers/voice').default;
    const initialState = isolatedVoiceReducer(undefined, { type: '@@INIT' });

    expect(initialState.isEnabled).toBe(true);
  });
});
