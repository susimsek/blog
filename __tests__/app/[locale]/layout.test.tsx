import React from 'react';
import { render, screen } from '@testing-library/react';
import LocaleLayout, { dynamic, dynamicParams, generateStaticParams } from '@/app/(localized)/[locale]/layout';

const notFoundMock = jest.fn(() => {
  throw new Error('NOT_FOUND');
});

const loadLocaleResourcesMock = jest.fn(async (_locale: string, _ns: string[]) => ({
  common: { common: { siteName: 'Blog' } },
}));

const appProvidersMock = jest.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid="providers">{children}</div>
));

jest.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}));

jest.mock('@/app/providers', () => ({
  __esModule: true,
  default: (props: { locale: string; resources: Record<string, unknown>; children: React.ReactNode }) =>
    appProvidersMock(props),
}));

jest.mock('@/i18n/server', () => ({
  hasLocale: (locale: string) => ['en', 'tr'].includes(locale),
  loadLocaleResources: (locale: string, ns: string[]) => loadLocaleResourcesMock(locale, ns),
}));

describe('LocaleLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports static guards', () => {
    expect(dynamic).toBe('error');
    expect(dynamicParams).toBe(false);
  });

  it('generates locale params', async () => {
    await expect(generateStaticParams()).resolves.toEqual([{ locale: 'en' }, { locale: 'tr' }]);
  });

  it('loads resources and renders providers for valid locale', async () => {
    const element = await LocaleLayout({
      children: <div>locale-content</div>,
      params: Promise.resolve({ locale: 'en' }),
    });

    const htmlElement = element as React.ReactElement<{ lang?: string; children: React.ReactNode }>;
    expect(htmlElement.type).toBe('html');
    expect(htmlElement.props.lang).toBe('en');

    const htmlChildren = React.Children.toArray(htmlElement.props.children) as React.ReactElement[];
    const bodyElement = htmlChildren[0] as React.ReactElement<{ children: React.ReactNode }>;
    expect(bodyElement.type).toBe('body');

    render(<>{bodyElement.props.children}</>);

    expect(loadLocaleResourcesMock).toHaveBeenCalledWith(
      'en',
      expect.arrayContaining(['404', 'common', 'post', 'topic']),
    );
    expect(appProvidersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'en',
      }),
    );
    expect(screen.getByText('locale-content')).toBeInTheDocument();
  });

  it('calls notFound for unsupported locale', async () => {
    await expect(
      LocaleLayout({
        children: <div>locale-content</div>,
        params: Promise.resolve({ locale: 'de' }),
      }),
    ).rejects.toThrow('NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
