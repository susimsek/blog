import { getDictionary, getServerTranslator, hasLocale, loadLocaleResources } from '@/i18n/server';

describe('i18n server', () => {
  it('loads every dictionary resource for both supported locales', async () => {
    const namespaces = [
      '404',
      'about',
      'category',
      'common',
      'contact',
      'games',
      'home',
      'medium',
      'post',
      'search',
      'topic',
    ] as const;

    for (const locale of ['en', 'tr'] as const) {
      for (const namespace of namespaces) {
        await expect(getDictionary(locale, namespace)).resolves.toEqual(expect.any(Object));
      }
    }
  });

  it('detects supported locales', () => {
    expect(hasLocale('en')).toBe(true);
    expect(hasLocale('tr')).toBe(true);
    expect(hasLocale('de')).toBe(false);
  });

  it('loads locale resources with fallback locale and namespace behavior', async () => {
    await expect(loadLocaleResources('en', ['common', 'common', 'unknown'])).resolves.toEqual(
      expect.objectContaining({
        common: expect.objectContaining({
          common: expect.any(Object),
        }),
      }),
    );

    await expect(loadLocaleResources('unknown-locale', ['missing'])).resolves.toEqual(
      expect.objectContaining({
        common: expect.objectContaining({
          common: expect.any(Object),
        }),
      }),
    );
  });

  it('creates a server translator with merged resources', async () => {
    const translator = await getServerTranslator('tr', ['common', 'search', 'search']);

    expect(translator.locale).toBe('tr');
    expect(translator.resources).toEqual(
      expect.objectContaining({
        common: expect.any(Object),
        search: expect.any(Object),
      }),
    );
    expect(translator.t('common.footer.aboutMe', { ns: 'common' })).toBeTruthy();
  });

  it('uses all namespaces by default and falls back to the default locale for invalid locales', async () => {
    const resources = await loadLocaleResources('invalid-locale');
    const translator = await getServerTranslator('invalid-locale', ['missing']);

    expect(Object.keys(resources).length).toBeGreaterThan(5);
    expect(translator.locale).toBe('en');
    expect(translator.resources).toEqual(
      expect.objectContaining({
        common: expect.any(Object),
      }),
    );
  });
});
