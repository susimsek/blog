import * as React from 'react';
import type { ReactElement } from 'react';
import path from 'node:path';
import '@testing-library/jest-dom';
import { resetDynamicMocks, resolveDynamicMock } from '@tests/utils/dynamicMockRegistry';

jest.mock('rehype-sanitize', () => ({
  __esModule: true,
  default: jest.fn(),
  defaultSchema: {},
}));

afterEach(() => {
  resetDynamicMocks();
});

// Centralized lightweight mocks for common Next.js and i18n helpers
jest.mock('next/navigation', () => ({
  __esModule: true,
  usePathname: () => '/',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), back: jest.fn() }),
}));

jest.mock('next/link', () => {
  const Link = ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href?: string }) =>
    React.createElement('a', { href, ...props }, children);
  return { __esModule: true, default: Link };
});

jest.mock('next/image', () => {
  const Image = ({
    src,
    alt,
    width,
    height,
    style,
    priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { src?: unknown; priority?: boolean }) => {
    const resolvedSrc = (() => {
      if (typeof src === 'string') return src.startsWith('http') ? `${src}?e=${encodeURIComponent(src)}` : src;
      if (src && typeof src === 'object' && 'src' in src) return String((src as { src?: string }).src);
      return '';
    })();

    return React.createElement('img', {
      src: resolvedSrc,
      alt,
      width,
      height,
      style,
      'data-priority': priority ? 'true' : 'false',
      ...props,
    });
  };

  return { __esModule: true, default: Image };
});

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (k: string) => k, i18n: { changeLanguage: jest.fn() } }),
  Trans: ({ children }: { children?: React.ReactNode }) => children ?? null,
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

type DynamicModule = { default?: ReactElement | null } | ReactElement | null | Record<string, unknown>;

jest.mock('next/dynamic', () => {
  const knownModules: Record<string, string> = {
    LanguageSwitcher: '@/components/i18n/LanguageSwitcher',
    ThemeToggler: '@/components/theme/ThemeToggler',
    DateRangePicker: '@/components/common/DateRangePicker',
    MarkdownTabsRenderer: '@/components/common/MarkdownTabsRenderer',
    MarkdownRenderer: '@/components/common/MarkdownRenderer',
  };

  const tryLoad = (id: string) => {
    try {
      return jest.requireMock(id);
    } catch {
      try {
        return jest.requireActual(id);
      } catch {
        return null;
      }
    }
  };

  const resolveModule = (id?: string | null) => {
    if (!id) return null;
    const candidates = [id, id.startsWith('@/') ? path.join(process.cwd(), 'src', id.slice(2)) : null].filter(
      Boolean,
    ) as string[];
    for (const c of candidates) {
      const m = tryLoad(c);
      if (m) return m;
    }
    return null;
  };

  return (
    importer: () => Promise<DynamicModule> | DynamicModule,
    options?: { loading?: () => ReactElement | null },
  ) => {
    const importerString = importer?.toString?.() ?? '';
    const moduleId =
      /import\(['"](.+?)['"]\)/.exec(importerString)?.[1] ??
      /require\(['"](.+?)['"]\)/.exec(importerString)?.[1] ??
      null;

    const matchedKey = Object.keys(knownModules).find(key => importerString.includes(key));
    const resolvedModuleId = moduleId ?? (matchedKey ? knownModules[matchedKey] : null);

    const mockedModule = resolveDynamicMock({ importerString, moduleId: resolvedModuleId ?? moduleId, knownModules });
    const loadedModule = mockedModule ?? (resolvedModuleId ? resolveModule(resolvedModuleId) : null);

    const Resolved =
      loadedModule && typeof loadedModule === 'object' && 'default' in (loadedModule as object)
        ? ((loadedModule as { default?: unknown }).default ?? loadedModule)
        : loadedModule;

    const DynamicComponent = (props: Record<string, unknown>) => {
      if (!Resolved) {
        return options?.loading?.() ?? null;
      }
      return React.createElement(Resolved as React.ComponentType<Record<string, unknown>>, props);
    };

    DynamicComponent.displayName = 'DynamicComponent';
    return DynamicComponent;
  };
});
