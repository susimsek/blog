// __tests__/lib/getStatic.test.ts
import { getI18nPaths, getStaticPaths, getI18nProps, makeStaticProps } from '@/lib/getStatic';
import i18nextConfig from '../../next-i18next.config';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

jest.mock('next-i18next/serverSideTranslations', () => ({
  serverSideTranslations: jest.fn((locale, namespaces) => ({
    _nextI18Next: {
      initialI18nStore: {},
      initialLocale: locale,
      userConfig: {},
    },
  })),
}));

describe('getStaticPaths', () => {
  it('should return paths for each locale', () => {
    const paths = getI18nPaths();
    expect(paths).toEqual(
      i18nextConfig.i18n.locales.map(locale => ({
        params: { locale },
      })),
    );

    const staticPaths = getStaticPaths({ locales: ['en', 'fr'], defaultLocale: 'en' });
    expect(staticPaths).toEqual({
      fallback: false,
      paths,
    });
  });
});

describe('getI18nProps', () => {
  it('should load i18n props for a specific locale and namespace', async () => {
    const ctx = { params: { locale: 'en' } };
    const props = await getI18nProps(ctx, ['common', 'home']);

    expect(serverSideTranslations).toHaveBeenCalledWith('en', ['common', 'home']);
    expect(props).toHaveProperty('_nextI18Next');
    expect(props._nextI18Next).toEqual({
      initialI18nStore: {},
      initialLocale: 'en',
      userConfig: {},
    });
  });

  it('should fall back to default locale if locale is not provided', async () => {
    const ctx = { params: {} }; // No locale provided
    const props = await getI18nProps(ctx, ['common']);

    expect(serverSideTranslations).toHaveBeenCalledWith(i18nextConfig.i18n.defaultLocale, ['common']);
    expect(props).toHaveProperty('_nextI18Next');
    expect(props._nextI18Next).toEqual({
      initialI18nStore: {},
      initialLocale: i18nextConfig.i18n.defaultLocale,
      userConfig: {},
    });
  });

  it('should handle empty namespaces', async () => {
    const ctx = { params: { locale: 'fr' } };
    const props = await getI18nProps(ctx, []);

    expect(serverSideTranslations).toHaveBeenCalledWith('fr', []);
    expect(props).toHaveProperty('_nextI18Next');
    expect(props._nextI18Next).toEqual({
      initialI18nStore: {},
      initialLocale: 'fr',
      userConfig: {},
    });
  });

  it('should load i18n props for a given locale', async () => {
    const ctx = { params: { locale: 'en' } };
    const props = await getI18nProps(ctx, ['common']);

    expect(serverSideTranslations).toHaveBeenCalledWith('en', ['common']);
    expect(props).toHaveProperty('_nextI18Next');
    expect(props._nextI18Next).toEqual({
      initialI18nStore: {},
      initialLocale: 'en',
      userConfig: {},
    });
  });

  it('should use default namespace if none is provided', async () => {
    const ctx = { params: { locale: 'de' } };
    const props = await getI18nProps(ctx);

    expect(serverSideTranslations).toHaveBeenCalledWith('de', ['common']);
    expect(props).toHaveProperty('_nextI18Next');
    expect(props._nextI18Next).toEqual({
      initialI18nStore: {},
      initialLocale: 'de',
      userConfig: {},
    });
  });

  it('should fall back to default locale if none is provided', async () => {
    const ctx = { params: {} }; // No locale in params
    const props = await getI18nProps(ctx, ['common']);

    expect(serverSideTranslations).toHaveBeenCalledWith(i18nextConfig.i18n.defaultLocale, ['common']);
    expect(props).toHaveProperty('_nextI18Next');
  });
});

describe('makeStaticProps', () => {
  it('should create a static props function', async () => {
    const ctx = { params: { locale: 'fr' } };
    const staticProps = makeStaticProps(['home']);
    const result = await staticProps(ctx);

    expect(serverSideTranslations).toHaveBeenCalledWith('fr', ['home']);

    expect(result).toEqual({
      props: {
        _nextI18Next: {
          initialI18nStore: {},
          initialLocale: 'fr',
          userConfig: {},
        },
      },
    });
  });

  it('should use default namespaces if none are provided', async () => {
    const ctx = { params: { locale: 'de' } };
    const staticProps = makeStaticProps();
    const result = await staticProps(ctx);

    expect(serverSideTranslations).toHaveBeenCalledWith('de', []);
    expect(result.props).toHaveProperty('_nextI18Next');
  });
});
