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

jest.mock('@root/next-i18next.config', () => ({
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
    const htmlElement = container.ownerDocument.documentElement;

    expect(htmlElement).toBeInTheDocument();
    expect(htmlElement).toHaveAttribute('lang', 'fr');
  });

  it('uses default locale when locale is not provided', () => {
    const props = {
      __NEXT_DATA__: { locale: undefined },
    };

    const { container } = render(<MyDocument {...(props as any)} />);
    const htmlElement = container.ownerDocument.documentElement;

    expect(htmlElement).toHaveAttribute('lang', 'en'); // Default locale
  });

  it('renders Head with correct favicon links', () => {
    const props = {
      __NEXT_DATA__: { locale: 'en' },
    };

    const { container } = render(<MyDocument {...(props as any)} />);
    const headElement = container.ownerDocument.head;

    expect(headElement.innerHTML).toContain(
      '<link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png">',
    );
    expect(headElement.innerHTML).toContain(
      '<link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32x32.png">',
    );
    expect(headElement.innerHTML).toContain(
      '<link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16x16.png">',
    );
    expect(headElement.innerHTML).toContain('<link rel="shortcut icon" href="/static/favicon.ico">');
  });

  it('renders Main and NextScript components', () => {
    const props = {
      __NEXT_DATA__: { locale: 'en' },
    };

    const { container } = render(<MyDocument {...(props as any)} />);
    const bodyElement = container.ownerDocument.body;

    expect(bodyElement).toHaveTextContent('Main content');
    expect(bodyElement).toHaveTextContent('Next script');
  });
});
