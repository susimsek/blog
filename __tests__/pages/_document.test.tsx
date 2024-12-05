import React from 'react';
import { render } from '@testing-library/react';
import MyDocument from '@/pages/_document';

jest.mock('next/document', () => {
  const React = require('react');
  return {
    __esModule: true,
    Html: ({ children, lang }: { children: React.ReactNode; lang?: string }) => <html lang={lang}>{children}</html>,
    Head: ({ children }: { children: React.ReactNode }) => <head>{children}</head>,
    Main: () => <main>Main content</main>,
    NextScript: () => <script>Next script</script>,
    default: class Document extends React.Component {
      static async getInitialProps(ctx: any) {
        return { ...ctx };
      }
      render() {
        return null;
      }
    },
  };
});

jest.mock('../../next-i18next.config', () => ({
  i18n: {
    defaultLocale: 'en',
  },
}));

jest.mock('@/config/constants', () => ({
  assetPrefix: '/static',
}));

describe('MyDocument', () => {
  it('renders Html with correct lang attribute', () => {
    const props = {
      __NEXT_DATA__: { locale: 'fr' },
    };
    const { container } = render(<MyDocument {...(props as any)} />);
    const htmlElement = container.querySelector('html');

    expect(htmlElement).toBeInTheDocument();
    expect(htmlElement).toHaveAttribute('lang', 'fr');
  });

  it('uses default locale when locale is not provided', () => {
    const props = {
      __NEXT_DATA__: { locale: undefined },
    };
    const { container } = render(<MyDocument {...(props as any)} />);
    const htmlElement = container.querySelector('html');

    expect(htmlElement).toHaveAttribute('lang', 'en'); // Default locale
  });

  it('renders Head with correct favicon links', () => {
    const props = {
      __NEXT_DATA__: { locale: 'en' },
    };
    const { container } = render(<MyDocument {...(props as any)} />);

    const appleTouchIconLink = container.querySelector('link[rel="apple-touch-icon"]');
    expect(appleTouchIconLink).toBeInTheDocument();
    expect(appleTouchIconLink).toHaveAttribute('href', '/static/favicons/apple-touch-icon.png');

    const favicon32Link = container.querySelector('link[rel="icon"][sizes="32x32"]');
    expect(favicon32Link).toBeInTheDocument();
    expect(favicon32Link).toHaveAttribute('href', '/static/favicons/favicon-32x32.png');

    const favicon16Link = container.querySelector('link[rel="icon"][sizes="16x16"]');
    expect(favicon16Link).toBeInTheDocument();
    expect(favicon16Link).toHaveAttribute('href', '/static/favicons/favicon-16x16.png');

    const shortcutIconLink = container.querySelector('link[rel="shortcut icon"]');
    expect(shortcutIconLink).toBeInTheDocument();
    expect(shortcutIconLink).toHaveAttribute('href', '/static/favicons/favicon.ico');
  });

  it('renders Main and NextScript components', () => {
    const props = {
      __NEXT_DATA__: { locale: 'en' },
    };
    const { container } = render(<MyDocument {...(props as any)} />);

    expect(container).toHaveTextContent('Main content');
    expect(container).toHaveTextContent('Next script');
  });
});
