import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@/config/store';
import { getStaticPaths, getStaticProps } from '@/pages/[locale]/404';
import '@testing-library/jest-dom';
import { useTranslation } from 'next-i18next';
import NotFound from '@/pages/[locale]/404';

const mockContext = { locales: ['en', 'tr'], defaultLocale: 'en' };

// Mock `next/router`
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    route: '/',
    pathname: '/',
    query: { locale: 'en' },
    asPath: '/',
  }),
}));

// Mock `next-i18next`
jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(),
}));

beforeEach(() => {
  (useTranslation as jest.Mock).mockReturnValue({
    t: (key: string) => key, // Mock translation function
  });
});

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

// Mock FontAwesomeIcon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <i data-testid={`font-awesome-icon-${icon}`} />,
}));

jest.mock('@assets/images/logo.svg', () => ({
  __esModule: true,
  ReactComponent: () => <svg data-testid="mock-logo" />,
}));

// Mock Layout component
jest.mock('@/components/common/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-layout">{children}</div>,
}));

describe('404 Page', () => {
  it('renders Layout with header, footer, and main content', () => {
    render(
      <Provider store={store}>
        <NotFound />
      </Provider>,
    );

    // Error code
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404.errorCode');

    // Error header
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('404.header');

    // Description
    expect(screen.getByText('404.description')).toBeInTheDocument();
  });

  it('renders the back to home link', () => {
    render(
      <Provider store={store}>
        <NotFound />
      </Provider>,
    );

    const homeLink = screen.getByRole('link', { name: /404.backToHome/i });
    expect(homeLink).toBeInTheDocument();

    // Expect the root URL since Link handles locale internally
    const expectedHref = '/';
    expect(homeLink).toHaveAttribute('href', expectedHref);
  });
});

describe('getStaticPaths', () => {
  it('returns correct paths for all supported locales', async () => {
    const result = await getStaticPaths(mockContext);

    expect(result).toEqual({
      paths: [{ params: { locale: 'en' } }, { params: { locale: 'tr' } }],
      fallback: false,
    });
  });
});

describe('getStaticProps', () => {
  it('returns props with correct namespaces', async () => {
    const context = {
      params: { locale: 'en' },
    };

    const result = await getStaticProps(context);

    expect(result).toEqual({
      props: {
        _nextI18Next: expect.objectContaining({
          initialLocale: 'en',
          ns: ['404', 'common'],
        }),
      },
    });
  });
});
