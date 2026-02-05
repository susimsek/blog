import themeReducer, {
  toggleTheme,
  setTheme,
  setThemeFromSystem,
  resetToSystemTheme,
  type Theme,
} from '@/reducers/theme';

jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  isBrowser: true, // Simulate a browser environment
}));

describe('theme reducer', () => {
  let getItemMock: jest.SpyInstance;
  let setItemMock: jest.SpyInstance;
  let removeItemMock: jest.SpyInstance;

  beforeEach(() => {
    // Mock localStorage methods
    getItemMock = jest.spyOn(Storage.prototype, 'getItem');
    setItemMock = jest.spyOn(Storage.prototype, 'setItem');
    removeItemMock = jest.spyOn(Storage.prototype, 'removeItem');
    getItemMock.mockClear();
    setItemMock.mockClear();
    removeItemMock.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInitialTheme', () => {
    it('should initialize with light theme when localStorage is empty', () => {
      getItemMock.mockReturnValue(null);
      const initialState = themeReducer(undefined, { type: '@@INIT' });
      expect(initialState.theme).toBe('light');
      expect(initialState.hasExplicitTheme).toBe(false);
    });

    it('should initialize with dark theme when localStorage has dark', () => {
      // Set mock before the reducer is accessed
      getItemMock.mockReturnValue('dark');

      // Require the reducer to re-evaluate the mocked localStorage
      jest.resetModules();
      const themeReducer = require('@/reducers/theme').default;

      const initialState = themeReducer(undefined, { type: '@@INIT' });
      expect(initialState.theme).toBe('dark');
      expect(initialState.hasExplicitTheme).toBe(true);
    });

    it('should initialize with oceanic theme when localStorage has oceanic', () => {
      getItemMock.mockReturnValue('oceanic');

      jest.resetModules();
      const themeReducer = require('@/reducers/theme').default;

      const initialState = themeReducer(undefined, { type: '@@INIT' });
      expect(initialState.theme).toBe('oceanic');
      expect(initialState.hasExplicitTheme).toBe(true);
    });

    it('should initialize with forest theme when localStorage has forest', () => {
      getItemMock.mockReturnValue('forest');

      jest.resetModules();
      const themeReducer = require('@/reducers/theme').default;

      const initialState = themeReducer(undefined, { type: '@@INIT' });
      expect(initialState.theme).toBe('forest');
      expect(initialState.hasExplicitTheme).toBe(true);
    });

    it('should initialize with light theme when localStorage has invalid value', () => {
      getItemMock.mockReturnValue('invalid-value');
      const initialState = themeReducer(undefined, { type: '@@INIT' });
      expect(initialState.theme).toBe('light');
      expect(initialState.hasExplicitTheme).toBe(false);
    });
  });

  describe('toggleTheme', () => {
    it('should toggle theme from light to dark', () => {
      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme: 'light', hasExplicitTheme: false };
      const newState = themeReducer(initialState, toggleTheme());
      expect(newState.theme).toBe('dark');
      expect(newState.hasExplicitTheme).toBe(true);
      expect(setItemMock).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should toggle theme from dark to oceanic', () => {
      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme: 'dark', hasExplicitTheme: false };
      const newState = themeReducer(initialState, toggleTheme());
      expect(newState.theme).toBe('oceanic');
      expect(newState.hasExplicitTheme).toBe(true);
      expect(setItemMock).toHaveBeenCalledWith('theme', 'oceanic');
    });

    it('should toggle theme from oceanic to forest', () => {
      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme: 'oceanic', hasExplicitTheme: false };
      const newState = themeReducer(initialState, toggleTheme());
      expect(newState.theme).toBe('forest');
      expect(newState.hasExplicitTheme).toBe(true);
      expect(setItemMock).toHaveBeenCalledWith('theme', 'forest');
    });

    it('should toggle theme from forest to light', () => {
      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme: 'forest', hasExplicitTheme: false };
      const newState = themeReducer(initialState, toggleTheme());
      expect(newState.theme).toBe('light');
      expect(newState.hasExplicitTheme).toBe(true);
      expect(setItemMock).toHaveBeenCalledWith('theme', 'light');
    });
  });

  describe('setTheme', () => {
    it('should set theme to light', () => {
      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme: 'dark', hasExplicitTheme: false };
      const newState = themeReducer(initialState, setTheme('light'));
      expect(newState.theme).toBe('light');
      expect(newState.hasExplicitTheme).toBe(true);
      expect(setItemMock).toHaveBeenCalledWith('theme', 'light');
    });

    it('should set theme to dark', () => {
      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme: 'light', hasExplicitTheme: false };
      const newState = themeReducer(initialState, setTheme('dark'));
      expect(newState.theme).toBe('dark');
      expect(newState.hasExplicitTheme).toBe(true);
      expect(setItemMock).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should set theme to oceanic', () => {
      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme: 'light', hasExplicitTheme: false };
      const newState = themeReducer(initialState, setTheme('oceanic'));
      expect(newState.theme).toBe('oceanic');
      expect(newState.hasExplicitTheme).toBe(true);
      expect(setItemMock).toHaveBeenCalledWith('theme', 'oceanic');
    });

    it('should set theme to forest', () => {
      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme: 'light', hasExplicitTheme: false };
      const newState = themeReducer(initialState, setTheme('forest'));
      expect(newState.theme).toBe('forest');
      expect(newState.hasExplicitTheme).toBe(true);
      expect(setItemMock).toHaveBeenCalledWith('theme', 'forest');
    });
  });

  describe('resetToSystemTheme', () => {
    it('should clear explicit theme preference and remove localStorage key', () => {
      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme: 'forest', hasExplicitTheme: true };
      const newState = themeReducer(initialState, resetToSystemTheme());

      expect(newState.hasExplicitTheme).toBe(false);
      expect(newState.theme).toBe('light');
      expect(removeItemMock).toHaveBeenCalledWith('theme');
    });
  });

  describe('setThemeFromSystem', () => {
    it('updates theme when there is no explicit preference', () => {
      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme: 'light', hasExplicitTheme: false };
      const newState = themeReducer(initialState, setThemeFromSystem('dark'));
      expect(newState.theme).toBe('dark');
    });

    it('does not override theme when explicit preference exists', () => {
      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme: 'forest', hasExplicitTheme: true };
      const newState = themeReducer(initialState, setThemeFromSystem('light'));
      expect(newState.theme).toBe('forest');
    });
  });

  describe('storage failures', () => {
    it('ignores localStorage errors while setting theme', () => {
      setItemMock.mockImplementation(() => {
        throw new Error('blocked');
      });

      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme: 'light', hasExplicitTheme: false };
      expect(() => themeReducer(initialState, setTheme('dark'))).not.toThrow();
    });

    it('ignores localStorage errors while resetting theme', () => {
      removeItemMock.mockImplementation(() => {
        throw new Error('blocked');
      });

      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme: 'forest', hasExplicitTheme: true };
      expect(() => themeReducer(initialState, resetToSystemTheme())).not.toThrow();
    });
  });
});
