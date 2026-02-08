import * as React from 'react';
import type { ReactElement } from 'react';
import path from 'path';
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
    React.createElement('a', { href, ...props }, children as React.ReactNode);
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
  }: React.ImgHTMLAttributes<HTMLImageElement> & { src?: unknown }) => {
    // If src is an object (imported), try to use src.src
    let resolvedSrc = '';
    if (typeof src === 'string') {
      // If absolute URL, include an encoded form so tests that expect encoded fragments pass
      resolvedSrc = src.startsWith('http') ? `${src}?e=${encodeURIComponent(src)}` : src;
    } else if (src && typeof src === 'object' && src.src) {
      resolvedSrc = String(src.src);
    }
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
  Trans: ({ children }: { children?: React.ReactNode }) => (children as React.ReactNode) ?? null,
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

  const resolveModule = (id: string) => {
    const candidates = [id, id.startsWith('@/') ? path.join(process.cwd(), 'src', id.slice(2)) : null].filter(
      Boolean,
    ) as string[];

    for (const candidate of candidates) {
      try {
        return jest.requireMock(candidate);
      } catch {
        try {
          return jest.requireActual(candidate);
        } catch {
          continue;
        }
      }
    }
    return null;
  };

  return (
    importer: () => Promise<DynamicModule> | DynamicModule,
    options?: { loading?: () => ReactElement | null },
  ) => {
    // use top-level React import
    const importerString = importer?.toString?.() ?? '';
    const importMatch = /import\(['"](.+?)['"]\)/.exec(importerString);
    const requireMatch = /require\(['"](.+?)['"]\)/.exec(importerString);
    const moduleId = importMatch?.[1] ?? requireMatch?.[1];

    const matchedKey = Object.keys(knownModules).find(key => importerString.includes(key));
    const resolvedModuleId = moduleId ?? (matchedKey ? knownModules[matchedKey] : null);

    const mockedModule = resolveDynamicMock({
      importerString,
      moduleId: resolvedModuleId ?? moduleId,
      knownModules,
    });
    const loadedModule = mockedModule ?? (resolvedModuleId ? resolveModule(resolvedModuleId) : null);
    const Resolved = loadedModule?.default ?? loadedModule;

    const DynamicComponent = (props: Record<string, unknown>) => {
      if (!Resolved) {
        return options?.loading ? options.loading() : null;
      }
      return React.createElement(
        Resolved as React.ComponentType<Record<string, unknown>>,
        props as Record<string, unknown>,
      );
    };

    DynamicComponent.displayName = 'DynamicComponent';
    return DynamicComponent;
  };
});
