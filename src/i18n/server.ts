import 'server-only';
import { createInstance } from 'i18next';
import { allNamespaces, defaultLocale, locales } from '@/i18n/settings';

type NamespaceResource = Record<string, unknown>;
export type LocaleResources = Record<string, NamespaceResource>;

const dictionaries = {
  en: {
    '404': () => import('@root/public/locales/en/404.json').then(module => module.default as NamespaceResource),
    about: () => import('@root/public/locales/en/about.json').then(module => module.default as NamespaceResource),
    category: () => import('@root/public/locales/en/category.json').then(module => module.default as NamespaceResource),
    common: () => import('@root/public/locales/en/common.json').then(module => module.default as NamespaceResource),
    contact: () => import('@root/public/locales/en/contact.json').then(module => module.default as NamespaceResource),
    home: () => import('@root/public/locales/en/home.json').then(module => module.default as NamespaceResource),
    medium: () => import('@root/public/locales/en/medium.json').then(module => module.default as NamespaceResource),
    post: () => import('@root/public/locales/en/post.json').then(module => module.default as NamespaceResource),
    search: () => import('@root/public/locales/en/search.json').then(module => module.default as NamespaceResource),
    topic: () => import('@root/public/locales/en/topic.json').then(module => module.default as NamespaceResource),
  },
  tr: {
    '404': () => import('@root/public/locales/tr/404.json').then(module => module.default as NamespaceResource),
    about: () => import('@root/public/locales/tr/about.json').then(module => module.default as NamespaceResource),
    category: () => import('@root/public/locales/tr/category.json').then(module => module.default as NamespaceResource),
    common: () => import('@root/public/locales/tr/common.json').then(module => module.default as NamespaceResource),
    contact: () => import('@root/public/locales/tr/contact.json').then(module => module.default as NamespaceResource),
    home: () => import('@root/public/locales/tr/home.json').then(module => module.default as NamespaceResource),
    medium: () => import('@root/public/locales/tr/medium.json').then(module => module.default as NamespaceResource),
    post: () => import('@root/public/locales/tr/post.json').then(module => module.default as NamespaceResource),
    search: () => import('@root/public/locales/tr/search.json').then(module => module.default as NamespaceResource),
    topic: () => import('@root/public/locales/tr/topic.json').then(module => module.default as NamespaceResource),
  },
} as const;

export type Locale = keyof typeof dictionaries;
export type DictionaryNamespace = keyof (typeof dictionaries)[Locale];

export const hasLocale = (locale: string): locale is Locale => locale in dictionaries;

const fallbackLocale: Locale = hasLocale(defaultLocale) ? defaultLocale : 'en';
const fallbackNamespace: DictionaryNamespace = 'common';

const hasNamespace = (namespace: string): namespace is DictionaryNamespace => namespace in dictionaries[fallbackLocale];
const resolveLocale = (locale: string): Locale => (hasLocale(locale) ? locale : fallbackLocale);
const resolveNamespace = (namespace: string): DictionaryNamespace =>
  hasNamespace(namespace) ? namespace : fallbackNamespace;

export const getDictionary = async (locale: Locale, namespace: DictionaryNamespace): Promise<NamespaceResource> => {
  return dictionaries[locale][namespace]();
};

async function loadNamespace(locale: string, namespace: string): Promise<NamespaceResource> {
  const safeLocale = resolveLocale(locale);
  const safeNamespace = resolveNamespace(namespace);

  try {
    return await getDictionary(safeLocale, safeNamespace);
  } catch {
    return getDictionary(fallbackLocale, safeNamespace);
  }
}

export async function loadLocaleResources(
  locale: string,
  namespaces: string[] = allNamespaces,
): Promise<LocaleResources> {
  const uniqueNamespaces = [...new Set(namespaces)].filter(hasNamespace);
  const resolvedNamespaces = uniqueNamespaces.length > 0 ? uniqueNamespaces : [fallbackNamespace];
  const entries = await Promise.all(
    resolvedNamespaces.map(async namespace => [namespace, await loadNamespace(locale, namespace)] as const),
  );
  return Object.fromEntries(entries);
}

export async function getServerTranslator(locale: string, namespaces: string[] = allNamespaces) {
  const safeLocale = resolveLocale(locale);
  const uniqueNamespaces = [...new Set(namespaces)].filter(hasNamespace);
  const resolvedNamespaces = uniqueNamespaces.length > 0 ? uniqueNamespaces : [fallbackNamespace];
  const resources = await loadLocaleResources(safeLocale, resolvedNamespaces);

  const i18n = createInstance();
  await i18n.init({
    lng: safeLocale,
    fallbackLng: defaultLocale,
    supportedLngs: locales,
    ns: resolvedNamespaces,
    defaultNS: 'common',
    resources: {
      [safeLocale]: resources,
    },
    interpolation: {
      escapeValue: false,
    },
    initAsync: false,
  });

  return {
    locale: safeLocale,
    resources,
    t: i18n.getFixedT(safeLocale),
  };
}
