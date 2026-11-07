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

    it.each(['dark', 'oceanic', 'forest'] as const)(
      'should initialize with %s theme when localStorage has it',
      storedTheme => {
        getItemMock.mockReturnValue(storedTheme);
        jest.resetModules();
        const reloadedThemeReducer = require('@/reducers/theme').default;

        const initialState = reloadedThemeReducer(undefined, { type: '@@INIT' });
        expect(initialState.theme).toBe(storedTheme);
        expect(initialState.hasExplicitTheme).toBe(true);
      },
    );

    it('should initialize with light theme when localStorage has invalid value', () => {
      getItemMock.mockReturnValue('invalid-value');
      const initialState = themeReducer(undefined, { type: '@@INIT' });
      expect(initialState.theme).toBe('light');
      expect(initialState.hasExplicitTheme).toBe(false);
    });

    it('should initialize with dark theme from system preference when no explicit theme exists', () => {
      getItemMock.mockReturnValue(null);
      const originalMatchMedia = window.matchMedia;
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: jest.fn().mockImplementation(() => ({
          matches: true,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
      });

      jest.resetModules();
      const themeReducer = require('@/reducers/theme').default;
      const initialState = themeReducer(undefined, { type: '@@INIT' });

      expect(initialState.theme).toBe('dark');
      expect(initialState.hasExplicitTheme).toBe(false);

      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: originalMatchMedia,
      });
    });
  });

  describe('toggleTheme', () => {
    it.each([
      ['light', 'dark'],
      ['dark', 'oceanic'],
      ['oceanic', 'forest'],
      ['forest', 'light'],
    ] as const)('should toggle theme from %s to %s', (theme, expectedTheme) => {
      const initialState: { theme: Theme; hasExplicitTheme: boolean } = { theme, hasExplicitTheme: false };
      const newState = themeReducer(initialState, toggleTheme());
      expect(newState.theme).toBe(expectedTheme);
      expect(newState.hasExplicitTheme).toBe(true);
      expect(setItemMock).toHaveBeenCalledWith('theme', expectedTheme);
    });
  });

  describe('setTheme', () => {
    it.each([
      ['dark', 'light'],
      ['light', 'dark'],
      ['light', 'oceanic'],
      ['light', 'forest'],
    ] as const)('should set theme from %s to %s', (initialTheme, expectedTheme) => {
      const initialState: { theme: Theme; hasExplicitTheme: boolean } = {
        theme: initialTheme,
        hasExplicitTheme: false,
      };
      const newState = themeReducer(initialState, setTheme(expectedTheme));
      expect(newState.theme).toBe(expectedTheme);
      expect(newState.hasExplicitTheme).toBe(true);
      expect(setItemMock).toHaveBeenCalledWith('theme', expectedTheme);
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
