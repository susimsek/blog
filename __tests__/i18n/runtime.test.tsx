import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import AppProviders from '@/app/providers';
import { createI18nInstance } from '@/config/i18n';
import { flags } from '@/config/flags';
import I18nProvider from '@/i18n/provider';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';

jest.mock('react-i18next', () => {
  const React = require('react');
  const I18nContext = React.createContext(undefined);

  return {
    I18nContext,
    I18nextProvider: ({ i18n, children }: { i18n: { t: (key: string) => string }; children: React.ReactNode }) => (
      <I18nContext.Provider value={{ i18n }}>{children}</I18nContext.Provider>
    ),
    useTranslation: (namespace = 'common') => {
      const context = React.useContext(I18nContext) as
        | { i18n?: { t: (key: string, options?: Record<string, unknown>) => string } }
        | undefined;
      return {
        t: (key: string, options?: Record<string, unknown>) =>
          context?.i18n?.t(key, { ns: namespace, ...options }) ?? key,
      };
    },
    initReactI18next: {
      type: '3rdParty',
      init: jest.fn(),
    },
  };
});

const makeStoreMock = jest.fn(() => ({ dispatch: jest.fn(), getState: jest.fn(), subscribe: jest.fn() }));

jest.mock('react-redux', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/config/store', () => ({
  makeStore: () => makeStoreMock(),
}));

jest.mock('@/config/iconLoader', () => ({
  loadIcons: jest.fn(),
}));

jest.mock('@/components/common/AppErrorToasts', () => ({
  __esModule: true,
  default: () => <div data-testid="app-error-toasts" />,
}));

jest.mock('@/components/theme/ThemeProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
}));

const { loadIcons: loadIconsMock } = jest.requireMock('@/config/iconLoader') as {
  loadIcons: jest.Mock;
};

function TranslationProbe() {
  const { t } = useTranslation('common');
  return <span data-testid="translated">{t('common.footer.copyright')}</span>;
}

const resources = {
  common: {
    common: {
      footer: {
        copyright: 'Translated footer',
      },
    },
  },
};

describe('i18n runtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an i18n instance with the provided resources', () => {
    const i18n = createI18nInstance('en', resources);

    expect(i18n.language).toBe('en');
    expect(i18n.t('common.footer.copyright')).toBe('Translated footer');
    expect(i18n.options.react).toMatchObject({
      useSuspense: false,
    });
  });

  it('renders children through I18nProvider and AppProviders', () => {
    render(
      <AppProviders locale="en" resources={resources}>
        <I18nProvider locale="en" resources={resources}>
          <TranslationProbe />
        </I18nProvider>
      </AppProviders>,
    );

    expect(makeStoreMock).toHaveBeenCalled();
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('app-error-toasts')).toBeInTheDocument();
    expect(screen.getByTestId('translated')).toHaveTextContent('Translated footer');
  });

  it('creates a scoped route i18n instance when there is no parent provider', () => {
    render(
      <RouteI18nProvider locale="en" resources={resources}>
        <TranslationProbe />
      </RouteI18nProvider>,
    );

    expect(screen.getByTestId('translated')).toHaveTextContent('Translated footer');
  });

  it('clones the parent i18n instance and merges route resources', () => {
    const parentI18n = createI18nInstance('en', {
      common: {
        common: {
          footer: {
            copyright: 'Parent footer',
          },
        },
      },
    });

    render(
      <I18nextProvider i18n={parentI18n}>
        <RouteI18nProvider locale="en" resources={resources}>
          <TranslationProbe />
        </RouteI18nProvider>
      </I18nextProvider>,
    );

    expect(screen.getByTestId('translated')).toHaveTextContent('Translated footer');
  });

  it('exports locale flags for english and turkish', () => {
    expect(flags.tr).toEqual(expect.any(Function));
    expect(flags.en).toEqual(expect.any(Function));
  });
});
