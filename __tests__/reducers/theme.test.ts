import themeReducer, { toggleTheme, setTheme } from '@/reducers/theme';

jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  isBrowser: true, // Simulate a browser environment
}));

describe('theme reducer', () => {
  let getItemMock: jest.SpyInstance;
  let setItemMock: jest.SpyInstance;

  beforeEach(() => {
    // Mock localStorage methods
    getItemMock = jest.spyOn(Storage.prototype, 'getItem');
    setItemMock = jest.spyOn(Storage.prototype, 'setItem');
    getItemMock.mockClear();
    setItemMock.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInitialTheme', () => {
    it('should initialize with light theme when localStorage is empty', () => {
      getItemMock.mockReturnValue(null);
      const initialState = themeReducer(undefined, { type: '@@INIT' });
      expect(initialState.theme).toBe('light');
    });

    it('should initialize with dark theme when localStorage has dark', () => {
      // Set mock before the reducer is accessed
      getItemMock.mockReturnValue('dark');

      // Require the reducer to re-evaluate the mocked localStorage
      jest.resetModules();
      const themeReducer = require('@/reducers/theme').default;

      const initialState = themeReducer(undefined, { type: '@@INIT' });
      expect(initialState.theme).toBe('dark');
    });

    it('should initialize with light theme when localStorage has invalid value', () => {
      getItemMock.mockReturnValue('invalid-value');
      const initialState = themeReducer(undefined, { type: '@@INIT' });
      expect(initialState.theme).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle theme from light to dark', () => {
      const initialState: { theme: 'light' | 'dark' } = { theme: 'light' };
      const newState = themeReducer(initialState, toggleTheme());
      expect(newState.theme).toBe('dark');
      expect(setItemMock).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should toggle theme from dark to light', () => {
      const initialState: { theme: 'light' | 'dark' } = { theme: 'dark' };
      const newState = themeReducer(initialState, toggleTheme());
      expect(newState.theme).toBe('light');
      expect(setItemMock).toHaveBeenCalledWith('theme', 'light');
    });
  });

  describe('setTheme', () => {
    it('should set theme to light', () => {
      const initialState: { theme: 'light' | 'dark' } = { theme: 'dark' };
      const newState = themeReducer(initialState, setTheme('light'));
      expect(newState.theme).toBe('light');
      expect(setItemMock).toHaveBeenCalledWith('theme', 'light');
    });

    it('should set theme to dark', () => {
      const initialState: { theme: 'light' | 'dark' } = { theme: 'light' };
      const newState = themeReducer(initialState, setTheme('dark'));
      expect(newState.theme).toBe('dark');
      expect(setItemMock).toHaveBeenCalledWith('theme', 'dark');
    });
  });
});
