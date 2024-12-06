// lib/getStatic.ts
import { GetStaticPaths, GetStaticPropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import i18nextConfig from '../../next-i18next.config';

// Define the type of params returned in getI18nPaths for locale-based paths
type LocaleParams = {
  params: {
    locale: string;
  };
};

// Generates paths for each locale
export const getI18nPaths = (): LocaleParams[] =>
  i18nextConfig.i18n.locales.map((lng: string) => ({
    params: {
      locale: lng,
    },
  }));

// Sets up getStaticPaths for locale paths with TypeScript
export const getStaticPaths: GetStaticPaths = () => ({
  fallback: false,
  paths: getI18nPaths(),
});

// Load i18n props for specific namespaces, defaulting to ['common']
export const getI18nProps = async (ctx: GetStaticPropsContext, ns: string[] = ['common']) => {
  const locale = (ctx?.params?.locale as string) || i18nextConfig.i18n.defaultLocale;
  return {
    ...(await serverSideTranslations(locale, ns)),
  };
};

// Higher-order function to create getStaticProps with specified namespaces
export const makeStaticProps =
  (ns: string[] = []) =>
  async (ctx: GetStaticPropsContext) => ({
    props: await getI18nProps(ctx, ns),
  });
