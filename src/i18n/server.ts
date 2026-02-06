import fs from 'node:fs/promises';
import path from 'node:path';
import { createInstance } from 'i18next';
import { allNamespaces, defaultLocale, locales } from '@/i18n/settings';

type NamespaceResource = Record<string, unknown>;
export type LocaleResources = Record<string, NamespaceResource>;

const localesDir = path.join(process.cwd(), 'public', 'locales');

const resolveLocale = (locale: string) => (locales.includes(locale) ? locale : defaultLocale);

async function loadNamespace(locale: string, namespace: string): Promise<NamespaceResource> {
  const safeLocale = resolveLocale(locale);
  const localeFile = path.join(localesDir, safeLocale, `${namespace}.json`);
  const fallbackFile = path.join(localesDir, defaultLocale, `${namespace}.json`);

  try {
    const raw = await fs.readFile(localeFile, 'utf8');
    return JSON.parse(raw) as NamespaceResource;
  } catch {
    const raw = await fs.readFile(fallbackFile, 'utf8');
    return JSON.parse(raw) as NamespaceResource;
  }
}

export async function loadLocaleResources(
  locale: string,
  namespaces: string[] = allNamespaces,
): Promise<LocaleResources> {
  const uniqueNamespaces = [...new Set(namespaces)];
  const entries = await Promise.all(uniqueNamespaces.map(async ns => [ns, await loadNamespace(locale, ns)] as const));
  return Object.fromEntries(entries);
}

export async function getServerTranslator(locale: string, namespaces: string[] = allNamespaces) {
  const safeLocale = resolveLocale(locale);
  const resources = await loadLocaleResources(safeLocale, namespaces);

  const i18n = createInstance();
  await i18n.init({
    lng: safeLocale,
    fallbackLng: defaultLocale,
    supportedLngs: locales,
    ns: namespaces,
    defaultNS: 'common',
    resources: {
      [safeLocale]: resources,
    },
    interpolation: {
      escapeValue: false,
    },
    initImmediate: false,
  });

  return {
    locale: safeLocale,
    resources,
    t: i18n.getFixedT(safeLocale),
  };
}
