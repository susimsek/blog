describe('i18n settings', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('@root/i18n.config.json');
    jest.dontMock('@/config/constants');
  });

  it('falls back to known locales when configured locales are unsupported', async () => {
    jest.doMock('@root/i18n.config.json', () => ({
      __esModule: true,
      default: {
        locales: ['es'],
        defaultLocale: 'es',
      },
    }));
    jest.doMock('@/config/constants', () => ({
      LOCALES: {
        en: 'English',
        tr: 'Turkish',
      },
    }));

    const settings = await import('@/i18n/settings');

    expect(settings.locales).toEqual(['en', 'tr']);
    expect(settings.defaultLocale).toBe('en');
    expect(settings.isSupportedLocale('tr')).toBe(true);
    expect(settings.isSupportedLocale('es')).toBe(false);
  });

  it('keeps configured locales when they are known and uses the configured default locale', async () => {
    jest.doMock('@root/i18n.config.json', () => ({
      __esModule: true,
      default: {
        locales: ['tr', 'en'],
        defaultLocale: 'tr',
      },
    }));
    jest.doMock('@/config/constants', () => ({
      LOCALES: {
        en: 'English',
        tr: 'Turkish',
      },
    }));

    const settings = await import('@/i18n/settings');

    expect(settings.locales).toEqual(['tr', 'en']);
    expect(settings.defaultLocale).toBe('tr');
  });
});
